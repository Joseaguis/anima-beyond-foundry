import React from "react";
import type { ItemTabProps } from "../types";
import { SectionCard } from "../../character/ui/SectionCard";
import { Field, NumberField, TextField } from "../../character/ui/fields";

export function PhysicalTab({ system, isEditable, onUpdate }: ItemTabProps) {
  const loc = (k: string) => game.i18n.localize(k);

  return (
    <SectionCard title={loc("ANIMA.ItemPhysical")}>
      <div className="a-item-grid">
        <Field label={loc("ANIMA.ItemQuality")}>
          <NumberField system={system} path="quality" isEditable={isEditable} onUpdate={onUpdate} />
        </Field>
        <Field label={loc("ANIMA.Presence")}>
          <NumberField system={system} path="presence" isEditable={isEditable} onUpdate={onUpdate} />
        </Field>
        <Field label={loc("ANIMA.ItemFortitude")}>
          <NumberField system={system} path="fortitude" isEditable={isEditable} onUpdate={onUpdate} />
        </Field>
        <Field label={loc("ANIMA.ItemBreakage")}>
          <NumberField system={system} path="breakage" isEditable={isEditable} onUpdate={onUpdate} />
        </Field>
        <Field label={loc("ANIMA.ItemWeight")}>
          <NumberField system={system} path="weight" isEditable={isEditable} onUpdate={onUpdate} />
        </Field>
        <Field label={loc("ANIMA.ItemPrice")}>
          <NumberField system={system} path="price" isEditable={isEditable} onUpdate={onUpdate} />
        </Field>
      </div>
      <div className="a-item-equipped">
        <label>
          <input
            type="checkbox"
            checked={!!system.equipped}
            disabled={!isEditable}
            onChange={(e) => onUpdate("system.equipped", e.target.checked)}
          />
          {loc("ANIMA.ItemEquipped")}
        </label>
      </div>
    </SectionCard>
  );
}
