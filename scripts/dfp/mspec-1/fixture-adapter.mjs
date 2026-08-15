import { createServer } from "node:http";
import { pathToFileURL } from "node:url";
import { sha256 } from "./deterministic-json.mjs";
import { loadMeasuredFixtures } from "./fixtures.mjs";

const LOOPBACK_HOST = "127.0.0.1";
const FIXTURE_ROUTE_LOCALE = "vi";
const FIXTURE_AUTHORIZATION_CLASS = "public";

function send(response, status, contentType, body) {
  response.writeHead(status, {
    "cache-control": "no-store",
    "content-type": contentType,
    "x-dfp-fixture-adapter": "DFP-MSPEC-1",
    "x-dfp-content-sha256": sha256(body),
  });
  response.end(body);
}

export const FIXTURE_ASSET_JS = "document.querySelector('[data-dfp-action]')?.addEventListener('click',()=>{document.documentElement.dataset.interacted='true'});";

export function fixtureEvidenceIdentity(fixture) {
  let locale;
  switch (fixture.definition.kind) {
    case "discovery":
      locale = fixture.measurement.value.data.locale;
      break;
    case "detail":
      locale = fixture.measurement.value.data.resource.locale;
      break;
    case "practice":
      locale = fixture.measurement.value.data.requestedLocale;
      break;
    case "localeRegistry":
      locale = FIXTURE_ROUTE_LOCALE;
      break;
    default:
      throw new Error(`Unsupported fixture kind: ${fixture.definition.kind}`);
  }
  if (typeof locale !== "string" || locale.trim() === "") {
    throw new Error(
      `Fixture ${fixture.definition.id} does not declare a canonical measurement locale`,
    );
  }
  return Object.freeze({
    locale,
    authorizationClass: FIXTURE_AUTHORIZATION_CLASS,
  });
}

export function renderFixtureRoute(fixture) {
  const escapedFixtureId = JSON.stringify(fixture.definition.id);
  const identity = fixtureEvidenceIdentity(fixture);
  return `<!doctype html>
<html lang="${identity.locale}" data-dfp-authorization-class="${identity.authorizationClass}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="dfp-locale" content="${identity.locale}">
<meta name="dfp-authorization-class" content="${identity.authorizationClass}">
<title>DFP fixture ${fixture.definition.id}</title>
<style>
html{font-family:system-ui,sans-serif}body{margin:0;padding:24px}main{max-width:720px}
.hero{width:100%;aspect-ratio:16/9;background:#f4c993;border-radius:16px}
button{margin-top:24px;min-height:44px}
</style>
<script>
window.__DFP_READY__=false;
window.__DFP_VITALS__={lcp:0,cls:0,inp:0};
new PerformanceObserver(list=>{for(const entry of list.getEntries()){window.__DFP_VITALS__.lcp=entry.startTime}}).observe({type:"largest-contentful-paint",buffered:true});
new PerformanceObserver(list=>{for(const entry of list.getEntries()){if(!entry.hadRecentInput)window.__DFP_VITALS__.cls+=entry.value}}).observe({type:"layout-shift",buffered:true});
try{new PerformanceObserver(list=>{for(const entry of list.getEntries()){window.__DFP_VITALS__.inp=Math.max(window.__DFP_VITALS__.inp,entry.duration)}}).observe({type:"event",buffered:true,durationThreshold:16})}catch{}
fetch("/__dfp__/rsc/"+${escapedFixtureId}).then(response=>response.text()).then(()=>{window.__DFP_READY__=true});
</script>
<script src="/__dfp__/asset.js" defer></script>
</head>
<body><main><div class="hero"></div><h1>DFP-MSPEC-1</h1><p>${fixture.definition.id}</p><button data-dfp-action>Measure interaction</button></main></body>
</html>`;
}

export async function createFixtureAdapter() {
  const fixtures = new Map(
    (await loadMeasuredFixtures()).map(({ definition, measurement }) => [
      definition.id,
      { definition, measurement },
    ]),
  );

  const server = createServer((request, response) => {
    const url = new URL(request.url ?? "/", `http://${LOOPBACK_HOST}`);

    if (url.pathname === "/__dfp__/health") {
      send(
        response,
        200,
        "application/json; charset=utf-8",
        JSON.stringify({ status: "ok", measurementSpec: "DFP-MSPEC-1" }),
      );
      return;
    }

    if (url.pathname === "/__dfp__/asset.js") {
      send(
        response,
        200,
        "text/javascript; charset=utf-8",
        FIXTURE_ASSET_JS,
      );
      return;
    }

    const match = url.pathname.match(
      /^\/__dfp__\/(fixture|rsc|route)\/([a-z0-9-]+)$/,
    );
    const fixture = match ? fixtures.get(match[2]) : null;
    if (!match || !fixture) {
      send(
        response,
        404,
        "application/json; charset=utf-8",
        JSON.stringify({ outcomeCode: "NOT_FOUND" }),
      );
      return;
    }

    if (match[1] === "fixture") {
      send(
        response,
        200,
        "application/json; charset=utf-8",
        fixture.measurement.serialized,
      );
      return;
    }

    if (match[1] === "rsc") {
      send(
        response,
        200,
        "text/x-component; charset=utf-8",
        fixture.measurement.serialized,
      );
      return;
    }

    send(
      response,
      200,
      "text/html; charset=utf-8",
      renderFixtureRoute(fixture),
    );
  });

  return {
    host: LOOPBACK_HOST,
    server,
    async listen(port = 0) {
      await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(port, LOOPBACK_HOST, resolve);
      });
      const address = server.address();
      return `http://${LOOPBACK_HOST}:${address.port}`;
    },
    async close() {
      if (!server.listening) return;
      await new Promise((resolve, reject) => server.close(
        (error) => error ? reject(error) : resolve(),
      ));
    },
  };
}

async function main() {
  const portArgument = process.argv.find((argument) => argument.startsWith("--port="));
  const port = portArgument ? Number(portArgument.slice("--port=".length)) : 4173;
  if (!Number.isSafeInteger(port) || port < 0 || port > 65_535) {
    throw new Error("--port must be an integer from 0 through 65535");
  }
  const adapter = await createFixtureAdapter();
  const origin = await adapter.listen(port);
  process.stdout.write(`${origin}\n`);
}

if (
  process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await main();
}
