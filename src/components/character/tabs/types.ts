import type { AnimaItem, ItemOps } from "../../../sheets/ReactSheet";

export interface TabProps {
  actor: FoundryActor;
  system: Record<string, any>;
  items: AnimaItem[];
  isEditable: boolean;
  onUpdate: (path: string, value: unknown) => Promise<void>;
  /** Grouped item create/edit/delete/compendium operations. */
  itemOps: ItemOps;
}
