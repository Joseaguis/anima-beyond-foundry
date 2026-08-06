/**
 * Absorción and the damage percentage (Core Exxet pp. 86-87, Tabla 42).
 *
 * Pure arithmetic over numbers the prep pipeline already publishes: the
 * defender's `system.equipment.at[<type>]` and the attacker's `atPiercing`
 * (`prepareEquipment` derives it from weapon quality, one TA grade per +5).
 */

import { AT_TYPES, type AtType } from "../../actors/creature/prep/equipment";

/** Every being absorbs 20 before any armour is counted (Core p. 86). */
export const BASE_ABSORPTION = 20;

/** Each grade of TA is worth 10 points of Absorción. */
export const ABSORPTION_PER_AT_GRADE = 10;

/** Below this, the blow lands but draws no blood: no damage at all. */
export const MINIMUM_EFFECTIVE_DAMAGE = 10;

/**
 * Weapons record their attack type uppercase (`"FIL"`), the armour table keys it
 * lowercase (`"fil"`). Returns null for anything unrecognised — an attack with
 * no TA type (psychic powers, which no TA stops) absorbs nothing but the base.
 */
export function toAtType(value: string | undefined | null): AtType | null {
  const key = (value ?? "").trim().toLowerCase();
  return (AT_TYPES as readonly string[]).includes(key) ? (key as AtType) : null;
}

export interface AbsorptionInput {
  /** Defender's TA per attack type, i.e. `system.equipment.at`. */
  at: Partial<Record<AtType, number>>;
  /** Attack type of the incoming blow (`"FIL"`, `"fil"`, …). */
  attackType: string | null | undefined;
  /** TA grades the attack ignores (weapon quality, spells, ki abilities). */
  atPiercing?: number;
  /**
   * The attack bypasses armour entirely — psychic powers, against which "no TA
   * is effective" (Core p. 211). Only the base 20 applies.
   */
  ignoresArmor?: boolean;
}

export interface AbsorptionBreakdown {
  /** TA the defender has against this attack type before piercing. */
  atGrades: number;
  /** Grades removed by the attack. */
  piercedGrades: number;
  /** TA that actually counts, never below zero. */
  effectiveGrades: number;
  /** 20 + 10 × effectiveGrades. */
  total: number;
}

export function computeAbsorption(input: AbsorptionInput): AbsorptionBreakdown {
  const type = toAtType(input.attackType);
  const atGrades = input.ignoresArmor || !type ? 0 : (input.at[type] ?? 0);
  const piercedGrades = input.ignoresArmor ? 0 : Math.max(0, input.atPiercing ?? 0);
  const effectiveGrades = Math.max(0, atGrades - piercedGrades);
  return {
    atGrades,
    piercedGrades,
    effectiveGrades,
    total: BASE_ABSORPTION + effectiveGrades * ABSORPTION_PER_AT_GRADE,
  };
}

/**
 * Tabla 42. Every 10 points the attacker keeps after Absorción is a 10 % of the
 * attack's final damage, rounded down in groups of ten: 27 → 20 %, 185 → 180 %.
 * Under 10 points there is no damage at all.
 */
export function damagePercent(afterAbsorption: number): number {
  if (afterAbsorption < MINIMUM_EFFECTIVE_DAMAGE) return 0;
  return Math.floor(afterAbsorption / 10) * 10;
}

/** Apply the percentage of Tabla 42 to an attack's final damage. */
export function applyDamagePercent(finalDamage: number, percent: number): number {
  return Math.floor((finalDamage * percent) / 100);
}
