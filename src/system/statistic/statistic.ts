/**
 * A rollable statistic: a base value the prep pipeline already computed, the
 * selectors that decide which situational modifiers apply to it, and a `roll()`.
 *
 * Adapted from `pf2e/src/module/system/statistic/statistic.ts`. The big
 * simplification is that Ánima's numbers are already final — `prepareCombat`,
 * `prepareVitals` and the domain `prepare.ts` files have done the arithmetic —
 * so a Statistic here is a thin wrapper over `base` rather than a rebuild of it.
 */

import { extractRollModifiers } from "../../rules/roll-helpers";
import { stackBreakdown, type RollModifier } from "../../rules/modifier";
import { rollCheck, type CheckOutcome } from "../check/check";
import { openThresholdFor, fumbleThresholdFor } from "./house-rules";
import type { AnimaCheckType, CheckRollParameters } from "../check/types";
import type { StrikeFlag } from "../chat/flags";
import type { AnimaActor } from "../../documents/actor";
import type { AnimaItem } from "../../documents/item";
import type { GradeOption, SpellCast } from "../actions/spellcast";

export interface AnimaStatisticData {
  slug: string;
  /** Localisation key or literal text. */
  label: string;
  type: AnimaCheckType;
  /** Final value published by the prep pipeline. */
  base: number;
  selectors: string[];
  /** Roll options this statistic always contributes (`item:slug:…`). */
  rollOptions?: string[];
  /** The weapon, spell or power this statistic came from. */
  item?: AnimaItem | null;
  /** Damage data carried into the Resultado del Asalto. Attacks only. */
  strike?: StrikeFlag | null;
  /**
   * Grades this can be used at (a spell's four). When present the dialog shows
   * a selector, and `castFor` re-derives what the chosen grade actually does.
   */
  grades?: GradeOption[];
  castFor?: (grade: string) => SpellCast;
}

export class AnimaStatistic {
  readonly actor: AnimaActor;
  readonly slug: string;
  readonly label: string;
  readonly type: AnimaCheckType;
  readonly base: number;
  readonly selectors: string[];
  readonly item: AnimaItem | null;
  readonly strike: StrikeFlag | null;
  readonly grades: GradeOption[];

  #ownOptions: string[];
  #castFor?: (grade: string) => SpellCast;

  constructor(actor: AnimaActor, data: AnimaStatisticData) {
    this.actor = actor;
    this.slug = data.slug;
    this.label = localize(data.label);
    this.type = data.type;
    this.base = data.base;
    this.selectors = [...new Set(data.selectors)];
    this.item = data.item ?? null;
    this.strike = data.strike ?? null;
    this.grades = data.grades ?? [];
    this.#ownOptions = data.rollOptions ?? [];
    this.#castFor = data.castFor;
  }

  /** What this statistic does at one grade, when it has grades at all. */
  castAt(grade: string | null | undefined): SpellCast | null {
    if (!grade || !this.#castFor) return null;
    return this.#castFor(grade);
  }

  /** Options in play for this statistic: the actor's, plus its own. */
  rollOptions(extra: string[] = []): Set<string> {
    const options = this.actor.getRollOptions(this.selectors);
    for (const option of this.#ownOptions) options.add(option);
    options.add(`check:type:${this.type}`);
    options.add(`check:statistic:${this.slug}`);
    if (this.item) {
      options.add(`item:type:${this.item.type}`);
      const slug = (this.item.system as { slug?: string })?.slug;
      if (slug) options.add(`item:slug:${slug}`);
    }
    for (const option of extra) options.add(option);
    return options;
  }

  /** Situational modifiers that currently apply, before the dialog touches them. */
  modifiers(extraOptions: string[] = [], extra: RollModifier[] = []): RollModifier[] {
    const options = this.rollOptions(extraOptions);
    return [...extractRollModifiers(this.actor.synthetics, this.selectors, options), ...extra];
  }

  /** What the sheet shows next to the roll button: base plus what applies now. */
  get total(): number {
    return this.base + stackBreakdown(this.modifiers()).total;
  }

  /**
   * Roll it. Unless `skipDialog` is set (Shift-click), the player first gets
   * the modifiers dialog and may cancel — in which case nothing is rolled and
   * this resolves to null.
   */
  async roll(params: CheckRollParameters = {}): Promise<CheckOutcome | null> {
    const extraOptions = params.extraRollOptions ?? [];
    const rollOptions = this.rollOptions(extraOptions);
    const label = params.label ?? this.label;

    let modifiers = this.modifiers(extraOptions, params.modifiers ?? []);
    let difficulty =
      typeof params.difficulty === "number" ? params.difficulty : (params.difficulty?.value ?? null);
    let openThreshold = params.openThreshold ?? openThresholdFor(this.actor);
    let fumbleThreshold = params.fumbleThreshold ?? fumbleThresholdFor(this.actor);
    // Defaults to the first grade, which is what the statistic was built with.
    let grade = params.grade ?? this.grades[0]?.key ?? null;

    if (!params.skipDialog) {
      // Loaded on demand: CheckDialog reaches for `foundry.applications` at
      // module scope, which does not exist in the sandbox or in tests. Keeping
      // it out of the static graph is what lets both build statistics.
      const { promptCheckDialog } = await import("../check/CheckDialog");
      const chosen = await promptCheckDialog({
        label,
        type: this.type,
        base: this.base,
        modifiers,
        difficulty,
        openThreshold,
        fumbleThreshold,
        grades: this.grades,
        grade,
      });
      if (!chosen) return null;
      ({ modifiers, difficulty, openThreshold, fumbleThreshold } = chosen);
      grade = chosen.grade ?? grade;
    }

    // Re-derive what the spell does at the grade the player settled on: damage,
    // Zeón and the shield it would raise all change with it.
    const cast = this.castAt(grade);

    return rollCheck({
      actor: this.actor,
      item: this.item,
      type: this.type,
      slug: this.slug,
      label,
      base: this.base,
      selectors: this.selectors,
      rollOptions,
      modifiers,
      difficulty,
      strike: params.strike ?? (cast ? cast.strike : this.strike),
      cast: cast
        ? { grade: cast.grade, zeonCost: cast.zeonCost, shield: cast.shield }
        : null,
      targetUuid: params.targetUuid ?? currentTargetUuid(),
      createMessage: params.createMessage,
      openThreshold,
      fumbleThreshold,
    });
  }
}

/** The token the user is targeting, so the attack card knows where to land. */
function currentTargetUuid(): string | null {
  if (typeof game === "undefined") return null;
  const target = game.user?.targets?.first?.();
  const actor = (target as { actor?: { uuid?: string } } | undefined)?.actor;
  return actor?.uuid ?? null;
}

function localize(label: string): string {
  if (!label.startsWith("ANIMA.")) return label;
  if (typeof game === "undefined" || !game.i18n) return label;
  const localized = game.i18n.localize(label);
  return localized === label ? label : localized;
}
