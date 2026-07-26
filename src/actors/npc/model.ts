import { CreatureModel, creatureSchema, equipBonusField } from "../creature/model";
import { prepareCharacteristics } from "../creature/prep/characteristics";
import { prepareState } from "../creature/prep/state";
import { prepareVitals } from "../creature/prep/vitals";
import { prepareCombat } from "../creature/prep/combat";
import { prepareEquipment } from "../creature/prep/equipment";
import type { PrepMode } from "../creature/prep/types";

const { SchemaField, NumberField, StringField, HTMLField } = foundry.data.fields;

function directSkillField() {
  return new SchemaField({
    base: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
    special: new NumberField({ required: true, initial: 0, integer: true }),
  });
}

export function npcSchema() {
  return {
    ...creatureSchema(),
    // GM-facing difficulty indicator, no mechanical effect yet.
    threatLevel: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
    // Printed stat blocks list presence directly instead of deriving it.
    presenceBase: new NumberField({ required: true, initial: 30, integer: true, min: 0 }),
    combat: new SchemaField({
      attack: directSkillField(),
      parry: directSkillField(),
      dodge: directSkillField(),
      wearArmor: directSkillField(),
      equipBonus: equipBonusField(),
    }),
    // Manually entered weapon/armor summary, same fallback shape as characters.
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
    notes: new HTMLField({ required: true, initial: "" }),
  };
}

export type NpcSchema = ReturnType<typeof npcSchema>;

/**
 * NPCs/creatures enter their stats directly, like a printed stat block
 * ("direct" prep mode): combat bases, presence and life points are edited
 * as-is, with rule-element modifiers applied on top. They still share the
 * characteristics, resistances and vitals machinery with characters.
 */
export class NpcModel extends CreatureModel<NpcSchema> {
  static override defineSchema(): foundry.data.fields.DataSchema {
    return npcSchema();
  }

  protected override get prepMode(): PrepMode {
    return "direct";
  }

  override prepareDerivedData(): void {
    const ctx = this.buildPrepContext();
    const data = this as Record<string, any>;

    prepareCharacteristics(data, ctx);
    prepareState(data, ctx);
    prepareCombat(data, ctx);
    prepareEquipment(data, ctx);
    prepareVitals(data, ctx);

    data.categoryName = ctx.categories[0]?.data.labelName ?? "";
  }
}
