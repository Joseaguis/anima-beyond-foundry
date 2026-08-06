/**
 * Modifiers and stacking rules.
 *
 * Inspired by PF2e's modifier architecture (pf2e/src/module/actor/modifiers.ts),
 * simplified for Anima: a modifier targets a derived stat by key, carries a typed
 * value, and stacks (or not) with other modifiers of the same type.
 */

import type { Predicate } from "./predicate";

/**
 * Stacking categories. `untyped` modifiers always stack with everything; for every
 * other (named) type only the best bonus and the worst penalty of that type apply.
 * Edit this list to add/rename Anima-specific categories — the editor dropdown and
 * stacking logic both read from it.
 */
export const MODIFIER_TYPES = [
  "untyped",
  "item",
  "magic",
  "status",
  "circumstance",
  "special",
] as const;

export type ModifierType = (typeof MODIFIER_TYPES)[number];

export function isModifierType(value: unknown): value is ModifierType {
  return typeof value === "string" && (MODIFIER_TYPES as readonly string[]).includes(value);
}

/** The shape {@link stackBreakdown} needs: both modifier kinds satisfy it. */
export interface StackableModifier {
  /** Signed value; positive = bonus, negative = penalty. */
  value: number;
  /** Stacking category. */
  type: ModifierType;
  /** Whether the modifier is active. Disabled entries are ignored entirely. */
  enabled: boolean;
}

/** A single resolved modifier, as collected into the actor's synthetics. */
export interface Modifier extends StackableModifier {
  /** Target stat key (see ./targets). */
  target: string;
  /** Human-readable origin (rule label / item name). */
  source?: string;
}

/**
 * A situational modifier resolved when the dice are rolled rather than baked
 * into a derived value during preparation.
 *
 * The distinction matters: {@link Modifier} answers "what is this character's
 * attack ability?" and is already inside `system.combat.attack.final`, while a
 * RollModifier answers "what applies to *this* attack, right now?" — surprise,
 * aiming, an active Ki technique, a second weapon. Mixing the two would double
 * count, so they live in separate synthetics buckets.
 */
export interface RollModifier extends StackableModifier {
  /** Selectors under which the modifier is offered (see system/check/selectors). */
  selectors: string[];
  /** Human-readable origin (rule label / item name). */
  label: string;
  /**
   * Re-tested against the check's roll options at roll time, so a modifier can
   * depend on things preparation cannot know (the weapon used, the target).
   */
  predicate?: Predicate;
  /** Turned off by the user in the check dialog. */
  ignored?: boolean;
  /** Cannot be turned off in the dialog (fatigue, armour penalties…). */
  forced?: boolean;
}

/**
 * Resolve a list of modifiers (all targeting the same stat) into a single total,
 * applying Anima stacking rules. Adapted from PF2e's `applyStackingRules`.
 *
 * Rules:
 * - Disabled entries are ignored.
 * - `untyped` modifiers always stack (every one is added).
 * - For every other type, bonuses and penalties are resolved separately: only the
 *   highest bonus of a given type and the lowest (worst) penalty of that type apply.
 */
export function stackTotal(modifiers: StackableModifier[]): number {
  return stackBreakdown(modifiers).total;
}

/**
 * Like {@link stackTotal} but also returns which entries actually contributed,
 * useful for showing a breakdown in the UI / chat.
 */
export function stackBreakdown<T extends StackableModifier>(
  modifiers: T[],
): {
  total: number;
  applied: T[];
} {
  const highestBonus: Record<string, T> = {};
  const lowestPenalty: Record<string, T> = {};
  const applied: T[] = [];

  for (const modifier of modifiers) {
    if (!modifier.enabled) continue;
    if (modifier.type === "untyped") {
      applied.push(modifier);
      continue;
    }
    const pool = modifier.value < 0 ? lowestPenalty : highestBonus;
    const existing = pool[modifier.type];
    const isBetter =
      existing === undefined ||
      (modifier.value < 0 ? modifier.value < existing.value : modifier.value > existing.value);
    if (isBetter) pool[modifier.type] = modifier;
  }

  applied.push(...Object.values(highestBonus), ...Object.values(lowestPenalty));
  const total = applied.reduce((sum, m) => sum + m.value, 0);
  return { total, applied };
}
