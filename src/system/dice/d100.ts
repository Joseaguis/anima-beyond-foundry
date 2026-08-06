/**
 * The D100 mechanic of Ánima: Open Rolls, Fumbles and Mastery (Core Exxet p. 7-8).
 *
 * Pure and Foundry-free — it only needs a {@link RollBackend}. Everything that
 * decides *whether* a given check opens or fumbles (resistances don't open,
 * fumble levels don't open, critical levels do neither) is expressed through
 * {@link D100Options}, so the check engine picks the flags and this module
 * stays the single place where the mechanic itself lives.
 */

import type { RollBackend } from "./backend";
import {
  ALWAYS_OPEN,
  FUMBLE_BASE,
  MASTERY_FUMBLE_REDUCTION,
  MASTERY_THRESHOLD,
  MAX_OPEN_ROLLS,
  OPEN_ROLL_BASE,
  OPEN_ROLL_STEP,
} from "./config";

export interface D100Options {
  /** Result that triggers an Open Roll. Defaults to 90. */
  openThreshold?: number;
  /** Highest result that fumbles. Defaults to 3; 0 or less never fumbles. */
  fumbleThreshold?: number;
  /**
   * Open Rolls are allowed. False for Resistance checks, Fumble Levels and
   * Critical Levels (Core p. 7).
   */
  allowOpen?: boolean;
  /** Fumbles are possible. False for Fumble Levels and Critical Levels. */
  allowFumble?: boolean;
  /**
   * The character is a master at this skill (final ability above 200), which
   * removes one grade from their fumble range. Use {@link hasMastery}.
   */
  mastery?: boolean;
  /**
   * Roll the Fumble Level after a fumble. False for initiative, where a fumble
   * just means acting last and "no es necesario calcular el Nivel de Pifia"
   * (Core p. 96). Defaults to true.
   */
  rollFumbleLevel?: boolean;
}

export interface D100Result {
  /** Every die rolled for the check, in order. A fumble stops the chain at one. */
  dice: number[];
  /** The first die — what "a natural N" refers to. */
  natural: number;
  /** Sum of the chain. On a fumble this is just the natural roll. */
  total: number;
  /** How many times the roll opened. */
  opens: number;
  isOpen: boolean;
  isFumble: boolean;
  /**
   * Second, independent D100 that grades the failure — no Open Roll allowed
   * (Core p. 7). Null when the check did not fumble.
   */
  fumbleLevel: number | null;
  /** Effective thresholds actually used, after mastery and house rules. */
  openThreshold: number;
  fumbleThreshold: number;
}

/** A final ability above 200 makes the character a master (Core p. 7). */
export function hasMastery(finalAbility: number): boolean {
  return finalAbility > MASTERY_THRESHOLD;
}

/**
 * Effective fumble range: mastery removes one grade, so the default 1-3 becomes
 * 1-2. Never goes below 0 (0 = the character cannot fumble at all, which is what
 * the "Incapaz de errar" advantage grants).
 */
export function effectiveFumbleThreshold(base: number, mastery: boolean): number {
  const reduced = base - (mastery ? MASTERY_FUMBLE_REDUCTION : 0);
  return Math.max(0, reduced);
}

/**
 * Roll a D100 check applying Ánima's mechanic.
 *
 * Order matters: the fumble is checked first, and a fumbled roll never opens —
 * the natural result is both the total and the trigger for the separate Fumble
 * Level roll.
 */
export async function resolveD100(
  backend: RollBackend,
  options: D100Options = {},
): Promise<D100Result> {
  const openThreshold = options.openThreshold ?? OPEN_ROLL_BASE;
  const fumbleThreshold = effectiveFumbleThreshold(
    options.fumbleThreshold ?? FUMBLE_BASE,
    options.mastery ?? false,
  );
  const allowOpen = options.allowOpen ?? true;
  const allowFumble = options.allowFumble ?? true;

  const natural = await backend.rollDie(100);

  if (allowFumble && natural <= fumbleThreshold) {
    return {
      dice: [natural],
      natural,
      total: natural,
      opens: 0,
      isOpen: false,
      isFumble: true,
      fumbleLevel:
        (options.rollFumbleLevel ?? true) ? await rollFumbleLevel(backend) : null,
      openThreshold,
      fumbleThreshold,
    };
  }

  const dice = [natural];
  let opens = 0;

  if (allowOpen) {
    // Each consecutive open costs one more point; a 100 always opens regardless.
    let threshold = openThreshold;
    let last = natural;
    while (isOpenResult(last, threshold) && opens < MAX_OPEN_ROLLS) {
      opens += 1;
      threshold += OPEN_ROLL_STEP;
      last = await backend.rollDie(100);
      dice.push(last);
    }
  }

  return {
    dice,
    natural,
    total: dice.reduce((sum, die) => sum + die, 0),
    opens,
    isOpen: opens > 0,
    isFumble: false,
    fumbleLevel: null,
    openThreshold,
    fumbleThreshold,
  };
}

/** A result opens if it reaches the current threshold; a 100 always does. */
export function isOpenResult(result: number, threshold: number): boolean {
  return result >= threshold || result === ALWAYS_OPEN;
}

/**
 * The Fumble Level: a plain D100 with neither Open Roll nor Fumble. The caller
 * decides what to do with it — subtract it from the final result (skill checks,
 * psychic potential) or from the defence ability (fumble on defence).
 */
export async function rollFumbleLevel(backend: RollBackend): Promise<number> {
  return backend.rollDie(100);
}
