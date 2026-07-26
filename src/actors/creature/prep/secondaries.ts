import { baseFromDp, sumPerLevel, type CategoryData, type CharacteristicKey, type DpValue, type PrepContext } from "./types";

export interface SecondaryAbilityDef {
  key: string;
  labelKey: string;
  group: string;
  baseChar: CharacteristicKey;
  /** How the armor natural penalty applies (see data/secondaryAbilities.ts). */
  armorPenalty?: "full" | "half" | "unreducible";
}

export interface SecondaryAbilityData {
  dp?: DpValue;
  /** Natural bonuses (Excel "Bon."): each re-applies the characteristic bonus. */
  naturalBonus?: number;
  /** Natural abilities (Excel "Hab."): +10 each, inside the capped cube. */
  naturalAbilities?: number;
  /** Novel bonuses (Excel "Novel"): +10 each, as category bonus (outside the cap). */
  novelBonus?: number;
  special?: number;
  base?: number;
  charMod?: number;
  /** "Bonos" cube before the cap: charMod·(1+Bon.) + 10·Hab. */
  bonusRaw?: number;
  /** "Bonos" cube after the cap (Excel column U; what the Total sums). */
  bonusTotal?: number;
  catBonus?: number;
  final?: number;
}

export interface ImprovementStatus {
  assigned: number;
  max: number;
  over: boolean;
}

/** Natural-improvement budgets (Excel footer counters), published per prep. */
export interface SecondaryImprovementData {
  /** Natural bonuses on physical secondaries (FUE/DES/AGI/CON): max(1, level). */
  physical: ImprovementStatus;
  /** Natural bonuses on mental secondaries: max(1, level). */
  mental: ImprovementStatus;
  /** Natural abilities across every secondary: 5 · max(1, level). */
  abilities: ImprovementStatus;
  /** Novel bonuses across every secondary: Σ novelPerLevel · levels. */
  novel: ImprovementStatus;
  warnings: string[];
}

export interface SecondariesSystemSlice {
  secondary?: Record<string, SecondaryAbilityData>;
  customSecondary?: Record<string, Record<string, unknown>>;
  /** Natural-improvement budgets, published here by prepareSecondaries. */
  secondaryImprovement?: SecondaryImprovementData;
  /** Armor-derived penalties, published by prepareEquipment (runs earlier). */
  equipment?: {
    naturalPenalty?: number;
    naturalPenaltyHalf?: number;
    naturalPenaltyUnreduced?: number;
    physicalActionPenalty?: number;
  };
  /** State penalties (fatigue...), published by prepareState (runs earlier). */
  state?: { fatiguePenalty?: number };
}

/** A secondary ability is physical when it is performed with the body. */
const PHYSICAL_CHARS: readonly CharacteristicKey[] = ["str", "dex", "agi", "con"];

export function isPhysicalSecondary(baseChar: CharacteristicKey): boolean {
  return PHYSICAL_CHARS.includes(baseChar);
}

