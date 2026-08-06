/**
 * The two house rules that move the D100 thresholds, wired to the same
 * `system.specialRules` / synthetics-flags channel every other special rule
 * uses (see `src/rules/special-rules.ts` and `PrepContext.flag`).
 *
 * Both are stated as *shifts*, not absolute values, so they compose with the
 * advantages and disadvantages that also move the fumble range ("Buena suerte"
 * −1, its opposite +2, "Incapaz de errar" down to zero).
 */

import { specialRuleFlagValue, type SpecialRuleEntry } from "../../rules/special-rules";
import { FUMBLE_BASE, OPEN_ROLL_BASE } from "../dice/config";
import type { AnimaActor } from "../../documents/actor";

function flagValue(actor: AnimaActor, key: string): number {
  const rules = (actor.system as { specialRules?: Record<string, SpecialRuleEntry> })
    .specialRules;
  const fromSynthetics = actor.synthetics?.flags?.[key] ?? 0;
  return fromSynthetics + specialRuleFlagValue(rules?.[key]);
}

/**
 * Open Rolls trigger this many points earlier (a positive value makes them
 * easier: `openRollRange: 5` opens on 85+).
 */
export function openThresholdFor(actor: AnimaActor): number {
  return OPEN_ROLL_BASE - flagValue(actor, "openRollRange");
}

/**
 * Fumbles happen up to this result. `fumbleRange: -1` is the "one point less"
 * of a lucky character, `+2` the unlucky one. Never goes below zero.
 */
export function fumbleThresholdFor(actor: AnimaActor): number {
  return Math.max(0, FUMBLE_BASE + flagValue(actor, "fumbleRange"));
}
