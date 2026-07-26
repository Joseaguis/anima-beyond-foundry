import { BaseItemModel, baseItemSchema } from "../base/model";

const { NumberField, BooleanField } = foundry.data.fields;

export function physicalItemSchema() {
  return {
    ...baseItemSchema(),
    quality: new NumberField({ required: true, initial: 0, integer: true }),
    presence: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
    fortitude: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
    breakage: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
    weight: new NumberField({ required: true, initial: 0, min: 0 }),
    price: new NumberField({ required: true, initial: 0, min: 0 }),
    equipped: new BooleanField({ required: true, initial: false }),
  };
}

export type PhysicalItemSchema = ReturnType<typeof physicalItemSchema>;

/**
 * Base model for items with a physical presence in the world (weapons,
 * armors...). `item.isOfType("physical")` narrows against this class.
 */
export abstract class PhysicalItemModel<
  Schema extends PhysicalItemSchema = PhysicalItemSchema,
> extends BaseItemModel<Schema> {
  static override defineSchema(): foundry.data.fields.DataSchema {
    return physicalItemSchema();
  }

  get isEquipped(): boolean {
    return !!(this as PhysicalItemModel).equipped;
  }
}
