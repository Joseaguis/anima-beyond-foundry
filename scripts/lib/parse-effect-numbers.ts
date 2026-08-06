/**
 * Pulls the numbers a spell or psychic power actually needs out of the prose of
 * its grade line.
 *
 * The Excel keeps damage and shield resistance only inside the per-grade effect
 * text — there are no columns for them ("Daño 100.", "1.000 puntos de
 * Resistencia", "1500 PVs"). The extractors used to leave the numeric fields at
 * their defaults for exactly this reason; this module is what lets them stop
 * doing that.
 *
 * **The damage barrier is deliberately not parsed.** It is an attribute the
 * author sets on the item, not something guessed from prose: the books express
 * it half a dozen ways ("Barrera de daño 60", "BD 80", "Hasta Daño base 40",
 * and often only in the description), and a wrong barrier silently makes a
 * shield immune to attacks that should wear it down. The schema carries the
 * field and the item sheet edits it.
 *
 * Pure and dependency-free so `tests/parse-effect-numbers.test.ts` can drive it
 * with the real strings from the packs instead of running the extractor.
 */

/** Attack types of the TA table, matching `AT_TYPES` in prep/equipment.ts. */
export type AtTypeToken = "fil" | "con" | "pen" | "cal" | "fri" | "ele" | "ene";

export interface EffectNumbers {
  /** Base damage of the attack at this grade. */
  damage: number;
  /** Resistance points ("aguante") of a shield or a conjured structure. */
  shieldPoints: number;
}

export const NO_NUMBERS: EffectNumbers = { damage: 0, shieldPoints: 0 };

/**
 * A number as the books write it, with `.` as the thousands separator
 * ("1.000", "250.000"). The alternation is ordered so the grouped form wins;
 * otherwise a trailing sentence period would be read as a separator and
 * "Daño 100." would come out wrong.
 */
const NUMBER = String.raw`\d{1,3}(?:\.\d{3})+|\d+`;

function toNumber(raw: string): number {
  return Number(raw.replace(/\./g, ""));
}

function firstMatch(text: string, pattern: RegExp): number {
  const match = pattern.exec(text);
  return match ? toNumber(match[1]) : 0;
}

/**
 * "Daño 100", "Daño del choque 110", "RM 140 / Daño 100".
 *
 * Deliberately anchored on the word: several grades pair damage with other
 * figures on the same line ("Daño 40 / Fuerza 8"), and a loose "first number"
 * rule would pick up the radius, the RM or the Strength requirement instead.
 */
const DAMAGE = new RegExp(
  // The two lookbehinds keep out the phrasings where a damage figure is a
  // *threshold* rather than damage anyone deals: "Barrera de Daño 100", and the
  // "Hasta Daño base 40" of Burbuja protectora, whose description spells out
  // that the bubble "no sufre perjuicio alguno si detiene ataques con un daño
  // base igual o inferior". Both are damage barriers, and the barrier is an
  // authored field — but they must not leak into `damage` either.
  //
  // The optional words cover the spellings the books mix freely: "Daño 100",
  // "Daño Base 50", "Daño Base de 120", "daño base de 200 puntos",
  // "Daño del choque 110".
  String.raw`(?<!barrera\s+de\s+)(?<!hasta\s+)da[ñn]o(?:\s+base)?(?:\s+del\s+choque)?(?:\s+de)?\s+(${NUMBER})`,
  "i",
);

/**
 * "300 puntos de Resistencia", "El escudo tiene 1.000 puntos de Resistencia",
 * and the psychic convention "1500 PVs".
 *
 * The plural of `PVs` is load-bearing: the singular `PV` is used all over the
 * book for things that are not a pool of shield hit points — "140 PV por
 * asalto", "Sacrificio máximo de 100 PV", "Pérdida de -10 PV", "500 PV," for a
 * summoned construct's own life. Matching only the plural keeps those out
 * without a blacklist.
 */
const SHIELD_POINTS = new RegExp(String.raw`(${NUMBER})\s*puntos?\s+de\s+resistencia`, "i");
const SHIELD_PVS = new RegExp(String.raw`(${NUMBER})\s*PVs\b`, "i");
/** Escudo perfecto states its pool as "Aguanta 250 puntos de daño". */
const SHIELD_ENDURES = new RegExp(String.raw`aguanta\s+(${NUMBER})\s+puntos?\s+de\s+da[ñn]o`, "i");

/** Read the figures out of one grade's effect line. */
export function parseEffectNumbers(effect: string | null | undefined): EffectNumbers {
  const text = String(effect ?? "").trim();
  if (!text) return { ...NO_NUMBERS };

  return {
    damage: firstMatch(text, DAMAGE),
    shieldPoints:
      firstMatch(text, SHIELD_POINTS) ||
      firstMatch(text, SHIELD_PVS) ||
      firstMatch(text, SHIELD_ENDURES),
  };
}

