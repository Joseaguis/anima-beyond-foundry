import { characteristicField } from "./data";
import { defaultCategoryData, type CategoryData, type PrepContext, type PrepMode, type CharacteristicKey, type ResolvedCategory } from "./prep/types";
import { stackTotal, specialRuleFlagValue, type SpecialRuleEntry } from "../../rules";
import type { AnimaActor } from "../../documents/actor";

const { SchemaField, NumberField, StringField, TypedObjectField } = foundry.data.fields;

export function creatureSchema() {
  return {
    level: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
    str: characteristicField(),
    dex: characteristicField(),
    agi: characteristicField(),
    con: characteristicField(),
    int: characteristicField(),
    pow: characteristicField(),
    wp: characteristicField(),
    per: characteristicField(),
    lifePoints: new SchemaField({
      max: new NumberField({ required: true, initial: 70, integer: true }),
      current: new NumberField({ required: true, initial: 70, integer: true }),
      multiples: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
    }),
    fatigue: new SchemaField({
      max: new NumberField({ required: true, initial: 5, integer: true }),
      current: new NumberField({ required: true, initial: 5, integer: true }),
      special: new NumberField({ required: true, initial: 0, integer: true }),
    }),
    initiative: new SchemaField({
      base: new NumberField({ required: true, initial: 20, integer: true }),
      armorPenalty: new NumberField({ required: true, initial: 0, integer: true }),
      weaponBonus: new NumberField({ required: true, initial: 0, integer: true }),
      special: new NumberField({ required: true, initial: 0, integer: true }),
    }),
    // "Esp." shifts the level looked up in Tabla 19/20 (regeneración) and
    // Tabla 21 (movimiento); prep publishes the derived level and table texts
    // onto these same nodes.
    regeneration: new SchemaField({
      special: new NumberField({ required: true, initial: 0, integer: true }),
    }),
    movement: new SchemaField({
      special: new NumberField({ required: true, initial: 0, integer: true }),
    }),
    resistances: new SchemaField({
      rf: new SchemaField({ special: new NumberField({ required: true, initial: 0, integer: true }) }),
      re: new SchemaField({ special: new NumberField({ required: true, initial: 0, integer: true }) }),
      rv: new SchemaField({ special: new NumberField({ required: true, initial: 0, integer: true }) }),
      rm: new SchemaField({ special: new NumberField({ required: true, initial: 0, integer: true }) }),
      rp: new SchemaField({ special: new NumberField({ required: true, initial: 0, integer: true }) }),
      notes: new StringField({ required: true, initial: "" }),
    }),
    // Player-entered global modifiers, until the effects window exists. They
    // are injected into synthetics so every mod("allActions"/"physicalActions")
    // consumer (combat, secondaries, projections) picks them up.
    modifiers: new SchemaField({
      allActions: new NumberField({ required: true, initial: 0, integer: true }),
      physicalActions: new NumberField({ required: true, initial: 0, integer: true }),
    }),
    // Active special rules (house rules), keyed by catalog key (see
    // rules/special-rules). Presence of a key means the rule is active;
    // `value` only matters for rules with a numeric parameter.
    specialRules: new TypedObjectField(
      new SchemaField({
        value: new NumberField({ required: false, nullable: true, initial: null, integer: true }),
        note: new StringField({ required: true, initial: "" }),
      }),
      { required: true },
    ),
  };
}

/**
 * Bonos manuales de la caja "Equipo (Turno)" del Excel: se aplican en
 * prepareEquipment a los valores de todas las armas y del desarmado (no a las
 * habilidades de combate globales).
 */
export function equipBonusField() {
  return new SchemaField({
    turn: new NumberField({ required: true, initial: 0, integer: true }),
    attack: new NumberField({ required: true, initial: 0, integer: true }),
    parry: new NumberField({ required: true, initial: 0, integer: true }),
    dodge: new NumberField({ required: true, initial: 0, integer: true }),
    damage: new NumberField({ required: true, initial: 0, integer: true }),
  });
}

export type CreatureSchema = ReturnType<typeof creatureSchema>;

