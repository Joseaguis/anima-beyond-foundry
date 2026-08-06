import { BaseItemModel, baseItemSchema } from "../../items/base/model";
import { CreatureModel } from "../../actors/creature/model";
import type { SpellData } from "./data";

const { NumberField, StringField, SchemaField, HTMLField } = foundry.data.fields;

/**
 * One of a spell's four grades (Core p. 119): each has its own zeon cost, INT
 * requirement, maintenance cost and effect text. Reused for
 * base/intermediate/advanced/arcane.
 */
function spellGradeField() {
  return new SchemaField({
    zeonCost: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
    intRequired: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
    maintenanceCost: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
    // Per-grade effect line (Excel "Tablas Magia" cols V-Y): the same spell has
    // different numbers at each grade ("Daño 60" / "Daño 90"…).
    effect: new HTMLField({ required: true, initial: "" }),
    // The figures the roll engine needs, which the Excel only states inside the
    // effect prose. The extractor fills damage and shieldPoints through
    // `scripts/lib/parse-effect-numbers`; damageBarrier is authored by hand
    // (see that module's header for why it is not guessed).
    damage: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
    /** Resistance points of the shield this grade raises (Core p. 97). */
    shieldPoints: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
    /** Attacks with a base damage under this never wear it down (Core p. 236). */
    damageBarrier: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
  });
}

export function spellSchema() {
  return {
    ...baseItemSchema(),
    spellLevel: new NumberField({ required: true, initial: 2, integer: true, min: 2 }),
    actionType: new StringField({ required: true, initial: "active" }),
    maintenanceType: new StringField({ required: true, initial: "none" }),
    magicPath: new StringField({ required: true, initial: "" }),
    // TA the attack resolves against: fil | con | pen | cal | fri | ele | ene.
    damageType: new StringField({ required: true, initial: "" }),
    // Grades of the defender's TA this spell ignores. No source in the Excel,
    // so it is authored per spell.
    atPiercing: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
    resistanceType: new StringField({ required: true, initial: "none" }),
    // effect | attack | defense | detection | automatic | spiritual (Anímico).
    spellType: new StringField({ required: true, initial: "effect" }),
    effect: new HTMLField({ required: true, initial: "" }),
    // Paths this spell is closed to, comma separated (Excel col AA "Vía
    // cerrada"): Libre Acceso spells contradicting a path's nature (Core p. 118).
    closedPaths: new StringField({ required: true, initial: "" }),
    // Solo para conjuros de Libre Acceso: id del item de vía en cuyo hueco se
    // coloca este conjuro. Se elige en la ficha de personaje.
    hostPathId: new StringField({ required: true, initial: "" }),
    // Four grades, each with its own zeon/INT/maintenance (Core p. 119).
    grades: new SchemaField({
      base: spellGradeField(),
      intermediate: spellGradeField(),
      advanced: spellGradeField(),
      arcane: spellGradeField(),
    }),
  };
}

export type SpellSchema = ReturnType<typeof spellSchema>;

export class SpellModel extends BaseItemModel<SpellSchema> {
  static override defineSchema(): foundry.data.fields.DataSchema {
    return spellSchema();
  }

  /** Publish this spell into the actor's spell list (ephemeral) so the magic
   * prep can charge the ones its path does not already cover (Tabla 60). */
  override prepareActorData(): void {
    const actorSystem = this.parent?.actor?.system;
    if (!(actorSystem instanceof CreatureModel)) return;
    const data = this as Record<string, any>;
    const spells = ((actorSystem as unknown as { spells?: SpellData[] }).spells ??= []);
    spells.push({
      name: this.parent?.name ?? "",
      magicPath: data.magicPath ?? "",
      spellLevel: data.spellLevel ?? 0,
      closedPaths: data.closedPaths ?? "",
      hostPathId: data.hostPathId ?? "",
    });
  }

  /**
   * Migrate the legacy single-cost shape (`zeonCost`/`intRequired`/
   * `maintenanceCost` at the top level) into the base grade. Tolerates partial
   * sources; leaves already-migrated data untouched.
   */
  static override migrateData(source: Record<string, any>): Record<string, any> {
    const hasLegacy =
      "zeonCost" in source || "intRequired" in source || "maintenanceCost" in source;
    if (hasLegacy && !source.grades) {
      source.grades = {
        base: {
          zeonCost: source.zeonCost ?? 0,
          intRequired: source.intRequired ?? 0,
          maintenanceCost: source.maintenanceCost ?? 0,
        },
      };
    }
    return super.migrateData(source);
  }
}
