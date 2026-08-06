import { AnimaRuleElement, type RuleElementSource } from "./base";
import { isModifierType, type ModifierType } from "../modifier";
import type { AnimaSynthetics } from "../synthetics";
import type { AnimaItem } from "../../documents/item";

/**
 * Adds a situational modifier offered when the dice are rolled, keyed by
 * selector rather than by derived stat:
 *
 *   { "key": "RollModifier", "selectors": ["melee-attack-roll"], "value": -20,
 *     "type": "circumstance", "predicate": ["technique:golpe-vacio:active"] }
 *
 * The predicate is evaluated twice — once here, against the actor's state, and
 * again at roll time against the check's own options — so a rule can depend on
 * which weapon or spell is being used, something preparation cannot know.
 * That is what finally lets Ki techniques' `technique:<slug>:active` predicates
 * do something.
 *
 * Use FlatModifier instead when the bonus belongs to the character's sheet
 * value (it is permanent, it should show in the ability's total); use this one
 * when it belongs to a particular action.
 */
export class RollModifierRuleElement extends AnimaRuleElement {
  selectors: string[];
  value: number;
  type: ModifierType;
  forced: boolean;

  constructor(source: RuleElementSource, item: AnimaItem) {
    super(source, item);

    // Accept both `selector: "x"` and `selectors: ["x", "y"]`.
    const raw = Array.isArray(source.selectors)
      ? source.selectors
      : source.selector !== undefined
        ? [source.selector]
        : [];
    this.selectors = raw.filter((s): s is string => typeof s === "string" && s.length > 0);

    this.value = Number(source.value);
    this.type = isModifierType(source.type) ? source.type : "untyped";
    this.forced = source.forced === true;

    if (this.selectors.length === 0 || !Number.isFinite(this.value) || this.value === 0) {
      this.ignored = true;
    }
  }

  override beforePrepareData(synthetics: AnimaSynthetics, _rollOptions: Set<string>): void {
    if (this.ignored) return;
    // Note this deliberately does not call `this.test()`: the predicate travels
    // with the modifier and is resolved at roll time, where the check's own
    // options (weapon, spell, target) are known.
    //
    // One object shared across selectors on purpose — extractRollModifiers
    // dedupes by identity, so a check matching several of them counts it once.
    const modifier = {
      selectors: this.selectors,
      label: this.label,
      value: this.value,
      type: this.type,
      enabled: true,
      forced: this.forced,
      predicate: this.predicate,
    };
    for (const selector of this.selectors) {
      (synthetics.rollModifiers[selector] ??= []).push(modifier);
    }
  }
}
