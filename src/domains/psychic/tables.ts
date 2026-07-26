import { lookup1to20 } from "../../actors/creature/tables";

// Base Psychic Potential by Willpower (Core Tabla 68, p. 211; VOL 1..20). VOL≤4
// grants nothing; the value jumps by 20 from VOL 15 upward.
const PSYCHIC_POTENTIAL_BY_VOL = [
  0, 0, 0, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 120, 140, 160, 180, 200, 220,
] as const;

// Incrementar Potencial Psíquico (Core Tabla 70, p. 212): the cumulative number
// of CV permanently invested that each potential bonus tier requires.
const POTENTIAL_INCREMENT_TIERS: readonly (readonly [cv: number, bonus: number])[] = [
  [1, 10],
  [3, 20],
  [6, 30],
  [10, 40],
  [15, 50],
  [21, 60],
  [28, 70],
  [36, 80],
  [45, 90],
  [55, 100],
] as const;

/** Base Psychic Potential granted by Willpower (Core Tabla 68). */
export function getPsychicPotentialByVol(vol: number): number {
  return lookup1to20(PSYCHIC_POTENTIAL_BY_VOL, vol);
}

/**
 * Potential bonus obtained by permanently investing CV in Incrementar Potencial
 * Psíquico (Core Tabla 70): the highest tier whose cumulative CV cost is met.
 */
export function getPotentialIncrementBonus(cvs: number): number {
  let bonus = 0;
  for (const [cv, tierBonus] of POTENTIAL_INCREMENT_TIERS) {
    if (cvs >= cv) bonus = tierBonus;
  }
  return bonus;
}

/**
 * Concentración (Core Tabla 69, p. 211): bonus to the potential for preparing a
 * power in advance. Concentrating is a full active action — acting or taking
 * damage loses whatever has accumulated.
 */
export const CONCENTRATION_BONUSES: readonly { time: string; bonus: number }[] = [
  { time: "1 asalto", bonus: 10 },
  { time: "3 asaltos", bonus: 20 },
  { time: "5 asaltos", bonus: 30 },
  { time: "1 minuto", bonus: 40 },
  { time: "1 hora", bonus: 50 },
];

/**
 * Temporary uses of a free CV (Recuadro XII, Core p. 212; Excel "CVs Libres"
 * box). Spent CV come back at one per hour. Reference only — the sheet does not
 * derive anything from them.
 */
export const CV_FREE_USES: readonly { use: string; cost: string }[] = [
  { use: "Mejorar Proy. Psíquica", cost: "+10 / CV (máx +50)" },
  { use: "Mejorar Pot. Psíquico", cost: "+20 / CV (máx +100)" },
  { use: "Incrementar Innato", cost: "+20 / CV (máx +100)" },
  { use: "Prevenir Fatiga", cost: "1 CV · declarar antes" },
  { use: "Acceso temp. a Poder", cost: "1 CV por turno" },
];
