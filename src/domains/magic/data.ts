import type { DpValue } from "../../actors/creature/prep/types";

/** A mystic skill bought with DP plus a flat special (Convocatoria skills). */
export interface DpSkill {
  dp?: DpValue;
  special?: number;
}

/** A magic path embedded on the actor, published by MagicPathModel. */
export interface MagicPathData {
  /** Item id, so sub-paths and free-access spells can point at it. */
  id?: string;
  name: string;
  /** "path" (counts magic level), "subPath" (fills a path's slots) or "metamagic". */
  subtype: string;
  /** Path level 1-100 (Core p. 118). */
  level: number;
  /** Element this path represents ("Fuego", "Luz"…). */
  element?: string;
  /** Comma-separated antagonistic paths (Excel Tabla_VíasOpuestas). */
  opposedPath?: string;
  /** Sub-paths only: id of the path whose free-access slots this one fills. */
  parentPathId?: string;
}

/** A spell embedded on the actor, published by SpellModel. */
export interface SpellData {
  name: string;
  /** Path the spell belongs to, matched against the owned paths by name. */
  magicPath: string;
  /** Spell level 2-100, even (Core p. 118). */
  spellLevel: number;
  /** Comma-separated paths this spell is closed to (Excel "Vía cerrada"). */
  closedPaths?: string;
  /** Free-access spells only: id of the path whose slot this spell occupies. */
  hostPathId?: string;
}

/** The actor's `magic` block: DP inputs and derived outputs. */
export interface MagicData {
  // Inputs.
  zeonDp?: DpValue;
  zeonCurrent?: number;
  zeonSpecial?: number;
  actDp?: DpValue;
  actSpecial?: number;
  regenDp?: DpValue;
  regenSpecial?: number;
  magicProjectionDp?: DpValue;
  magicProjectionSpecial?: number;
  offensiveImbalance?: number;
  magicLevelDp?: DpValue;
  magicLevelSpecial?: number;
  summoning?: { summon?: DpSkill; control?: DpSkill; bind?: DpSkill; banish?: DpSkill };
  /** Acquired metamagia sphere ids (positional node ids of METAMAGIA_GRAPH). */
  metamagias?: string[];
  /** Spells kept active, for the upkeep totals (no runtime spends them yet). */
  activeSpells?: ActiveSpellData[];
  // Derived outputs.
  /** Zeon regen spheres, derived from `metamagias` (10 points each). */
  metamagiaRegen?: number;
  /** Magic level spent on metamagia spheres, derived from `metamagias`. */
  metamagiaMagicLevel?: number;
  zeonMax?: number;
  act?: number;
  zeonRegen?: number;
  magicProjectionBase?: number;
  magicProjectionFinal?: number;
  magicProjectionAttack?: number;
  magicProjectionDefense?: number;
  magicLevelMax?: number;
  magicLevelUsed?: number;
  magicLevelAvailable?: number;
  /** Magic level spent on paths alone (before spells and metamagia). */
  magicLevelPaths?: number;
  /** Magic level spent on loose spells not covered by their path (Tabla 60). */
  magicLevelSpells?: number;
  /** True when more magic level is spent than available — flagged, not clamped. */
  magicLevelOver?: boolean;
  /** Free-access slots granted by the owned paths, up to their level. */
  freeAccessSlots?: number;
  /** Slots taken by sub-path spells and assigned free-access spells. */
  freeAccessUsed?: number;
  /** Slots still open. Negative when over-assigned (flagged, not clamped). */
  freeAccessFree?: number;
  /** Problems found while filling the free-access slots; the sheet lists them. */
  warnings?: string[];
  summon?: number;
  control?: number;
  bind?: number;
  banish?: number;
  /** Zeon owed per round by sustained spells (Core p. 120). */
  upkeepRound?: number;
  /** Zeon owed per day by daily spells, declared at the start of the day. */
  upkeepDaily?: number;
}

/** One spell the character is keeping active (Core p. 120). */
export interface ActiveSpellData {
  name: string;
  /** Grade it was cast at: base | intermediate | advanced | arcane. */
  grade?: string;
  /** "round" (sustained) or "daily". */
  upkeepMode?: string;
  zeonUpkeep?: number;
  /** Who it is maintained against, for the RM retry every 5 rounds (p. 121). */
  against?: string;
  note?: string;
}

/** The slice of the actor system that the magic preparation reads and writes. */
export interface MagicSystemSlice {
  magic?: MagicData;
  /** Magic paths embedded on the actor (MagicPathModel.prepareActorData). */
  magicPaths?: MagicPathData[];
  /** Spells embedded on the actor (SpellModel.prepareActorData). */
  spells?: SpellData[];
  /** State penalties (fatigue...), published by prepareState (runs earlier). */
  state?: { fatiguePenalty?: number };
}
