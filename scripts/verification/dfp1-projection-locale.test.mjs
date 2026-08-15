import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";
import {
  deterministicJson,
  utf8Bytes,
} from "../dfp/mspec-1/deterministic-json.mjs";
import { generateFixture } from "../dfp/mspec-1/fixtures.mjs";

const lessonSource = await readFile("lib/supabaseLesson.ts", "utf8");
const registrySource = await readFile(
  "lib/learnerLocaleRegistry.ts",
  "utf8",
);
const registry = JSON.parse(
  await readFile("config/learner-locales.v1.json", "utf8"),
);

const EXPECTED_PROJECTIONS = {
  LANGUAGE_PROJECTION: "code,native_name,direction",
  LESSON_PROJECTION:
    "id,slug,title_original,title_support_default,youtube_id,status,quality_status,access_level,published_at,updated_at",
  LESSON_SEGMENT_PROJECTION:
    "id,sort_order,original_text,phonetic_text",
  SEGMENT_TRANSLATION_PROJECTION:
    "segment_id,language_code,translated_text",
  VOCABULARY_RELATIONAL_PROJECTION:
    "exercise_id,practice_target:practice_targets(id,target_type,name_original,phonetic_text,meaning_default,description,practice_target_translations(language_code,display_name,meaning))",
};

const FORBIDDEN_PROJECTION_FIELDS = new Set([
  "answer",
  "api_key",
  "correct_answer",
  "correctness",
  "explanation",
  "grade",
  "grading",
  "grading_rule",
  "hint",
  "is_correct",
  "learner_id",
  "learner_progress",
  "owner_id",
  "private_key",
  "progress",
  "role",
  "score",
  "secret",
  "service_role",
  "submission",
  "submissions",
  "token",
  "user_id",
]);

const createAst = (source) =>
  ts.createSourceFile(
    "lib/supabaseLesson.ts",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

const walk = (node, visitor) => {
  visitor(node);
  ts.forEachChild(node, (child) => walk(child, visitor));
};

const findNodes = (root, predicate) => {
  const matches = [];
  walk(root, (node) => {
    if (predicate(node)) matches.push(node);
  });
  return matches;
};

const unwrapExpression = (node) => {
  let current = node;
  while (
    ts.isParenthesizedExpression(current)
    || ts.isAsExpression(current)
    || ts.isSatisfiesExpression(current)
    || ts.isNonNullExpression(current)
  ) {
    current = current.expression;
  }
  return current;
};

const literalString = (node) => {
  const current = node ? unwrapExpression(node) : null;
  return current && ts.isStringLiteralLike(current) ? current.text : null;
};

const isMethodCall = (node, methodName) =>
  ts.isCallExpression(node)
  && ts.isPropertyAccessExpression(node.expression)
  && node.expression.name.text === methodName;

const isObjectMethodCall = (node, objectName, methodName) =>
  isMethodCall(node, methodName)
  && ts.isIdentifier(node.expression.expression)
  && node.expression.expression.text === objectName;

const topLevelConstBindings = (ast) => {
  const bindings = new Map();
  for (const statement of ast.statements) {
    if (
      !ts.isVariableStatement(statement)
      || !(statement.declarationList.flags & ts.NodeFlags.Const)
    ) {
      continue;
    }
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || !declaration.initializer) continue;
      assert.equal(
        bindings.has(declaration.name.text),
        false,
        `duplicate top-level const ${declaration.name.text}`,
      );
      bindings.set(declaration.name.text, declaration);
    }
  }
  return bindings;
};

const resolveStaticString = (projectionName, bindings) => {
  const declaration = bindings.get(projectionName);
  assert.ok(
    declaration?.initializer,
    `select projection ${projectionName} must resolve to a top-level const initializer`,
  );
  assert.ok(
    ts.isStringLiteral(declaration.initializer),
    `select projection ${projectionName} must have a static top-level const string initializer`,
  );
  return declaration.initializer.text;
};

