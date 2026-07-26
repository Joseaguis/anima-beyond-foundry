import { PhysicalItemModel } from "../../items/physical/model";
import { isPredicate, testPredicate, type Predicate } from "../predicate";
import type { AnimaSynthetics } from "../synthetics";
import type { AnimaItem } from "../../documents/item";
import type { AnimaActor } from "../../documents/actor";

/**
 * Raw rule element data as persisted in `item.system.rules[]`. Deliberately
 * loose (ObjectField JSON): validation happens when the rule is instantiated,
 * and a broken rule never breaks the actor (see rulesFromItem).
 */
export interface RuleElementSource {
  key: string;
  label?: string;
  priority?: number;
  predicate?: Predicate;
  /**
   * Whether the parent item must be equipped for the rule to apply.
   * Defaults to true for physical items, irrelevant for the rest.
   */
  requiresEquipped?: boolean;
  ignored?: boolean;
  [key: string]: unknown;
}

/**
 * Base class of the mini rule-element system (adapted from PF2e's RuleElement).
 * A rule element lives on an item and contributes to the owning actor's
 * synthetics during data preparation. Subclasses validate their own fields in
 * the constructor and mark themselves `ignored` (or throw) when invalid.
 */
export abstract class AnimaRuleElement {
  key: string;
  label: string;
  priority: number;
  predicate?: Predicate;
  /** Ignored rules are skipped entirely during preparation. */
  ignored: boolean;
  readonly item: AnimaItem;

  constructor(source: RuleElementSource, item: AnimaItem) {
    this.key = String(source.key);
    this.label = typeof source.label === "string" && source.label ? source.label : item.name;
    this.priority = typeof source.priority === "number" ? source.priority : 100;
    this.predicate = isPredicate(source.predicate) ? source.predicate : undefined;
    this.ignored = source.ignored === true;
    this.item = item;

    // Equipped gating (PF2e-style: decided at construction, not at collection):
    // rules on physical items only apply while the item is equipped, unless the
    // rule explicitly opts out with `requiresEquipped: false`.
    const system = item.system;
    if (system instanceof PhysicalItemModel && source.requiresEquipped !== false) {
      if (!system.isEquipped) this.ignored = true;
    }
  }

  get actor(): AnimaActor | null {
    return this.item.actor as AnimaActor | null;
  }

  /** Whether this rule currently applies, given the actor's roll options. */
  test(rollOptions: Set<string>): boolean {
    if (this.ignored) return false;
    return testPredicate(this.predicate, rollOptions);
  }

  /** Contribute to the actor's synthetics before derived data is computed. */
  beforePrepareData(_synthetics: AnimaSynthetics, _rollOptions: Set<string>): void {}
}

export type RuleElementConstructor = new (
  source: RuleElementSource,
  item: AnimaItem,
) => AnimaRuleElement;
