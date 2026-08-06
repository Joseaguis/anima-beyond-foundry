/**
 * Turning a statistic plus its situational modifiers into a finished check.
 *
 * Foundry-free on purpose: this is the layer the tests drive with a
 * {@link RollBackend} of fixed results, the same way the prep pipeline is
 * tested without Foundry's data models.
 */

import { getDifficultyForValue, type DifficultyRow } from "../../actors/creature/tables";
import { stackBreakdown, type RollModifier } from "../../rules/modifier";
import { resolveD10 } from "../dice/d10";
import { resolveD100 } from "../dice/d100";
import { hasMastery } from "../dice/d100";
import { ALWAYS_OPEN } from "../dice/config";
import { passesAutomatically } from "../dice/resistance";
import { CHECK_TYPES, usesDifficultyLadder, type AnimaCheckType } from "./types";
import type { RollBackend } from "../dice/backend";

export interface CheckResolveInput {
  type: AnimaCheckType;
  /** The statistic's final value as published by the prep pipeline. */
  base: number;
  /** Situational modifiers, already extracted and predicate-tested. */
  modifiers?: RollModifier[];
  /** Difficulty to beat. Null for opposed checks, which have no fixed target. */
  difficulty?: number | null;
  openThreshold?: number;
  fumbleThreshold?: number;
}

export interface CheckResult {
  type: AnimaCheckType;
  /** Statistic value before situational modifiers. */
  base: number;
  /** Sum of the modifiers that survived stacking. */
  modifierTotal: number;
  /** Which modifiers actually contributed, for the card's breakdown. */
  appliedModifiers: RollModifier[];
  /** base + modifierTotal: the "habilidad final" mastery is measured against. */
  finalAbility: number;
  /** Every die rolled, in order. */
  dice: number[];
  natural: number;
  /** Sum of the dice alone. */
  diceTotal: number;
  opens: number;
  isOpen: boolean;
  isFumble: boolean;
  fumbleLevel: number | null;
  /** Whether the fumble level was subtracted from the total for this check type. */
  fumbleApplied: boolean;
  mastery: boolean;
  /** The Resultado Final: ability + dice, minus the fumble level where it applies. */
  total: number;
  difficulty: number | null;
  /** Null for opposed checks, which are decided against the other roll. */
  success: boolean | null;
  /** total − difficulty: success level when positive, failure level when not. */
  margin: number | null;
  /** Grade reached on the ten-step ladder — magic and psychic checks only. */
  grade: DifficultyRow | null;
  /** Resistance passed without rolling (20 over the difficulty). */
  automatic: boolean;
  /** A natural 100 on a Resistance, which always avoids the effect. */
  naturalHundred: boolean;
}

export async function resolveCheck(
  backend: RollBackend,
  input: CheckResolveInput,
): Promise<CheckResult> {
  const config = CHECK_TYPES[input.type];
  const { total: modifierTotal, applied } = stackBreakdown(input.modifiers ?? []);
  const finalAbility = input.base + modifierTotal;
  const difficulty = input.difficulty ?? null;

  const skeleton = {
    type: input.type,
    base: input.base,
    modifierTotal,
    appliedModifiers: applied,
    finalAbility,
    difficulty,
    automatic: false,
    naturalHundred: false,
  };

  // A Resistance far enough above the difficulty never touches the dice.
  if (
    input.type === "resistance-check" &&
    difficulty !== null &&
    passesAutomatically(finalAbility, difficulty)
  ) {
    return {
      ...skeleton,
      dice: [],
      natural: 0,
      diceTotal: 0,
      opens: 0,
      isOpen: false,
      isFumble: false,
      fumbleLevel: null,
      fumbleApplied: false,
      mastery: false,
      total: finalAbility,
      success: true,
      margin: finalAbility - difficulty,
      grade: null,
      automatic: true,
    };
  }

  if (config.die === 10) {
    const roll = await resolveD10(backend, finalAbility);
    return {
      ...skeleton,
      dice: [roll.die],
      natural: roll.die,
      diceTotal: roll.effective,
      opens: 0,
      isOpen: false,
      isFumble: false,
      fumbleLevel: null,
      fumbleApplied: false,
      mastery: false,
      total: roll.total,
      success: difficulty === null ? null : roll.total >= difficulty,
      margin: difficulty === null ? null : roll.total - difficulty,
      grade: null,
    };
  }

  const mastery = config.mastery && hasMastery(finalAbility);
  const roll = await resolveD100(backend, {
    allowOpen: config.allowOpen,
    allowFumble: config.allowFumble,
    rollFumbleLevel: config.rollsFumbleLevel,
    mastery,
    openThreshold: input.openThreshold,
    fumbleThreshold: input.fumbleThreshold,
  });

  const fumbleApplied = roll.isFumble && config.fumbleSubtracts && roll.fumbleLevel !== null;
  const total = finalAbility + roll.total - (fumbleApplied ? (roll.fumbleLevel ?? 0) : 0);
  const naturalHundred = input.type === "resistance-check" && roll.natural === ALWAYS_OPEN;

  return {
    ...skeleton,
    dice: roll.dice,
    natural: roll.natural,
    diceTotal: roll.total,
    opens: roll.opens,
    isOpen: roll.isOpen,
    isFumble: roll.isFumble,
    fumbleLevel: roll.fumbleLevel,
    fumbleApplied,
    mastery,
    total,
    naturalHundred,
    success: resolveSuccess({
      opposed: config.opposed,
      difficulty,
      total,
      isFumble: roll.isFumble,
      naturalHundred,
    }),
    margin: difficulty === null ? null : total - difficulty,
    grade: usesDifficultyLadder(input.type) ? (getDifficultyForValue(total) ?? null) : null,
  };
}

function resolveSuccess(input: {
  opposed: boolean;
  difficulty: number | null;
  total: number;
  isFumble: boolean;
  naturalHundred: boolean;
}): boolean | null {
  // A natural 100 on a Resistance carries the check whatever the total is.
  if (input.naturalHundred) return true;
  // A fumble is an automatic failure, whatever the numbers say.
  if (input.isFumble) return false;
  // Opposed checks are decided against the other roll, not here.
  if (input.opposed || input.difficulty === null) return null;
  return input.total >= input.difficulty;
}
