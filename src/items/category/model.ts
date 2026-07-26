import { BaseItemModel, baseItemSchema } from "../base/model";
import { CreatureModel } from "../../actors/creature/model";
import type { CategoryData } from "../../actors/creature/prep/types";
import { categorySystemToData, type CategorySystemSource } from "./data";

const { SchemaField, NumberField, StringField, TypedObjectField } = foundry.data.fields;

function combatCostField() {
  return new NumberField({ required: true, initial: 2, integer: true, min: 1 });
}

function combatBonusField() {
  return new NumberField({ required: true, initial: 0, integer: true, min: 0 });
}

function secondaryCostField() {
  return new NumberField({ required: true, initial: 2, integer: true, min: 1 });
}

// The Excel master table has no per-GROUP innate bonuses (only per-ability
// ones, see secondaryAbilityBonusPerLevel), so groups default to 0.
function secondaryBonusField() {
  return new NumberField({ required: true, initial: 0, integer: true, min: 0 });
}

export function categorySchema() {
  return {
    ...baseItemSchema(),
    archetype: new StringField({ required: true, initial: "freelancer" }),
    lifeMultiple: new NumberField({ required: true, initial: 20, integer: true, min: 1 }),
    lpPerLevel: new NumberField({ required: true, initial: 5, integer: true, min: 0 }),
    initiativePerLevel: new NumberField({ required: true, initial: 5, integer: true, min: 0 }),
    martialKnowledgePerLevel: new NumberField({ required: true, initial: 10, integer: true, min: 0 }),
    // Fraction of the character's total DP that may be spent on each reserve
    // (Excel master table: "Limite Combate/Magia/Psi").
    dpLimits: new SchemaField({
      combat: new NumberField({ required: true, initial: 0.6, min: 0, max: 1 }),
      magic: new NumberField({ required: true, initial: 0.5, min: 0, max: 1 }),
      psychic: new NumberField({ required: true, initial: 0.5, min: 0, max: 1 }),
    }),
    combatCosts: new SchemaField({
      attack: combatCostField(),
      parry: combatCostField(),
      dodge: combatCostField(),
      wearArmor: combatCostField(),
    }),
    combatBonusPerLevel: new SchemaField({
      attack: combatBonusField(),
      parry: combatBonusField(),
      dodge: combatBonusField(),
      wearArmor: combatBonusField(),
    }),
    supernatural: new SchemaField({
      zeon: new NumberField({ required: true, initial: 2, integer: true, min: 1 }),
      actMultiple: new NumberField({ required: true, initial: 60, integer: true, min: 1 }),
      magicProjection: new NumberField({ required: true, initial: 2, integer: true, min: 1 }),
      ki: new NumberField({ required: true, initial: 2, integer: true, min: 1 }),
      kiAccMultiple: new NumberField({ required: true, initial: 20, integer: true, min: 1 }),
      psychicProjection: new NumberField({ required: true, initial: 2, integer: true, min: 1 }),
      cv: new NumberField({ required: true, initial: 20, integer: true, min: 1 }),
      summoning: new NumberField({ required: true, initial: 3, integer: true, min: 1 }),
      zeonPerLevel: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
      magicLevel: new NumberField({ required: true, initial: 3, integer: true, min: 1 }),
      // Levels needed to gain one innate CV (Excel "Nv/CV": 3 for most, 1 for mentalists).
      levelsPerCv: new NumberField({ required: true, initial: 3, integer: true, min: 1 }),
    }),
    secondaryCosts: new SchemaField({
      athletics: secondaryCostField(),
      social: secondaryCostField(),
      perceptive: secondaryCostField(),
      intellectual: secondaryCostField(),
      vigor: secondaryCostField(),
      subterfuge: secondaryCostField(),
      creative: secondaryCostField(),
    }),
    secondaryBonusPerLevel: new SchemaField({
      athletics: secondaryBonusField(),
      social: secondaryBonusField(),
      perceptive: secondaryBonusField(),
      intellectual: secondaryBonusField(),
      vigor: secondaryBonusField(),
      subterfuge: secondaryBonusField(),
      creative: secondaryBonusField(),
    }),
    // Per-ability DP cost reductions, keyed by secondary ability key. The
    // effective cost is min(group cost, override) — the Excel master table
    // lists these as absolute columns but never above the group cost.
    secondaryCostOverrides: new TypedObjectField(
      new NumberField({ required: true, integer: true, min: 1 }),
      { required: true },
    ),
    // Innate per-level bonuses to individual secondary abilities, keyed by
    // ability key (Excel master table right-hand columns).
    secondaryAbilityBonusPerLevel: new TypedObjectField(
      new NumberField({ required: true, integer: true, min: 0 }),
      { required: true },
    ),
    // Novel bonuses (+10 to a secondary, as category bonus) granted per level
    // (Excel "Bonos Novel" column; only the Novel category grants them).
    novelPerLevel: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
  };
}

export type CategorySchema = ReturnType<typeof categorySchema>;

export class CategoryModel extends BaseItemModel<CategorySchema> {
  static override defineSchema(): foundry.data.fields.DataSchema {
    return categorySchema();
  }

  /** This category's per-level costs and bonuses, in pipeline form. */
  toCategoryData(): CategoryData {
    return categorySystemToData(
      this.parent?.name ?? "",
      this as unknown as CategorySystemSource,
    );
  }

  /**
   * Contribute this category's per-level costs and bonuses to the owning
   * creature before its derived data is computed. Every category item is
   * published under its item id (multi-class characters resolve their slots
   * against categoryDataById); the first one additionally fills categoryData,
   * which single-category actors (NPCs, legacy characters) keep consuming.
   */
  override prepareActorData(): void {
    const actorSystem = this.parent?.actor?.system;
    const itemId = this.parent?.id;
    if (!(actorSystem instanceof CreatureModel) || !itemId) return;

    const data = this.toCategoryData();
    actorSystem.categoryDataById ??= {};
    actorSystem.categoryDataById[itemId] = data;
    actorSystem.categoryData ??= data;
  }
}
