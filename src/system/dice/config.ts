/**
 * Constants of Ánima's dice mechanic (Core Exxet pp. 7-8).
 *
 * Every number a house rule might want to move lives here, isolated on purpose:
 * the `openRollRange` / `fumbleRange` special rules and the per-check overrides
 * in the dialog shift these defaults rather than replacing the logic.
 */

/** A D100 of 90 or more is an Open Roll: roll again and add. */
export const OPEN_ROLL_BASE = 90;

/** Each consecutive open roll makes the next one one point harder (90, 91, 92…). */
export const OPEN_ROLL_STEP = 1;

/** A natural 100 is always an open roll, whatever the accumulated threshold is. */
export const ALWAYS_OPEN = 100;

/** A D100 of 1, 2 or 3 is a Fumble. */
export const FUMBLE_BASE = 3;

/** A final skill above this makes the character a master: one grade less of fumble. */
export const MASTERY_THRESHOLD = 200;

/** Grades of fumble range removed by mastery (3 stops being a fumble). */
export const MASTERY_FUMBLE_REDUCTION = 1;

/**
 * Safety valve. Open rolls are unbounded in theory; in practice a chain this
 * long means a broken RNG, and an infinite loop would hang the client.
 */
export const MAX_OPEN_ROLLS = 50;

/**
 * A resistance beating the difficulty by this much passes with no roll at all
 * (Core p. 8: "Si un personaje tiene una Resistencia 20 puntos por encima de la
 * dificultad que pone a prueba, no necesita tirar los dados").
 */
export const RESISTANCE_AUTO_SUCCESS_MARGIN = 20;

// --------------------------------------------------------------- D10 rules ---

/**
 * "Regla del 10": a natural 10 on a characteristic check counts as 12.
 * Core p. 8: "Consigue un 10, lo que le permite sumar 12 a su característica y
 * obtener un resultado de 21, en lugar de 19".
 */
export const NATURAL_10_BONUS = 2;

/**
 * "Regla del 1": a natural 1 on a characteristic check counts three points
 * worse than it reads, i.e. as a −2.
 *
 * ⚠ The book's own layout mangles this sidebar (p. 8): the "Regla del 1"
 * heading is missing and its example contradicts itself — it first says the
 * roll gains 3 points and then that a failure by 1 becomes a failure by 4. The
 * Excel (`Ficha Anima v8.7.0`) does not model characteristic checks at all, so
 * it cannot arbitrate. We take the reading that is symmetric with the Regla del
 * 10 and matches the failure example: a 1 is 3 points worse. Flip the sign of
 * the effect here if the table rules otherwise.
 */
export const NATURAL_1_PENALTY = 3;

/** Tabla 1 default: a characteristic check with no stated difficulty is Normal. */
export const DEFAULT_CHARACTERISTIC_DIFFICULTY = 10;

/**
 * Opposed characteristic checks: beyond this gap, each extra point of the
 * higher characteristic counts double (Core p. 8).
 */
export const OPPOSED_CHARACTERISTIC_GAP = 4;
