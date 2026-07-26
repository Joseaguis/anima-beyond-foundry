import React from "react";
import type { ItemTabProps } from "../types";
import { SectionCard } from "../../character/ui/SectionCard";
import { Field, NumberField, TextField } from "../../character/ui/fields";
import { RichTextEditor } from "../../ui/RichTextEditor";

const ACTIONS = [
  { value: "active", label: "Activa" },
  { value: "passive", label: "Pasiva" },
];

export function MonsterAbilityTab({ itemUuid, system, isEditable, onUpdate }: ItemTabProps) {
  const loc = (k: string) => game.i18n.localize(k);

  return (
    <SectionCard title={loc("ANIMA.ItemMonsterAbility")} dot="red">
      <div className="a-item-grid">
        <Field label={loc("ANIMA.ItemSubtype")}>
          <TextField system={system} path="subtype" isEditable={isEditable} onUpdate={onUpdate} />
        </Field>
        <Field label={loc("ANIMA.ItemDpCost")}>
          <NumberField system={system} path="dpCost" isEditable={isEditable} onUpdate={onUpdate} min={0} />
        </Field>
        <Field label={loc("ANIMA.Level")}>
          <NumberField system={system} path="level" isEditable={isEditable} onUpdate={onUpdate} min={0} />
        </Field>
        <Field label={loc("ANIMA.ItemAction")}>
          <select className="a-input" value={system.action ?? "active"} disabled={!isEditable}
            onChange={(e) => onUpdate("system.action", e.target.value)}>
            {ACTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </Field>
      </div>
      <Field label={loc("ANIMA.ItemEffect")}>
        <RichTextEditor
          path="effect"
          value={system.effect ?? ""}
          isEditable={isEditable}
          onUpdate={onUpdate}
          ownerKey={itemUuid}
          height={140}
        />
      </Field>
    </SectionCard>
  );
}
