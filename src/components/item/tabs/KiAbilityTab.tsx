import React from "react";
import type { ItemTabProps } from "../types";
import { SectionCard } from "../../character/ui/SectionCard";
import { Field, NumberField, TextField } from "../../character/ui/fields";

const SUBTYPES = [
  { value: "kiPower", label: "Poder de Ki" },
  { value: "nemesisPower", label: "Poder de Némesis" },
];

const ACTIONS = [
  { value: "active", label: "Activa" },
  { value: "passive", label: "Pasiva" },
];

export function KiAbilityTab({ system, isEditable, onUpdate }: ItemTabProps) {
  const loc = (k: string) => game.i18n.localize(k);

  return (
    <>
      <SectionCard title="Ki" dot="acc">
        <div className="a-item-grid">
          <Field label={loc("ANIMA.ItemSubtype")}>
            <select className="a-input" value={system.subtype ?? "kiPower"} disabled={!isEditable}
              onChange={(e) => onUpdate("system.subtype", e.target.value)}>
              {SUBTYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          <Field label={loc("ANIMA.ItemKiCost")}>
            <NumberField system={system} path="kiCost" isEditable={isEditable} onUpdate={onUpdate} min={0} />
          </Field>
          <Field label={loc("ANIMA.ItemKiMaintenance")}>
            <NumberField system={system} path="kiMaintenance" isEditable={isEditable} onUpdate={onUpdate} min={0} />
          </Field>
          <Field label={loc("ANIMA.ItemAction")}>
            <select className="a-input" value={system.action ?? "active"} disabled={!isEditable}
              onChange={(e) => onUpdate("system.action", e.target.value)}>
              {ACTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          <Field label={loc("ANIMA.ItemMkCost")}>
            <NumberField system={system} path="mkCost" isEditable={isEditable} onUpdate={onUpdate} min={0} />
          </Field>
        </div>
      </SectionCard>
    </>
  );
}
