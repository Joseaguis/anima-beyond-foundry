import React from "react";
import type { ItemTabProps } from "../types";
import { ModifiersEditor } from "../ModifiersEditor";
import type { RuleElementSource } from "../../../rules/rule-element/base";

export function ModifiersTab({ system, isEditable, onUpdate }: ItemTabProps) {
  return (
    <ModifiersEditor
      rules={(system.rules as RuleElementSource[]) ?? []}
      isEditable={isEditable}
      onUpdate={onUpdate}
    />
  );
}
