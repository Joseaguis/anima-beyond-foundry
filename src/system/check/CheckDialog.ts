/**
 * The modifiers dialog, as an ApplicationV2 hosting the React panel. Same
 * contract as PF2e's `CheckModifiersDialog`: it resolves with the player's
 * choices, or with null if they closed it — in which case nothing is rolled.
 */

import { ReactApplicationMixin } from "../../sheets/react/mixin";
import { CheckDialogApp, type CheckDialogProps, type CheckDialogResult } from "../../components/check/CheckDialogApp";
import { CHECK_TYPES, type AnimaCheckType } from "./types";
import type { RollModifier } from "../../rules/modifier";
import type { GradeOption } from "../actions/spellcast";
import type React from "react";

const { ApplicationV2 } = foundry.applications.api;

export interface CheckDialogInput {
  label: string;
  type: AnimaCheckType;
  base: number;
  modifiers: RollModifier[];
  difficulty: number | null;
  openThreshold: number;
  fumbleThreshold: number;
  /** A spell's four grades; empty for everything else. */
  grades?: GradeOption[];
  grade?: string | null;
}

class CheckDialogApplication extends ReactApplicationMixin<CheckDialogProps, typeof ApplicationV2>(
  ApplicationV2,
) {
  static DEFAULT_OPTIONS = {
    classes: ["animabfv2", "a-dialog"],
    position: { width: 380, height: "auto" as const },
    window: { resizable: false, title: "ANIMA.RollCheck" },
  };

  #input: CheckDialogInput;
  #resolve: (result: CheckDialogResult | null) => void;
  #settled = false;

  constructor(input: CheckDialogInput, resolve: (result: CheckDialogResult | null) => void) {
    super({});
    this.#input = input;
    this.#resolve = resolve;
  }

  get reactComponent(): React.ComponentType<CheckDialogProps> {
    return CheckDialogApp;
  }

  protected override _prepareReactProps(): CheckDialogProps {
    return {
      ...this.#input,
      opposed: CHECK_TYPES[this.#input.type].opposed,
      onRoll: (result) => {
        this.#settle(result);
        void this.close();
      },
      onCancel: () => {
        this.#settle(null);
        void this.close();
      },
    };
  }

  #settle(result: CheckDialogResult | null): void {
    if (this.#settled) return;
    this.#settled = true;
    this.#resolve(result);
  }

  override async close(options?: never): Promise<this> {
    // Closing with the window's X counts as a cancel.
    this.#settle(null);
    return (await super.close(options)) as this;
  }
}

/** Show the dialog and wait. Resolves to null when the player cancels. */
export function promptCheckDialog(input: CheckDialogInput): Promise<CheckDialogResult | null> {
  return new Promise((resolve) => {
    const application = new CheckDialogApplication(input, resolve);
    void (application as unknown as { render(force: boolean): unknown }).render(true);
  });
}
