/** Shared prop contracts between the sheet classes and the React components. */

/** Plain, React-friendly view of an embedded item on the actor. */
export interface AnimaItemView {
  id: string;
  name: string;
  img: string;
  type: string;
  system: Record<string, any>;
}

/** A pickable entry from a compendium pack. */
export interface CompendiumEntry {
  uuid: string;
  name: string;
  img: string;
  pack: string;
  /** Tree layout fields carried from the entry's system data (when present). */
  subtype?: string;
  /** Name of the prerequisite/parent node ("" or undefined for a root). */
  parent?: string;
  /** Branch/grouping label. */
  branch?: string;
  /** Martial Knowledge (CM) cost. */
  mkCost?: number;
}

export interface ItemOps {
  /** Create a new blank embedded item of the given type (and optional subtype). */
  onItemCreate: (type: string, subtype?: string) => Promise<void>;
  /** Open the item's own sheet for editing. */
  onItemEdit: (id: string) => void;
  /** Apply an update to the embedded item (e.g. `{"system.ammoId": id}`). */
  onItemUpdate: (id: string, updates: Record<string, unknown>) => Promise<void>;
  /** Delete the embedded item. */
  onItemDelete: (id: string) => Promise<void>;
  /** List compendium entries matching the given type (and optional subtype). */
  getCompendiumItems: (type: string, subtype?: string) => Promise<CompendiumEntry[]>;
  /** Copy a compendium entry onto the actor as an embedded item. */
  onItemAddFromCompendium: (uuid: string) => Promise<void>;
}
