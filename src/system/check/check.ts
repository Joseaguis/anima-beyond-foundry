/**
 * The check engine: takes a fully-built context, rolls it, and posts the card.
 * Mirrors `Check.roll` in `pf2e/src/module/system/check/check.ts`, minus the
 * parts of PF2e that Ánima has no use for (degrees of success, MAP, fortune).
 *
 * Everything above this layer (statistics, actions) decides *what* to roll;
 * everything below (dice, resolve) decides *how*. This file only wires the two
 * to Foundry.
 */

import { AnimaRoll, foundryBackend } from "../dice/AnimaRoll";
import { renderCastActions, renderDefenseButtons, renderPsychicOutcome } from "../chat/card";
import {
  SYSTEM_ID,
  type AnimaChatFlags,
  type CastFlag,
  type PsychicFlag,
  type StrikeFlag,
} from "../chat/flags";
import { psychicOutcomeAt } from "../actions/psychic";
import { resolveCheck, type CheckResult } from "./resolve";
import { CHECK_TYPES, type AnimaCheckType } from "./types";
import type { RollModifier } from "../../rules/modifier";
import type { AnimaActor } from "../../documents/actor";
import type { AnimaItem } from "../../documents/item";

export interface CheckContext {
  actor: AnimaActor;
  token?: { uuid: string } | null;
  item?: AnimaItem | null;
  type: AnimaCheckType;
  slug: string;
  /** Already localised. */
  label: string;
  base: number;
  selectors: string[];
  rollOptions: Set<string>;
  modifiers: RollModifier[];
  difficulty?: number | null;
  /** Present on attacks, so the defender's card can resolve the round. */
  strike?: StrikeFlag | null;
  /** Present when a spell was cast at a chosen grade. */
  cast?: CastFlag | null;
  /** Actor being attacked, when one is targeted. */
  targetUuid?: string | null;
  /** Post the card to chat. Defaults to true. */
  createMessage?: boolean;
  openThreshold?: number;
  fumbleThreshold?: number;
}

export interface CheckOutcome {
  roll: AnimaRoll;
  result: CheckResult;
  /** The posted message, absent when `createMessage` was false. */
  message: ChatMessage | null;
}

export async function rollCheck(context: CheckContext): Promise<CheckOutcome> {
  const result = await resolveCheck(foundryBackend(), {
    type: context.type,
    base: context.base,
    modifiers: context.modifiers,
    difficulty: context.difficulty ?? null,
    openThreshold: context.openThreshold,
    fumbleThreshold: context.fumbleThreshold,
  });

  const roll = AnimaRoll.fromCheck(result, { slug: context.slug, label: context.label });
  await roll.evaluate();

  if (context.createMessage === false) {
    return { roll, result, message: null };
  }

  const message = await postCheckMessage(roll, result, context);
  return { roll, result, message };
}

async function postCheckMessage(
  roll: AnimaRoll,
  result: CheckResult,
  context: CheckContext,
): Promise<ChatMessage | null> {
  const flags: AnimaChatFlags = {
    check: {
      type: context.type,
      slug: context.slug,
      label: context.label,
      actorUuid: context.actor.uuid ?? null,
      tokenUuid: context.token?.uuid ?? null,
      itemUuid: context.item?.uuid ?? null,
      selectors: context.selectors,
      options: [...context.rollOptions].sort(),
      result,
    },
  };

  if (context.strike) flags.strike = context.strike;
  if (context.cast) flags.cast = context.cast;

  const message = await roll.toMessage(
    {
      speaker: ChatMessage.getSpeaker({ actor: context.actor as never }),
      flags: { [SYSTEM_ID]: flags },
    },
    { create: true },
  );

  // Every button needs the message id, which only exists once the message is
  // created — so the interactive blocks go on in a second, cheap update.
  if (message) {
    const id = message.id ?? "";
    let content = message.content;
    const update: Record<string, unknown> = {};

    // The Zeón is owed whether or not the spell worked (Core p. 116), so this
    // block is appended even on a fumble.
    if (context.cast) content += renderCastActions(context.cast, id);

    // A psychic power's grade is an output of the roll, so its block can only
    // be built now that the result exists.
    const psychic = psychicFlagFor(context, result);
    if (psychic) {
      update.psychic = psychic;
      content += renderPsychicOutcome(psychic, id);
    }

    if (isOpposedAttack(context.type)) {
      update.opposed = {
        state: "pending",
        attackMessageId: id,
        targetUuid: context.targetUuid ?? null,
      } satisfies AnimaChatFlags["opposed"];
      content += renderDefenseButtons(id);
    }

    if (content !== message.content) {
      await message.update({
        content,
        ...(Object.keys(update).length ? { flags: { [SYSTEM_ID]: update } } : {}),
      } as never);
    }
  }

  return message ?? null;
}

/**
 * The ladder row a psychic potential check landed on, if any. A fumble reaches
 * nothing, and neither does a total under the first rung of the ladder.
 */
function psychicFlagFor(context: CheckContext, result: CheckResult): PsychicFlag | null {
  if (context.type !== "psychic-potential" || !context.item || result.isFumble) return null;
  const grade = result.grade;
  if (!grade) return null;

  const outcome = psychicOutcomeAt(context.item, grade.key);
  if (!outcome) return null;

  return {
    gradeKey: outcome.gradeKey,
    gradeLabel: outcome.gradeLabel,
    effect: outcome.effect,
    strike: outcome.strike,
    shield: outcome.shield,
  };
}

/** Attacks wait for a defence; defences and plain checks resolve on their own. */
function isOpposedAttack(type: AnimaCheckType): boolean {
  return (
    CHECK_TYPES[type].opposed &&
    type !== "defense-roll" &&
    type !== "magic-projection-defense"
  );
}
