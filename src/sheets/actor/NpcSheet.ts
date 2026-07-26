import { ReactSheet, type ReactSheetProps } from "../ReactSheet";
import { NpcSheetApp } from "../../components/npc/NpcSheetApp";
import type React from "react";

export class NpcSheet extends ReactSheet {
  static override DEFAULT_OPTIONS = {
    ...ReactSheet.DEFAULT_OPTIONS,
    classes: ["animabfv2", "sheet", "actor", "npc"],
    position: { width: 620, height: 700 },
  };

  override get reactComponent(): React.ComponentType<ReactSheetProps> {
    return NpcSheetApp;
  }
}
