import { DEFAULT_SECONDARY_ABILITIES } from "../../data/secondaryAbilities";
import { migrateCharacterDp, migrateSecondaryNatural } from "./migration";
import { CreatureModel, creatureSchema, equipBonusField } from "../creature/model";
import { prepareCharacteristics } from "../creature/prep/characteristics";
import { prepareState } from "../creature/prep/state";
import { prepareVitals } from "../creature/prep/vitals";
import { prepareCombat } from "../creature/prep/combat";
import { prepareEquipment } from "../creature/prep/equipment";
import { prepareSupernatural } from "../creature/prep/supernatural";
import { prepareSecondaries } from "../creature/prep/secondaries";
import { prepareDevelopment } from "../creature/prep/development";
import { defaultCategoryData, type PrepMode, type ResolvedCategory } from "../creature/prep/types";

const {
  SchemaField,
  NumberField,
  StringField,
  BooleanField,
  ObjectField,
  ArrayField,
  TypedObjectField,
} = foundry.data.fields;

/**
 * DP spent on one ability, split by category slot key (system.categories[].key).
 * Legacy plain-number values are converted by migrateCharacterDp.
 */
function dpRecordField() {
  return new TypedObjectField(new NumberField({ required: true, integer: true, min: 0 }), {
    required: true,
  });
}

function dpSkillField() {
  return new SchemaField({
    dp: dpRecordField(),
    special: new NumberField({ required: true, initial: 0, integer: true }),
  });
}

/**
 * A per-characteristic DP map for the six Ki characteristics (FUE/DES/AGI/CON/
 * POD/VOL). Ki points and accumulation are bought characteristic by
 * characteristic, each spend being a per-category-slot DP record.
 */
function kiCharField() {
  return new SchemaField({
    str: dpRecordField(),
    dex: dpRecordField(),
    agi: dpRecordField(),
    con: dpRecordField(),
    pow: dpRecordField(),
    wp: dpRecordField(),
  });
}

