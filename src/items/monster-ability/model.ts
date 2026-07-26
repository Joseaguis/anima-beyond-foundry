import { BaseItemModel, baseItemSchema } from "../base/model";

const { NumberField, StringField, HTMLField } = foundry.data.fields;

export function monsterAbilitySchema() {
  return {
    ...baseItemSchema(),
    subtype: new StringField({ required: true, initial: "monsterPower" }),
    dpCost: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
    level: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
    effect: new HTMLField({ required: true, initial: "" }),
    action: new StringField({ required: true, initial: "active" }),
  };
}

export type MonsterAbilitySchema = ReturnType<typeof monsterAbilitySchema>;

export class MonsterAbilityModel extends BaseItemModel<MonsterAbilitySchema> {
  static override defineSchema(): foundry.data.fields.DataSchema {
    return monsterAbilitySchema();
  }
}
