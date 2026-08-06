/**
 * The Foundry side of the dice: a `Roll` subclass that carries a finished
 * {@link CheckResult} and renders the system's own chat card.
 *
 * Why the formula is deterministic: Ánima's Open Roll is an unbounded chain
 * whose threshold climbs with each link, which no Foundry dice modifier can
 * express. So the dice are rolled first — one real `Roll("1d100")` each, via
 * {@link foundryBackend}, which keeps Dice So Nice and the dice-roll sound
 * working — and the AnimaRoll is then assembled from the results. Everything a
 * reader needs travels in `roll.options`, which Foundry serialises with the
 * message, so a card survives a reload.
 *
 * Registered in `CONFIG.Dice.rolls` so `Roll.fromData` rebuilds the subclass.
 */

import { renderCheckCard } from "../chat/card";
import type { RollBackend } from "./backend";
import type { CheckResult } from "../check/resolve";

/** Dice backed by real Foundry rolls, so the usual dice pipeline still fires. */
export function foundryBackend(): RollBackend {
  return {
    async rollDie(faces: number): Promise<number> {
      const roll = await new Roll(`1d${faces}`).evaluate();
      return roll.total;
    },
  };
}

export interface AnimaRollData extends Record<string, unknown> {
  check?: CheckResult;
  /** Statistic slug, for rules and macros that inspect the message. */
  slug?: string;
  /** Localised name shown as the card's heading. */
  label?: string;
}

export class AnimaRoll extends Roll {
  /**
   * Build the roll from an already-resolved check. The formula spells out the
   * arithmetic the card shows: every die, then the ability, then the modifiers.
   */
  static fromCheck(result: CheckResult, data: AnimaRollData = {}): AnimaRoll {
    // Spell out the open-roll chain when the dice add up to the dice total, so
    // the formula reads like the card. The D10 checks don't (a natural 1 counts
    // as −2), so those fall back to the single resolved value.
    const diceSum = result.dice.reduce((sum, die) => sum + die, 0);
    const head =
      result.dice.length > 0 && diceSum === result.diceTotal
        ? result.dice.join(" + ")
        : String(result.diceTotal);

    const parts = [head, signed(result.finalAbility)];
    if (result.fumbleApplied && result.fumbleLevel !== null) {
      parts.push(signed(-result.fumbleLevel));
    }
    // `Roll.options` is free-form at runtime and is what Foundry serialises with
    // the message; fvtt-types models it as a closed shape, hence the cast.
    const options = { ...data, check: result } as AnimaRollData;
    return new AnimaRoll(parts.join(" "), {}, options as never);
  }

  /** Our payload on `options`, narrowed back to the shape we put there.
   *  Not called `data` — Roll already owns that name. */
  get payload(): AnimaRollData {
    return this.options as unknown as AnimaRollData;
  }

  get check(): CheckResult | null {
    return this.payload.check ?? null;
  }

  override async render(): Promise<string> {
    if (!(this as unknown as { _evaluated?: boolean })._evaluated) await this.evaluate();
    return renderCheckCard(this);
  }
}

/** "+ 120" / "- 30", as the formula parser expects them. */
function signed(value: number): string {
  return value < 0 ? `- ${Math.abs(value)}` : `+ ${value}`;
}
