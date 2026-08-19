import { isProficiencyCode } from "@/lib/proficiencyContext";

const LIBRARY_SLUG = "listen-to-chinese";
const MAX_SYSTEMS = 32;
const MAX_LEVELS_PER_SYSTEM = 64;

type Row = Record<string, unknown>;

export type PublicProficiencyOption = Readonly<{
  value: string;
  systemCode: string;
  systemName: string;
  levelCode: string;
  levelName: string;
  sortOrder: number;
}>;

const recordValue = (value: unknown): Row | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value as Row
    : null;

const oneRelation = (value: unknown): Row | null => {
  if (Array.isArray(value)) {
    return value.length === 1 ? recordValue(value[0]) : null;
  }
  return recordValue(value);
};

export function parsePublicProficiencyCatalog(
  value: unknown,
): readonly PublicProficiencyOption[] | null {
  if (!Array.isArray(value) || value.length > MAX_SYSTEMS) return null;

  const options: PublicProficiencyOption[] = [];
  const seen = new Set<string>();

  for (const rawSystem of value) {
    const system = recordValue(rawSystem);
    if (
      !system
      || system.is_active !== true
      || typeof system.code !== "string"
      || !isProficiencyCode(system.code)
      || typeof system.name !== "string"
      || system.name.trim().length === 0
      || system.name.length > 120
    ) {
      return null;
    }

    const library = oneRelation(system.library);
    if (
      !library
      || library.slug !== LIBRARY_SLUG
      || library.is_active !== true
      || !Array.isArray(system.levels)
      || system.levels.length > MAX_LEVELS_PER_SYSTEM
    ) {
      return null;
    }

    for (const rawLevel of system.levels) {
      const level = recordValue(rawLevel);
      if (!level) return null;
      if (level.is_active !== true) continue;
      if (
        typeof level.code !== "string"
        || !isProficiencyCode(level.code)
        || typeof level.name !== "string"
        || level.name.trim().length === 0
        || level.name.length > 120
        || typeof level.sort_order !== "number"
        || !Number.isInteger(level.sort_order)
      ) {
        return null;
      }

      const optionValue = `${system.code}:${level.code}`;
      if (seen.has(optionValue)) return null;
      seen.add(optionValue);
      options.push(Object.freeze({
        value: optionValue,
        systemCode: system.code,
        systemName: system.name,
        levelCode: level.code,
        levelName: level.name,
        sortOrder: level.sort_order,
      }));
    }
  }

  options.sort((left, right) =>
    left.systemName.localeCompare(right.systemName)
    || left.systemCode.localeCompare(right.systemCode)
    || left.sortOrder - right.sortOrder
    || left.levelName.localeCompare(right.levelName)
    || left.levelCode.localeCompare(right.levelCode));

  return Object.freeze(options);
}

function isPublicSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL
      && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

let publicCatalogPromise: Promise<readonly PublicProficiencyOption[]> | null = null;

async function loadPublicProficiencyOptions(): Promise<
  readonly PublicProficiencyOption[]
> {
  try {
    const { supabase } = await import("@/lib/supabase/client");
    const { data, error } = await supabase
      .from("level_systems")
      .select(
        "code,name,is_active,library:libraries!inner(slug,is_active),levels(code,name,sort_order,is_active)",
      )
      .eq("is_active", true)
      .eq("library.slug", LIBRARY_SLUG)
      .eq("library.is_active", true)
      .limit(MAX_SYSTEMS);

    if (error) return [];
    return parsePublicProficiencyCatalog(data) ?? [];
  } catch {
    return [];
  }
}

export function getPublicProficiencyOptions(): Promise<
  readonly PublicProficiencyOption[]
> {
  if (typeof window === "undefined" || !isPublicSupabaseConfigured()) {
    return Promise.resolve([]);
  }

  publicCatalogPromise ??= loadPublicProficiencyOptions();
  return publicCatalogPromise;
}
