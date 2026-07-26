/**
 * Reusable schema fragments shared by several item types. Each fragment is a
 * plain function returning field definitions; models spread them into their
 * own schema function so the schema's TypeScript type stays exact.
 */

const { SchemaField, StringField, NumberField, HTMLField } = foundry.data.fields;

export function descriptionSchema() {
  return {
    description: new SchemaField({
      value: new HTMLField({ required: true, initial: "" }),
      chat: new HTMLField({ required: true, initial: "" }),
    }),
    source: new StringField({ required: true, initial: "" }),
  };
}

/** Martial Knowledge cost, shared by ki abilities, combat styles and magic paths. */
export function mkCostSchema() {
  return {
    mkCost: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
  };
}

/** Flat combat bonuses granted by combat styles. */
export function combatBonusSchema() {
  return {
    attackBonus: new NumberField({ required: true, initial: 0, integer: true }),
    defenseBonus: new NumberField({ required: true, initial: 0, integer: true }),
    damageBonus: new NumberField({ required: true, initial: 0, integer: true }),
    dodgeBonus: new NumberField({ required: true, initial: 0, integer: true }),
    initiativeBonus: new NumberField({ required: true, initial: 0, integer: true }),
  };
}