/**
 * Shared base model for creature-like actors (characters, NPCs). Provides the
 * common schema (characteristics, vitals, initiative) and the context the
 * derived-data pipeline phases (./prep) consume. Subclasses declare how base
 * values are obtained (development points vs direct entry) via `prepMode`.
 */
export abstract class CreatureModel<
  Schema extends CreatureSchema = CreatureSchema,
> extends foundry.abstract.TypeDataModel<Schema, Actor.Implementation> {
  /**
   * Per-level costs and bonuses contributed by an embedded category item
   * during prepareActorData (see CategoryModel). Ephemeral, never persisted.
   */
  declare categoryData: CategoryData | undefined;

  /**
   * Every embedded category item's data keyed by item id, published during
   * prepareActorData. Multi-class characters resolve their category slots
   * against this map. Ephemeral, never persisted.
   */
  declare categoryDataById: Record<string, CategoryData> | undefined;

  /**
   * The category progression resolved during the last buildPrepContext call.
   * Consumed after preparation (roll options, sheets). Ephemeral.
   */
  declare resolvedCategories: ResolvedCategory[] | undefined;

  /** How base values are obtained: "dp" (characters) or "direct" (NPCs). */
  protected abstract get prepMode(): PrepMode;

  override prepareBaseData(): void {
    super.prepareBaseData();
    // Ephemeral item-contributed data: reset every cycle so deleting the
    // source item really removes its contribution.
    this.categoryData = undefined;
    this.categoryDataById = undefined;
    this.resolvedCategories = undefined;
    const data = this as Record<string, unknown>;
    data.equippedWeapons = undefined;
    data.equippedArmors = undefined;
    data.equipment = undefined;
    data.magicPaths = undefined;
    data.spells = undefined;
    data.psychicDisciplines = undefined;
    data.psychicPowers = undefined;
    data.kiAbilities = undefined;
    data.kiTechniques = undefined;
    data.combatStyles = undefined;
    data.weaponTables = undefined;
  }

  /**
   * The chronological category progression. The base implementation is the
   * single-category behavior shared by NPCs and slot-less characters: one
   * stage holding every level, backed by the first embedded category item
   * (or defaults). CharacterModel overrides this to resolve system.categories.
   */
  protected getCategoryProgression(): ResolvedCategory[] {
    const data = this as Record<string, unknown>;
    const level = typeof data.level === "number" ? data.level : 0;
    return [
      {
        key: "c1",
        data: this.categoryData ?? defaultCategoryData(),
        levels: level,
        cumulativeLevels: level,
        changeCost: 0,
      },
    ];
  }

  /** Build the context consumed by the ./prep phase functions. */
  protected buildPrepContext(): PrepContext {
    const synthetics = (this.parent as unknown as AnimaActor).synthetics;
    // Manual global modifiers behave like any rule-element contribution;
    // synthetics are reset each cycle in prepareBaseData, so no double count.
    const manual = (this as Record<string, unknown>).modifiers as
      | { allActions?: number; physicalActions?: number }
      | undefined;
    if (synthetics && manual) {
      for (const target of ["allActions", "physicalActions"] as const) {
        const value = manual[target] ?? 0;
        if (value === 0) continue;
        (synthetics.modifiers[target] ??= []).push({
          target,
          value,
          type: "untyped",
          enabled: true,
          source: "Manual",
        });
      }
    }
    const categories = this.getCategoryProgression();
    this.resolvedCategories = categories;
    const specialRules = (this as Record<string, unknown>).specialRules as
      | Record<string, SpecialRuleEntry>
      | undefined;
    return {
      level: categories.reduce((sum, c) => sum + c.levels, 0),
      categories,
      mode: this.prepMode,
      mod: (key: string) => stackTotal(synthetics?.modifiers[key] ?? []),
      flag: (key: string) =>
        (synthetics?.flags?.[key] ?? 0) + specialRuleFlagValue(specialRules?.[key]),
      charFinals: {} as Record<CharacteristicKey, number>,
      charMods: {} as Record<CharacteristicKey, number>,
    };
  }
}
