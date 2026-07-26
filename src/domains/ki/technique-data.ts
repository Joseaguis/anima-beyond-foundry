import type { KiCharKey } from "./data";

/**
 * Types for the Dominus Exxet technique builder (cap. 5, "Creación de Técnicas
 * de Ki") as modelled by the `Creación de Técnicas` sheet of the reference
 * Excel. The catalog itself lives in `technique-tables.generated.ts`.
 */

/** Whether a Efecto is bound to a single Action or lasts the whole round. */
export type TechniqueEffectType = "action" | "round";

/** The Action a Efecto is intrinsically tied to; drives Active vs Passive. */
export type TechniqueEffectClass = "attack" | "counter" | "defense" | "variable";

/** One selectable grade / add-on of a Efecto (a row of its options table). */
export interface TechniqueEffectOption {
  /** The option label, e.g. `"+125"`. Empty when the Efecto has a single form. */
  option: string;
  /** Ki cost as the technique's Efecto Primario. */
  ki1: number;
  /** Ki cost as a Efecto Secundario. */
  ki2: number;
  cm: number;
  /** Ki added to make it Mantenido, and paid again every later round. */
  mant: number;
  /** Ki added for Sostenimiento Menor; `null` when it cannot be sustained. */
  sMinor: number | null;
  /** Ki added for Sostenimiento Mayor; `null` when it cannot be sustained. */
  sMajor: number | null;
  /** Minimum technique level required to pick this option. */
  level: number;
}

export interface TechniqueEffectDef {
  key: string;
  name: string;
  /** Catalog heading, e.g. `"EFECTOS OFENSIVOS"`. */
  section: string;
  type: TechniqueEffectType;
  klass: TechniqueEffectClass;
  /** Characteristic the Efecto is naturally based on. */
  primaryChar: KiCharKey;
  /** Ki surcharge for shifting part of the cost onto each optional one. */
  optionalChars: Partial<Record<KiCharKey, number>>;
  /** Affine elements, used by the Atadura Elemental disadvantage. */
  elements: string[];
  options: readonly TechniqueEffectOption[];
}

/** Which techniques a Desventaja may be applied to. */
export type TechniqueDisadvantageClass = "any" | "attack" | "defense";

export interface TechniqueDisadvantageOption {
  option: string;
  /** Always negative: the CM the Desventaja gives back. */
  cm: number;
  level: number;
}

export interface TechniqueDisadvantageDef {
  key: string;
  name: string;
  klass: TechniqueDisadvantageClass;
  options: readonly TechniqueDisadvantageOption[];
}

// ---------------------------------------------------------------------------
// The composition stored on a technique item
// ---------------------------------------------------------------------------

/** Exactly one Efecto is the Primario; the rest amplify it. */
export type TechniqueEffectRole = "primary" | "secondary";

/** How a Efecto persists past the round it was executed in. */
export type TechniqueDuration = "none" | "maintained" | "sustainedMinor" | "sustainedMajor";

/** Per-characteristic Ki allocation. */
export type KiDistribution = Partial<Record<KiCharKey, number>>;

/** One Efecto chosen for a technique, with its options and Ki allocation. */
export interface TechniqueEffectEntry {
  /** Key into `TECHNIQUE_EFFECTS`. */
  effect: string;
  role: TechniqueEffectRole;
  /**
   * Selected option labels. The first is the Efecto's main grade; the rest are
   * the optional Ventajas from its "Opciones de los efectos" block. Every one
   * of them adds its own Ki and CM.
   */
  options: string[];
  duration: TechniqueDuration;
  /** How the activation Ki is spread across characteristics. */
  distribution: KiDistribution;
  /** How the per-round upkeep Ki is spread (Mantenido only). */
  upkeepDistribution: KiDistribution;
}

export interface TechniqueDisadvantageEntry {
  /** Key into `TECHNIQUE_DISADVANTAGES`. */
  disadvantage: string;
  option: string;
}

