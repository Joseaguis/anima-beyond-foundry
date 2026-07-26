import React, { useState } from "react";
import type { ItemTabProps } from "../types";
import { SectionCard } from "../../character/ui/SectionCard";
import { TextField } from "../../character/ui/fields";
import { ModifiersEditor } from "../ModifiersEditor";
import { RULE_ELEMENTS } from "../../../rules";
import type { RuleElementSource } from "../../../rules/rule-element/base";
import { slugify } from "../../../utils/slugify";

/**
 * The technical tab, modelled on PF2e's rules panel: the identifiers a rule
 * author needs (UUID, slug, roll options) on top, then the rule elements
 * themselves. Absorbs the former "Modificadores" tab.
 */

function localize(key: string): string {
  return typeof game !== "undefined" && game.i18n ? game.i18n.localize(key) : key;
}

function copyToClipboard(text: string): void {
  const clipboard = (globalThis as any).game?.clipboard;
  if (clipboard?.copyPlainText) void clipboard.copyPlainText(text);
  else void navigator?.clipboard?.writeText?.(text);
}

export function RulesTab(props: ItemTabProps) {
  const { itemUuid, itemName, system, isEditable, rollOptions, onUpdate } = props;
  const rules = (system.rules as RuleElementSource[]) ?? [];
  const ruleKeys = Object.keys(RULE_ELEMENTS);
  const [newKey, setNewKey] = useState(ruleKeys[0] ?? "");

  const addRule = () => {
    if (!newKey) return;
    void onUpdate("system.rules", [...rules, { key: newKey }]);
  };

  return (
    <>
      <SectionCard title={localize("ANIMA.RulesIdentifiers")} light>
        <div className="a-rules-nerd">
          <div className="a-rules-row">
            <span className="a-flabel">{localize("ANIMA.RulesUuid")}</span>
            <input className="a-input a-input--left" value={itemUuid} readOnly />
            <button
              type="button"
              onClick={() => copyToClipboard(itemUuid)}
              title={localize("ANIMA.RulesCopyUuid")}
            >
              {localize("ANIMA.RulesCopyUuid")}
            </button>
          </div>

          <div className="a-rules-row">
            <span className="a-flabel">{localize("ANIMA.RulesSlug")}</span>
            <TextField
              system={system}
              path="slug"
              isEditable={isEditable}
              onUpdate={onUpdate}
              placeholder={slugify(itemName)}
            />
            {isEditable && (
              <button
                type="button"
                onClick={() => void onUpdate("system.slug", slugify(itemName))}
                title={localize("ANIMA.RulesRegenerateSlug")}
              >
                {localize("ANIMA.RulesRegenerateSlug")}
              </button>
            )}
          </div>

          <details className="a-rules-options">
            <summary>{localize("ANIMA.RulesViewRollOptions")}</summary>
            {rollOptions.length === 0 ? (
              <p className="a-modifiers-empty">{localize("ANIMA.RulesNoRollOptions")}</p>
            ) : (
              <ul>
                {rollOptions.map((option) => (
                  <li key={option}>
                    <code>{option}</code>
                  </li>
                ))}
              </ul>
            )}
          </details>
        </div>
      </SectionCard>

      <SectionCard title={localize("ANIMA.Modifiers")}>
        <ModifiersEditor rules={rules} isEditable={isEditable} onUpdate={onUpdate} />

        {isEditable && (
          <div className="a-rules-row a-rules-create">
            <select value={newKey} onChange={(e) => setNewKey(e.target.value)}>
              {ruleKeys.map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
            <button type="button" onClick={addRule}>
              {localize("ANIMA.RulesNew")}
            </button>
          </div>
        )}
      </SectionCard>
    </>
  );
}
