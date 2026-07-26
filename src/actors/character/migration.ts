/**
 * Shape-migration for the multi-category DP model. Pre-multiclass characters
 * persisted each dp spend as a plain number and had no category progression;
 * the current schema stores dp as Record<slotKey, number> plus a
 * system.categories array. Pure module (no Foundry globals) so it can be
 * unit-tested in Node; invoked from CharacterModel.migrateData, which Foundry
 * runs on every document construction (the migrated shape persists on the
 * next save).
 */

/** Slot key assigned to the single category of pre-multiclass characters. */
export const LEGACY_SLOT_KEY = "c1";

type AnyRecord = Record<string, any>;

/**
 * Convert a legacy numeric dp value into a per-slot record, assigning the
 * whole spend to the legacy slot. Returns the amount migrated (0 when the
 * field is absent or already a record).
 */
function migrateDpField(holder: unknown, key: string): number {
  if (!holder || typeof holder !== "object") return 0;
  const obj = holder as AnyRecord;
  const value = obj[key];
  if (typeof value !== "number") return 0;
  obj[key] = value > 0 ? { [LEGACY_SLOT_KEY]: value } : {};
  return value;
}

/** Sum a legacy dp value (plain number or per-slot record) to its DP total. */
function legacyDpTotal(value: unknown): number {
  if (typeof value === "number") return value;
  if (value && typeof value === "object") {
    return Object.values(value as AnyRecord).reduce(
      (sum, v) => sum + (typeof v === "number" ? v : 0),
      0,
    );
  }
  return 0;
}

/** Normalize a legacy dp value into a per-slot record. */
function legacyDpRecord(value: unknown): AnyRecord {
  if (typeof value === "number") return value > 0 ? { [LEGACY_SLOT_KEY]: value } : {};
  if (value && typeof value === "object") return value as AnyRecord;
  return {};
}

/**
 * Migrate the legacy single-pool Ki (`ki.dp` / `ki.accumulationDp`) to the
 * per-characteristic shape (`ki.pointsDp` / `ki.accDp`, each a map of the six Ki
 * characteristics). Legacy data does not record which characteristic a spend
 * belonged to; bought points carry no >10 scaling, so the attribution changes
 * neither the totals nor the combat-reserve accounting. The whole legacy record
 * is placed under `pow` (approximate) and the old fields removed. Returns the DP
 * migrated (for the category-seeding heuristic below).
 */
function migrateKiField(ki: unknown): number {
  if (!ki || typeof ki !== "object") return 0;
  const obj = ki as AnyRecord;
  let migrated = 0;
  if ("dp" in obj) {
    if (!obj.pointsDp) obj.pointsDp = { pow: legacyDpRecord(obj.dp) };
    migrated += legacyDpTotal(obj.dp);
    delete obj.dp;
  }
  if ("accumulationDp" in obj) {
    if (!obj.accDp) obj.accDp = { pow: legacyDpRecord(obj.accumulationDp) };
    migrated += legacyDpTotal(obj.accumulationDp);
    delete obj.accumulationDp;
  }
  return migrated;
}

/**
 * Migrate a character system source in place (and return it). Tolerates
 * partial sources (document updates): only fields present and still in the
 * legacy shape are touched.
 */
export function migrateCharacterDp(source: AnyRecord): AnyRecord {
  let legacyDp = 0;

  for (const key of ["attack", "parry", "dodge", "wearArmor", "martialKnowledge"]) {
    legacyDp += migrateDpField(source.combat?.[key], "dp");
  }
  legacyDp += migrateDpField(source.magic, "zeonDp");
  legacyDp += migrateDpField(source.magic, "magicProjectionDp");
  legacyDp += migrateKiField(source.ki);
  legacyDp += migrateDpField(source.psychic, "cvDp");
  legacyDp += migrateDpField(source.psychic, "projectionDp");
  // Potencial Psíquico is now derived from VOL (Tabla 68); fold any old manual
  // value into the flat special so it is not lost.
  if (source.psychic && typeof source.psychic === "object") {
    const psychic = source.psychic as AnyRecord;
    if (typeof psychic.potential === "number") {
      psychic.potentialSpecial = (psychic.potentialSpecial ?? 0) + psychic.potential;
      delete psychic.potential;
    }
  }
  if (source.secondary && typeof source.secondary === "object") {
    for (const ability of Object.values(source.secondary)) {
      legacyDp += migrateDpField(ability, "dp");
    }
  }
  if (source.customSecondary && typeof source.customSecondary === "object") {
    for (const ability of Object.values(source.customSecondary)) {
      legacyDp += migrateDpField(ability, "dp");
    }
  }

  // Seed the category progression for pre-multiclass characters: one slot
  // holding every level. itemId "" resolves to the first embedded category
  // item at prepare time (the old first-wins behavior). Only full sources
  // qualify (partial updates lack `combat`), and only when the character has
  // actually progressed — fresh actors keep an empty array.
  const hasSlots = Array.isArray(source.categories) && source.categories.length > 0;
  if (!hasSlots && source.combat && (legacyDp > 0 || (source.level ?? 0) > 0)) {
    source.categories = [
      { key: LEGACY_SLOT_KEY, itemId: "", levels: source.level ?? 0, changeCost: 0 },
    ];
  }

  return source;
}

/**
 * Drop the legacy manual `natural` field from secondary abilities (fixed and
 * custom), in place. It was a hand-written annotation of the natural
 * improvement (`charMod·Bon. + 10·Hab.`); the structured counters
 * (naturalBonus / naturalAbilities / novelBonus) replace it and the old
 * values are discarded by design. Tolerates partial sources. Note: in
 * customSecondary (schema-less ObjectField) a persisted `natural` survives in
 * the database until the object is next written — it is inert either way.
 */
export function migrateSecondaryNatural(source: AnyRecord): AnyRecord {
  for (const bag of [source.secondary, source.customSecondary]) {
    if (!bag || typeof bag !== "object") continue;
    for (const ability of Object.values(bag)) {
      if (ability && typeof ability === "object" && "natural" in (ability as AnyRecord)) {
        delete (ability as AnyRecord).natural;
      }
    }
  }
  return source;
}
