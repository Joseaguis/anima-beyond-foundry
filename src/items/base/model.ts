import { descriptionSchema } from "./data";
import type { AnimaItem } from "../../documents/item";

const { ArrayField, ObjectField } = foundry.data.fields;

export function baseItemSchema() {
  return {
    ...descriptionSchema(),
    // Rule elements (loose JSON, validated when instantiated — see src/rules).
    rules: new ArrayField(new ObjectField(), { required: true, initial: [] }),
  };
}

export type BaseItemSchema = ReturnType<typeof baseItemSchema>;

/**
 * Root of the item system-model hierarchy. The document class (AnimaItem) is
 * shared by every type; per-type data and behavior live in subclasses of this
 * model. It also defines the hooks through which items participate in the
 * owning actor's data preparation cycle (see AnimaActor).
 */
export abstract class BaseItemModel<
  Schema extends BaseItemSchema = BaseItemSchema,
> extends foundry.abstract.TypeDataModel<Schema, Item.Implementation> {
  static override defineSchema(): foundry.data.fields.DataSchema {
    return baseItemSchema();
  }

  /** The item document this model belongs to. */
  get item(): AnimaItem {
    return this.parent as unknown as AnimaItem;
  }

  /**
   * Prepare data that depends on sibling items on the same actor (e.g. a
   * weapon reading its weapon table). Runs before prepareActorData.
   */
  prepareSiblingData(): void {}

  /**
   * Contribute data to the owning actor before its derived data is computed
   * (e.g. a category writing its per-level costs and bonuses).
   */
  prepareActorData(): void {}
}
