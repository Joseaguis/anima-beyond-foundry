import { BaseItemModel, baseItemSchema } from "../base/model";
import { combatBonusSchema, mkCostSchema } from "../base/data";
import { CreatureModel } from "../../actors/creature/model";

const { NumberField, StringField, ObjectField } = foundry.data.fields;

/**
 * Snapshot of a combat style/martial art/ars magnus on the actor (ephemeral).
 * prepareKi totals the mkCost; prepareDevelopment totals the dpCost.
 */
export interface CombatStyleData {
  name: string;
  subtype: string;
  mkCost: number;
  dpCost: number;
}

export function combatStyleSchema() {
  return {
    ...baseItemSchema(),
    ...mkCostSchema(),
    ...combatBonusSchema(),
    subtype: new StringField({ required: true, initial: "martialArt" }),
    // Coste en PDs (tablas de estilo y artes marciales; los Ars Magnus solo
    // gastan CM). Cuenta contra la reserva de combate en prepareDevelopment.
    dpCost: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
    degree: new StringField({ required: true, initial: "basic" }),
    requiredCombat: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
    bonuses: new ObjectField({ required: true, initial: () => ({}) }),
    damageType: new StringField({ required: true, initial: "" }),
  };
}

export type CombatStyleSchema = ReturnType<typeof combatStyleSchema>;

export class CombatStyleModel extends BaseItemModel<CombatStyleSchema> {
  static override defineSchema(): foundry.data.fields.DataSchema {
    return combatStyleSchema();
  }

  /** Publish into the actor's combat-style list (ephemeral) for CM/PD totals. */
  override prepareActorData(): void {
    const actorSystem = this.parent?.actor?.system;
    if (!(actorSystem instanceof CreatureModel)) return;
    const data = this as Record<string, any>;
    const styles = ((actorSystem as unknown as { combatStyles?: CombatStyleData[] }).combatStyles ??=
      []);
    styles.push({
      name: this.parent?.name ?? "",
      subtype: data.subtype ?? "martialArt",
      mkCost: data.mkCost ?? 0,
      dpCost: data.dpCost ?? 0,
    });
  }
}
