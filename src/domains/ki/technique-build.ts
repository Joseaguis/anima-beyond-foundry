import { KI_CHAR_KEYS, type KiCharKey } from "./data";
import type {
  KiDistribution,
  TechniqueBuildResult,
  TechniqueComposition,
  TechniqueEffectCost,
  TechniqueEffectEntry,
  TechniqueError,
  TechniqueEffectOption,
} from "./technique-data";
import {
  CM_PER_KI_ADDED,
  CM_PER_KI_REDUCED,
  CM_PER_LEVEL,
  COMBINABLE_KI_PER_LEVEL,
  KI_ADDED_PER_CM_STEP,
  MAX_CM_FROM_KI_INCREASE,
  MAX_KI_INCREASE,
  MAX_KI_REDUCTION,
  MIN_CHARS_FOR_KI_REDUCTION,
  MIN_LEVEL_FOR_SUSTAIN,
  TECHNIQUE_LEVELS,
  getDisadvantageDef,
  getDisadvantageOption,
  getEffectDef,
  resolveEffectOptions,
} from "./technique-tables";

/**
 * The Ki technique builder: turns a composition (level, Efectos, Desventajas,
 * cost adjustments) into its CM cost, its per-characteristic Ki cost and the
 * list of rule violations.
 *
 * Faithful to the formula behind the `CM:` cell of the reference Excel:
 *
 *   MAX(levelMinimum,
 *       Σ CM(efectos) + Σ CM(desventajas)
 *       + 10·level (si Mantenida) + 20·level (Sost. Menor) + 30·level (Sost. Mayor)
 *       + 10·level (si Combinable)
 *       + 10·kiReducido − 5·floor(kiAñadido / 2))
 *
 * and to the per-Efecto Ki formula, which sums the Coste 1º/2º of every selected
 * option, adds the Sostenimiento surcharge per option, the Mantenimiento, the
 * optional-characteristic surcharges and the Estados Sobrenaturales extra.
 */

function emptyPerChar(): Record<KiCharKey, number> {
  return { str: 0, dex: 0, agi: 0, con: 0, pow: 0, wp: 0 };
}

function sumDistribution(dist: KiDistribution | undefined): number {
  if (!dist) return 0;
  let total = 0;
  for (const key of KI_CHAR_KEYS) total += dist[key] ?? 0;
  return total;
}

/** Ki added by the chosen duration, summed across the effect's options. */
function durationKi(options: TechniqueEffectOption[], duration: TechniqueEffectEntry["duration"]) {
  let ki = 0;
  let upkeep = 0;
  let unsupported = false;
  for (const option of options) {
    if (duration === "maintained") {
      // Maintaining adds this value once on activation and again every later
      // round (Dominus p. 046).
      ki += option.mant;
      upkeep += option.mant;
    } else if (duration === "sustainedMinor") {
      if (option.sMinor === null) unsupported = true;
      else ki += option.sMinor;
    } else if (duration === "sustainedMajor") {
      if (option.sMajor === null) unsupported = true;
      else ki += option.sMajor;
    }
  }
  return { ki, upkeep, unsupported };
}

interface EffectAnalysis extends TechniqueEffectCost {
  /** Highest level requirement across the selected options. */
  requiredLevel: number;
  klass: string;
  type: string;
  unknownOptions: string[];
  cannotSustain: boolean;
}

