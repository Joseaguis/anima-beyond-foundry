import { BaseItemModel, baseItemSchema } from "../../items/base/model";

const { NumberField, StringField, HTMLField } = foundry.data.fields;

/**
 * Un Patrón Mental (Arcana Exxet cap. 8): rasgo mental adquirido con PD que
 * otorga efectos —casi siempre de rol— sin repercusión numérica en la ficha.
 * Item de contenido puro (como trait): guarda el texto de sus efectos y su
 * coste de adquisición, pero no contribuye a la preparación derivada del actor.
 */
export function mentalPatternSchema() {
  return {
    ...baseItemSchema(),
    // Texto del efecto (normalmente de rol).
    effect: new HTMLField({ required: true, initial: "" }),
    // Se adquieren con PD; valor informativo, aún no cableado a las reservas.
    dpCost: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
    // Modificador asociado (columna de la ficha); solo para mostrar.
    modifier: new StringField({ required: true, initial: "" }),
  };
}

export type MentalPatternSchema = ReturnType<typeof mentalPatternSchema>;

export class MentalPatternModel extends BaseItemModel<MentalPatternSchema> {
  static override defineSchema(): foundry.data.fields.DataSchema {
    return mentalPatternSchema();
  }
}
