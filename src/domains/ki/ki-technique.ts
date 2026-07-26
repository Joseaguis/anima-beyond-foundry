import { BaseItemModel, baseItemSchema } from "../../items/base/model";
import { CreatureModel } from "../../actors/creature/model";
import type { RuleElementSource } from "../../rules/rule-element/base";
import { KI_CHAR_KEYS, type KiCharKey } from "./data";
import { buildTechnique } from "./technique-build";
import { buildTechniqueProfile, techniqueRuleElements } from "./technique-profile";
import type {
  KiTechniqueData,
  TechniqueBuildResult,
  TechniqueComposition,
  TechniqueProfile,
} from "./technique-data";
import { TECHNIQUE_LEVELS } from "./technique-tables";

const { ArrayField, BooleanField, NumberField, SchemaField, StringField } = foundry.data.fields;

/** A Ki allocation across the six Ki characteristics. */
function kiDistributionField() {
  const field = () => new NumberField({ required: true, initial: 0, integer: true, min: 0 });
  return new SchemaField(Object.fromEntries(KI_CHAR_KEYS.map((key) => [key, field()])));
}

export function kiTechniqueSchema() {
  return {
    ...baseItemSchema(),
    /** Árbol de Técnicas this one belongs to (Dominus p. 044). */
    tree: new StringField({ required: true, initial: "" }),
    level: new NumberField({ required: true, initial: 1, integer: true, min: 1, max: 3 }),
    combinable: new BooleanField({ required: true, initial: false }),

    // The composition. Everything else (CM, Ki cost, profile) is derived from
    // this by the builder, never stored.
    effects: new ArrayField(
      new SchemaField({
        /** Key into TECHNIQUE_EFFECTS. */
        effect: new StringField({ required: true, initial: "" }),
        role: new StringField({
          required: true,
          initial: "secondary",
          choices: ["primary", "secondary"],
        }),
        /** Selected option labels; the first is the Efecto's main grade. */
        options: new ArrayField(new StringField(), { required: true, initial: [] }),
        duration: new StringField({
          required: true,
          initial: "none",
          choices: ["none", "maintained", "sustainedMinor", "sustainedMajor"],
        }),
        distribution: kiDistributionField(),
        upkeepDistribution: kiDistributionField(),
      }),
      { required: true, initial: [] },
    ),
    disadvantages: new ArrayField(
      new SchemaField({
        /** Key into TECHNIQUE_DISADVANTAGES. */
        disadvantage: new StringField({ required: true, initial: "" }),
        option: new StringField({ required: true, initial: "" }),
      }),
      { required: true, initial: [] },
    ),
    /** Ki bought off at +10 CM per point, per characteristic. */
    kiReduction: kiDistributionField(),
    /** Ki added to buy CM back, at −5 CM per 2 points. */
    kiIncrease: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
    /** Ki not tied to one Efecto: Combinable and the Ki-for-CM trade. */
    freeDistribution: kiDistributionField(),

    // Values as printed in the books, for the imported compendium. The Excel
    // stores these as literals instead of recomputing them, so they can differ
    // from the builder by a few points; they are reference only.
    bookCm: new NumberField({ required: false, nullable: true, initial: null, integer: true }),
    bookCost: new StringField({ required: false, initial: "" }),
    bookDistribution: new SchemaField(
      Object.fromEntries(
        KI_CHAR_KEYS.map((key) => [
          key,
          new SchemaField({
            activation: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
            upkeep: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
          }),
        ]),
      ),
    ),
  };
}

export type KiTechniqueSchema = ReturnType<typeof kiTechniqueSchema>;

/**
 * A Técnica de Ki built with the Dominus Exxet cap. 5 rules.
 *
 * The item stores only how the technique was composed; its CM cost, its Ki cost
 * per characteristic, its mechanical profile and its rule violations are all
 * derived by `buildTechnique` on every preparation cycle. That way changing the
 * tables can never leave a stale cost behind.
 */
