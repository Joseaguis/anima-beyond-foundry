import type React from "react";

/**
 * What every item panel (tab or sidebar) receives. The item's identity travels
 * as explicit props instead of hidden inside `system`.
 */
export interface ItemTabProps {
  itemType: string;
  itemUuid: string;
  itemName: string;
  system: Record<string, any>;
  isEditable: boolean;
  isGM: boolean;
  /** Roll options this item would see, for the Rules tab. */
  rollOptions: string[];
  onUpdate: (path: string, value: unknown) => Promise<void>;
}

export interface ItemTabDef {
  id: string;
  labelKey: string;
  component: React.FC<ItemTabProps>;
  /** Optional tab: when it returns false the tab is not rendered. */
  condition?: (props: ItemTabProps) => boolean;
}

/**
 * Per-type sheet composition. The common axis (Description / Details / Rules)
 * is built by `buildTabs`; a type only declares what is proper to it.
 */
export interface ItemSheetConfig {
  /** Persistent left column, hidden on the Rules tab. */
  sidebar?: React.FC<ItemTabProps>;
  /** Body of the Details tab, proper to the type. */
  details?: React.FC<ItemTabProps>;
  /** Extra tabs, inserted between Details and Rules. */
  extra?: ItemTabDef[];
}
