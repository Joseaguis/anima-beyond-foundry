import { AnimaRuleElement, type RuleElementSource } from "./base";
import { isModifierType, type ModifierType } from "../modifier";
import { isTarget } from "../targets";
import type { AnimaSynthetics } from "../synthetics";
import type { AnimaItem } from "../../documents/item";

/**
 * Adds a flat, typed modifier to one of the actor's derived stats:
 * `{ "key": "FlatModifier", "target": "attack", "value": 10, "type": "magic" }`
 * Optionally gated by a predicate over the actor's roll options.
 */
export class FlatModifierRuleElement extends AnimaRuleElement {
  target: string;
  value: number;
  type: ModifierType;

  constructor(source: RuleElementSource, item: AnimaItem) {
    super(source, item);
    this.target = String(source.target ?? "");
    this.value = Number(source.value);
    this.type = isModifierType(source.type) ? source.type : "untyped";

    if (!isTarget(this.target) || !Number.isFinite(this.value) || this.value === 0) {
      this.ignored = true;
    }
  }

  override beforePrepareData(synthetics: AnimaSynthetics, rollOptions: Set<string>): void {
    if (!this.test(rollOptions)) return;
    (synthetics.modifiers[this.target] ??= []).push({
      target: this.target,
      value: this.value,
      type: this.type,
      enabled: true,
      source: this.label,
    });
  }
}
