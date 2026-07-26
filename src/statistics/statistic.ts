import { stackBreakdown, type Modifier } from "../rules/modifier";
import type { AnimaSynthetics } from "../rules/synthetics";

export interface StatPart {
  label: string;
  value: number;
}

/**
 * A composable derived statistic (adapted from PF2e's Statistic): a list of
 * named base parts plus the stacked modifiers from the actor's synthetics for
 * the statistic's target key. Exposes the final total and a full breakdown for
 * tooltips and chat cards.
 */
export class AnimaStatistic {
  readonly slug: string;
  /** Named base parts (base value, characteristic mod, category bonus...). */
  readonly parts: StatPart[];
  /** Modifiers that survived stacking, from synthetics. */
  readonly applied: Modifier[];
  readonly total: number;

  constructor(slug: string, parts: StatPart[], synthetics?: AnimaSynthetics) {
    this.slug = slug;
    this.parts = parts.filter((part) => part.value !== 0);
    const { total: modTotal, applied } = stackBreakdown(synthetics?.modifiers[slug] ?? []);
    this.applied = applied;
    this.total = parts.reduce((sum, part) => sum + part.value, 0) + modTotal;
  }

  /** Every contribution, base parts first, then applied modifiers. */
  get breakdown(): StatPart[] {
    return [
      ...this.parts,
      ...this.applied.map((m) => ({ label: m.source ?? m.type, value: m.value })),
    ];
  }
}
