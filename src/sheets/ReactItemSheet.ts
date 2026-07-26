import { ReactApplicationMixin } from "./react/mixin";
import type { AnimaItem } from "../documents/item";
import type { AnimaActor } from "../documents/actor";

export interface ReactItemSheetProps {
  item: { id: string; uuid: string; name: string; img: string; type: string };
  system: Record<string, any>;
  isEditable: boolean;
  /** Gates the GM notes editor and any GM-only tab. */
  isGM: boolean;
  /**
   * Roll options this item would see: the owning actor's, plus the ones the
   * item itself emits. Shown in the Rules tab.
   */
  rollOptions: string[];
  onUpdate: (path: string, value: unknown) => Promise<void>;
  /** Opens the FilePicker on the item image. */
  onEditImage: () => Promise<void>;
}

const { ItemSheetV2 } = foundry.applications.sheets;

/** Base class for item sheets: ApplicationV2 + React (no Handlebars). */
export abstract class ReactItemSheet extends ReactApplicationMixin<
  ReactItemSheetProps,
  typeof ItemSheetV2
>(ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["animabfv2", "sheet", "item"],
    // Wide enough for the summary sidebar next to the tab body.
    position: { width: 700, height: 500 },
    window: { resizable: true },
  };

  get animaItem(): AnimaItem {
    return (this as unknown as { item: AnimaItem }).item;
  }

  protected override _prepareReactProps(): ReactItemSheetProps {
    const item = this.animaItem;
    return {
      item: {
        id: item.id ?? "",
        uuid: item.uuid ?? "",
        name: item.name,
        img: item.img ?? "",
        type: item.type,
      },
      system: item.system as Record<string, any>,
      isEditable: (this as unknown as { isEditable: boolean }).isEditable,
      isGM: !!game.user?.isGM,
      rollOptions: this.#buildRollOptions(),
      onUpdate: (path, value) => item.update({ [path]: value }).then(() => undefined),
      onEditImage: () => this.#editImage(),
    };
  }

  /** Actor options (when embedded) plus the ones this item contributes. */
  #buildRollOptions(): string[] {
    const item = this.animaItem;
    const actor = item.actor as AnimaActor | null | undefined;
    const options = new Set<string>(actor?.getRollOptions?.() ?? []);
    const synthetic = (item.system as { syntheticRules?: { predicate?: unknown }[] })
      .syntheticRules;
    for (const rule of synthetic ?? []) {
      const predicate = rule.predicate;
      if (!Array.isArray(predicate)) continue;
      for (const entry of predicate) {
        if (typeof entry === "string") options.add(entry);
      }
    }
    return [...options].sort();
  }

  async #editImage(): Promise<void> {
    const item = this.animaItem;
    const picker = new foundry.applications.apps.FilePicker.implementation({
      current: item.img ?? "",
      type: "image",
      callback: (path: string) => {
        void item.update({ img: path });
      },
    });
    await picker.browse();
  }
}
