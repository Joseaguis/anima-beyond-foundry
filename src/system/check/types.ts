/**
 * The kinds of check Ánima makes, and how the dice mechanic bends for each one.
 *
 * Every exception the rulebook grants — Resistances don't open, initiative
 * fumbles have no level, a fumbled defence subtracts from the defence itself —
 * is data in {@link CHECK_TYPES} rather than a branch in the engine.
 */

import type { RollModifier } from "../../rules/modifier";
import type { StrikeFlag } from "../chat/flags";

export type AnimaCheckType =
  | "skill-check"
  | "resistance-check"
  | "characteristic-check"
  | "attack-roll"
  | "defense-roll"
  | "magic-projection-attack"
  | "magic-projection-defense"
  | "psychic-potential"
  | "psychic-projection"
  | "initiative-roll";

export interface CheckTypeConfig {
  /** Characteristic checks are the only D10 ones (Core p. 8). */
  die: 10 | 100;
  allowOpen: boolean;
  allowFumble: boolean;
  /** Whether a fumble is followed by the Fumble Level roll. */
  rollsFumbleLevel: boolean;
  /**
   * The Fumble Level is subtracted from the final result. True where the book
   * says so explicitly (defence, psychic potential, maintained spells); false
   * where a fumble is instead a flat automatic failure whose consequences the
   * GM narrates (attack, spellcasting).
   */
  fumbleSubtracts: boolean;
  /** Mastery above 200 shortens the fumble range. Only for actual skills. */
  mastery: boolean;
  /** Resolved against a difficulty rather than against an opponent's roll. */
  opposed: boolean;
}

export const CHECK_TYPES: Record<AnimaCheckType, CheckTypeConfig> = {
  "skill-check": {
    die: 100,
    allowOpen: true,
    allowFumble: true,
    rollsFumbleLevel: true,
    fumbleSubtracts: true,
    mastery: true,
    opposed: false,
  },
  // Core p. 8: no Open Roll; a natural 100 always passes; +20 over the
  // difficulty passes automatically. Handled in dice/resistance.ts.
  "resistance-check": {
    die: 100,
    allowOpen: false,
    allowFumble: true,
    rollsFumbleLevel: true,
    fumbleSubtracts: false,
    mastery: false,
    opposed: false,
  },
  "characteristic-check": {
    die: 10,
    allowOpen: false,
    allowFumble: false,
    rollsFumbleLevel: false,
    fumbleSubtracts: false,
    mastery: false,
    opposed: false,
  },
  // Core p. 96: the blow simply misses and the character loses their active
  // actions; the opponent may add the failure level to their own attack.
  "attack-roll": {
    die: 100,
    allowOpen: true,
    allowFumble: true,
    rollsFumbleLevel: true,
    fumbleSubtracts: false,
    mastery: true,
    opposed: true,
  },
  // Core p. 96: "restar la cantidad directamente de su habilidad de defensa".
  "defense-roll": {
    die: 100,
    allowOpen: true,
    allowFumble: true,
    rollsFumbleLevel: true,
    fumbleSubtracts: true,
    mastery: true,
    opposed: true,
  },
  // Core p. 116: the spell fails and the Zeon is spent anyway; over 90 it goes
  // out of control. Nothing is subtracted from the roll.
  "magic-projection-attack": {
    die: 100,
    allowOpen: true,
    allowFumble: true,
    rollsFumbleLevel: true,
    fumbleSubtracts: false,
    mastery: true,
    opposed: true,
  },
  // Core p. 116: a fumble on an already-maintained spell does not cancel it —
  // it subtracts the failure level from the projection.
  "magic-projection-defense": {
    die: 100,
    allowOpen: true,
    allowFumble: true,
    rollsFumbleLevel: true,
    fumbleSubtracts: true,
    mastery: true,
    opposed: true,
  },
  // Core p. 212: "el nivel de Pifia se restará de su resultado final".
  "psychic-potential": {
    die: 100,
    allowOpen: true,
    allowFumble: true,
    rollsFumbleLevel: true,
    fumbleSubtracts: true,
    mastery: true,
    opposed: false,
  },
  "psychic-projection": {
    die: 100,
    allowOpen: true,
    allowFumble: true,
    rollsFumbleLevel: true,
    fumbleSubtracts: false,
    mastery: true,
    opposed: true,
  },
  // Core p. 96: acting last is the whole consequence; no level is calculated.
  "initiative-roll": {
    die: 100,
    allowOpen: true,
    allowFumble: true,
    rollsFumbleLevel: false,
    fumbleSubtracts: false,
    mastery: false,
    opposed: false,
  },
};

/** Whether this check reads the difficulty ladder (magic and psychic grades). */
export function usesDifficultyLadder(type: AnimaCheckType): boolean {
  return type === "psychic-potential" || type === "magic-projection-attack";
}

// ------------------------------------------------------------------ inputs ---

export interface CheckDifficulty {
  value: number;
  label?: string;
}

/** What a statistic hands the engine to make one roll. */
export interface CheckRollParameters {
  /** Skip the modifiers dialog (Shift-click). */
  skipDialog?: boolean;
  /** Fixed difficulty to beat. Absent for opposed rolls. */
  difficulty?: CheckDifficulty | number | null;
  /** Extra modifiers for this roll only, on top of the synthetics ones. */
  modifiers?: RollModifier[];
  /** Extra roll options for this roll only. */
  extraRollOptions?: string[];
  /** Overrides the check's own label on the card. */
  label?: string;
  /** House-rule overrides coming from the dialog or the special rules. */
  openThreshold?: number;
  fumbleThreshold?: number;
  /** Actor being attacked. Defaults to the user's current target. */
  targetUuid?: string | null;
  /** Grade a spell is cast at. Defaults to Base; the dialog can change it. */
  grade?: string | null;
  /**
   * Overrides the statistic's own damage data. Used by the psychic projection
   * follow-up, whose damage comes from the grade the potential check reached
   * rather than from the projection statistic itself.
   */
  strike?: StrikeFlag | null;
  /** Post the result to chat. Defaults to true. */
  createMessage?: boolean;
}
