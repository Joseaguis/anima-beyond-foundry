import { BaseItemModel, baseItemSchema } from "../../items/base/model";
import { mkCostSchema } from "../../items/base/data";
import { CreatureModel } from "../../actors/creature/model";
import type { KiAbilityData } from "./data";

const { NumberField, StringField } = foundry.data.fields;

export function kiAbilitySchema() {
  return {
    ...baseItemSchema(),
    ...mkCostSchema(),
    subtype: new StringField({ required: true, initial: "kiPower" }),
    // Dominios del Ki tree layout: the prerequisite ability name and the root
    // domain it hangs from. Informational (the tree is not enforced); the CM
    // cost is what gets budgeted (see prepareKi).
    parent: new StringField({ required: true, initial: "" }),
    branch: new StringField({ required: true, initial: "" }),
    kiCost: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
    kiMaintenance: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
    action: new StringField({ required: true, initial: "active" }),
  };
}

export type KiAbilitySchema = ReturnType<typeof kiAbilitySchema>;

export class KiAbilityModel extends BaseItemModel<KiAbilitySchema> {
  static override defineSchema(): foundry.data.fields.DataSchema {
    return kiAbilitySchema();
  }

  /**
   * Publish this ability into the actor's Ki-ability list (ephemeral) so the
   * Ki prep can total the Martial Knowledge (CM) spent.
   */
  override prepareActorData(): void {
    const actorSystem = this.parent?.actor?.system;
    if (!(actorSystem instanceof CreatureModel)) return;
    const data = this as Record<string, any>;
    const abilities = ((actorSystem as unknown as { kiAbilities?: KiAbilityData[] }).kiAbilities ??=
      []);
    abilities.push({
      name: this.parent?.name ?? "",
      subtype: data.subtype ?? "kiPower",
      mkCost: data.mkCost ?? 0,
      kiCost: data.kiCost ?? 0,
      kiMaintenance: data.kiMaintenance ?? 0,
    });
  }
}
