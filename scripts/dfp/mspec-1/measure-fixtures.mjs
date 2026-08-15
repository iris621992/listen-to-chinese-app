import { pathToFileURL } from "node:url";
import {
  loadFixtureManifest,
  loadMeasuredFixtures,
} from "./fixtures.mjs";
import { payloadBudget } from "./measurements.mjs";
import {
  FIXTURE_SCHEMA_VERSION,
  MSPEC_VERSION,
} from "./spec.mjs";

export function evaluateMeasuredFixtures(manifest, measuredFixtures) {
  const duplicateIds = manifest.fixtures.filter(
    (fixture, index, fixtures) => (
      fixtures.findIndex((candidate) => candidate.id === fixture.id) !== index
    ),
  ).map((fixture) => fixture.id);
  const measuredById = new Map(
    measuredFixtures.map((item) => [item.definition.id, item]),
  );
  const results = manifest.fixtures.map((lockedDefinition) => {
    const item = measuredById.get(lockedDefinition.id);
    const measurement = item?.measurement;
    const budget = payloadBudget(lockedDefinition.kind);
    const identityChecks = {
      present: Boolean(item),
      schemaVersion: measurement?.schemaVersion === FIXTURE_SCHEMA_VERSION,
      sha256: measurement?.sha256 === lockedDefinition.sha256,
      bytes: measurement?.bytes === lockedDefinition.bytes,
    };
    return {
      id: lockedDefinition.id,
      kind: lockedDefinition.kind,
      sizeClass: lockedDefinition.sizeClass,
      schemaVersion: measurement?.schemaVersion ?? null,
      sha256: measurement?.sha256 ?? null,
      bytes: measurement?.bytes ?? null,
      lockedSha256: lockedDefinition.sha256,
      lockedBytes: lockedDefinition.bytes,
      targetBytes: budget.targetBytes,
      hardBytes: budget.hardBytes,
      identityChecks,
      identityPass: Object.values(identityChecks).every(Boolean),
      targetPass: Number.isFinite(measurement?.bytes)
        && measurement.bytes <= budget.targetBytes,
      hardPass: Number.isFinite(measurement?.bytes)
        && measurement.bytes <= budget.hardBytes,
    };
  });
  const exactFixtureSet = duplicateIds.length === 0
    && measuredFixtures.length === manifest.fixtures.length
    && measuredFixtures.every(({ definition }) => (
      manifest.fixtures.some((fixture) => fixture.id === definition.id)
    ));
  const headerPass = manifest.measurementSpec === MSPEC_VERSION
    && manifest.fixtureSchemaVersion === FIXTURE_SCHEMA_VERSION;
  return {
    measurementSpec: MSPEC_VERSION,
    generatedAt: null,
    exactFixtureSet,
    duplicateIds,
    results,
    pass: headerPass
      && exactFixtureSet
      && results.every((result) => result.identityPass && result.hardPass),
  };
}

async function main() {
  const manifest = await loadFixtureManifest();
  const result = evaluateMeasuredFixtures(
    manifest,
    await loadMeasuredFixtures(),
  );
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (!result.pass) process.exitCode = 1;
}

if (
  process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await main();
}