function analyzeEffect(entry: TechniqueEffectEntry, errors: TechniqueError[]): EffectAnalysis | null {
  const def = getEffectDef(entry.effect);
  if (!def) {
    errors.push({
      code: "unknownEffect",
      labelKey: "ANIMA.TechniqueError.UnknownEffect",
      data: { effect: entry.effect },
    });
    return null;
  }

  const { resolved, unknown } = resolveEffectOptions(def, entry.options);
  const duration = durationKi(resolved, entry.duration);

  const cm = resolved.reduce((sum, o) => sum + o.cm, 0);
  const baseKi = resolved.reduce(
    (sum, o) => sum + (entry.role === "primary" ? o.ki1 : o.ki2),
    0,
  );

  // Shifting part of the cost onto an optional characteristic costs extra, once
  // per characteristic actually used.
  let surcharge = 0;
  for (const key of KI_CHAR_KEYS) {
    if ((entry.distribution?.[key] ?? 0) > 0) surcharge += def.optionalChars[key] ?? 0;
  }

  // Stacking n "Estado añadido" options costs n·(n−1) extra Ki.
  const states = resolved.filter((o) => o.option.startsWith("Estado añadido")).length;
  const statesExtra = states * (states - 1);

  return {
    effect: entry.effect,
    role: entry.role,
    duration: entry.duration,
    cm,
    kiRequired: baseKi + duration.ki + surcharge + statesExtra,
    kiAllocated: sumDistribution(entry.distribution),
    upkeepRequired: duration.upkeep,
    upkeepAllocated: sumDistribution(entry.upkeepDistribution),
    requiredLevel: resolved.reduce((max, o) => Math.max(max, o.level), 1),
    klass: def.klass,
    type: def.type,
    unknownOptions: unknown,
    cannotSustain: duration.unsupported,
  };
}

