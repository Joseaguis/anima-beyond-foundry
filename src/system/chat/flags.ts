/**
 * Shape of `message.flags.animabfv2`. Everything a card needs to re-render, be
 * inspected by a macro, or be completed later by the defender lives here — the
 * DOM of a chat message is disposable, the flags are not.
 */

import type { CheckResult } from "../check/resolve";
import type { RoundResolution } from "../combat/resolution";
import type { ShieldTemplate } from "../combat/shield";
import type { AnimaCheckType } from "../check/types";

export const SYSTEM_ID = "animabfv2";

/** Socket channel used to ask the GM to apply damage we cannot write ourselves. */
export const SOCKET_NAME = `system.${SYSTEM_ID}`;

export interface CheckFlag {
  type: AnimaCheckType;
  slug: string;
  label: string;
  actorUuid: string | null;
  tokenUuid: string | null;
  itemUuid: string | null;
  selectors: string[];
  /** Sorted, so two identical checks produce identical flags. */
  options: string[];
  result: CheckResult;
}

/** Everything an attack carries into the Resultado del Asalto. */
export interface StrikeFlag {
  finalDamage: number;
  /** TA grades the attack ignores (weapon quality, spells, ki). */
  atPiercing: number;
  /** `FIL`, `CON`, `PEN`… Null when nothing on the TA table stops it. */
  attackType: string | null;
  /** No TA is effective at all (psychic powers). */
  ignoresArmor?: boolean;
  weaponName?: string;
}

export interface OpposedFlag {
  state: "pending" | "resolved";
  /** Message holding the attack roll. */
  attackMessageId: string;
  defenseMessageId?: string;
  /** Actor the attack was aimed at, so damage knows where to land. */
  targetUuid?: string | null;
  resolution?: RoundResolution;
}

/** A spell cast at a chosen grade: what it cost and what it would raise. */
export interface CastFlag {
  grade: string;
  zeonCost: number;
  /** The shield this spell creates on a success, if it is a defence spell. */
  shield?: ShieldTemplate | null;
}

/**
 * The row of the difficulty ladder a psychic potential check reached, with what
 * that row does. Written after the roll, since the grade is its result.
 */
export interface PsychicFlag {
  gradeKey: string;
  gradeLabel: string;
  effect: string;
  strike?: StrikeFlag | null;
  shield?: ShieldTemplate | null;
}

export interface AnimaChatFlags {
  check: CheckFlag;
  strike?: StrikeFlag;
  cast?: CastFlag;
  psychic?: PsychicFlag;
  opposed?: OpposedFlag;
  /** Set once damage has been applied, so it cannot be applied twice. */
  damageApplied?: { amount: number; targetUuid: string };
  /** Set once the Zeón has been spent, so it cannot be spent twice. */
  zeonSpent?: { amount: number };
  /** Set once the shield has been raised, so it cannot be raised twice. */
  shieldRaised?: { shieldId: string };
}

/** Read our flags off a message, with the casts confined to one place. */
export function readAnimaFlags(message: unknown): AnimaChatFlags | null {
  const flags = (message as { flags?: Record<string, unknown> } | null)?.flags;
  const own = flags?.[SYSTEM_ID] as AnimaChatFlags | undefined;
  return own?.check ? own : null;
}

/** Payload of the "apply damage" socket request handled by the GM. */
export interface ApplyDamageRequest {
  action: "applyDamage";
  targetUuid: string;
  amount: number;
  messageId: string;
}
