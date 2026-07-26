import type { ReactItemSheetProps } from "../ReactItemSheet";
import { ReactItemSheet } from "../ReactItemSheet";
import { ItemSheetApp } from "../../components/item/ItemSheetApp";

export class ItemSheet extends ReactItemSheet {
  get reactComponent(): React.ComponentType<ReactItemSheetProps> {
    return ItemSheetApp;
  }
}