const parseProjection = (source) => {
  let offset = 0;
  const skipWhitespace = () => {
    while (/\s/.test(source[offset] ?? "")) offset += 1;
  };
  const parseName = () => {
    skipWhitespace();
    const start = offset;
    while (offset < source.length && !/[\s,:()]/.test(source[offset])) {
      offset += 1;
    }
    const name = source.slice(start, offset);
    assert.ok(name.length > 0, `invalid projection token at offset ${offset}`);
    skipWhitespace();
    return name;
  };
  const parseList = (closingCharacter = null) => {
    const fields = [];
    const seen = new Set();
    skipWhitespace();
    while (offset < source.length && source[offset] !== closingCharacter) {
      const firstName = parseName();
      let alias = null;
      let name = firstName;
      if (source[offset] === ":") {
        offset += 1;
        alias = firstName;
        name = parseName();
      }
      let children = null;
      if (source[offset] === "(") {
        offset += 1;
        children = parseList(")");
        assert.equal(source[offset], ")", "unclosed relational projection");
        offset += 1;
        skipWhitespace();
      }
      const field = { alias, name, children };
      const key = JSON.stringify(field);
      assert.equal(seen.has(key), false, `duplicate projection field ${key}`);
      seen.add(key);
      fields.push(field);
      if (source[offset] === ",") {
        offset += 1;
        skipWhitespace();
        continue;
      }
      assert.ok(
        source[offset] === closingCharacter
          || (closingCharacter === null && offset === source.length),
        `invalid projection syntax at offset ${offset}`,
      );
    }
    assert.ok(fields.length > 0, "projection field set must not be empty");
    return fields.sort((left, right) =>
      JSON.stringify(left).localeCompare(JSON.stringify(right))
    );
  };
  const projection = parseList();
  skipWhitespace();
  assert.equal(offset, source.length, "projection must be fully parsed");
  return projection;
};

const visitProjectionFields = (fields, visitor) => {
  for (const field of fields) {
    visitor(field);
    if (field.children) visitProjectionFields(field.children, visitor);
  }
};

const expectedProjectionTrees = Object.fromEntries(
  Object.entries(EXPECTED_PROJECTIONS).map(([name, projection]) => [
    name,
    parseProjection(projection),
  ]),
);

const assertSafeProjection = (projection) => {
  visitProjectionFields(projection, (field) => {
    assert.notEqual(field.name, "*", "wildcard projection fields are forbidden");
    for (const candidate of [field.alias, field.name]) {
      if (!candidate) continue;
      assert.equal(
        FORBIDDEN_PROJECTION_FIELDS.has(candidate.toLowerCase()),
        false,
        `forbidden learner projection field ${candidate}`,
      );
    }
  });
};

const assertProjectionContract = (source) => {
  const ast = createAst(source);
  const bindings = topLevelConstBindings(ast);
  const projectionNames = [...bindings.keys()]
    .filter((name) => name.endsWith("_PROJECTION"))
    .sort();
  assert.deepEqual(
    projectionNames,
    Object.keys(EXPECTED_PROJECTIONS).sort(),
    "production projection constants must exactly match the approved registry",
  );
  for (const projectionName of projectionNames) {
    const projection = parseProjection(
      resolveStaticString(projectionName, bindings),
    );
    assertSafeProjection(projection);
    assert.deepEqual(
      projection,
      expectedProjectionTrees[projectionName],
      `${projectionName} must match its approved structural field tree`,
    );
  }

  const selectCalls = findNodes(ast, (node) => isMethodCall(node, "select"));
  const uses = new Map(
    Object.keys(EXPECTED_PROJECTIONS).map((name) => [name, 0]),
  );
  for (const selectCall of selectCalls) {
    assert.equal(
      selectCall.arguments.length,
      1,
      "every select must have exactly one statically resolvable projection",
    );
    assert.ok(
      ts.isIdentifier(selectCall.arguments[0]),
      "every select must receive an approved projection identifier directly",
    );
    const projectionIdentifier = selectCall.arguments[0].text;
    const projection = parseProjection(
      resolveStaticString(projectionIdentifier, bindings),
    );
    assertSafeProjection(projection);
    const matches = Object.entries(expectedProjectionTrees)
      .filter(([, expected]) => {
        try {
          assert.deepEqual(projection, expected);
          return true;
        } catch {
          return false;
        }
      })
      .map(([name]) => name);
    assert.equal(
      matches.length,
      1,
      "every select must match exactly one approved projection field tree",
    );
    assert.equal(
      projectionIdentifier,
      matches[0],
      "every select must use its approved projection identifier",
    );
    uses.set(matches[0], uses.get(matches[0]) + 1);
  }
  assert.equal(
    selectCalls.length,
    Object.keys(EXPECTED_PROJECTIONS).length,
    "production AST must contain exactly the approved select set",
  );
  for (const [projectionName, count] of uses) {
    assert.equal(count, 1, `${projectionName} must be selected exactly once`);
  }
};

