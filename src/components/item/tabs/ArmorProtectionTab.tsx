import React from "react";
import type { ItemTabProps } from "../types";
import { SectionCard } from "../../character/ui/SectionCard";
import { Field, NumberField } from "../../character/ui/fields";

const ARMOR_TYPES = [
  { value: "soft", labelKey: "ANIMA.ArmorSoft" },
  { value: "hard", labelKey: "ANIMA.ArmorHard" },
  { value: "natural", labelKey: "ANIMA.ArmorNatural" },
];

const LOCALIZATIONS = [
  { value: "complete", labelKey: "ANIMA.LocComplete" },
  { value: "breastplate", labelKey: "ANIMA.LocBreastplate" },
  { value: "shirt", labelKey: "ANIMA.LocShirt" },
  { value: "head", labelKey: "ANIMA.LocHead" },
  { value: "other", labelKey: "ANIMA.LocOther" },
];

const AT_KEYS = ["fil", "con", "pen", "cal", "fri", "ele", "ene"] as const;

export function ArmorProtectionTab({ system, isEditable, onUpdate }: ItemTabProps) {
  const loc = (k: string) => game.i18n.localize(k);

  return (
    <>
      <SectionCard title={loc("ANIMA.AT")} dot="blue">
        <Field label={loc("ANIMA.ItemArmorType")}>
          <select
            className="a-input"
            value={system.armorType ?? "soft"}
            disabled={!isEditable}
            onChange={(e) => onUpdate("system.armorType", e.target.value)}
          >
            {ARMOR_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{loc(t.labelKey)}</option>
            ))}
          </select>
        </Field>
        <Field label={loc("ANIMA.ItemLocalization")}>
          <select
            className="a-input"
            value={system.localization ?? "complete"}
            disabled={!isEditable}
            onChange={(e) => onUpdate("system.localization", e.target.value)}
          >
            {LOCALIZATIONS.map((l) => (
              <option key={l.value} value={l.value}>{loc(l.labelKey)}</option>
            ))}
          </select>
        </Field>
        <div className="a-item-grid a-item-grid--7">
          {AT_KEYS.map((k) => (
            <Field key={k} label={k.toUpperCase()}>
              <NumberField system={system} path={`at.${k}`} isEditable={isEditable} onUpdate={onUpdate} min={0} />
            </Field>
          ))}
        </div>
      </SectionCard>

      <SectionCard title={loc("ANIMA.Penalty")} light>
        <div className="a-item-grid">
          <Field label={loc("ANIMA.ItemMovementPenalty")}>
            <NumberField system={system} path="movementPenalty" isEditable={isEditable} onUpdate={onUpdate} min={0} />
          </Field>
          <Field label={loc("ANIMA.ItemNaturalPenalty")}>
            <NumberField system={system} path="naturalPenalty" isEditable={isEditable} onUpdate={onUpdate} min={0} />
          </Field>
          <Field label={loc("ANIMA.ItemRequirement")}>
            <NumberField system={system} path="requirement" isEditable={isEditable} onUpdate={onUpdate} min={0} />
          </Field>
        </div>
      </SectionCard>
    </>
  );
}
