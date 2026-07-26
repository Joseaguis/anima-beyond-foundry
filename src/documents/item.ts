import { PhysicalItemModel } from "../items/physical/model";

/**
 * System-wide Item document class. There is a single document class for every
 * item type (Foundry only supports one); per-type data and behavior live in
 * the TypeDataModels registered in CONFIG.Item.dataModels.
 */

/** Map of item type name -> system model instance, derived from DataModelConfig. */
export type ItemSystemMap = {
  [K in keyof DataModelConfig["Item"]]: InstanceType<DataModelConfig["Item"][K]>;
};

export type ItemType = keyof ItemSystemMap;

export class AnimaItem extends Item {
  /**
   * Narrow this item by type, typing `system` accordingly:
   * `if (item.isOfType("weapon", "armor")) { item.system... }`
   * The pseudo-type "physical" matches any item whose model extends
   * PhysicalItemModel (weapons, armors...).
   */
  isOfType(type: "physical"): this is AnimaItem & { system: PhysicalItemModel };
  isOfType<T extends ItemType>(
    ...types: T[]
  ): this is AnimaItem & { type: T; system: ItemSystemMap[T] };
  isOfType(...types: string[]): boolean {
    return types.some((t) =>
      t === "physical" ? this.system instanceof PhysicalItemModel : this.type === t,
    );
  }
}
