import React from "react";
import type { ItemTabProps } from "../types";
import { SectionCard } from "../../character/ui/SectionCard";
import { Field, NumberField, TextField } from "../../character/ui/fields";
import { RichTextEditor } from "../../ui/RichTextEditor";

export function MagicPathTab({ itemUuid, system, isEditable, onUpdate }: ItemTabProps) {
  const loc = (k: string) => game.i18n.localize(k);

  return (
    <SectionCard title={loc("ANIMA.ItemMagicPath")} dot="blue">
      <div className="a-item-grid">
        <Field label={loc("ANIMA.ItemSubtype")}>
          <TextField system={system} path="subtype" isEditable={isEditable} onUpdate={onUpdate} />
        </Field>
        <Field label={loc("ANIMA.ItemElement")}>
          <TextField system={system} path="element" isEditable={isEditable} onUpdate={onUpdate} />
        </Field>
        <Field label={loc("ANIMA.ItemOpposedPath")}>
          <TextField system={system} path="opposedPath" isEditable={isEditable} onUpdate={onUpdate} />
        </Field>
        <Field label={loc("ANIMA.ItemMkCost")}>
          <NumberField system={system} path="mkCost" isEditable={isEditable} onUpdate={onUpdate} min={0} />
        </Field>
        <Field label={loc("ANIMA.Level")}>
          <NumberField system={system} path="level" isEditable={isEditable} onUpdate={onUpdate} min={1} />
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
      {system.subtype === "subPath" && (
        <p className="text-[11.5px] a-muted mt-2">
          {system.parentPathId
            ? "Vinculada a una vía. Ocupa el primer hueco de Libre Acceso de cada decena."
            : "Sin vía asignada: elígela en la pestaña Místicos de la ficha de personaje."}
        </p>
      )}
    </SectionCard>
  );
}
