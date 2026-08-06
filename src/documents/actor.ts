import { emptySynthetics, extractRollOptions, rulesFromItem, type AnimaSynthetics } from "../rules";
import { buildStatistics } from "../system/statistic/build";
import type { AnimaRuleElement } from "../rules";
import type { AnimaStatistic } from "../system/statistic/statistic";
import type { BaseItemModel } from "../items/base/model";
import type { AnimaItem } from "./item";

/** Map of actor type name -> system model instance, derived from DataModelConfig. */
export type ActorSystemMap = {
  [K in keyof DataModelConfig["Actor"]]: InstanceType<DataModelConfig["Actor"][K]>;
};

export type ActorType = keyof ActorSystemMap;

/**
 * System-wide Actor document class. Owns the preparation cycle through which
 * items and their rule elements contribute to the actor (PF2e-style):
 *
 *   prepareBaseData        -> reset synthetics
 *   prepareEmbeddedDocuments -> items prepare themselves (super), then
 *                              prepareSiblingData / prepareActorData hooks,
 *                              then rule elements write into synthetics
 *   prepareDerivedData     -> the system model computes derived stats,
 *                              reading modifiers from synthetics
 *
 * Per-type data and derived calculations live in the TypeDataModels.
 */
export class AnimaActor extends Actor {
  /** Data contributed by rule elements this preparation cycle. */
  declare synthetics: AnimaSynthetics;

  /** Active rule elements collected from embedded items, sorted by priority. */
  declare rules: AnimaRuleElement[];

  /** Built lazily on first use and dropped whenever the actor is re-prepared. */
  #statistics: Map<string, AnimaStatistic> | null = null;

  /**
   * Everything this actor can roll, keyed by slug — secondary abilities,
   * Resistances, characteristics, one attack and parry per equipped weapon,
   * the projections and initiative. See `system/statistic/build.ts`.
   */
  get statistics(): Map<string, AnimaStatistic> {
    return (this.#statistics ??= buildStatistics(this));
  }

  /** One statistic by slug, e.g. `resistance.rm` or `strike.<weaponId>`. */
  getStatistic(slug: string): AnimaStatistic | null {
    return this.statistics.get(slug) ?? null;
  }

  /**
   * Narrow this actor by type, typing `system` accordingly:
   * `if (actor.isOfType("character")) { actor.system... }`
   */
  isOfType<T extends ActorType>(
    ...types: T[]
  ): this is AnimaActor & { type: T; system: ActorSystemMap[T] } {
    return types.some((t) => this.type === t);
  }

  /**
   * Roll options describing the actor's current state, consumed by rule
   * element predicates and by the check engine.
   *
   * Called with no arguments during preparation (only the actor's own state
   * exists yet) and with a check's selectors at roll time, when rule elements
   * may have contributed extra options per selector. `all` is always included,
   * the same contract as PF2e's `ActorPF2e#getRollOptions`.
   */
  getRollOptions(selectors: string[] = []): Set<string> {
    const options = new Set<string>();
    options.add(`self:type:${this.type}`);
    const system = this.system as {
      level?: number;
      categoryData?: { labelName?: string };
      resolvedCategories?: { data: { labelName?: string } }[];
    };
    // One option per category in the progression, so predicates match
    // multi-class characters on any of their categories.
    const categoryNames = system.resolvedCategories?.length
      ? system.resolvedCategories.map((c) => c.data.labelName)
      : [system.categoryData?.labelName];
    for (const name of categoryNames) {
      if (name) options.add(`self:category:${name.toLowerCase().replace(/\s+/g, "-")}`);
    }
    if (typeof system.level === "number") {
      options.add(`self:level:${system.level}`);
    }

    // Synthetics are absent while the very first preparation pass is running.
    if (this.synthetics) {
      for (const option of extractRollOptions(this.synthetics, selectors)) options.add(option);
    }

    return options;
  }

  /**
   * The same options re-prefixed for the other side of a roll, so a defender's
   * rules can predicate on who is attacking them (PF2e's `getSelfRollOptions`).
   */
  getRollOptionsAs(prefix: "target" | "origin"): Set<string> {
    const options = new Set<string>();
    for (const option of this.getRollOptions()) {
      options.add(option.startsWith("self:") ? option.replace(/^self/, prefix) : option);
    }
    return options;
  }

  override prepareBaseData(): void {
    super.prepareBaseData();
    this.synthetics = emptySynthetics();
    this.rules = [];
    // Statistics read prepared values, so they must not outlive a prep cycle.
    this.#statistics = null;
  }

  override prepareEmbeddedDocuments(): void {
    super.prepareEmbeddedDocuments();

    const systems = this.items.contents
      .map((item) => item.system as unknown)
      .filter((system): system is BaseItemModel => isItemModel(system));

    // Two passes so an item can rely on every sibling's own data being ready.
    for (const system of systems) system.prepareSiblingData();
    for (const system of systems) system.prepareActorData();

    this.rules = this.prepareRuleElements();

    const rollOptions = this.getRollOptions();
    for (const rule of this.rules) {
      try {
        rule.beforePrepareData(this.synthetics, rollOptions);
      } catch (error) {
        // A single broken rule must never break the whole actor.
        console.error(`AnimaBFv2 | Rule element "${rule.key}" (${rule.label}) failed`, error);
      }
    }
  }

  protected prepareRuleElements(): AnimaRuleElement[] {
    // Categories define costs/bonuses others may depend on: their rules first.
    return this.items.contents
      .sort((a, b) => Number(b.type === "category") - Number(a.type === "category"))
      .flatMap((item) => rulesFromItem(item as unknown as AnimaItem))
      .filter((rule) => !rule.ignored)
      .sort((a, b) => a.priority - b.priority);
  }
}

function isItemModel(system: unknown): system is BaseItemModel {
  return (
    typeof system === "object" &&
    system !== null &&
    typeof (system as BaseItemModel).prepareActorData === "function"
  );
}
