/**
 * Resistance checks (Core Exxet p. 8). A D100 plus the Resistance against a
 * difficulty, with three departures from the general rule:
 *
 * 1. Open Rolls are not allowed.
 * 2. A natural 100 always avoids the effect, however high the difficulty is.
 * 3. A Resistance 20 points above the difficulty passes with no roll at all.
 *
 * The book does not exempt Resistances from the Fumble, so the general rule
 * applies: 1-3 is an automatic failure. Callers can override the range through
 * `fumbleThreshold` for the advantages and disadvantages that move it.
 */

import type { RollBackend } from "./backend";
import { RESISTANCE_AUTO_SUCCESS_MARGIN } from "./config";
import { ALWAYS_OPEN } from "./config";
import { resolveD100, type D100Result } from "./d100";

export interface ResistanceCheckResult {
  /** Null when the check passed automatically without rolling. */
  roll: D100Result | null;
  resistance: number;
  difficulty: number;
  /** resistance + roll total; equals the resistance on an automatic success. */
  total: number;
  success: boolean;
  /** total − difficulty. Zero on an automatic success (nothing was rolled). */
  margin: number;
  /** The check was won without touching the dice (Resistance ≥ difficulty + 20). */
  automatic: boolean;
  /** A natural 100 carried the check regardless of the total. */
  naturalHundred: boolean;
}

/** A Resistance this far above the difficulty needs no roll (Core p. 8). */
export function passesAutomatically(resistance: number, difficulty: number): boolean {
  return resistance - difficulty >= RESISTANCE_AUTO_SUCCESS_MARGIN;
}

export async function resolveResistanceCheck(
  backend: RollBackend,
  resistance: number,
  difficulty: number,
  options: { fumbleThreshold?: number; skipAutomatic?: boolean } = {},
): Promise<ResistanceCheckResult> {
  if (!options.skipAutomatic && passesAutomatically(resistance, difficulty)) {
    return {
      roll: null,
      resistance,
      difficulty,
      total: resistance,
      success: true,
      margin: 0,
      automatic: true,
      naturalHundred: false,
    };
  }

  const roll = await resolveD100(backend, {
    allowOpen: false,
    fumbleThreshold: options.fumbleThreshold,
    // Mastery reduces the fumble range of a *skill*; Resistances are not skills.
    mastery: false,
  });

  const total = resistance + roll.total;
  const naturalHundred = roll.natural === ALWAYS_OPEN;

  return {
    roll,
    resistance,
    difficulty,
    total,
    success: naturalHundred || (!roll.isFumble && total >= difficulty),
    margin: total - difficulty,
    automatic: false,
    naturalHundred,
  };
}