/**
 * The numbers for every grade of one item.
 *
 * Two layouts coexist in the books and both have to work:
 *
 * - The grade line carries the figure, and it changes per grade
 *   ("Daño Base 50" → "Daño Base 100" → …).
 * - The **description** states a single figure for the whole spell and the
 *   grades vary something else entirely — the number of meteors, the radius,
 *   how many spikes rise from the ground. "Espina de la tierra" says "cada
 *   espina tiene daño base 60" once and then lists 2 / 4 / 6 / 8 spines.
 *
 * So the description acts as the baseline and a grade line overrides it when it
 * has a figure of its own. Note what is deliberately *not* implemented: grades
 * like "1 rebote o +10 al daño" offer the caster a choice between two effects,
 * so folding the bonus in would overstate the spell. Those keep the baseline
 * and the player applies the choice at the table.
 *
 * The baseline is opt-in (`useDescription`) because descriptions talk *about*
 * damage as often as they state it — "Agravar daño" illustrates itself with
 * "un arma de daño base 60", and reading that as the spell's own damage would
 * be plain wrong. Callers turn it on only for the kinds of item where a bare
 * figure in the description can only mean that item's own damage or pool.
 */
export function parseItemNumbers(
  description: string | null | undefined,
  gradeTexts: (string | null | undefined)[],
  { useDescription = false }: { useDescription?: boolean } = {},
): EffectNumbers[] {
  const baseline = useDescription ? parseEffectNumbers(description) : { ...NO_NUMBERS };
  return gradeTexts.map((text) => {
    const own = parseEffectNumbers(text);
    return {
      damage: own.damage || baseline.damage,
      shieldPoints: own.shieldPoints || baseline.shieldPoints,
    };
  });
}

// ------------------------------------------------------------ attack type ---

/** The word the books use for a TA, mapped to its token. */
const AT_WORDS: [RegExp, AtTypeToken][] = [
  [/^(?:energ[íi]as?|ENE)$/i, "ene"],
  [/^(?:calor|fuego|[íi]gneo?s?|CAL)$/i, "cal"],
  [/^(?:fr[íi]o|hielo|FRI)$/i, "fri"],
  [/^(?:electricidad|el[ée]ctricos?|ELE)$/i, "ele"],
  [/^(?:contundentes?|CON)$/i, "con"],
  [/^(?:penetrantes?|PEN)$/i, "pen"],
  [/^(?:filo|cortes?|FIL)$/i, "fil"],
];

/**
 * The spell stating outright which TA it attacks. Two spellings, tried in this
 * order — "TA de X" has to win, because "ataca en TA de Penetrantes" satisfies
 * both and the looser one would capture the word "TA" itself.
 */
const DECLARED_AT = [
  /TA\s+de\s+(?:l[oa]s?\s+)?([\wÁÉÍÓÚáéíóúÑñ]+)/i,
  /ataca(?:ndo)?\s+en\s+(?:l[oa]s?\s+)?([\wÁÉÍÓÚáéíóúÑñ]+)/i,
];

/**
 * Fallbacks, for spells that never name a TA. Ordered most-specific first:
 * "daña energía" is a phrasing that decides the TA on its own, whereas a bare
 * mention of an element is only a hint about the spell's flavour.
 */
const AT_KEYWORDS: [RegExp, AtTypeToken][] = [
  [/da[ñn]a[rn]?\s+energ[íi]a/i, "ene"],
  [/\bel[ée]ctric|\brayo\b|\brel[áa]mpago/i, "ele"],
  [/\bfuego\b|\bllama|\b[íi]gne|\bcalor\b|\bincandescen|\bfundir/i, "cal"],
  [/\bhielo\b|\bfr[íi]o\b|\bcongel|\bescarcha|\bnieve\b/i, "fri"],
  [/\benerg[íi]a\b|m[áa]gic[ao]\s+pur[ao]/i, "ene"],
  [/\bcontundente/i, "con"],
  [/\bpenetrante|\bperfora|\bempala|\bespina|\baguja/i, "pen"],
  [/\bfilo\b|\bcortante|\bsierra|\bcuchilla/i, "fil"],
];

/**
 * Best guess at an attack's TA type from its description. The Excel has no
 * column for it, so this reads the same prose a player would.
 *
 * An explicit "TA de X" always wins over the keyword scan, and it has to:
 * "Espina de la tierra" declares "ataca en TA de Penetrantes" and then rules
 * out targets "que sólo pueden ser afectados por ataques basados en energía" —
 * a keyword-only reading turns a spear of rock into an energy attack.
 * "Devastación" is the same trap the other way round: it "ataca en la TA de
 * calor, aunque es capaz de dañar energía".
 *
 * Returns "" when nothing matches, which is the signal for the extractor's
 * override table to step in rather than for the caller to invent a default.
 */
export function guessAttackType(...texts: (string | null | undefined)[]): AtTypeToken | "" {
  const haystack = texts.filter(Boolean).join(" ");
  if (!haystack) return "";

  for (const pattern of DECLARED_AT) {
    const declared = pattern.exec(haystack);
    if (!declared) continue;
    for (const [word, type] of AT_WORDS) {
      if (word.test(declared[1])) return type;
    }
  }

  for (const [pattern, type] of AT_KEYWORDS) {
    if (pattern.test(haystack)) return type;
  }
  return "";
}

/**
 * Merge the grades of one item so a caller can ask "does this thing ever deal
 * damage / ever raise a shield?" without walking the four grades itself.
 */
export function summarizeGrades(grades: EffectNumbers[]): EffectNumbers {
  return grades.reduce<EffectNumbers>(
    (best, grade) => ({
      damage: Math.max(best.damage, grade.damage),
      shieldPoints: Math.max(best.shieldPoints, grade.shieldPoints),
    }),
    { ...NO_NUMBERS },
  );
}
