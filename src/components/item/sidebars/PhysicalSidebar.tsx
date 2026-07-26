import React from "react";
import type { ItemTabProps } from "../types";
import { Field, NumberField, CheckboxField } from "../../character/ui/fields";
import { SummaryStats } from "./SummarySidebar";

/**
 * Sidebar for physical items (weapon, armor): the summary stats on top and the
 * shared physical fields below, editable in place. Mirrors PF2e's split
 * between the generic sidebar and `physical-sidebar.hbs`, and replaces the
 * former "Físico" tab.
 */
export function PhysicalSidebar({ itemType, system, isEditable, onUpdate }: ItemTabProps) {
  const loc = (k: string) => game.i18n.localize(k);

  const field = (labelKey: string, path: string) => (
    <Field label={loc(labelKey)}>
      <NumberField system={system} path={path} isEditable={isEditable} onUpdate={onUpdate} />
    </Field>
  );

  return (
    <div className="a-item-sidebar-stack">
      <div className="a-item-summary-grid">
        <SummaryStats itemType={itemType} system={system} />
      </div>

      <div className="a-item-sidebar-fields">
        {field("ANIMA.ItemQuality", "quality")}
        {field("ANIMA.Presence", "presence")}
        {field("ANIMA.ItemFortitude", "fortitude")}
        {field("ANIMA.ItemBreakage", "breakage")}
        {field("ANIMA.ItemWeight", "weight")}
        {field("ANIMA.ItemPrice", "price")}
      </div>

      {"equipped" in system && (
        <label className="a-item-equipped">
          <CheckboxField
            system={system}
            path="equipped"
            isEditable={isEditable}
            onUpdate={onUpdate}
          />
          {loc("ANIMA.ItemEquipped")}
        </label>
      )}
    </div>
  );
}
