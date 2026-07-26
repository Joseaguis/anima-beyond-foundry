import type {
  TechniqueDisadvantageDef,
  TechniqueDisadvantageOption,
  TechniqueDuration,
  TechniqueEffectDef,
  TechniqueEffectOption,
} from "./technique-data";
import { TECHNIQUE_DISADVANTAGES, TECHNIQUE_EFFECTS } from "./technique-tables.generated";

/**
 * Tables 16-19 of Dominus Exxet cap. 5, plus lookups over the generated Efecto
 * and Desventaja catalog.
 */

export interface TechniqueLevelDef {
  /** Lowest CM that can be invested; a cheaper build still costs this much. */
  min: number;
  max: number;
  maxDisadvantages: number;
}

/** Tabla 16: Niveles y Árboles de Técnicas (Dominus p. 044). */
export const TECHNIQUE_LEVELS: Record<number, TechniqueLevelDef> = {
  1: { min: 20, max: 50, maxDisadvantages: 1 },
  2: { min: 40, max: 100, maxDisadvantages: 2 },
  3: { min: 60, max: 200, maxDisadvantages: 3 },
};

export const TECHNIQUE_LEVEL_KEYS = [1, 2, 3] as const;

/**
 * Rows the reference sheet lays out per technique: one Efecto Primario plus four
 * Secundarios. This is form layout, **not** a rule — the books cap neither
 * ("Cada Técnica puede incluir varios Efectos Secundarios", Dominus p. 045) and
 * at least one published technique uses six. Used only to size the editor.
 */
export const REFERENCE_SHEET_EFFECT_ROWS = 5;

/**
 * CM surcharges, all of them a flat multiple of the technique's level. The books
 * print them as three separate tables, but they collapse to this: Tabla 17
 * (Mantenidas) and Tabla 19 (Combinables) are 10 × level, and Tabla 18
 * (Sostenidas) is 20 × level for Menor and 30 × level for Mayor.
 */
export const CM_PER_LEVEL: Record<"maintained" | "sustainedMinor" | "sustainedMajor" | "combinable", number> =
  {
    maintained: 10,
    sustainedMinor: 20,
    sustainedMajor: 30,
    combinable: 10,
  };

/** Tabla 19: a Combinable technique also costs 3 × level extra Ki. */
export const COMBINABLE_KI_PER_LEVEL = 3;

/** How long a Sostenida lasts, in rounds (Dominus p. 047). */
export const SUSTAIN_ROUNDS: Partial<Record<TechniqueDuration, number>> = {
  sustainedMinor: 5,
  sustainedMajor: 20,
};

/** Sostenidas are only available to Técnicas Mayores and Arcanas. */
export const MIN_LEVEL_FOR_SUSTAIN = 2;

// Altering the Ki and CM cost of a technique (Dominus p. 046).

/** CM paid to shave one point of Ki off a characteristic. */
export const CM_PER_KI_REDUCED = 10;

/** At most 5 points of Ki may be bought off (50 CM). */
export const MAX_KI_REDUCTION = 5;

/** Reducing Ki requires the technique to rest on at least three characteristics. */
export const MIN_CHARS_FOR_KI_REDUCTION = 3;

/** CM given back per 2 points of Ki added. */
export const CM_PER_KI_ADDED = 5;
export const KI_ADDED_PER_CM_STEP = 2;

/** The Ki-for-CM trade caps out at −20 CM, i.e. +8 Ki. */
export const MAX_CM_FROM_KI_INCREASE = 20;
export const MAX_KI_INCREASE =
  (MAX_CM_FROM_KI_INCREASE / CM_PER_KI_ADDED) * KI_ADDED_PER_CM_STEP;

/** Técnicas Improvisadas widen the fumble range by two (Dominus p. 047). */
export const IMPROVISED_FUMBLE_INCREASE = 2;

// ---------------------------------------------------------------------------
// Catalog lookups
// ---------------------------------------------------------------------------

const EFFECTS_BY_KEY = new Map(TECHNIQUE_EFFECTS.map((e) => [e.key, e]));
const DISADVANTAGES_BY_KEY = new Map(TECHNIQUE_DISADVANTAGES.map((d) => [d.key, d]));

export function getEffectDef(key: string): TechniqueEffectDef | undefined {
  return EFFECTS_BY_KEY.get(key);
}

export function getDisadvantageDef(key: string): TechniqueDisadvantageDef | undefined {
  return DISADVANTAGES_BY_KEY.get(key);
}

export function getEffectOption(
  effect: TechniqueEffectDef,
  option: string,
): TechniqueEffectOption | undefined {
  return effect.options.find((o) => o.option === option);
}

export function getDisadvantageOption(
  disadvantage: TechniqueDisadvantageDef,
  option: string,
): TechniqueDisadvantageOption | undefined {
  return disadvantage.options.find((o) => o.option === option);
}

/**
 * Resolve the option labels stored on a technique. An empty list selects the
 * Efecto's single unlabelled form, which is how the catalog represents effects
 * that have no grades (Intangibilidad, Choque Físico...).
 */
export function resolveEffectOptions(
  effect: TechniqueEffectDef,
  options: readonly string[],
): { resolved: TechniqueEffectOption[]; unknown: string[] } {
  if (options.length === 0) {
    const blank = getEffectOption(effect, "");
    return { resolved: blank ? [blank] : [], unknown: [] };
  }
  const resolved: TechniqueEffectOption[] = [];
  const unknown: string[] = [];
  for (const label of options) {
    const hit = getEffectOption(effect, label);
    if (hit) resolved.push(hit);
    else unknown.push(label);
  }
  return { resolved, unknown };
}

export { TECHNIQUE_DISADVANTAGES, TECHNIQUE_EFFECTS, TECHNIQUE_ELEMENTS } from "./technique-tables.generated";

/** Efectos grouped by their catalog section, for the option dropdowns. */
export function effectsBySection(): { section: string; effects: TechniqueEffectDef[] }[] {
  const groups = new Map<string, TechniqueEffectDef[]>();
  for (const effect of TECHNIQUE_EFFECTS) {
    const list = groups.get(effect.section) ?? [];
    list.push(effect);
    groups.set(effect.section, list);
  }
  return [...groups].map(([section, effects]) => ({ section, effects }));
}
