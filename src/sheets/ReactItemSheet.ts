import { ReactApplicationMixin } from "./react/mixin";
import type { AnimaItem } from "../documents/item";

export interface ReactItemSheetProps {
  item: { id: string; name: string; img: string; type: string };
  system: Record<string, any>;
  isEditable: boolean;
  onUpdate: (path: string, value: unknown) => Promise<void>;
}

const { ItemSheetV2 } = foundry.applications.sheets;

/** Base class for item sheets: ApplicationV2 + React (no Handlebars). */
export abstract class ReactItemSheet extends ReactApplicationMixin<
  ReactItemSheetProps,
  typeof ItemSheetV2
>(ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["animabfv2", "sheet", "item"],
    position: { width: 520, height: 480 },
    window: { resizable: true },
  };

  get animaItem(): AnimaItem {
    return (this as unknown as { item: AnimaItem }).item;
  }

  protected override _prepareReactProps(): ReactItemSheetProps {
    const item = this.animaItem;
    return {
      item: { id: item.id ?? "", name: item.name, img: item.img ?? "", type: item.type },
      system: item.system as Record<string, any>,
      isEditable: (this as unknown as { isEditable: boolean }).isEditable,
      onUpdate: (path, value) => item.update({ [path]: value }).then(() => undefined),
    };
  }
}
