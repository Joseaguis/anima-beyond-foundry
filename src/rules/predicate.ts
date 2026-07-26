/**
 * Minimal predicate system for rule elements, tested against an actor's roll
 * options (a set of strings like "self:type:character" or "self:category:wizard").
 *
 * Two forms are accepted:
 * - `string[]`               — every option must be present (AND).
 * - `{ all?, any?, not? }`   — all of `all`, at least one of `any`, none of `not`.
 *
 * This is a deliberate subset of PF2e's PredicatePF2e; extend it here if rule
 * elements ever need quantifiers or numeric comparisons.
 */
export type Predicate = string[] | { all?: string[]; any?: string[]; not?: string[] };

export function isPredicate(value: unknown): value is Predicate {
  if (Array.isArray(value)) return value.every((v) => typeof v === "string");
  if (typeof value === "object" && value !== null) {
    return ["all", "any", "not"].some((k) => k in (value as object));
  }
  return false;
}

export function testPredicate(predicate: Predicate | undefined, options: Set<string>): boolean {
  if (!predicate) return true;

  if (Array.isArray(predicate)) {
    return predicate.every((option) => options.has(option));
  }

  const { all = [], any = [], not = [] } = predicate;
  if (!all.every((option) => options.has(option))) return false;
  if (any.length > 0 && !any.some((option) => options.has(option))) return false;
  if (not.some((option) => options.has(option))) return false;
  return true;
}
