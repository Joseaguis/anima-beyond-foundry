import {
  DEFAULT_DP_LIMITS,
  dpRecord,
  dpTotal,
  type DpValue,
  type PrepContext,
  type ResolvedCategory,
} from "./types";

/** Martial Knowledge costs 5 DP per point in every category (Excel PDs sheet). */
export const MARTIAL_KNOWLEDGE_DP_COST = 5;

/** Total development points granted at a given character level. */1
export function developmentPointsForLevel(level: number): number {
  return level === 0 ? 400 : 600 + (level - 1) * 100;
}

export type ReserveKey = "combat" | "magic" | "psychic";

export interface ReserveStatus {
  /** DP spent on this reserve's abilities (orphan spends included). */
  spent: number;
  /** The limit in force: the last stage's (mode "combined" checks every stage). */
  limit: number;
  /** True when the spend violates the limit at any stage. */
  over: boolean;
}

export interface CategoryDevelopment {
  key: string;
  label: string;
  levels: number;
  cumulativeLevels: number;
  /** Total DP available up to the end of this stage. */
  dpBudget: number;
  changeCost: number;
  /** DP assigned to this slot across every ability (changeCost excluded). */
  spent: number;
  /** Reserve limit at this stage (fraction × dpBudget, floored). */
  limits: Record<ReserveKey, number>;
  missing: boolean;
}

export interface DevelopmentData {
  total: number;
  /** Every DP spent: abilities + category change costs + orphans + items. */
  spent: number;
  available: number;
  limits: Record<ReserveKey, ReserveStatus>;
  perCategory: CategoryDevelopment[];
  /** DP recorded under slot keys no longer in the progression. */
  orphanDp: number;
  /**
   * DP spent via items (tablas de armas, tablas de estilo y artes marciales).
   * Items no pertenecen a un tramo: cuentan en el total y contra el límite de
   * combate final, no en los checks por tramo.
   */
  itemDp: number;
  warnings: string[];
}

export interface DevelopmentSystemSlice {
  combat?: Record<string, { dp?: DpValue } | undefined>;
  magic?: {
    zeonDp?: DpValue;
    magicProjectionDp?: DpValue;
    actDp?: DpValue;
    regenDp?: DpValue;
    magicLevelDp?: DpValue;
    summoning?: {
      summon?: { dp?: DpValue };
      control?: { dp?: DpValue };
      bind?: { dp?: DpValue };
      banish?: { dp?: DpValue };
    };
  };
  ki?: {
    pointsDp?: Record<string, DpValue | undefined>;
    accDp?: Record<string, DpValue | undefined>;
  };
  psychic?: { cvDp?: DpValue; projectionDp?: DpValue };
  secondary?: Record<string, { dp?: DpValue } | undefined>;
  customSecondary?: Record<string, { dp?: DpValue } | undefined>;
  dpConfig?: { limitMode?: string };
  development?: DevelopmentData;
  /** Weapon tables embedded on the actor (WeaponTableModel.prepareActorData). */
  weaponTables?: { dpCost: number }[];
  /** Combat styles embedded on the actor (CombatStyleModel.prepareActorData). */
  combatStyles?: { subtype: string; dpCost: number }[];
}

/** Every dp spend of the sheet, grouped by the reserve whose limit it takes. */
function collectSpends(system: DevelopmentSystemSlice): Record<ReserveKey | "general", DpValue[]> {
  const combatKeys = ["attack", "parry", "dodge", "wearArmor", "martialKnowledge"];
  return {
    // Ki points and accumulation take the combat limit (Core Exxet: Dominio is a
    // combat reserve); each is bought per characteristic, so every slot counts.
    combat: [
      ...combatKeys.map((k) => system.combat?.[k]?.dp),
      ...Object.values(system.ki?.pointsDp ?? {}),
      ...Object.values(system.ki?.accDp ?? {}),
    ],
    magic: [
      system.magic?.zeonDp,
      system.magic?.magicProjectionDp,
      system.magic?.actDp,
      system.magic?.regenDp,
      system.magic?.magicLevelDp,
      system.magic?.summoning?.summon?.dp,
      system.magic?.summoning?.control?.dp,
      system.magic?.summoning?.bind?.dp,
      system.magic?.summoning?.banish?.dp,
    ],
    psychic: [system.psychic?.cvDp, system.psychic?.projectionDp],
    general: [
      ...Object.values(system.secondary ?? {}).map((a) => a?.dp),
      ...Object.values(system.customSecondary ?? {}).map((a) => a?.dp),
    ],
  };
}

/**
 * DP totals, per-reserve limits and per-category budgets ("dp" mode only).
 *
 * Limit mode "combined" (the Excel default): at every stage i of the
 * progression, the DP spent on a reserve in stages 0..i must fit within
 * floor(limit_i × dpBudget_i), where limit_i is stage i's category fraction
 * and dpBudget_i the total DP at the character's cumulative level after that
 * stage. Later stages never relax an earlier stage's check — each category
 * keeps the limits of the previous ones. The other Excel modes are accepted
 * but fall back to "combined" until implemented.
 */
