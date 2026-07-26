import { BaseItemModel, baseItemSchema } from "../../items/base/model";
import { CreatureModel } from "../../actors/creature/model";
import { DIFFICULTY_KEYS } from "../../actors/creature/tables";
import type { PsychicPowerData } from "./data";

const { SchemaField, NumberField, StringField, BooleanField, ArrayField, HTMLField } =
  foundry.data.fields;

export function psychicPowerSchema() {
  return {
    ...baseItemSchema(),
    // Discipline this power belongs to, referenced by name (empty for the
    // discipline-less Poderes Matriciales).
    discipline: new StringField({ required: true, initial: "" }),
    // 1-3 within a discipline (Core p. 211); 0 for Poderes Matriciales.
    powerLevel: new NumberField({ required: true, initial: 1, integer: true, min: 0, max: 3 }),
    // Active powers need initiative to run; passive ones can be used any time.
    action: new StringField({
      required: true,
      initial: "active",
      choices: ["active", "passive"],
    }),
    // Whether the power can be sustained via an innato (Core p. 212).
    maintainable: new BooleanField({ required: true, initial: false }),
    // Lowest difficulty the power can be sustained at (Excel "Tabla Poderes con
    // mantenimiento", column `Pot. Min`). Empty when the power is not
    // maintainable or the sheet leaves it blank.
    maintenanceDifficulty: new StringField({
      required: true,
      initial: "",
      choices: ["", ...DIFFICULTY_KEYS],
    }),
    // One of the four generic Poderes Matriciales (no discipline, no level).
    isMatrix: new BooleanField({ required: true, initial: false }),
    // Dominar un poder: normally 1 CV (matriciales included).
    masteryCost: new NumberField({ required: true, initial: 1, integer: true, min: 0 }),
    // Fortalecer un poder: +10 per CV to this power, max 10 CV / +100 (Core p. 212).
    fortifyCvs: new NumberField({ required: true, initial: 0, integer: true, min: 0, max: 10 }),
    // Difficulty→effect table proper to each power (filled in as content later).
    grades: new ArrayField(
      new SchemaField({
        difficulty: new StringField({ required: true, initial: "" }),
        effect: new HTMLField({ required: true, initial: "" }),
      }),
      { required: true, initial: [] },
    ),
    effect: new HTMLField({ required: true, initial: "" }),
  };
}

export type PsychicPowerSchema = ReturnType<typeof psychicPowerSchema>;

export class PsychicPowerModel extends BaseItemModel<PsychicPowerSchema> {
  static override defineSchema(): foundry.data.fields.DataSchema {
    return psychicPowerSchema();
  }

  /** Publish this power into the actor's power list (ephemeral) so the psychic
   * prep can total the CV spent on mastery and fortification, and so the sheet
   * can tell which powers an innato is allowed to sustain. */
  override prepareActorData(): void {
    const actorSystem = this.parent?.actor?.system;
    if (!(actorSystem instanceof CreatureModel)) return;
    const data = this as Record<string, any>;
    const list = ((actorSystem as unknown as { psychicPowers?: PsychicPowerData[] })
      .psychicPowers ??= []);
    list.push({
      name: this.parent?.name ?? "",
      discipline: data.discipline ?? "",
      powerLevel: data.powerLevel ?? 0,
      masteryCost: data.masteryCost ?? 1,
      fortifyCvs: data.fortifyCvs ?? 0,
      isMatrix: data.isMatrix ?? false,
      action: data.action ?? "active",
      maintainable: data.maintainable ?? false,
      maintenanceDifficulty: data.maintenanceDifficulty ?? "",
    });
  }
}