export function characterSchema() {
  return {
    ...creatureSchema(),
    race: new StringField({ required: true, initial: "human" }),
    destinyPoints: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
    destinyPointsUsed: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
    specialRegeneration: new StringField({ required: true, initial: "" }),
    // Chronological category progression (multi-class). Each slot has a stable
    // key (dp spends are indexed by it), the embedded category item it points
    // to ("" = first category item on the actor), the levels advanced in it,
    // and the DP paid for changing into it (0 for the first slot; the exact
    // change-cost formula is unverified, so it stays user-editable).
    categories: new ArrayField(
      new SchemaField({
        key: new StringField({ required: true, initial: "" }),
        itemId: new StringField({ required: true, initial: "" }),
        levels: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
        changeCost: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
      }),
      { required: true, initial: [] },
    ),
    dpConfig: new SchemaField({
      // How primary-ability limits combine across categories. Only "combined"
      // (each stage keeps every earlier stage's limit) is implemented; the
      // other Excel modes are accepted for forward compatibility.
      limitMode: new StringField({
        required: true,
        initial: "combined",
        choices: ["combined", "greatestCombined", "individual", "last", "best"],
      }),
    }),
    details: new SchemaField({
      sex: new StringField({ required: true, initial: "" }),
      nephilim: new StringField({ required: true, initial: "" }),
      height: new StringField({ required: true, initial: "" }),
      weight: new StringField({ required: true, initial: "" }),
      appearance: new NumberField({ required: true, initial: 5, integer: true, min: 1, max: 9 }),
      complexion: new StringField({ required: true, initial: "" }),
      eyes: new StringField({ required: true, initial: "" }),
      hair: new StringField({ required: true, initial: "" }),
      age: new StringField({ required: true, initial: "" }),
      region: new StringField({ required: true, initial: "" }),
      socialClass: new StringField({ required: true, initial: "" }),
    }),
    biography: new SchemaField({
      particularities: new StringField({ required: true, initial: "" }),
      personality: new StringField({ required: true, initial: "" }),
      dreams: new StringField({ required: true, initial: "" }),
      history: new StringField({ required: true, initial: "" }),
      clothing: new StringField({ required: true, initial: "" }),
      titles: new StringField({ required: true, initial: "" }),
      contacts: new StringField({ required: true, initial: "" }),
    }),
    money: new SchemaField({
      gold: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
      silver: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
      copper: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
    }),
    fame: new SchemaField({
      audacity: new NumberField({ required: true, initial: 0, integer: true }),
      cowardice: new NumberField({ required: true, initial: 0, integer: true }),
      honor: new NumberField({ required: true, initial: 0, integer: true }),
      infamy: new NumberField({ required: true, initial: 0, integer: true }),
    }),
    mentalHealth: new SchemaField({
      insanityThreshold: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
    }),
    experience: new SchemaField({
      current: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
    }),
    creationPoints: new SchemaField({
      total: new NumberField({ required: true, initial: 3, integer: true }),
      spent: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
    }),
    languages: new StringField({ required: true, initial: "" }),
    notes: new StringField({ required: true, initial: "" }),
    // Cajas de notas libres por pestaña (Excel: Notas Equipo de Combate,
    // Notas Ki, Notas Místicos, Notas Psíquicos).
    combatNotes: new StringField({ required: true, initial: "" }),
    kiNotes: new StringField({ required: true, initial: "" }),
    magicNotes: new StringField({ required: true, initial: "" }),
    psychicNotes: new StringField({ required: true, initial: "" }),
    // Clase de criatura (Excel "Clase" box). Campos de anotación manual, sin
    // fórmula asociada todavía.
    class: new SchemaField({
      creatureType: new StringField({ required: true, initial: "" }),
      accumulateDamage: new BooleanField({ required: true, initial: false }),
      createdWithMagic: new BooleanField({ required: true, initial: false }),
      gnosis: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
      natureBonus: new NumberField({ required: true, initial: 0, integer: true }),
    }),
    // Ajustes de nivel (Excel "Ajustes de nivel" box): cada fila es una
    // entrada manual de notas + nivel + PDs, sin fórmula asociada todavía.
    levelAdjustments: new SchemaField(
      Object.fromEntries(
        ["race", "gnosis", "legacy", "boundArtifact", "extraPd"].map((key) => [
          key,
          new SchemaField({
            notes: new StringField({ required: true, initial: "" }),
            level: new NumberField({ required: true, initial: 0, integer: true }),
            pd: new NumberField({ required: true, initial: 0, integer: true }),
          }),
        ]),
      ),
    ),
    racialCapabilities: new StringField({ required: true, initial: "" }),
    bloodLegacies: new StringField({ required: true, initial: "" }),
    nephilimCapabilities: new StringField({ required: true, initial: "" }),
    combat: new SchemaField({
      attack: dpSkillField(),
      parry: dpSkillField(),
      dodge: dpSkillField(),
      wearArmor: dpSkillField(),
      // Purchased Martial Knowledge (5 DP per point, same in every category).
      martialKnowledge: dpSkillField(),
      // Anotaciones manuales de la caja "Habilidades de Combate" del Excel.
      developedWeapon: new StringField({ required: true, initial: "" }),
      actionsPerTurn: new NumberField({ required: true, initial: 1, integer: true, min: 0 }),
      equipBonus: equipBonusField(),
    }),
    // Manually entered equipped weapon/armor summary. Kept as a fallback for
    // characters without inventory items; superseded by equipped weapon/armor
    // items when present (see WeaponModel/ArmorModel prepareActorData).
    weapon: new SchemaField({
      name: new StringField({ required: true, initial: "" }),
      damage: new NumberField({ required: true, initial: 0, integer: true }),
      speed: new NumberField({ required: true, initial: 0, integer: true }),
    }),
    armor: new SchemaField({
      name: new StringField({ required: true, initial: "" }),
      at: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
      penalty: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
    }),
    magic: new SchemaField({
      // Zeón: DP bought (×5 per multiple) + current reserve + flat special.
      zeonDp: dpRecordField(),
      zeonCurrent: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
      zeonSpecial: new NumberField({ required: true, initial: 0, integer: true }),
      // Acumulación (ACT).
      actDp: dpRecordField(),
      actSpecial: new NumberField({ required: true, initial: 0, integer: true }),
      // Múltiplo de regeneración.
      regenDp: dpRecordField(),
      regenSpecial: new NumberField({ required: true, initial: 0, integer: true }),
      // Proyección Mágica.
      magicProjectionDp: dpRecordField(),
      magicProjectionSpecial: new NumberField({ required: true, initial: 0, integer: true }),
      // Desequilibrio ofensivo: shifts projection to attack (+) or defense (−),
      // steps of 10, clamped to ±30 in derived data (Core p. 117).
      offensiveImbalance: new NumberField({ required: true, initial: 0, integer: true }),
      // Nivel de Magia (innate by INT + bought). No longer a manual field.
      magicLevelDp: dpRecordField(),
      magicLevelSpecial: new NumberField({ required: true, initial: 0, integer: true }),
      // Convocatoria: Convocar/Dominación(Controlar)/Atadura(Atar)/Desconvocar.
      summoning: new SchemaField({
        summon: dpSkillField(),
        control: dpSkillField(),
        bind: dpSkillField(),
        banish: dpSkillField(),
      }),
      // Nota: Contenedor / Amplificador / Potencial innato existían aquí como
      // campos numéricos huérfanos. En el Excel son casillas de anotación que
      // van *debajo* del Total de Zeón y no alimentan ninguna fórmula, así que
      // se han retirado; para notas de este tipo está `magicNotes`.
      // Invocaciones y Encarnaciones: simple persisted list (no derived logic).
      summons: new ArrayField(
        new SchemaField({
          name: new StringField({ required: true, initial: "" }),
          difficulty: new NumberField({ required: true, initial: 0, integer: true }),
          zeonUpkeep: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
        }),
        { required: true, initial: [] },
      ),
      // Conjuros activos (Core p. 120). Los totales por asalto y por día se
      // derivan en prepareMagic; todavía no hay runtime que descuente Zeón.
      activeSpells: new ArrayField(
        new SchemaField({
          name: new StringField({ required: true, initial: "" }),
          // Grado con el que se lanzó: cada uno tiene su propio mantenimiento.
          grade: new StringField({ required: true, initial: "base" }),
          // "round" (sostenido, por asalto) o "daily" (declarado cada jornada).
          upkeepMode: new StringField({ required: true, initial: "round" }),
          zeonUpkeep: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
          // Contra quién se mantiene: necesario para repetir la RM cada 5
          // asaltos, derecho exclusivo de los conjuros mantenidos (Core p. 121).
          against: new StringField({ required: true, initial: "" }),
          note: new StringField({ required: true, initial: "" }),
        }),
        { required: true, initial: [] },
      ),
      // Habilidades metamágicas adquiridas: ids de nodos del grafo de Metamagia
      // (src/domains/magic/metamagia-graph.ts). Su coste en Nivel de Magia y su
      // aporte a la regeneración se derivan en prepareMagic.
      metamagias: new ArrayField(new StringField({ required: true, initial: "" }), {
        required: true,
        initial: [],
      }),
    }),
    ki: new SchemaField({
      // Ki points and accumulation are bought per characteristic (Excel Ki
      // sheet: FUE/DES/AGI/CON/POD/VOL each have their own row), so each is a
      // per-characteristic map of DP records. The innate contribution comes
      // from the characteristic value (see prepareSupernatural).
      pointsDp: kiCharField(),
      accDp: kiCharField(),
      special: new NumberField({ required: true, initial: 0, integer: true }),
      // Ki actual por característica (columna "Actual" del Excel): registro
      // manual de juego, sin runtime de gasto todavía.
      current: new SchemaField(
        Object.fromEntries(
          ["str", "dex", "agi", "con", "pow", "wp"].map((key) => [
            key,
            new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
          ]),
        ),
      ),
      // Habilidades del Ki (Detección/Ocultación): entrada manual, Total =
      // base + special en la UI.
      detection: new SchemaField({
        base: new NumberField({ required: true, initial: 0, integer: true }),
        special: new NumberField({ required: true, initial: 0, integer: true }),
      }),
      concealment: new SchemaField({
        base: new NumberField({ required: true, initial: 0, integer: true }),
        special: new NumberField({ required: true, initial: 0, integer: true }),
      }),
      // Cajas de anotación del Excel sin mecánica: Sellos del Dragón, Límites
      // libres y el flag de Unificación del Ki.
      dragonSeals: new StringField({ required: true, initial: "" }),
      freeLimits: new NumberField({ required: true, initial: 1, integer: true, min: 0 }),
      unified: new BooleanField({ required: true, initial: true }),
    }),
    psychic: new SchemaField({
      // CVs (Consumos de Voluntad): DP bought + current free reserve.
      cvDp: dpRecordField(),
      cvCurrent: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
      // Proyección Psíquica.
      projectionDp: dpRecordField(),
      projectionSpecial: new NumberField({ required: true, initial: 0, integer: true }),
      // Potencial Psíquico: base by VOL is derived; these feed the final value.
      // CV permanently invested in Incrementar Potencial (Tabla 70) and a flat
      // special (temporal Mejorar Potencial, ventajas...).
      potentialIncrementCvs: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
      potentialSpecial: new NumberField({ required: true, initial: 0, integer: true }),
      // Cristal psíquico (Core p. 229): grants +5..+30 to the potential while
      // held. Only one crystal can be attuned at a time, so this is a single
      // pair of fields rather than a list. A crystal bound to a discipline only
      // boosts that discipline's powers.
      crystalBonus: new NumberField({ required: true, initial: 0, integer: true, min: 0, max: 30 }),
      crystalDiscipline: new StringField({ required: true, initial: "" }),
      // Innatos: each maintains one power at a time (Core p. 212), 2 CV each.
      innatos: new ArrayField(
        new SchemaField({
          powerName: new StringField({ required: true, initial: "" }),
          potentialAllocated: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
          note: new StringField({ required: true, initial: "" }),
        }),
        { required: true, initial: [] },
      ),
    }),
    secondary: new SchemaField(
      Object.fromEntries(
        DEFAULT_SECONDARY_ABILITIES.map((a) => [
          a.key,
          new SchemaField({
            dp: dpRecordField(),
            // Natural improvement counters (Excel "Mejora Natural" columns):
            // Bon. re-applies the characteristic bonus, Hab. is +10 each
            // (both live in the capped "Bonos" cube), Novel is +10 each as
            // category bonus (outside the cap).
            naturalBonus: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
            naturalAbilities: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
            novelBonus: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
            special: new NumberField({ required: true, initial: 0, integer: true }),
          }),
        ]),
      ),
    ),
    customSecondary: new ObjectField({ required: true, initial: () => ({}) }),
  };
}

