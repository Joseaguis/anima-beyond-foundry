import { getActionsPerTurn } from "../tables";
import { baseFromDp, sumPerLevel, type DpValue, type PrepContext } from "./types";

export interface CombatSkillData {
  dp?: DpValue;
  special?: number;
  base?: number;
  catBonus?: number;
  final?: number;
}

/** Read-only breakdown of the global action modifiers, for sheet tooltips. */
export interface ActionModBreakdown {
  allActions: number;
  physicalActions: number;
  fatigue: number;
}

/**
 * Bonos manuales de la caja "Equipo (Turno)" del Excel. prepareCombat no los
 * aplica: prepareEquipment los suma a los valores de armas y desarmado.
 */
export interface EquipBonusData {
  turn?: number;
  attack?: number;
  parry?: number;
  dodge?: number;
  damage?: number;
}

export interface CombatSystemSlice {
  combat?: {
    attack: CombatSkillData;
    parry: CombatSkillData;
    dodge: CombatSkillData;
    wearArmor: CombatSkillData;
    equipBonus?: EquipBonusData;
    damageBonus?: number;
    actionsPerTurn?: number;
    actionModBreakdown?: ActionModBreakdown;
  };
  /** State penalties (fatigue...), published by prepareState (runs earlier). */
  state?: { fatiguePenalty?: number };
}

const COMBAT_CHAR: Record<"attack" | "parry" | "dodge" | "wearArmor", "dex" | "agi" | "str"> = {
  attack: "dex",
  parry: "dex",
  dodge: "agi",
  wearArmor: "str",
};

/**
 * Attack, parry, dodge and wear-armor abilities plus the aggregated damage
 * bonus. In "dp" mode the base comes from development points spent; in
 * "direct" mode the base is entered as-is and only special + modifiers apply
 * (characteristic and category bonuses are already baked into printed values).
 */
export function prepareCombat(system: CombatSystemSlice, ctx: PrepContext): void {
  const cb = system.combat;
  if (!cb) return;

  const { categories, mod, charMods } = ctx;

  // Every combat ability is a physical action: aggregated "all action" and
  // "physical action" modifiers (pain, grapple...) and the fatigue penalty
  // apply on top of the ability's own modifiers. Equipment-derived armor
  // penalties are added later by prepareEquipment (they depend on wearArmor's
  // final value).
  const actionMod =
    mod("allActions") + mod("physicalActions") + (system.state?.fatiguePenalty ?? 0);
  cb.actionModBreakdown = {
    allActions: mod("allActions"),
    physicalActions: mod("physicalActions"),
    fatigue: system.state?.fatiguePenalty ?? 0,
  };

  // Tabla 37: number of actions per turn from DEX + AGI (overrides the
  // deprecated persisted field).
  cb.actionsPerTurn = getActionsPerTurn((ctx.charFinals.dex ?? 0) + (ctx.charFinals.agi ?? 0));

  for (const key of ["attack", "parry", "dodge", "wearArmor"] as const) {
    const skill = cb[key];
    if (!skill) continue;

    if (ctx.mode === "dp") {
      skill.base = baseFromDp(categories, skill.dp, (d) => d.combatCosts[key]);
      // The innate category bonus to attack/parry/dodge caps at +50; wear
      // armor's does not.
      const innate = sumPerLevel(categories, (d) => d.combatBonusPerLevel[key]);
      skill.catBonus = key === "wearArmor" ? innate : Math.min(50, innate);
      skill.final =
        skill.base +
        charMods[COMBAT_CHAR[key]] +
        skill.catBonus +
        (skill.special ?? 0) +
        mod(key) +
        actionMod;
    } else {
      skill.catBonus = 0;
      skill.final = (skill.base ?? 0) + (skill.special ?? 0) + mod(key) + actionMod;
    }
  }

  // Aggregated damage bonus from items (e.g. weapons, combat styles).
  cb.damageBonus = mod("damage");
}