export function prepareDevelopment(system: DevelopmentSystemSlice, ctx: PrepContext): void {
  if (ctx.mode !== "dp") return;

  const categories = ctx.categories;
  const firstKey = categories[0]?.key ?? "c1";
  const slotKeys = new Set(categories.map((c) => c.key));
  const spends = collectSpends(system);
  const warnings: string[] = [];

  const limitMode = system.dpConfig?.limitMode ?? "combined";
  if (limitMode !== "combined") {
    warnings.push(`Modo de límite "${limitMode}" no implementado; se aplica "combined".`);
  }

  // Per-slot and orphan totals across every spend.
  const spentBySlot: Record<string, number> = {};
  let orphanDp = 0;
  let abilityDp = 0;
  const allSpends = [...spends.combat, ...spends.magic, ...spends.psychic, ...spends.general];
  for (const dp of allSpends) {
    const record = dpRecord(dp, firstKey);
    for (const [key, value] of Object.entries(record)) {
      if (!value) continue;
      abilityDp += value;
      if (slotKeys.has(key)) spentBySlot[key] = (spentBySlot[key] ?? 0) + value;
      else orphanDp += value;
    }
  }

  // Reserve spend cumulative up to each stage (orphans excluded from the
  // per-stage checks, included in the global totals).
  const reserveKeys: ReserveKey[] = ["combat", "magic", "psychic"];
  const reserveBySlot: Record<ReserveKey, Record<string, number>> = {
    combat: {},
    magic: {},
    psychic: {},
  };
  const reserveTotals: Record<ReserveKey, number> = { combat: 0, magic: 0, psychic: 0 };
  for (const reserve of reserveKeys) {
    for (const dp of spends[reserve]) {
      reserveTotals[reserve] += dpTotal(dp);
      const record = dpRecord(dp, firstKey);
      for (const [key, value] of Object.entries(record)) {
        if (value && slotKeys.has(key)) {
          reserveBySlot[reserve][key] = (reserveBySlot[reserve][key] ?? 0) + value;
        }
      }
    }
  }

  const perCategory: CategoryDevelopment[] = [];
  const over: Record<ReserveKey, boolean> = { combat: false, magic: false, psychic: false };
  const lastLimit: Record<ReserveKey, number> = { combat: 0, magic: 0, psychic: 0 };
  const cumulativeReserve: Record<ReserveKey, number> = { combat: 0, magic: 0, psychic: 0 };

  for (const category of categories) {
    const dpBudget = developmentPointsForLevel(category.cumulativeLevels);
    const fractions = category.data.dpLimits ?? DEFAULT_DP_LIMITS;
    const limits = {} as Record<ReserveKey, number>;
    for (const reserve of reserveKeys) {
      cumulativeReserve[reserve] += reserveBySlot[reserve][category.key] ?? 0;
      limits[reserve] = Math.floor(fractions[reserve] * dpBudget);
      if (cumulativeReserve[reserve] > limits[reserve]) over[reserve] = true;
      lastLimit[reserve] = limits[reserve];
    }
    perCategory.push({
      key: category.key,
      label: category.data.labelName,
      levels: category.levels,
      cumulativeLevels: category.cumulativeLevels,
      dpBudget,
      changeCost: category.changeCost,
      spent: spentBySlot[category.key] ?? 0,
      limits,
      missing: category.missing ?? false,
    });
    if (category.missing) {
      warnings.push(`La categoría del tramo "${category.key}" no está en el personaje.`);
    }
  }

  // Minimum 2 levels in a category before changing out of it (last stage may
  // still be in progress).
  for (const category of categories.slice(0, -1)) {
    if (category.levels < 2) {
      warnings.push(
        `Cambio de categoría tras ${category.levels} nivel(es) en ${category.data.labelName || category.key}: el mínimo son 2.`,
      );
    }
  }
  if (orphanDp > 0) {
    warnings.push(`${orphanDp} PD asignados a tramos eliminados no aportan habilidad.`);
  }

  // Item-bought capabilities (Excel PDs sheet): weapon tables, style tables
  // and martial arts spend PD from the combat reserve. Ars Magnus only spends
  // CM (see prepareKi). Items are not assigned to a stage, so like orphans
  // they count against the final limit in force, not the per-stage checks.
  const itemDp =
    (system.weaponTables ?? []).reduce((sum, t) => sum + (t.dpCost ?? 0), 0) +
    (system.combatStyles ?? [])
      .filter((s) => s.subtype === "styleTable" || s.subtype === "martialArt")
      .reduce((sum, s) => sum + (s.dpCost ?? 0), 0);
  reserveTotals.combat += itemDp;

  // Orphan spends skip the per-stage checks but still count against the
  // final limit in force.
  for (const reserve of reserveKeys) {
    if (reserveTotals[reserve] > lastLimit[reserve]) over[reserve] = true;
  }

  const changeCosts = categories.reduce((sum, c) => sum + c.changeCost, 0);
  const total = developmentPointsForLevel(ctx.level);
  const spent = abilityDp + changeCosts + itemDp;

  system.development = {
    total,
    spent,
    available: total - spent,
    limits: {
      combat: { spent: reserveTotals.combat, limit: lastLimit.combat, over: over.combat },
      magic: { spent: reserveTotals.magic, limit: lastLimit.magic, over: over.magic },
      psychic: { spent: reserveTotals.psychic, limit: lastLimit.psychic, over: over.psychic },
    },
    perCategory,
    orphanDp,
    itemDp,
    warnings,
  };
}