const fluentChain = (fromCall) => {
  const calls = [{ name: "from", call: fromCall }];
  let current = fromCall;
  while (
    ts.isPropertyAccessExpression(current.parent)
    && current.parent.expression === current
    && ts.isCallExpression(current.parent.parent)
    && current.parent.parent.expression === current.parent
  ) {
    current = current.parent.parent;
    calls.push({ name: current.expression.name.text, call: current });
  }
  return calls;
};

const oneTableChain = (root, tableName) => {
  const fromCalls = findNodes(
    root,
    (node) =>
      isMethodCall(node, "from")
      && literalString(node.arguments[0]) === tableName,
  );
  assert.equal(
    fromCalls.length,
    1,
    `${tableName} must have exactly one canonical receiver chain`,
  );
  return fluentChain(fromCalls[0]);
};

const assertProtectedFieldFilter = (
  chain,
  protectedField,
  expectedMethod,
  valueMatcher,
  message,
) => {
  const filters = chain
    .filter(({ name }) => name === "eq" || name === "in")
    .map(({ name, call }) => {
      const field = literalString(call.arguments[0]);
      assert.notEqual(
        field,
        null,
        `${message}: every eq/in filter field must be a static string literal`,
      );
      return { name, call, field };
    });
  const protectedFilters = filters.filter(
    ({ field }) => field === protectedField,
  );
  assert.equal(
    protectedFilters.length,
    1,
    `${message}: protected field must have exactly one eq/in filter`,
  );
  assert.equal(
    protectedFilters[0].name,
    expectedMethod,
    `${message}: protected field must use ${expectedMethod}`,
  );
  assert.ok(valueMatcher(protectedFilters[0].call.arguments), message);
};

const oneFunctionDeclaration = (ast, functionName) => {
  const functions = findNodes(
    ast,
    (node) =>
      ts.isFunctionDeclaration(node)
      && node.name?.text === functionName,
  );
  assert.equal(functions.length, 1, `${functionName} must remain uniquely defined`);
  return functions[0];
};

const functionParameterName = (functionNode, index, message) => {
  const parameter = functionNode.parameters[index];
  assert.ok(parameter && ts.isIdentifier(parameter.name), message);
  return parameter.name.text;
};

const propertyFunction = (objectLiteral, propertyName) => {
  const properties = objectLiteral.properties.filter(
    (property) =>
      ts.isPropertyAssignment(property)
      && (
        (ts.isIdentifier(property.name) && property.name.text === propertyName)
        || (ts.isStringLiteralLike(property.name)
          && property.name.text === propertyName)
      ),
  );
  assert.equal(properties.length, 1, `${propertyName} callback must be unique`);
  const initializer = properties[0].initializer;
  assert.ok(
    ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer),
    `${propertyName} must remain an inline callback`,
  );
  return initializer;
};

const localConstBindings = (root) => {
  const bindings = new Map();
  walk(root, (node) => {
    if (
      !ts.isVariableDeclaration(node)
      || !ts.isIdentifier(node.name)
      || !node.initializer
      || !ts.isVariableDeclarationList(node.parent)
      || !(node.parent.flags & ts.NodeFlags.Const)
    ) {
      return;
    }
    assert.equal(
      bindings.has(node.name.text),
      false,
      `ambiguous local const ${node.name.text}`,
    );
    bindings.set(node.name.text, node.initializer);
  });
  return bindings;
};

const expressionOrigin = (node, bindings, resolving = new Set()) => {
  const current = unwrapExpression(node);
  if (!ts.isIdentifier(current)) return current;
  assert.equal(resolving.has(current.text), false, "cyclic locale value flow");
  const initializer = bindings.get(current.text);
  if (!initializer) return current;
  const nextResolving = new Set(resolving);
  nextResolving.add(current.text);
  return expressionOrigin(initializer, bindings, nextResolving);
};

