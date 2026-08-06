/**
 * Reading the synthetics at roll time. Adapted from PF2e's
 * `pf2e/src/module/rules/helpers.ts` (`extractModifiers`).
 */

import { testPredicate } from "./predicate";
import type { RollModifier } from "./modifier";
import type { AnimaSynthetics } from "./synthetics";

/**
 * Every situational modifier offered by any of the given selectors, with its
 * predicate re-tested against the check's roll options.
 *
 * A modifier registered under several selectors that a check happens to include
 * at once (a Ki technique on both `attack` and `melee-attack-roll`) is returned
 * only once — otherwise it would count twice for `untyped` modifiers, which
 * always stack.
 */
export function extractRollModifiers(
  synthetics: AnimaSynthetics,
  selectors: string[],
  rollOptions: Set<string>,
): RollModifier[] {
  const seen = new Set<RollModifier>();
  const extracted: RollModifier[] = [];

  for (const selector of new Set(selectors)) {
    for (const modifier of synthetics.rollModifiers[selector] ?? []) {
      if (seen.has(modifier)) continue;
      seen.add(modifier);
      // Clone so the dialog can toggle `ignored` without corrupting synthetics,
      // which live as long as the prepared actor data does.
      extracted.push({
        ...modifier,
        enabled: modifier.enabled && testPredicate(modifier.predicate, rollOptions),
      });
    }
  }

  return extracted;
}

/** Roll options contributed by rule elements for the given selectors, plus `all`. */
export function extractRollOptions(
  synthetics: AnimaSynthetics,
  selectors: string[],
): Set<string> {
  const options = new Set<string>();
  for (const selector of new Set(["all", ...selectors])) {
    for (const option of synthetics.rollOptions[selector] ?? []) options.add(option);
  }
  return options;
}
