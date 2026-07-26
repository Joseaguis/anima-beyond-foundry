/** Schema fragments shared by every creature-like actor (character, NPC). */

const { SchemaField, NumberField } = foundry.data.fields;

/** A primary characteristic (STR, DEX...): persisted base + item bonus. */
export function characteristicField() {
  return new SchemaField({
    base: new NumberField({ required: true, initial: 5, integer: true, min: 1 }),
    bonus: new NumberField({ required: true, initial: 0, integer: true }),
  });
}
