import {
  getLifePointsBase,
  getMovementSpeed,
  getRegeneration,
  getRegenerationRow,
} from "../tables";
import { developmentPointsForLevel, MARTIAL_KNOWLEDGE_DP_COST } from "./development";
import { baseFromDp, sumPerLevel, type DpValue, type PrepContext } from "./types";

/** Persisted "Esp." bonus plus the derived total prep writes next to it. */
export interface ResistanceData {
  special?: number;
  total?: number;
}

export interface VitalsSystemSlice {
  /** Direct-mode only: persisted presence, used instead of the level formula. */
  presenceBase?: number;
  presence?: number;
  resistances?: {
    rf: ResistanceData;
    rm: ResistanceData;
    rp: ResistanceData;
    rv: ResistanceData;
    re: ResistanceData;
    notes?: string;
  };
  lifePoints?: { max: number; current: number; multiples?: number };
  fatigue?: { max: number; current: number; special?: number };
  initiative?: {
    base: number;
    armorPenalty: number;
    weaponBonus: number;
    special?: number;
    final?: number;
    /** Desglose publicado para la tabla Turno del Excel (solo lectura). */
    charPart?: number;
    catPart?: number;
    weaponPart?: number;
    armorPart?: number;
  };
  /** Purchased Martial Knowledge (characters only; 5 DP per point). */
  combat?: { martialKnowledge?: { dp?: DpValue; special?: number } };
  /** Equipment-derived contributions, published by prepareEquipment (runs earlier). */
  equipment?: { naturalPenalty?: number; weaponInitiative?: number; movementPenalty?: number };
  mentalHealth?: { insanityThreshold: number };
  martialKnowledge?: number;
  developmentPoints?: number;
  creationPoints?: { total: number; spent: number; remaining?: number };
  movement?: {
    special?: number;
    final?: number;
    /** Speed text from Tabla 21, e.g. "25 km / asalto". */
    speedText?: string;
  };
  regeneration?: {
    special?: number;
    /** Level from CON alone (Tabla 19, caps at 12). */
    natural?: number;
    final?: number;
    /** Texts from Tabla 19/20 for the final level. */
    amountText?: string;
    removalText?: string;
    specialText?: string;
  };
  size?: number;
}

/**
 * Presence, resistances, life points, fatigue, initiative, martial knowledge,
 * development/creation points, movement, regeneration and size.
 */
export function prepareVitals(system: VitalsSystemSlice, ctx: PrepContext): void {
  const { level, categories, mod, charFinals, charMods } = ctx;

  // Characters derive presence from level (25 + 5·level, 20 at level 0);
  // NPC stat blocks list it directly.
  const presence =
    ctx.mode === "direct" && typeof system.presenceBase === "number"
      ? system.presenceBase + mod("presence")
      : (level === 0 ? 20 : 25 + level * 5) + mod("presence");
  system.presence = presence;

  const resistanceChar = {
    rf: charMods.con,
    rm: charMods.pow,
    rp: charMods.wp,
    rv: charMods.con,
    re: charMods.con,
  } as const;
  system.resistances ??= { rf: {}, rm: {}, rp: {}, rv: {}, re: {} };
  for (const key of ["rf", "rm", "rp", "rv", "re"] as const) {
    const res = (system.resistances[key] ??= {});
    res.total = presence + resistanceChar[key] + (res.special ?? 0) + mod(key);
  }

  if (system.lifePoints) {
    if (ctx.mode === "dp") {
      const lpBase = getLifePointsBase(charFinals.con);
      const multiples = system.lifePoints.multiples ?? 0;
      system.lifePoints.max =
        lpBase +
        sumPerLevel(categories, (d) => d.lpPerLevel) +
        multiples * charFinals.con +
        mod("lifePoints");
    } else {
      // Direct mode: max is entered as-is (printed stat block) + modifiers.
      system.lifePoints.max = (system.lifePoints.max ?? 0) + mod("lifePoints");
    }
  }

  // fatigue.max is computed in prepareState (the exhaustion penalty needs it).

  if (system.initiative) {
    // Direct mode: the printed initiative already includes characteristic and
    // category contributions, so only penalties/bonuses/modifiers apply.
    const charPart = ctx.mode === "dp" ? charMods.dex + charMods.agi : 0;
    const catPart =
      ctx.mode === "dp" ? sumPerLevel(categories, (d) => d.initiativePerLevel) : 0;
    // Equipped weapon items supersede the manually entered weapon bonus; the
    // armor natural penalty (reduced by surplus Wear Armor, plus −20 per
    // extra layer) comes from prepareEquipment.
    const weaponPart =
      system.equipment?.weaponInitiative ?? system.initiative.weaponBonus ?? 0;
    const armorPart =
      -(system.initiative.armorPenalty ?? 0) + (system.equipment?.naturalPenalty ?? 0);
    system.initiative.charPart = charPart;
    system.initiative.catPart = catPart;
    system.initiative.weaponPart = weaponPart;
    system.initiative.armorPart = armorPart;
    system.initiative.final =
      system.initiative.base +
      charPart +
      catPart +
      weaponPart +
      armorPart +
      (system.initiative.special ?? 0) +
      mod("initiative");
  }

  // Innate MK from the progression plus, for characters, purchased points
  // (5 DP each, same cost in every category) and their special bonus.
  const mk = system.combat?.martialKnowledge;
  const purchasedMk =
    ctx.mode === "dp" && mk
      ? baseFromDp(categories, mk.dp, () => MARTIAL_KNOWLEDGE_DP_COST) + (mk.special ?? 0)
      : 0;
  system.martialKnowledge =
    sumPerLevel(categories, (d) => d.martialKnowledgePerLevel) + purchasedMk;

  if (ctx.mode === "dp") {
    system.developmentPoints = developmentPointsForLevel(level);
  }

  if (system.creationPoints) {
    system.creationPoints.remaining =
      (system.creationPoints.total ?? 3) - (system.creationPoints.spent ?? 0);
  }

  // Movement type (Tabla 21): AGI plus the "Esp." level shift, minus the armor
  // movement restriction (already reduced by surplus Wear Armor).
  system.movement ??= {};
  const movementLevel = Math.min(
    20,
    Math.max(
      0,
      charFinals.agi +
        (system.movement.special ?? 0) +
        mod("movement") -
        (system.equipment?.movementPenalty ?? 0),
    ),
  );
  system.movement.final = movementLevel;
  system.movement.speedText = getMovementSpeed(movementLevel);

  // Regeneration (Tabla 19/20): natural level from CON (caps at 12), shifted
  // by the "Esp." level bonus and modifiers, clamped to the 0..20 table.
  system.regeneration ??= {};
  const naturalRegen = getRegeneration(charFinals.con);
  const regenLevel = Math.min(
    20,
    Math.max(0, naturalRegen + (system.regeneration.special ?? 0) + mod("regeneration")),
  );
  const regenRow = getRegenerationRow(regenLevel);
  system.regeneration.natural = naturalRegen;
  system.regeneration.final = regenLevel;
  system.regeneration.amountText = regenRow.amount;
  system.regeneration.removalText = regenRow.removal;
  system.regeneration.specialText = regenRow.special;

  system.size = charFinals.str + charFinals.con;

  // Default insanity threshold derives from Willpower when the user hasn't set one.
  if (system.mentalHealth && !system.mentalHealth.insanityThreshold) {
    system.mentalHealth.insanityThreshold = charFinals.wp;
  }
}
