/**
 * Modifiers and stacking rules.
 *
 * Inspired by PF2e's modifier architecture (pf2e/src/module/actor/modifiers.ts),
 * simplified for Anima: a modifier targets a derived stat by key, carries a typed
 * value, and stacks (or not) with other modifiers of the same type.
 */

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

/** A single resolved modifier, as collected into the actor's synthetics. */
export interface Modifier {
  /** Target stat key (see ./targets). */
  target: string;
  /** Signed value; positive = bonus, negative = penalty. */
  value: number;
  /** Stacking category. */
  type: ModifierType;
  /** Whether the modifier is active. Disabled entries are ignored entirely. */
  enabled: boolean;
  /** Human-readable origin (rule label / item name). */
  source?: string;
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
export function stackTotal(modifiers: Modifier[]): number {
  return stackBreakdown(modifiers).total;
}

/**
 * Like {@link stackTotal} but also returns which entries actually contributed,
 * useful for showing a breakdown in the UI / chat.
 */
export function stackBreakdown(modifiers: Modifier[]): {
  total: number;
  applied: Modifier[];
} {
  const highestBonus: Record<string, Modifier> = {};
  const lowestPenalty: Record<string, Modifier> = {};
  const applied: Modifier[] = [];

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
