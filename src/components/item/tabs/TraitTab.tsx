import React from "react";
import type { ItemTabProps } from "../types";
import { SectionCard } from "../../character/ui/SectionCard";
import { Field, NumberField, TextField } from "../../character/ui/fields";
import { RichTextEditor } from "../../ui/RichTextEditor";

const SUBTYPES = [
  { value: "advantage", label: "Ventaja" },
  { value: "disadvantage", label: "Desventaja" },
];

const CATEGORIES = [
  { value: "common", label: "Común" },
  { value: "background", label: "Trasfondo" },
  { value: "psychic", label: "Psíquico" },
  { value: "magic", label: "Mágico" },
];

export function TraitTab({ itemUuid, system, isEditable, onUpdate }: ItemTabProps) {
  const loc = (k: string) => game.i18n.localize(k);

  return (
    <SectionCard title={loc("ANIMA.ItemTrait")} dot="acc">
      <div className="a-item-grid">
        <Field label={loc("ANIMA.ItemSubtype")}>
          <select className="a-input" value={system.subtype ?? "advantage"} disabled={!isEditable}
            onChange={(e) => onUpdate("system.subtype", e.target.value)}>
            {SUBTYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </Field>
        <Field label={loc("ANIMA.ItemCpCost")}>
          <NumberField system={system} path="cpCost" isEditable={isEditable} onUpdate={onUpdate} />
        </Field>
        <Field label={loc("ANIMA.ItemTraitCategory")}>
          <select className="a-input" value={system.traitCategory ?? "common"} disabled={!isEditable}
            onChange={(e) => onUpdate("system.traitCategory", e.target.value)}>
            {CATEGORIES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </Field>
        <Field label={loc("ANIMA.ItemPrerequisites")}>
          <TextField system={system} path="prerequisites" isEditable={isEditable} onUpdate={onUpdate} />
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