export type CharacterSchema = ReturnType<typeof characterSchema>;

export class CharacterModel extends CreatureModel<CharacterSchema> {
  static override defineSchema(): foundry.data.fields.DataSchema {
    return characterSchema();
  }

  static override migrateData(source: Record<string, any>): Record<string, any> {
    migrateCharacterDp(source);
    migrateSecondaryNatural(source);
    return super.migrateData(source);
  }

  protected override get prepMode(): PrepMode {
    return "dp";
  }

  /**
   * Resolve the persisted category progression (system.categories) against
   * the embedded category items. Slot-less characters keep the base
   * single-category behavior; an empty itemId points to the first category
   * item on the actor (the pre-multiclass convention).
   */
  protected override getCategoryProgression(): ResolvedCategory[] {
    const data = this as Record<string, any>;
    const slots: { key?: string; itemId?: string; levels?: number; changeCost?: number }[] =
      Array.isArray(data.categories) ? data.categories : [];
    if (slots.length === 0) return super.getCategoryProgression();

    const byId = this.categoryDataById ?? {};
    let cumulative = 0;
    return slots.map((slot, index) => {
      const resolved = slot.itemId ? byId[slot.itemId] : this.categoryData;
      const levels = slot.levels ?? 0;
      cumulative += levels;
      return {
        key: slot.key || `c${index + 1}`,
        data: resolved ?? defaultCategoryData(),
        levels,
        cumulativeLevels: cumulative,
        changeCost: slot.changeCost ?? 0,
        missing: !resolved,
      };
    });
  }

