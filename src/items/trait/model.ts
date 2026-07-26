import { BaseItemModel, baseItemSchema } from "../base/model";

const { NumberField, StringField, HTMLField } = foundry.data.fields;

export function traitSchema() {
  return {
    ...baseItemSchema(),
    subtype: new StringField({ required: true, initial: "advantage" }),
    cpCost: new NumberField({ required: true, initial: 1, integer: true }),
    traitCategory: new StringField({ required: true, initial: "common" }),
    prerequisites: new StringField({ required: true, initial: "" }),
    effect: new HTMLField({ required: true, initial: "" }),
  };
}

export type TraitSchema = ReturnType<typeof traitSchema>;

export class TraitModel extends BaseItemModel<TraitSchema> {
  static override defineSchema(): foundry.data.fields.DataSchema {
    return traitSchema();
  }
}
