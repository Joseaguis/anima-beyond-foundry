import { BaseItemModel, baseItemSchema } from "../base/model";
import { CreatureModel } from "../../actors/creature/model";

const { NumberField, StringField } = foundry.data.fields;

/** Snapshot of a known weapon table on the actor (ephemeral); dpCost feeds development. */
export interface WeaponTableData {
  name: string;
  dpCost: number;
}

export function weaponTableSchema() {
  return {
    ...baseItemSchema(),
    weaponGroup: new StringField({ required: true, initial: "" }),
    dpCost: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
  };
}

export type WeaponTableSchema = ReturnType<typeof weaponTableSchema>;

export class WeaponTableModel extends BaseItemModel<WeaponTableSchema> {
  static override defineSchema(): foundry.data.fields.DataSchema {
    return weaponTableSchema();
  }

  /** Publish into the actor's weapon-table list (ephemeral) for PD totals. */
  override prepareActorData(): void {
    const actorSystem = this.parent?.actor?.system;
    if (!(actorSystem instanceof CreatureModel)) return;
    const data = this as Record<string, any>;
    const tables = ((actorSystem as unknown as { weaponTables?: WeaponTableData[] }).weaponTables ??=
      []);
    tables.push({
      name: this.parent?.name ?? "",
      dpCost: data.dpCost ?? 0,
    });
  }
}
