import React from "react";
import type { ItemTabProps } from "../types";
import { SectionCard } from "../../character/ui/SectionCard";
import { TextField } from "../../character/ui/fields";
import { RichTextEditor } from "../../ui/RichTextEditor";

export function DescriptionTab({ itemUuid, system, isEditable, isGM, onUpdate }: ItemTabProps) {
  const loc = (k: string) => game.i18n.localize(k);

  return (
    <>
      {isGM && (
        <SectionCard title={loc("ANIMA.ItemGmNotes")} light>
          <RichTextEditor
            path="description.gm"
            value={system.description?.gm ?? ""}
            isEditable={isEditable}
            onUpdate={onUpdate}
            ownerKey={itemUuid}
            className="a-editor-container--gm"
            height={160}
          />
        </SectionCard>
      )}

      <SectionCard title={loc("ANIMA.ItemDescription")}>
        <RichTextEditor
          path="description.value"
          value={system.description?.value ?? ""}
          isEditable={isEditable}
          onUpdate={onUpdate}
          ownerKey={itemUuid}
        />
      </SectionCard>

      {"source" in system && (
        <SectionCard title={loc("ANIMA.Source")} light>
          <TextField
            system={system}
            path="source"
            isEditable={isEditable}
            onUpdate={onUpdate}
            placeholder="Core Exxet p.123"
          />
        </SectionCard>
      )}
    </>
  );
}