const assertLocaleContract = (source) => {
  const ast = createAst(source);
  const flowFunction = oneFunctionDeclaration(ast, "runDfp2DetailCoreFlow");
  const queriesName = functionParameterName(
    flowFunction,
    0,
    "runDfp2DetailCoreFlow must retain a queries parameter",
  );
  const resolveCalls = findNodes(
    flowFunction,
    (node) => isObjectMethodCall(node, queriesName, "resolveSelectedCode"),
  );
  const translationCalls = findNodes(
    flowFunction,
    (node) => isObjectMethodCall(node, queriesName, "loadSegmentTranslations"),
  );
  assert.equal(resolveCalls.length, 1, "selected locale must have one resolver call");
  assert.equal(
    translationCalls.length,
    1,
    "segment translations must have one flow call",
  );
  assert.ok(
    translationCalls[0].arguments[1],
    "segment translation flow call must receive the selected locale",
  );
  assert.equal(
    expressionOrigin(
      translationCalls[0].arguments[1],
      localConstBindings(flowFunction),
    ),
    resolveCalls[0],
    "loadSegmentTranslations must receive the exact resolved locale value",
  );

  const flowCalls = findNodes(
    ast,
    (node) =>
      ts.isCallExpression(node)
      && ts.isIdentifier(node.expression)
      && node.expression.text === "runDfp2DetailCoreFlow",
  );
  assert.equal(flowCalls.length, 1, "runDfp2DetailCoreFlow call site must be unique");
  const flowConfiguration = unwrapExpression(flowCalls[0].arguments[0]);
  assert.ok(
    flowConfiguration && ts.isObjectLiteralExpression(flowConfiguration),
    "runDfp2DetailCoreFlow must receive an inline query configuration",
  );
  const segmentLoader = propertyFunction(
    flowConfiguration,
    "loadSegmentTranslations",
  );
  const segmentLocaleName = functionParameterName(
    segmentLoader,
    1,
    "loadSegmentTranslations must retain an explicit locale parameter",
  );
  const segmentChain = oneTableChain(segmentLoader, "segment_translations");
  assertProtectedFieldFilter(
    segmentChain,
    "language_code",
    "eq",
    (args) =>
      ts.isIdentifier(unwrapExpression(args[1]))
      && unwrapExpression(args[1]).text === segmentLocaleName,
    "segment translations must filter their canonical chain by the callback locale",
  );

  const vocabularyFunction = oneFunctionDeclaration(
    ast,
    "getSupabaseLessonVocabulary",
  );
  const vocabularyLocaleName = functionParameterName(
    vocabularyFunction,
    1,
    "vocabulary loading must retain an explicit selected-locale parameter",
  );
  const practiceChain = oneTableChain(vocabularyFunction, "exercise_targets");
  assertProtectedFieldFilter(
    practiceChain,
    "practice_target.practice_target_translations.language_code",
    "eq",
    (args) =>
      ts.isIdentifier(unwrapExpression(args[1]))
      && unwrapExpression(args[1]).text === vocabularyLocaleName,
    "practice-target translations must filter their canonical chain by selected locale",
  );

  const coreFunction = oneFunctionDeclaration(ast, "getSupabaseLessonCore");
  const languageChain = oneTableChain(coreFunction, "languages");
  assertProtectedFieldFilter(
    languageChain,
    "code",
    "in",
    (args) => {
      const codes = args[1] ? unwrapExpression(args[1]) : null;
      return codes
        && ts.isArrayLiteralExpression(codes)
        && codes.elements.length === 1
        && ts.isSpreadElement(codes.elements[0])
        && ts.isIdentifier(unwrapExpression(codes.elements[0].expression))
        && unwrapExpression(codes.elements[0].expression).text
          === "enabledLearnerLocaleCodes";
    },
    "language discovery must bound its canonical chain to enabled learner locales",
  );
};

const projectionFixture = ({
  constants = {},
  selectArguments = {},
  extra = "",
} = {}) => {
  const declarations = Object.entries(EXPECTED_PROJECTIONS)
    .map(([name, projection]) =>
      `const ${name} = ${JSON.stringify(constants[name] ?? projection)};`
    )
    .join("\n");
  const selects = Object.keys(EXPECTED_PROJECTIONS)
    .map((name) => `void db.select(${selectArguments[name] ?? name});`)
    .join("\n");
  return `${declarations}\n${extra}\n${selects}`;
};

