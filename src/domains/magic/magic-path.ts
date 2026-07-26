import { BaseItemModel, baseItemSchema } from "../../items/base/model";
import { mkCostSchema } from "../../items/base/data";
import { CreatureModel } from "../../actors/creature/model";
import type { MagicPathData } from "./data";

const { NumberField, StringField } = foundry.data.fields;

export function magicPathSchema() {
  return {
    ...baseItemSchema(),
    ...mkCostSchema(),
    // "path" (una de las once vías, cuenta Nivel de Magia), "subPath" (sub-vía
    // de Arcana: ocupa huecos de una vía, no cuesta aparte) o "metamagic".
    subtype: new StringField({ required: true, initial: "path" }),
    // Solo para subPath: id del item de vía cuyos huecos de Libre Acceso rellena
    // (mismo patrón que weapon.ammoId). Se elige en la ficha de personaje.
    parentPathId: new StringField({ required: true, initial: "" }),
    element: new StringField({ required: true, initial: "" }),
    // "major" (Luz, Oscuridad, Creación, Destrucción, Nigromancia) or "minor"
    // (Fuego, Aire, Tierra, Agua, Esencia, Ilusión) — Core p. 118.
    pathType: new StringField({ required: true, initial: "" }),
    // Comma-separated list of antagonistic paths (Excel Tabla_VíasOpuestas):
    // developing one costs double magic level. Nigromancia opposes all ten.
    opposedPath: new StringField({ required: true, initial: "" }),
    // Path level 1-100 (Core p. 118): one spell every two levels. Spent magic
    // level equals this value (subtype "path" only; metamagias don't count).
    level: new NumberField({ required: true, initial: 1, integer: true, min: 1, max: 100 }),
    effect: new StringField({ required: true, initial: "" }),
  };
}

export type MagicPathSchema = ReturnType<typeof magicPathSchema>;

export class MagicPathModel extends BaseItemModel<MagicPathSchema> {
  static override defineSchema(): foundry.data.fields.DataSchema {
    return magicPathSchema();
  }

  /** Publish this path into the actor's magic-path list (ephemeral) so the
   * magic prep can total the spent magic level. */
  override prepareActorData(): void {
    const actorSystem = this.parent?.actor?.system;
    if (!(actorSystem instanceof CreatureModel)) return;
    const data = this as Record<string, any>;
    const paths = ((actorSystem as unknown as { magicPaths?: MagicPathData[] }).magicPaths ??= []);
    paths.push({
      id: this.parent?.id ?? "",
      name: this.parent?.name ?? "",
      subtype: data.subtype ?? "path",
      level: data.level ?? 0,
      element: data.element ?? "",
      opposedPath: data.opposedPath ?? "",
      parentPathId: data.parentPathId ?? "",
    });
  }
}