export class KiTechniqueModel extends BaseItemModel<KiTechniqueSchema> {
  static override defineSchema(): foundry.data.fields.DataSchema {
    return kiTechniqueSchema();
  }

  /** Result of the builder, recomputed each preparation. */
  declare build: TechniqueBuildResult;
  /** What the technique does mechanically. */
  declare profile: TechniqueProfile;
  /** CM the technique costs, budgeted against Conocimiento Marcial. */
  declare mkCost: number;
  /** Rules derived from the profile; collected alongside `rules` by the actor. */
  declare syntheticRules: RuleElementSource[];
  /**
   * True when the owner has not allocated the Ki yet and the displayed cost
   * comes from the book values instead of the composition.
   */
  declare usesBookCost: boolean;

  /** Stable identifier used by the activation roll option. */
  get slug(): string {
    return (this.parent?.name ?? "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  get composition(): TechniqueComposition {
    const data = this as unknown as TechniqueComposition;
    return {
      level: data.level,
      combinable: data.combinable,
      effects: data.effects ?? [],
      disadvantages: data.disadvantages ?? [],
      kiReduction: data.kiReduction ?? {},
      kiIncrease: data.kiIncrease ?? 0,
      freeDistribution: data.freeDistribution ?? {},
    };
  }

  override prepareDerivedData(): void {
    super.prepareDerivedData();
    this.refresh();
  }

  /**
   * Recompute the builder output, the profile and the derived rules.
   *
   * Called from `prepareDerivedData` so an unowned technique (opened straight
   * from a compendium) has its costs too, and again defensively from
   * `prepareActorData`, which reads `build` and must not depend on Foundry's
   * internal ordering of the two hooks.
   */
  private refresh(): void {
    const composition = this.composition;
    const build = buildTechnique(composition);
    const data = this as unknown as {
      bookDistribution?: Record<KiCharKey, { activation: number; upkeep: number }>;
    };

    // An entirely unallocated technique (every imported book entry, since the
    // books print only the total) shows the book cost rather than zeros, and
    // does not count as a distribution error.
    const allocated = build.kiTotal > 0 || build.kiUpkeepTotal > 0;
    const bookDist = data.bookDistribution;
    this.usesBookCost = !allocated && Boolean(bookDist);

    if (this.usesBookCost && bookDist) {
      for (const key of KI_CHAR_KEYS) {
        build.kiCost[key] = bookDist[key]?.activation ?? 0;
        build.kiUpkeep[key] = bookDist[key]?.upkeep ?? 0;
      }
      build.kiTotal = KI_CHAR_KEYS.reduce((sum, key) => sum + build.kiCost[key], 0);
      build.kiUpkeepTotal = KI_CHAR_KEYS.reduce((sum, key) => sum + build.kiUpkeep[key], 0);
      build.errors = build.errors.filter(
        (e) => e.code !== "kiNotDistributed" && e.code !== "upkeepNotDistributed",
      );
    }

    this.build = build;
    this.mkCost = build.cm;
    this.profile = buildTechniqueProfile(composition);
    this.syntheticRules = techniqueRuleElements(this.profile, this.slug);
  }

  /** Publish onto the actor so `prepareKi` can budget the CM it consumes. */
  override prepareActorData(): void {
    const actorSystem = this.parent?.actor?.system;
    if (!(actorSystem instanceof CreatureModel)) return;
    if (!this.build) this.refresh();
    const techniques = ((actorSystem as unknown as { kiTechniques?: KiTechniqueData[] })
      .kiTechniques ??= []);
    techniques.push({
      name: this.parent?.name ?? "",
      tree: (this as unknown as { tree: string }).tree ?? "",
      level: this.build.level,
      mkCost: this.mkCost,
      kiTotal: this.build.kiTotal,
      kiUpkeepTotal: this.build.kiUpkeepTotal,
      invalid: this.build.errors.length > 0,
    });
  }
}