/** Secondary abilities (fixed list + user-defined custom ones). */
export function prepareSecondaries(
  system: SecondariesSystemSlice,
  ctx: PrepContext,
  abilityDefs: SecondaryAbilityDef[],
): void {
  const { categories, mod, charMods } = ctx;

  // Effective DP cost of one ability for one category: the per-ability
  // override can only lower the group cost (Excel master table semantics).
  const costOf = (ability: { key: string; group: string }) => (d: CategoryData) => {
    const groupCost = d.secondaryCosts[ability.group] ?? 2;
    const override = d.secondaryCostOverrides?.[ability.key];
    return override !== undefined ? Math.min(groupCost, override) : groupCost;
  };
  // Innate per-level bonus: legacy per-group field plus the per-ability one.
  const bonusOf = (ability: { key: string; group: string }) => (d: CategoryData) =>
    (d.secondaryBonusPerLevel[ability.group] ?? 0) +
    (d.secondaryAbilityBonusPerLevel?.[ability.key] ?? 0);

  // Aggregated action modifiers: "all actions" (plus fatigue) hits every
  // secondary; the physical ones additionally take "physical action" modifiers
  // and the unmet armor-requirement penalty. Abilities marked with
  // armorPenalty also suffer the armor natural penalty (Core Exxet ch. 3).
  const allActions = mod("allActions") + (system.state?.fatiguePenalty ?? 0);
  const physicalActions =
    mod("physicalActions") + (system.equipment?.physicalActionPenalty ?? 0);
  const armorNatural: Record<string, number> = {
    full: system.equipment?.naturalPenalty ?? 0,
    half: system.equipment?.naturalPenaltyHalf ?? 0,
    unreducible: system.equipment?.naturalPenaltyUnreduced ?? 0,
  };
  const abilityMod = (def: { baseChar: CharacteristicKey; armorPenalty?: string }): number =>
    allActions +
    (isPhysicalSecondary(def.baseChar) ? physicalActions : 0) +
    (def.armorPenalty ? armorNatural[def.armorPenalty] ?? 0 : 0);

  // Untrained: −30 until at least 5 base points are bought with DP.
  const untrained = (base: number): number => (ctx.mode === "dp" && base < 5 ? -30 : 0);

  // "Bonos" cube (Excel column U): the characteristic contribution plus the
  // natural improvement, capped at 100. With the soft-cap special rule active,
  // the excess above 100 counts at half value, rounded down to a multiple of 5.
  const softCap = ctx.flag("secondaryBonusSoftCap") > 0;
  const capCube = (raw: number): number => {
    if (raw <= 100) return raw;
    return softCap ? 100 + Math.floor((raw - 100) / 10) * 5 : 100;
  };
  const fillCube = (ad: SecondaryAbilityData): void => {
    ad.bonusRaw =
      (ad.charMod ?? 0) * (1 + (ad.naturalBonus ?? 0)) + 10 * (ad.naturalAbilities ?? 0);
    ad.bonusTotal = capCube(ad.bonusRaw);
  };

  const sec = system.secondary;
  if (sec) {
    for (const ability of abilityDefs) {
      const ad = sec[ability.key];
      if (!ad) continue;
      ad.base = baseFromDp(categories, ad.dp, costOf(ability));
      ad.charMod = charMods[ability.baseChar] ?? 0;
      fillCube(ad);
      ad.catBonus = sumPerLevel(categories, bonusOf(ability)) + 10 * (ad.novelBonus ?? 0);
      ad.final =
        ad.base + (ad.bonusTotal ?? 0) + ad.catBonus + (ad.special ?? 0) +
        untrained(ad.base) + mod(`secondary.${ability.key}`) + abilityMod(ability);
    }
  }

  const customSec = system.customSecondary;
  if (customSec && typeof customSec === "object") {
    for (const custom of Object.values(customSec) as Record<string, any>[]) {
      if (!custom || !custom.name) continue;
      const cost = custom.cost ?? 2;
      const group = custom.group ?? "intellectual";
      const baseChar = (custom.baseChar as CharacteristicKey) ?? "int";
      // Custom abilities carry their own flat cost, same in every category.
      custom.base = cost > 0 ? baseFromDp(categories, custom.dp, () => cost) : 0;
      custom.charMod = charMods[baseChar] ?? 0;
      fillCube(custom);
      custom.catBonus =
        sumPerLevel(categories, (d) => d.secondaryBonusPerLevel[group] ?? 0) +
        10 * (custom.novelBonus ?? 0);
      custom.final =
        custom.base + (custom.bonusTotal ?? 0) + custom.catBonus + (custom.special ?? 0) +
        untrained(custom.base) + abilityMod({ baseChar, armorPenalty: custom.armorPenalty });
    }
  }

  prepareSecondaryImprovement(system, ctx, abilityDefs);
}

/**
 * Natural-improvement budgets (the Excel footer counters). Like the DP limits,
 * over-assignment is never clamped — it is reported (`over`, warnings) and the
 * UI paints it red.
 */
function prepareSecondaryImprovement(
  system: SecondariesSystemSlice,
  ctx: PrepContext,
  abilityDefs: SecondaryAbilityDef[],
): void {
  if (ctx.mode !== "dp") return;

  let physical = 0;
  let mental = 0;
  let abilities = 0;
  let novel = 0;
  const count = (ad: SecondaryAbilityData, baseChar: CharacteristicKey): void => {
    if (isPhysicalSecondary(baseChar)) physical += ad.naturalBonus ?? 0;
    else mental += ad.naturalBonus ?? 0;
    abilities += ad.naturalAbilities ?? 0;
    novel += ad.novelBonus ?? 0;
  };

  const sec = system.secondary;
  if (sec) {
    for (const ability of abilityDefs) {
      const ad = sec[ability.key];
      if (ad) count(ad, ability.baseChar);
    }
  }
  for (const custom of Object.values(system.customSecondary ?? {}) as Record<string, any>[]) {
    if (!custom || !custom.name) continue;
    count(custom, (custom.baseChar as CharacteristicKey) ?? "int");
  }

  // Level-0 characters already get one bonus of each kind and five natural
  // abilities (the Excel template shows "de 1 + 1" and "de 5" at level 0).
  const levels = Math.max(1, ctx.level);
  const status = (assigned: number, max: number): ImprovementStatus => ({
    assigned,
    max,
    over: assigned > max,
  });
  const improvement: SecondaryImprovementData = {
    physical: status(physical, levels),
    mental: status(mental, levels),
    abilities: status(abilities, 5 * levels),
    novel: status(novel, sumPerLevel(ctx.categories, (d) => d.novelPerLevel ?? 0)),
    warnings: [],
  };

  const warn = (label: string, s: ImprovementStatus, participle = "asignados"): void => {
    if (s.over) improvement.warnings.push(`${label}: ${s.assigned} ${participle} de ${s.max}.`);
  };
  warn("Bonos naturales físicos", improvement.physical);
  warn("Bonos naturales mentales", improvement.mental);
  warn("Habilidades naturales", improvement.abilities, "asignadas");
  warn("Bonos de Novel", improvement.novel);

  system.secondaryImprovement = improvement;
}