const localeFixture = ({
  flowUsesResolvedLocale = true,
  segmentFilterOnCanonicalChain = true,
  practiceFilterOnCanonicalChain = true,
  registryFilterOnCanonicalChain = true,
  extraSegmentProtectedFilter = false,
  extraPracticeProtectedFilter = false,
  extraRegistryProtectedFilter = false,
} = {}) => `
export async function runDfp2DetailCoreFlow(querySet) {
  const localeValue = querySet.resolveSelectedCode([]);
  return querySet.loadSegmentTranslations(
    [],
    ${flowUsesResolvedLocale ? "localeValue" : '"vi"'},
  );
}
export async function getSupabaseLessonCore() {
  const db = client();
  ${registryFilterOnCanonicalChain
    ? `void db.from("languages")
        .in("code", [...enabledLearnerLocaleCodes])
        ${extraRegistryProtectedFilter ? '.in("code", ["xx"])' : ""};`
    : "void db.from(\"languages\").in(\"status\", [\"active\"]); void db.from(\"registry_decoy\").in(\"code\", [...enabledLearnerLocaleCodes]);"}
  return runDfp2DetailCoreFlow({
    loadSegmentTranslations: async (ids, resolvedLocale) => {
      ${segmentFilterOnCanonicalChain
        ? ""
        : "void db.from(\"segment_decoy\").eq(\"language_code\", resolvedLocale);"}
      return db
        .from("segment_translations")
        .in("segment_id", ids)
        .eq(
          ${segmentFilterOnCanonicalChain ? '"language_code"' : '"status"'},
          resolvedLocale,
        )
        ${extraSegmentProtectedFilter ? '.eq("language_code", "vi")' : ""};
    },
    resolveSelectedCode: () => currentLocale,
  });
}
export async function getSupabaseLessonVocabulary(slug, learnerLocale) {
  const db = client();
  ${practiceFilterOnCanonicalChain
    ? ""
    : "void db.from(\"practice_decoy\").eq(\"practice_target.practice_target_translations.language_code\", learnerLocale);"}
  return db
    .from("exercise_targets")
    .eq(
      ${practiceFilterOnCanonicalChain
        ? '"practice_target.practice_target_translations.language_code"'
        : '"status"'},
      learnerLocale,
    )
    ${extraPracticeProtectedFilter
      ? '.eq("practice_target.practice_target_translations.language_code", "vi")'
      : ""};
}
`;

test("all DFP-2 lesson queries retain exact explicit projections", () => {
  assert.doesNotThrow(() => assertProjectionContract(lessonSource));
  assert.doesNotThrow(() =>
    assertProjectionContract(projectionFixture({
      constants: {
        LANGUAGE_PROJECTION: " direction , code , native_name ",
        VOCABULARY_RELATIONAL_PROJECTION:
          " practice_target : practice_targets( practice_target_translations( meaning , language_code , display_name ) , description , meaning_default , phonetic_text , name_original , target_type , id ) , exercise_id ",
      },
    }))
  );
  assert.throws(
    () => assertProjectionContract(projectionFixture({
      selectArguments: { LANGUAGE_PROJECTION: "INDIRECT_WILDCARD" },
      extra: 'const INDIRECT_WILDCARD = "*";',
    })),
    /wildcard projection fields are forbidden/,
  );
  assert.throws(
    () => assertProjectionContract(projectionFixture({
      extra:
        'const EXTRA_SENSITIVE = "answer,secret"; void db.select(EXTRA_SENSITIVE);',
    })),
    /forbidden learner projection field/,
  );
  assert.throws(
    () => assertProjectionContract(projectionFixture({
      selectArguments: { LANGUAGE_PROJECTION: "UNKNOWN_PROJECTION" },
    })),
    /must resolve to a top-level const initializer/,
  );
  assert.throws(
    () => assertProjectionContract(projectionFixture({
      selectArguments: {
        LANGUAGE_PROJECTION: '"code,native_name,direction"',
      },
    })),
    /must receive an approved projection identifier directly/,
  );
  assert.throws(
    () => assertProjectionContract(projectionFixture({
      extra: "void db.select(LESSON_PROJECTION);",
    })),
    /production AST must contain exactly the approved select set|selected exactly once/,
  );
  assert.throws(
    () => assertProjectionContract(projectionFixture({
      constants: {
        VOCABULARY_RELATIONAL_PROJECTION:
          EXPECTED_PROJECTIONS.VOCABULARY_RELATIONAL_PROJECTION.replace(
            "practice_target:practice_targets",
            "practice_target:private_targets",
          ),
      },
    })),
    /approved structural field tree/,
  );
});