/** Build a technique from its composition. Pure: no Foundry, no actor. */
export function buildTechnique(composition: TechniqueComposition): TechniqueBuildResult {
  const errors: TechniqueError[] = [];
  const level = composition.level;
  const levelDef = TECHNIQUE_LEVELS[level] ?? TECHNIQUE_LEVELS[1];

  const effects = composition.effects ?? [];
  const analyses = effects
    .map((entry) => analyzeEffect(entry, errors))
    .filter((a): a is EffectAnalysis => a !== null);

  // ---- structure ---------------------------------------------------------
  const primaries = effects.filter((e) => e.role === "primary").length;
  if (primaries !== 1) {
    errors.push({
      code: "primaryCount",
      labelKey: "ANIMA.TechniqueError.PrimaryCount",
      data: { count: primaries },
    });
  }
  // Deliberately no cap on the number of Efectos: the rules impose none, and
  // published techniques exist with six (see REFERENCE_SHEET_EFFECT_ROWS).

  for (const analysis of analyses) {
    for (const option of analysis.unknownOptions) {
      errors.push({
        code: "unknownOption",
        labelKey: "ANIMA.TechniqueError.UnknownOption",
        data: { effect: analysis.effect, option },
      });
    }
    if (analysis.requiredLevel > level) {
      errors.push({
        code: "effectLevelTooHigh",
        labelKey: "ANIMA.TechniqueError.EffectLevelTooHigh",
        data: { effect: analysis.effect, required: analysis.requiredLevel },
      });
    }
    if (analysis.cannotSustain) {
      errors.push({
        code: "cannotSustain",
        labelKey: "ANIMA.TechniqueError.CannotSustain",
        data: { effect: analysis.effect },
      });
    }
  }

  // ---- duration ----------------------------------------------------------
  const maintained = analyses.some((a) => a.duration === "maintained");
  const sustainedMinor = analyses.some((a) => a.duration === "sustainedMinor");
  const sustainedMajor = analyses.some((a) => a.duration === "sustainedMajor");
  const sustained = sustainedMinor || sustainedMajor;

  if (maintained && sustained) {
    errors.push({
      code: "maintainedAndSustained",
      labelKey: "ANIMA.TechniqueError.MaintainedAndSustained",
    });
  }
  if (sustained && level < MIN_LEVEL_FOR_SUSTAIN) {
    errors.push({
      code: "sustainLevel",
      labelKey: "ANIMA.TechniqueError.SustainLevel",
      data: { min: MIN_LEVEL_FOR_SUSTAIN },
    });
  }
  // A Sostenida may only carry Efectos of a strictly lower level than its own.
  for (const analysis of analyses) {
    if (analysis.duration.startsWith("sustained") && analysis.requiredLevel >= level) {
      errors.push({
        code: "sustainEffectLevel",
        labelKey: "ANIMA.TechniqueError.SustainEffectLevel",
        data: { effect: analysis.effect, required: analysis.requiredLevel },
      });
    }
  }

  // ---- disadvantages -----------------------------------------------------
  const disadvantages = composition.disadvantages ?? [];
  if (disadvantages.length > levelDef.maxDisadvantages) {
    errors.push({
      code: "tooManyDisadvantages",
      labelKey: "ANIMA.TechniqueError.TooManyDisadvantages",
      data: { max: levelDef.maxDisadvantages },
    });
  }

  let cmDisadvantages = 0;
  for (const entry of disadvantages) {
    const def = getDisadvantageDef(entry.disadvantage);
    if (!def) {
      errors.push({
        code: "unknownDisadvantage",
        labelKey: "ANIMA.TechniqueError.UnknownDisadvantage",
        data: { disadvantage: entry.disadvantage },
      });
      continue;
    }
    // Options are optional for the single-valued disadvantages (Compleja,
    // Sin Defensa...), whose only row carries an empty label.
    const option = getDisadvantageOption(def, entry.option) ?? def.options[0];
    if (!option) continue;
    cmDisadvantages += option.cm;

    if (option.level > level) {
      errors.push({
        code: "disadvantageLevelTooHigh",
        labelKey: "ANIMA.TechniqueError.DisadvantageLevelTooHigh",
        data: { disadvantage: def.name, required: option.level },
      });
    }
    if (def.klass !== "any" && !analyses.some((a) => a.klass === def.klass)) {
      errors.push({
        code: "disadvantageClass",
        labelKey: "ANIMA.TechniqueError.DisadvantageClass",
        data: { disadvantage: def.name, klass: def.klass },
      });
    }
  }

  // ---- cost adjustment ---------------------------------------------------
  const kiReduction = composition.kiReduction ?? {};
  const reducedTotal = sumDistribution(kiReduction);
  const kiIncrease = composition.kiIncrease ?? 0;

  if (reducedTotal > MAX_KI_REDUCTION) {
    errors.push({
      code: "kiReductionTooHigh",
      labelKey: "ANIMA.TechniqueError.KiReductionTooHigh",
      data: { max: MAX_KI_REDUCTION },
    });
  }
  if (kiIncrease > MAX_KI_INCREASE) {
    errors.push({
      code: "kiIncreaseTooHigh",
      labelKey: "ANIMA.TechniqueError.KiIncreaseTooHigh",
      data: { max: MAX_KI_INCREASE },
    });
  }

  // ---- Ki totals ---------------------------------------------------------
  const kiCost = emptyPerChar();
  const kiUpkeep = emptyPerChar();
  for (const entry of effects) {
    for (const key of KI_CHAR_KEYS) {
      kiCost[key] += entry.distribution?.[key] ?? 0;
      kiUpkeep[key] += entry.upkeepDistribution?.[key] ?? 0;
    }
  }
  // Combinable Ki and the Ki-for-CM trade are not tied to one Efecto, so they
  // are allocated separately.
  for (const key of KI_CHAR_KEYS) {
    kiCost[key] += composition.freeDistribution?.[key] ?? 0;
  }

  const combinableKi = composition.combinable ? COMBINABLE_KI_PER_LEVEL * level : 0;
  const freeRequired = combinableKi + kiIncrease;
  const effectsRequired = analyses.reduce((sum, a) => sum + a.kiRequired, 0);
  const totalRequired = effectsRequired + freeRequired - reducedTotal;
  const kiTotal = KI_CHAR_KEYS.reduce((sum, key) => sum + kiCost[key], 0);
  const kiUpkeepTotal = KI_CHAR_KEYS.reduce((sum, key) => sum + kiUpkeep[key], 0);

  if (kiTotal !== totalRequired) {
    errors.push({
      code: "kiNotDistributed",
      labelKey: "ANIMA.TechniqueError.KiNotDistributed",
      data: { allocated: kiTotal, required: totalRequired },
    });
  }
  const upkeepRequired = analyses.reduce((sum, a) => sum + a.upkeepRequired, 0);
  if (kiUpkeepTotal !== upkeepRequired) {
    errors.push({
      code: "upkeepNotDistributed",
      labelKey: "ANIMA.TechniqueError.UpkeepNotDistributed",
      data: { allocated: kiUpkeepTotal, required: upkeepRequired },
    });
  }

  // Reducing Ki needs three supporting characteristics and may not take any of
  // them below half its base cost, rounding up.
  if (reducedTotal > 0) {
    const charsUsed = KI_CHAR_KEYS.filter(
      (key) => kiCost[key] + (kiReduction[key] ?? 0) > 0,
    ).length;
    if (charsUsed < MIN_CHARS_FOR_KI_REDUCTION) {
      errors.push({
        code: "kiReductionChars",
        labelKey: "ANIMA.TechniqueError.KiReductionChars",
        data: { min: MIN_CHARS_FOR_KI_REDUCTION, used: charsUsed },
      });
    }
    for (const key of KI_CHAR_KEYS) {
      const reduced = kiReduction[key] ?? 0;
      if (reduced <= 0) continue;
      const base = kiCost[key] + reduced;
      const floorValue = Math.ceil(base / 2);
      if (kiCost[key] < floorValue) {
        errors.push({
          code: "kiReductionBelowHalf",
          labelKey: "ANIMA.TechniqueError.KiReductionBelowHalf",
          data: { char: key, min: floorValue },
        });
      }
    }
  }

  // ---- CM total ----------------------------------------------------------
  const cmEffects = analyses.reduce((sum, a) => sum + a.cm, 0);
  const cmMaintained = maintained ? CM_PER_LEVEL.maintained * level : 0;
  const cmSustained =
    (sustainedMinor ? CM_PER_LEVEL.sustainedMinor * level : 0) +
    (sustainedMajor ? CM_PER_LEVEL.sustainedMajor * level : 0);
  const cmCombinable = composition.combinable ? CM_PER_LEVEL.combinable * level : 0;
  const cmAdjustment =
    reducedTotal * CM_PER_KI_REDUCED -
    Math.min(
      MAX_CM_FROM_KI_INCREASE,
      Math.floor(kiIncrease / KI_ADDED_PER_CM_STEP) * CM_PER_KI_ADDED,
    );

  const subtotal =
    cmEffects + cmDisadvantages + cmMaintained + cmSustained + cmCombinable + cmAdjustment;
  const cm = Math.max(levelDef.min, subtotal);

  if (cm > levelDef.max) {
    errors.push({
      code: "cmExceedsLevel",
      labelKey: "ANIMA.TechniqueError.CmExceedsLevel",
      data: { cm, max: levelDef.max },
    });
  }

  return {
    level,
    cm,
    cmEffects,
    cmDisadvantages,
    cmMaintained,
    cmSustained,
    cmCombinable,
    cmAdjustment,
    atLevelMinimum: subtotal < levelDef.min,
    kiCost,
    kiUpkeep,
    kiTotal,
    kiUpkeepTotal,
    perEffect: analyses.map(
      ({ unknownOptions: _u, requiredLevel: _l, klass: _k, type: _t, cannotSustain: _c, ...cost }) =>
        cost,
    ),
    errors,
  };
}

