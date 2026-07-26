import React from "react";
import type { ItemTabProps } from "../types";
import { SectionCard } from "../../character/ui/SectionCard";
import { TextField, TextArea } from "../../character/ui/fields";

export function DescriptionTab({ system, isEditable, onUpdate }: ItemTabProps) {
  return (
    <>
      <SectionCard title={game.i18n.localize("ANIMA.ItemDescription")}>
        <TextArea
          system={system}
          path="description.value"
          isEditable={isEditable}
          onUpdate={onUpdate}
          style={{ minHeight: 180 }}
        />
      </SectionCard>

      {"source" in (system.description ?? {}) && (
        <SectionCard title={game.i18n.localize("ANIMA.Source")} light>
          <TextField
            system={system}
            path="description.source"
            isEditable={isEditable}
            onUpdate={onUpdate}
            placeholder="Core Exxet p.123"
          />
        </SectionCard>
      )}
    </>
  );
}
