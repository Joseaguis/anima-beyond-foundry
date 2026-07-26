import { ReactSheet, type ReactSheetProps } from "../ReactSheet";
import { CharacterSheetApp } from "../../components/character/CharacterSheetApp";
import type React from "react";

export class CharacterSheet extends ReactSheet {
  static override DEFAULT_OPTIONS = {
    ...ReactSheet.DEFAULT_OPTIONS,
    classes: ["animabfv2", "sheet", "actor", "character"],
    position: { width: 680, height: 750 },
  };

  override get reactComponent(): React.ComponentType<ReactSheetProps> {
    return CharacterSheetApp;
  }
}