/**
 * Whether the owner meets the Árbol de Técnicas requirement for a given level:
 * two Básicas are needed before a Mayor, and two Mayores before an Arcana
 * (Dominus p. 044).
 */
export function meetsTreeRequirement(level: number, owned: readonly { level: number }[]): boolean {
  if (level <= 1) return true;
  return owned.filter((t) => t.level === level - 1).length >= 2;
}

/**
 * Render a cost the way the sheet does: `FUE 6 (2)`, upkeep in parentheses.
 * Characteristics follow the Excel's display order, not `KI_CHAR_KEYS`.
 */
const KI_DISPLAY_ORDER: readonly KiCharKey[] = ["agi", "con", "dex", "str", "pow", "wp"];

export function formatKiCost(
  kiCost: Record<KiCharKey, number>,
  kiUpkeep: Record<KiCharKey, number>,
): string {
  const labels: Record<KiCharKey, string> = {
    agi: "AGI",
    con: "CON",
    dex: "DES",
    str: "FUE",
    pow: "POD",
    wp: "VOL",
  };
  return KI_DISPLAY_ORDER.filter((key) => kiCost[key] > 0)
    .map((key) => {
      const upkeep = kiUpkeep[key] ?? 0;
      return `${labels[key]} ${kiCost[key]}${upkeep > 0 ? ` (${upkeep})` : ""}`;
    })
    .join(" ");
}
