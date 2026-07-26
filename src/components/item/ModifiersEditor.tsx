import React from "react";
import { MODIFIER_TYPES, type ModifierType } from "../../rules/modifier";
import { TARGETS, type TargetGroup } from "../../rules/targets";
import type { RuleElementSource } from "../../rules/rule-element/base";

interface ModifiersEditorProps {
  rules: RuleElementSource[];
  isEditable: boolean;
  onUpdate: (path: string, value: unknown) => Promise<void>;
}

const GROUP_LABELS: Record<TargetGroup, string> = {
  general: "ANIMA.ModGroupGeneral",
  characteristic: "ANIMA.ModGroupCharacteristic",
  combat: "ANIMA.ModGroupCombat",
  resistance: "ANIMA.ModGroupResistance",
  secondary: "ANIMA.ModGroupSecondary",
  supernatural: "ANIMA.ModGroupSupernatural",
  vital: "ANIMA.ModGroupVital",
};

const TYPE_LABELS: Record<ModifierType, string> = {
  untyped: "ANIMA.ModTypeUntyped",
  item: "ANIMA.ModTypeItem",
  magic: "ANIMA.ModTypeMagic",
  status: "ANIMA.ModTypeStatus",
  circumstance: "ANIMA.ModTypeCircumstance",
  special: "ANIMA.ModTypeSpecial",
};

const GROUP_ORDER: TargetGroup[] = [
  "general",
  "characteristic",
  "combat",
  "resistance",
  "secondary",
  "supernatural",
  "vital",
];

function localize(key: string): string {
  return typeof game !== "undefined" && game.i18n ? game.i18n.localize(key) : key;
}

/** Target <option>s organized into <optgroup>s by group. */
function TargetOptions() {
  return (
    <>
      <option value="">—</option>
      {GROUP_ORDER.map((group) => (
        <optgroup key={group} label={localize(GROUP_LABELS[group])}>
          {Object.entries(TARGETS)
            .filter(([, def]) => def.group === group)
            .map(([value, def]) => (
              <option key={value} value={value}>
                {localize(def.labelKey)}
              </option>
            ))}
        </optgroup>
      ))}
    </>
  );
}

/**
 * Visual editor for an item's `system.rules`. FlatModifier rules get an
 * editable row (target / value / stacking type / active); any other rule kind
 * is preserved untouched and shown as a read-only summary. Works for every
 * item type — `rules` lives on the base item schema.
 */
export function ModifiersEditor({ rules, isEditable, onUpdate }: ModifiersEditorProps) {
  const rows = Array.isArray(rules) ? rules : [];

  const commit = (next: RuleElementSource[]) => onUpdate("system.rules", next);

  const updateRow = (index: number, patch: Partial<RuleElementSource>) => {
    const next = rows.map((row, i) => (i === index ? { ...row, ...patch } : row));
    void commit(next);
  };

  const addRow = () => {
    void commit([...rows, { key: "FlatModifier", target: "", value: 0, type: "untyped" }]);
  };

  const removeRow = (index: number) => {
    void commit(rows.filter((_, i) => i !== index));
  };

  return (
    <div className="a-modifiers-editor">
      {rows.length === 0 && (
        <p className="a-modifiers-empty">{localize("ANIMA.ModifiersEmpty")}</p>
      )}
      {rows.map((row, index) =>
        row.key === "FlatModifier" ? (
          <div className="a-modifier-row" key={index}>
            <select
              value={String(row.target ?? "")}
              disabled={!isEditable}
              onChange={(e) => updateRow(index, { target: e.target.value })}
              aria-label={localize("ANIMA.ModTarget")}
            >
              <TargetOptions />
            </select>
            <input
              type="number"
              value={Number(row.value ?? 0)}
              disabled={!isEditable}
              onChange={(e) => updateRow(index, { value: Number(e.target.value) })}
              aria-label={localize("ANIMA.ModValue")}
            />
            <select
              value={String(row.type ?? "untyped")}
              disabled={!isEditable}
              onChange={(e) => updateRow(index, { type: e.target.value as ModifierType })}
              aria-label={localize("ANIMA.ModType")}
            >
              {MODIFIER_TYPES.map((t) => (
                <option key={t} value={t}>
                  {localize(TYPE_LABELS[t])}
                </option>
              ))}
            </select>
            <input
              type="checkbox"
              checked={row.ignored !== true}
              disabled={!isEditable}
              onChange={(e) => updateRow(index, { ignored: !e.target.checked })}
              aria-label={localize("ANIMA.ModEnabled")}
            />
            {isEditable && (
              <button type="button" onClick={() => removeRow(index)} aria-label={localize("ANIMA.ModRemove")}>
                ✕
              </button>
            )}
          </div>
        ) : (
          <div className="a-modifier-row a-modifier-row-raw" key={index}>
            <code>{row.key}</code>
            {isEditable && (
              <button type="button" onClick={() => removeRow(index)} aria-label={localize("ANIMA.ModRemove")}>
                ✕
              </button>
            )}
          </div>
        ),
      )}
      {isEditable && (
        <button type="button" className="a-modifier-add" onClick={addRow}>
          {localize("ANIMA.ModAdd")}
        </button>
      )}
    </div>
  );
}
