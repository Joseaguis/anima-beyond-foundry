/**
 * Shared vocabulary of the derived-data pipeline. The prep functions in this
 * folder are pure (no Foundry globals): they receive a slice of system data
 * plus a context, mutate the slice in place, and can be unit-tested in Node.
 */

export const CHARACTERISTIC_KEYS = [
  "str",
  "dex",
  "agi",
  "con",
  "int",
  "pow",
  "wp",
  "per",
] as const;

export type CharacteristicKey = (typeof CHARACTERISTIC_KEYS)[number];

/** Per-level costs and bonuses contributed by a category item (or defaults). */
export interface CategoryData {
  labelName: string;
  /** DP cost of one life-point multiple (Excel "Múltiplos de Vida" cost). */
  lifeMultiple?: number;
  lpPerLevel: number;
  initiativePerLevel: number;
  martialKnowledgePerLevel: number;
  combatCosts: { attack: number; parry: number; dodge: number; wearArmor: number };
  combatBonusPerLevel: { attack: number; parry: number; dodge: number; wearArmor: number };
  supernatural: {
    /** DP cost of one zeon purchase step (each buys 5 zeon; Excel CosteZeón). */
    zeon: number;
    /** DP cost of one ACT purchase multiple (Excel CosteACT: 70/60/50). */
    actMultiple: number;
    magicProjection: number;
    ki: number;
    kiAccMultiple: number;
    psychicProjection: number;
    cv: number;
    /** DP cost of one Summoning skill purchase (Excel CosteConvocar/Atar...). */
    summoning?: number;
    /** Innate zeon gained per level (Paladín 20, Hechicero 100...). */
    zeonPerLevel?: number;
    /** Levels needed to gain one innate CV ("Nv/CV"). */
    levelsPerCv?: number;
  };
  /** Fraction of total DP spendable per reserve (combat/magic/psychic). */
  dpLimits?: { combat: number; magic: number; psychic: number };
  secondaryCosts: Record<string, number>;
  secondaryBonusPerLevel: Record<string, number>;
  /** Per-ability cost reductions; effective cost = min(group, override). */
  secondaryCostOverrides?: Record<string, number>;
  /** Innate per-level bonuses to individual secondary abilities. */
  secondaryAbilityBonusPerLevel?: Record<string, number>;
  /** Novel bonuses (+10 to a secondary, as category bonus) granted per level. */
  novelPerLevel?: number;
}

/** Default reserve limits when a category doesn't define them. */
export const DEFAULT_DP_LIMITS = { combat: 0.6, magic: 0.5, psychic: 0.5 } as const;

/** Fallbacks used when the actor has no category item embedded. */
export function defaultCategoryData(): CategoryData {
  return {
    labelName: "",
    lifeMultiple: 20,
    lpPerLevel: 0,
    initiativePerLevel: 0,
    martialKnowledgePerLevel: 0,
    combatCosts: { attack: 2, parry: 2, dodge: 2, wearArmor: 2 },
    combatBonusPerLevel: { attack: 0, parry: 0, dodge: 0, wearArmor: 0 },
    supernatural: {
      zeon: 2,
      actMultiple: 60,
      magicProjection: 2,
      ki: 2,
      kiAccMultiple: 20,
      psychicProjection: 2,
      cv: 20,
      summoning: 3,
      zeonPerLevel: 0,
      levelsPerCv: 3,
    },
    dpLimits: { ...DEFAULT_DP_LIMITS },
    secondaryCosts: {
      athletics: 2,
      social: 2,
      perceptive: 2,
      intellectual: 2,
      vigor: 2,
      subterfuge: 2,
      creative: 2,
    },
    secondaryBonusPerLevel: {
      athletics: 0,
      social: 0,
      perceptive: 0,
      intellectual: 0,
      vigor: 0,
      subterfuge: 0,
      creative: 0,
    },
    secondaryCostOverrides: {},
    secondaryAbilityBonusPerLevel: {},
    novelPerLevel: 0,
  };
}

/**
 * How base combat/supernatural values are obtained:
 * - "dp":     derived from development points spent (characters).
 * - "direct": entered directly as base values (NPCs, like printed stat blocks).
 */
export type PrepMode = "dp" | "direct";

/** One stage of the character's chronological category progression. */
export interface ResolvedCategory {
  /** Stable slot key; dp spends are indexed by it. */
  key: string;
  data: CategoryData;
  /** Levels advanced while in this category. */
  levels: number;
  /** Total character levels up to and including this stage. */
  cumulativeLevels: number;
  /** DP paid for changing into this category (0 for the first). */
  changeCost: number;
  /** True when the slot references a category item no longer on the actor. */
  missing?: boolean;
}

/**
 * A persisted dp spend: per-slot record in the current schema, plain number
 * in pre-multiclass data (treated as spent in the first slot).
 */
export type DpValue = number | Record<string, number> | undefined;

/** Normalize a dp spend to a per-slot record. */
export function dpRecord(dp: DpValue, firstKey: string): Record<string, number> {
  if (typeof dp === "number") return dp > 0 ? { [firstKey]: dp } : {};
  return dp ?? {};
}

/** Total DP spent on an ability across every slot. */
export function dpTotal(dp: DpValue): number {
  if (typeof dp === "number") return dp;
  if (!dp) return 0;
  return Object.values(dp).reduce((sum, v) => sum + (typeof v === "number" ? v : 0), 0);
}

/**
 * Ability base bought with DP: Σ floor(dp_i / cost_i) over the progression.
 * The floor applies per category — like the Excel, where each category column
 * divides its own spend by its own cost — so remainders are lost per stage.
 * Spends keyed to a slot no longer in the progression buy nothing (they still
 * count as spent DP, see prepareDevelopment).
 */
export function baseFromDp(
  categories: ResolvedCategory[],
  dp: DpValue,
  costOf: (data: CategoryData) => number,
): number {
  const record = dpRecord(dp, categories[0]?.key ?? "c1");
  let base = 0;
  for (const c of categories) {
    const spent = record[c.key] ?? 0;
    const cost = costOf(c.data);
    if (spent > 0 && cost > 0) base += Math.floor(spent / cost);
  }
  return base;
}

/** Σ perLevel(category) · levels over the progression (innate bonuses). */
export function sumPerLevel(
  categories: ResolvedCategory[],
  perLevel: (data: CategoryData) => number,
): number {
  return categories.reduce((sum, c) => sum + perLevel(c.data) * c.levels, 0);
}

export interface PrepContext {
  /** Total character level (Σ levels over the progression). */
  level: number;
  /** Chronological category progression; always has at least one entry. */
  categories: ResolvedCategory[];
  mode: PrepMode;
  /** Stacked modifier total for a target key (fed by the actor's synthetics). */
  mod: (key: string) => number;
  /**
   * Aggregate value of a special-rule flag (see rules/special-rules): actor
   * `system.specialRules` entries plus synthetics. `> 0` means active.
   */
  flag: (key: string) => number;
  /** Final characteristic values, filled by prepareCharacteristics. */
  charFinals: Record<CharacteristicKey, number>;
  /** Characteristic modifiers, filled by prepareCharacteristics. */
  charMods: Record<CharacteristicKey, number>;
}
