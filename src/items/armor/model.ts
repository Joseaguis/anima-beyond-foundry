import { PhysicalItemModel, physicalItemSchema } from "../physical/model";
import type { EquippedArmorData } from "../../actors/creature/prep/equipment";

const { SchemaField, NumberField, StringField } = foundry.data.fields;

function armorTypeField() {
  return new NumberField({ required: true, initial: 0, integer: true, min: 0 });
}

export function armorSchema() {
  return {
    ...physicalItemSchema(),
    // "soft" | "hard" | "natural" — natural protections (spells, ki) never
    // count as an armor layer (docs/reglas/armaduras.md).
    armorType: new StringField({ required: true, initial: "soft" }),
    // Body area covered: "complete", "breastplate", "shirt", "head"...
    localization: new StringField({ required: true, initial: "complete" }),
    at: new SchemaField({
      fil: armorTypeField(),
      con: armorTypeField(),
      pen: armorTypeField(),
      cal: armorTypeField(),
      fri: armorTypeField(),
      ele: armorTypeField(),
      ene: armorTypeField(),
    }),
    movementPenalty: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
    naturalPenalty: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
    requirement: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
    perceptionPenalty: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
  };
}

export type ArmorSchema = ReturnType<typeof armorSchema>;

export class ArmorModel extends PhysicalItemModel<ArmorSchema> {
  static override defineSchema(): foundry.data.fields.DataSchema {
    return armorSchema();
  }

  /**
   * Publish this armor into the actor's equipped-armor list (ephemeral).
   * prepareEquipment later combines the layers: TA merging, layer penalties
   * and the wear-armor requirement check (docs/reglas/armaduras.md).
   */
  override prepareActorData(): void {
    const actorSystem = this.parent?.actor?.system as
      | { equippedArmors?: EquippedArmorData[] }
      | undefined;
    if (!actorSystem || !this.isEquipped) return;

    const data = this as Record<string, any>;
    const armors = (actorSystem.equippedArmors ??= []);
    armors.push({
      name: this.parent?.name ?? "",
      armorType: data.armorType ?? "soft",
      localization: data.localization ?? "complete",
      quality: data.quality ?? 0,
      at: { ...data.at },
      requirement: data.requirement ?? 0,
      naturalPenalty: data.naturalPenalty ?? 0,
      movementPenalty: data.movementPenalty ?? 0,
      perceptionPenalty: data.perceptionPenalty ?? 0,
      fortitude: data.fortitude ?? 0,
      presence: data.presence ?? 0,
    });
  }
}