test("selected locale remains filtered at both translation sources", () => {
  assert.doesNotThrow(() => assertLocaleContract(lessonSource));
  assert.doesNotThrow(() => assertLocaleContract(localeFixture()));
  assert.throws(
    () => assertLocaleContract(localeFixture({
      flowUsesResolvedLocale: false,
    })),
    /exact resolved locale value/,
  );
  assert.throws(
    () => assertLocaleContract(localeFixture({
      segmentFilterOnCanonicalChain: false,
    })),
    /canonical chain by the callback locale/,
  );
  assert.throws(
    () => assertLocaleContract(localeFixture({
      practiceFilterOnCanonicalChain: false,
    })),
    /canonical chain by selected locale/,
  );
  assert.throws(
    () => assertLocaleContract(localeFixture({
      registryFilterOnCanonicalChain: false,
    })),
    /canonical chain to enabled learner locales/,
  );
  assert.throws(
    () => assertLocaleContract(localeFixture({
      extraSegmentProtectedFilter: true,
    })),
    /protected field must have exactly one eq\/in filter/,
  );
  assert.throws(
    () => assertLocaleContract(localeFixture({
      extraPracticeProtectedFilter: true,
    })),
    /protected field must have exactly one eq\/in filter/,
  );
  assert.throws(
    () => assertLocaleContract(localeFixture({
      extraRegistryProtectedFilter: true,
    })),
    /protected field must have exactly one eq\/in filter/,
  );
});

test("versioned learner-locale registry enables only en, vi, and ar", () => {
  assert.equal(registry.schemaVersion, "learner-locale-registry.v1");
  assert.equal(registry.registryVersion, 1);
  assert.equal(registry.defaultLocaleCode, "en");

  const enabled = registry.locales
    .filter((locale) => locale.enabled)
    .sort((left, right) => left.code.localeCompare(right.code));
  assert.deepEqual(
    enabled.map((locale) => locale.code),
    ["ar", "en", "vi"],
  );
  assert.deepEqual(
    Object.fromEntries(
      enabled.map((locale) => [locale.code, locale.direction]),
    ),
    { ar: "rtl", en: "ltr", vi: "ltr" },
  );
  assert.equal(
    enabled.find((locale) => locale.code === "en")?.fallbackLocaleCode,
    null,
  );
  assert.equal(
    enabled.find((locale) => locale.code === "vi")?.fallbackLocaleCode,
    "en",
  );
  assert.equal(
    enabled.find((locale) => locale.code === "ar")?.fallbackLocaleCode,
    "en",
  );
  assert.match(registrySource, /resolveLearnerLocale/);
  assert.match(registrySource, /registryVersion/);
});

test("three-to-fifteen locale expansion stays within the learner-payload budget", () => {
  const detail = generateFixture({
    id: "dfp1-detail-maximum-approved",
    kind: "detail",
    sizeClass: "maximum-approved",
    segments: 300,
    locale: "vi",
  }).data;
  const localeMetadata = (count) =>
    Array.from({ length: count }, (_, index) => ({
      code: `locale-${index + 1}`,
      label: `Locale ${index + 1}`,
      direction: index === 2 ? "rtl" : "ltr",
    }));
  const measuredLearnerPayload = (localeCount) => {
    const payload = { ...detail, languages: localeMetadata(localeCount) };
    const { languages: registryMetadata, ...learnerData } = payload;
    assert.equal(registryMetadata.length, localeCount);
    return utf8Bytes(deterministicJson(learnerData));
  };

  const threeLocaleBytes = measuredLearnerPayload(3);
  const fifteenLocaleBytes = measuredLearnerPayload(15);
  const growth =
    (fifteenLocaleBytes - threeLocaleBytes) / threeLocaleBytes;
  assert.ok(
    growth <= 0.10,
    `learner payload grew by ${(growth * 100).toFixed(2)}%`,
  );
});

test("negative-auth boundary remains on the answer-free RPC path", () => {
  const protectedTables = [
    "exercises",
    "exercise_options",
    "exercise_translations",
    "exercise_option_translations",
    "exercise_media",
  ];
  for (const table of protectedTables) {
    assert.doesNotMatch(
      lessonSource,
      new RegExp(`\\.from\\(\\s*["']${table}["']\\s*\\)`),
    );
  }
  assert.match(
    lessonSource,
    /loadPreSubmitExercises\(normalizedSlug, selectedCode\)/,
  );
  assert.doesNotMatch(
    lessonSource,
    /SUPABASE_SERVICE_ROLE|service_role|secret|private_key/i,
  );
});
