import React from "react";
import type { ItemTabProps } from "../types";
import { SectionCard } from "../../character/ui/SectionCard";
import { Field, NumberField, TextField } from "../../character/ui/fields";

const ACTION_TYPES = [
  { value: "active", label: "Activa" },
  { value: "passive", label: "Pasiva" },
];

const MAINTENANCE_TYPES = [
  { value: "none", label: "Ninguno" },
  { value: "daily", label: "Diario" },
  { value: "sustained", label: "Sostenido" },
];

const SPELL_TYPES = [
  { value: "effect", label: "Efecto" },
  { value: "attack", label: "Ataque" },
  { value: "defense", label: "Defensa" },
  { value: "detection", label: "Detección" },
  { value: "automatic", label: "Automático" },
  { value: "spiritual", label: "Anímico" },
];

const RESISTANCE_TYPES = [
  { value: "none", label: "Ninguna" },
  { value: "rm", label: "RM" },
  { value: "rf", label: "RF" },
  { value: "rp", label: "RP" },
  { value: "rv", label: "RV" },
  { value: "re", label: "RE" },
];

const SPELL_GRADES = [
  { key: "base", label: "Base" },
  { key: "intermediate", label: "Intermedio" },
  { key: "advanced", label: "Avanzado" },
  { key: "arcane", label: "Arcano" },
];

export function SpellTab({ system, isEditable, onUpdate }: ItemTabProps) {
  const loc = (k: string) => game.i18n.localize(k);

  return (
    <>
      <SectionCard title={loc("ANIMA.Magic")} dot="blue">
        <div className="a-item-grid">
          <Field label={loc("ANIMA.ItemSpellLevel")}>
            <NumberField system={system} path="spellLevel" isEditable={isEditable} onUpdate={onUpdate} min={2} />
          </Field>
          <Field label={loc("ANIMA.ItemMagicPath")}>
            <TextField system={system} path="magicPath" isEditable={isEditable} onUpdate={onUpdate} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title={loc("ANIMA.ItemSpellGrades")} light>
        <div className="a-item-grid">
          {SPELL_GRADES.map((g) => (
            <div key={g.key} className="flex flex-col gap-1 min-w-0">
              <span className="a-flabel">{g.label}</span>
              <div className="flex gap-1">
                <Field label={loc("ANIMA.ItemZeonCost")}>
                  <NumberField system={system} path={`grades.${g.key}.zeonCost`} isEditable={isEditable} onUpdate={onUpdate} min={0} />
                </Field>
                <Field label={loc("ANIMA.ItemIntRequired")}>
                  <NumberField system={system} path={`grades.${g.key}.intRequired`} isEditable={isEditable} onUpdate={onUpdate} min={0} />
                </Field>
                <Field label={loc("ANIMA.ItemMaintenanceCost")}>
                  <NumberField system={system} path={`grades.${g.key}.maintenanceCost`} isEditable={isEditable} onUpdate={onUpdate} min={0} />
                </Field>
              </div>
              <Field label={loc("ANIMA.ItemEffect")}>
                <TextField system={system} path={`grades.${g.key}.effect`} isEditable={isEditable} onUpdate={onUpdate} />
              </Field>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title={loc("ANIMA.ItemSpellDetails")} light>
        <div className="a-item-grid">
          <Field label={loc("ANIMA.ItemActionType")}>
            <select className="a-input" value={system.actionType ?? "active"} disabled={!isEditable}
              onChange={(e) => onUpdate("system.actionType", e.target.value)}>
              {ACTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          <Field label={loc("ANIMA.ItemMaintenanceType")}>
            <select className="a-input" value={system.maintenanceType ?? "none"} disabled={!isEditable}
              onChange={(e) => onUpdate("system.maintenanceType", e.target.value)}>
              {MAINTENANCE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          <Field label={loc("ANIMA.ItemSpellType")}>
            <select className="a-input" value={system.spellType ?? "effect"} disabled={!isEditable}
              onChange={(e) => onUpdate("system.spellType", e.target.value)}>
              {SPELL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          <Field label={loc("ANIMA.ItemDamageType")}>
            <TextField system={system} path="damageType" isEditable={isEditable} onUpdate={onUpdate} />
          </Field>
          <Field label={loc("ANIMA.ItemResistanceType")}>
            <select className="a-input" value={system.resistanceType ?? "none"} disabled={!isEditable}
              onChange={(e) => onUpdate("system.resistanceType", e.target.value)}>
              {RESISTANCE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          <Field label={loc("ANIMA.ItemClosedPaths")}>
            <TextField system={system} path="closedPaths" isEditable={isEditable} onUpdate={onUpdate} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title={loc("ANIMA.ItemEffect")} light>
        <TextField system={system} path="effect" isEditable={isEditable} onUpdate={onUpdate} />
      </SectionCard>
    </>
  );
}
