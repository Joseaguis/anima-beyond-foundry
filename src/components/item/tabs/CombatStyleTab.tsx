import React from "react";
import type { ItemTabProps } from "../types";
import { SectionCard } from "../../character/ui/SectionCard";
import { Field, NumberField, TextField } from "../../character/ui/fields";

const SUBTYPES = [
  { value: "martialArt", label: "Arte Marcial" },
  { value: "styleTable", label: "Tabla de Estilo" },
  { value: "arsMagnus", label: "Ars Magnus" },
  { value: "weapon", label: "Arma" },
];

const DEGREES = [
  { value: "basic", label: "Básico" },
  { value: "advanced", label: "Avanzado" },
  { value: "supreme", label: "Supremo" },
];

export function CombatStyleTab({ system, isEditable, onUpdate }: ItemTabProps) {
  const loc = (k: string) => game.i18n.localize(k);

  return (
    <>
      <SectionCard title={loc("ANIMA.ItemCombatStyle")} dot="red">
        <div className="a-item-grid">
          <Field label={loc("ANIMA.ItemSubtype")}>
            <select className="a-input" value={system.subtype ?? "martialArt"} disabled={!isEditable}
              onChange={(e) => onUpdate("system.subtype", e.target.value)}>
              {SUBTYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          <Field label={loc("ANIMA.ItemDegree")}>
            <select className="a-input" value={system.degree ?? "basic"} disabled={!isEditable}
              onChange={(e) => onUpdate("system.degree", e.target.value)}>
              {DEGREES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          <Field label={loc("ANIMA.ItemRequiredCombat")}>
            <NumberField system={system} path="requiredCombat" isEditable={isEditable} onUpdate={onUpdate} min={0} />
          </Field>
          <Field label={loc("ANIMA.ItemMkCost")}>
            <NumberField system={system} path="mkCost" isEditable={isEditable} onUpdate={onUpdate} min={0} />
          </Field>
          <Field label={loc("ANIMA.ItemDpCost")}>
            <NumberField system={system} path="dpCost" isEditable={isEditable} onUpdate={onUpdate} min={0} />
          </Field>
          <Field label={loc("ANIMA.ItemDamageType")}>
            <TextField system={system} path="damageType" isEditable={isEditable} onUpdate={onUpdate} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title={loc("ANIMA.ItemCombatBonuses")} light>
        <div className="a-item-grid">
          <Field label={loc("ANIMA.Attack")}>
            <NumberField system={system} path="attackBonus" isEditable={isEditable} onUpdate={onUpdate} />
          </Field>
          <Field label={loc("ANIMA.ItemDefenseBonus")}>
            <NumberField system={system} path="defenseBonus" isEditable={isEditable} onUpdate={onUpdate} />
          </Field>
          <Field label={loc("ANIMA.Damage")}>
            <NumberField system={system} path="damageBonus" isEditable={isEditable} onUpdate={onUpdate} />
          </Field>
          <Field label={loc("ANIMA.Dodge")}>
            <NumberField system={system} path="dodgeBonus" isEditable={isEditable} onUpdate={onUpdate} />
          </Field>
          <Field label={loc("ANIMA.Initiative")}>
            <NumberField system={system} path="initiativeBonus" isEditable={isEditable} onUpdate={onUpdate} />
          </Field>
        </div>
      </SectionCard>
    </>
  );
}
