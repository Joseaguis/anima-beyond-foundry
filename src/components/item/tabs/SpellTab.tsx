import React from "react";
import type { ItemTabProps } from "../types";
import { SectionCard } from "../../character/ui/SectionCard";
import { Field, NumberField, TextField } from "../../character/ui/fields";
import { RichTextEditor } from "../../ui/RichTextEditor";

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

/** The TA an attack spell resolves against (Core p. 86); "" for the rest. */
const AT_TYPES = [
  { value: "", label: "—" },
  { value: "fil", label: "Filo" },
  { value: "con", label: "Contundente" },
  { value: "pen", label: "Penetrante" },
  { value: "cal", label: "Calor" },
  { value: "fri", label: "Frío" },
  { value: "ele", label: "Electricidad" },
  { value: "ene", label: "Energía" },
];

export function SpellTab({ itemUuid, system, isEditable, onUpdate }: ItemTabProps) {
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
              {/* Cifras que consume el motor de tiradas. El extractor rellena
                  daño y aguante leyendo el texto del grado; la barrera se pone
                  a mano, porque adivinarla haría inmune a un escudo. */}
              <div className="flex gap-1">
                <Field label={loc("ANIMA.ItemSpellDamage")}>
                  <NumberField system={system} path={`grades.${g.key}.damage`} isEditable={isEditable} onUpdate={onUpdate} min={0} />
                </Field>
                <Field label={loc("ANIMA.ItemShieldPoints")}>
                  <NumberField system={system} path={`grades.${g.key}.shieldPoints`} isEditable={isEditable} onUpdate={onUpdate} min={0} />
                </Field>
                <Field label={loc("ANIMA.ItemDamageBarrier")}>
                  <NumberField system={system} path={`grades.${g.key}.damageBarrier`} isEditable={isEditable} onUpdate={onUpdate} min={0} />
                </Field>
              </div>
              <Field label={loc("ANIMA.ItemEffect")}>
                {/* Textos cortos ("Daño 100."): plegados para no dominar el panel. */}
                <RichTextEditor
                  path={`grades.${g.key}.effect`}
                  value={system.grades?.[g.key]?.effect ?? ""}
                  isEditable={isEditable}
                  onUpdate={onUpdate}
                  ownerKey={itemUuid}
                  toggled
                  height={90}
                />
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
            <select className="a-input" value={system.damageType ?? ""} disabled={!isEditable}
              onChange={(e) => onUpdate("system.damageType", e.target.value)}>
              {AT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          <Field label={loc("ANIMA.ItemAtPiercing")}>
            <NumberField system={system} path="atPiercing" isEditable={isEditable} onUpdate={onUpdate} min={0} />
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
        <RichTextEditor
          path="effect"
          value={system.effect ?? ""}
          isEditable={isEditable}
          onUpdate={onUpdate}
          ownerKey={itemUuid}
          height={160}
        />
      </SectionCard>
    </>
  );
}