/** The full composition of a technique: everything the builder needs. */
export interface TechniqueComposition {
  level: number;
  combinable: boolean;
  effects: TechniqueEffectEntry[];
  disadvantages: TechniqueDisadvantageEntry[];
  /**
   * Ki traded away at +10 CM each (Dominus p. 046), per characteristic and as a
   * positive count of points removed. Per-characteristic because the rule caps
   * each one at half its base cost, which needs to be checked individually.
   */
  kiReduction: KiDistribution;
  /**
   * Ki added to buy CM back, at −5 CM per 2 points. Stored as a positive count
   * of points added.
   */
  kiIncrease: number;
  /** Free per-characteristic Ki not tied to one Efecto (Combinable, adjustments). */
  freeDistribution: KiDistribution;
}

// ---------------------------------------------------------------------------
// Builder output
// ---------------------------------------------------------------------------

/** A validation failure, mirroring the error list of the Excel sheet. */
export interface TechniqueError {
  code: string;
  /** Localization key under `ANIMA.TechniqueError`. */
  labelKey: string;
  /** Values interpolated into the message. */
  data?: Record<string, string | number>;
}

/** Per-Efecto cost breakdown produced by the builder. */
export interface TechniqueEffectCost {
  effect: string;
  role: TechniqueEffectRole;
  duration: TechniqueDuration;
  cm: number;
  /** Ki the Efecto requires, including surcharges and duration extras. */
  kiRequired: number;
  /** Ki actually allocated across characteristics. */
  kiAllocated: number;
  /** Upkeep Ki required per later round (Mantenido only). */
  upkeepRequired: number;
  upkeepAllocated: number;
}

export interface TechniqueBuildResult {
  level: number;
  /** CM after extras, disadvantages and the level minimum. */
  cm: number;
  /** CM contributed by the Efectos and their options alone. */
  cmEffects: number;
  cmDisadvantages: number;
  cmMaintained: number;
  cmSustained: number;
  cmCombinable: number;
  cmAdjustment: number;
  /** True when the level minimum, not the parts, set the final CM. */
  atLevelMinimum: boolean;
  /** Total activation Ki required, per characteristic. */
  kiCost: Record<KiCharKey, number>;
  /** Per-round upkeep Ki, per characteristic. */
  kiUpkeep: Record<KiCharKey, number>;
  kiTotal: number;
  kiUpkeepTotal: number;
  perEffect: TechniqueEffectCost[];
  errors: TechniqueError[];
}

// ---------------------------------------------------------------------------
// Mechanical profile — what the technique actually does
// ---------------------------------------------------------------------------

/**
 * The mechanical outcome of a technique, derived from its Efectos. Consumed by
 * the (future) activation runtime; the persistent half is also emitted as
 * predicate-gated rule elements so nothing applies until the technique is used.
 */
export interface TechniqueProfile {
  /** Bonuses that last the whole round (Efectos of Tipo Asalto). */
  round: Partial<Record<string, number>>;
  /** Bonuses tied to a single Action (Efectos of Tipo Acción). */
  action: Partial<Record<string, number>>;
  extraAttacks: number;
  extraDefenses: number;
  /** Armour Type granted, if any. */
  armor: number;
  /** Reach in metres, if the technique projects. */
  range: number;
  /** Area radius in metres. */
  area: number;
  /** Supernatural states inflicted, by name. */
  states: string[];
  /** Whether the technique is Active (needs an Attack) or Passive. */
  activation: "active" | "passive";
  duration: {
    mode: TechniqueDuration;
    /** Rounds it lasts; `null` for instantaneous or maintained-indefinitely. */
    rounds: number | null;
  };
}

/** A technique published onto the actor so `prepareKi` can budget its CM. */
export interface KiTechniqueData {
  name: string;
  tree: string;
  level: number;
  mkCost: number;
  kiTotal: number;
  kiUpkeepTotal: number;
  /** True when the composition does not validate. */
  invalid: boolean;
}