  override prepareDerivedData(): void {
    const ctx = this.buildPrepContext();
    // The prep phases work on structural slices; the model instance satisfies
    // them at runtime, but its schema-derived type is too wide to prove it.
    const data = this as Record<string, any>;

    // With a category progression the level is derived (Σ levels per stage);
    // slot-less characters keep their persisted level.
    if (Array.isArray(data.categories) && data.categories.length > 0) {
      data.level = ctx.level;
    }

    // Order matters: state (fatigue) feeds every action; equipment needs the
    // combat finals (wear armor, attack, parry); vitals and secondaries
    // consume the penalties equipment publishes; development only reads
    // persisted spends and the progression.
    prepareCharacteristics(data, ctx);
    prepareState(data, ctx);
    prepareCombat(data, ctx);
    prepareEquipment(data, ctx);
    prepareVitals(data, ctx);
    prepareSupernatural(data, ctx);
    prepareSecondaries(data, ctx, DEFAULT_SECONDARY_ABILITIES);
    prepareDevelopment(data, ctx);

    // Category display name for the sheet (empty when no category item).
    data.categoryName = ctx.categories
      .filter((c) => c.data.labelName)
      .map((c) => (ctx.categories.length > 1 ? `${c.data.labelName} ${c.levels}` : c.data.labelName))
      .join(" / ");
  }
}
