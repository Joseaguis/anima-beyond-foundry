import { FlatModifierRuleElement } from "./rule-element/flat-modifier";
import { RollModifierRuleElement } from "./rule-element/roll-modifier";
import type { AnimaRuleElement, RuleElementConstructor, RuleElementSource } from "./rule-element/base";
import type { AnimaItem } from "../documents/item";

export { AnimaRuleElement, type RuleElementSource, type RuleElementConstructor } from "./rule-element/base";
export { FlatModifierRuleElement } from "./rule-element/flat-modifier";
export { RollModifierRuleElement } from "./rule-element/roll-modifier";
export { type AnimaSynthetics, emptySynthetics } from "./synthetics";
export { extractRollModifiers, extractRollOptions } from "./roll-helpers";
export {
  MODIFIER_TYPES,
  isModifierType,
  stackBreakdown,
  stackTotal,
  type Modifier,
  type ModifierType,
  type RollModifier,
  type StackableModifier,
} from "./modifier";
export { isPredicate, testPredicate, type Predicate } from "./predicate";
export { TARGETS, isTarget, targetOptions, type TargetDef, type TargetGroup } from "./targets";
export {
  SPECIAL_RULES,
  specialRuleFlagValue,
  type SpecialRuleDef,
  type SpecialRuleEntry,
} from "./special-rules";

/**
 * Registry of available rule element kinds. Adding a new kind is one file in
 * ./rule-element plus one entry here.
 */
export const RULE_ELEMENTS: Record<string, RuleElementConstructor> = {
  FlatModifier: FlatModifierRuleElement,
  RollModifier: RollModifierRuleElement,
};

/**
 * Instantiate the rule elements of an item: the ones the author persisted in
 * `system.rules`, plus any the item's model derived into `system.syntheticRules`
 * during preparation (Ki techniques build theirs from their Efectos). Synthetic
 * rules stay out of `system.rules` so the item sheet's modifier editor keeps
 * showing only what the user actually wrote.
 *
 * A malformed entry is logged and skipped; it never breaks the actor's data
 * preparation.
 */
export function rulesFromItem(item: AnimaItem): AnimaRuleElement[] {
  const system = item.system as { rules?: unknown; syntheticRules?: unknown };
  const rules: AnimaRuleElement[] = [];

  const sources: RuleElementSource[] = [
    ...(Array.isArray(system.rules) ? (system.rules as RuleElementSource[]) : []),
    ...(Array.isArray(system.syntheticRules) ? (system.syntheticRules as RuleElementSource[]) : []),
  ];

  for (const source of sources) {
    if (!source || typeof source.key !== "string") continue;
    const RuleClass = RULE_ELEMENTS[source.key];
    if (!RuleClass) {
      console.warn(`AnimaBFv2 | Unknown rule element "${source.key}" on item "${item.name}"`);
      continue;
    }
    try {
      rules.push(new RuleClass(source, item));
    } catch (error) {
      console.warn(`AnimaBFv2 | Failed to build rule element "${source.key}" on item "${item.name}"`, error);
    }
  }

  return rules;
}
