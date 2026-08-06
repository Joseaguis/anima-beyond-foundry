/**
 * Characteristic checks: the one place Ánima uses a D10 instead of a D100
 * (Core Exxet p. 8). Roll 1d10, add the characteristic, compare against the
 * difficulty of Tabla 1. Neither Open Rolls nor Fumbles apply here; instead the
 * extremes of the die have their own rules (see NATURAL_10_BONUS /
 * NATURAL_1_PENALTY in ./config, including the caveat about the book's layout).
 */

import type { RollBackend } from "./backend";
import {
  DEFAULT_CHARACTERISTIC_DIFFICULTY,
  NATURAL_1_PENALTY,
  NATURAL_10_BONUS,
  OPPOSED_CHARACTERISTIC_GAP,
} from "./config";

export interface D10Result {
  /** The die as rolled. */
  die: number;
  /** What the die is worth after the Regla del 10 / Regla del 1. */
  effective: number;
  characteristic: number;
  /** characteristic + effective. */
  total: number;
  naturalTen: boolean;
  naturalOne: boolean;
}

export interface D10CheckResult extends D10Result {
  difficulty: number;
  success: boolean;
  /** total − difficulty: the success level when positive, failure level when not. */
  margin: number;
}

/**
 * "Regla del 10": a natural 10 is worth 12.
 * "Regla del 1": a natural 1 is worth three points less than it reads (−2).
 */
export function effectiveDieValue(die: number): number {
  if (die === 10) return 10 + NATURAL_10_BONUS;
  if (die === 1) return 1 - NATURAL_1_PENALTY;
  return die;
}

/** Roll 1d10 and add a characteristic, applying the rules of 10 and 1. */
export async function resolveD10(
  backend: RollBackend,
  characteristic: number,
): Promise<D10Result> {
  const die = await backend.rollDie(10);
  const effective = effectiveDieValue(die);
  return {
    die,
    effective,
    characteristic,
    total: characteristic + effective,
    naturalTen: die === 10,
    naturalOne: die === 1,
  };
}

/**
 * A characteristic check against a fixed difficulty. With no difficulty stated
 * the check is Normal (10), as the book instructs.
 */
export async function resolveCharacteristicCheck(
  backend: RollBackend,
  characteristic: number,
  difficulty: number = DEFAULT_CHARACTERISTIC_DIFFICULTY,
): Promise<D10CheckResult> {
  const roll = await resolveD10(backend, characteristic);
  return {
    ...roll,
    difficulty,
    success: roll.total >= difficulty,
    margin: roll.total - difficulty,
  };
}

/**
 * Opposed checks compensate for lopsided characteristics: past a gap of four,
 * every extra point of the higher one counts double (Core p. 8 — Celia's FUE 5
 * against Serenade's 11 makes Serenade effectively a 13).
 *
 * Returns both characteristics as they should be rolled.
 */
export function applyOpposedGap(a: number, b: number): [number, number] {
  const gap = Math.abs(a - b);
  if (gap <= OPPOSED_CHARACTERISTIC_GAP) return [a, b];
  const surplus = gap - OPPOSED_CHARACTERISTIC_GAP;
  return a > b ? [a + surplus, b] : [a, b + surplus];
}

export interface OpposedD10Result {
  attacker: D10Result;
  defender: D10Result;
  /** attacker.total − defender.total. Zero is a tie. */
  difference: number;
  winner: "attacker" | "defender" | "tie";
}

/**
 * Opposed characteristic check: both sides roll and the larger total wins by
 * the difference, which is their success level over the other.
 */
export async function resolveOpposedCharacteristicCheck(
  backend: RollBackend,
  attackerCharacteristic: number,
  defenderCharacteristic: number,
): Promise<OpposedD10Result> {
  const [attackerChar, defenderChar] = applyOpposedGap(
    attackerCharacteristic,
    defenderCharacteristic,
  );
  const attacker = await resolveD10(backend, attackerChar);
  const defender = await resolveD10(backend, defenderChar);
  const difference = attacker.total - defender.total;
  return {
    attacker,
    defender,
    difference,
    winner: difference === 0 ? "tie" : difference > 0 ? "attacker" : "defender",
  };
}
