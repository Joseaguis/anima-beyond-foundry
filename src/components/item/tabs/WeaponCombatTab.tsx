import React from "react";
import type { ItemTabProps } from "../types";
import { SectionCard } from "../../character/ui/SectionCard";
import { Field, NumberField, TextField } from "../../character/ui/fields";

const WEAPON_TYPES = [
  { value: "melee", labelKey: "ANIMA.WeaponMelee" },
  { value: "ranged", labelKey: "ANIMA.WeaponRanged" },
  { value: "thrown", labelKey: "ANIMA.WeaponThrown" },
  { value: "ammo", labelKey: "ANIMA.WeaponAmmo" },
  { value: "shield", labelKey: "ANIMA.WeaponShield" },
];

const DAMAGE_TYPES = ["FIL", "CON", "PEN", "CAL", "FRI", "ELE", "ENE"];

const SIZES = [
  { value: "small", labelKey: "ANIMA.SizeSmall" },
  { value: "medium", labelKey: "ANIMA.SizeMedium" },
  { value: "large", labelKey: "ANIMA.SizeLarge" },
];

export function WeaponCombatTab({ system, isEditable, onUpdate }: ItemTabProps) {
  const loc = (k: string) => game.i18n.localize(k);

  return (
    <>
      <SectionCard title={loc("ANIMA.Combat")} dot="red">
        <div className="a-item-grid">
          <Field label={loc("ANIMA.ItemWeaponType")}>
            <select
              className="a-input"
              value={system.weaponType ?? "melee"}
              disabled={!isEditable}
              onChange={(e) => onUpdate("system.weaponType", e.target.value)}
            >
              {WEAPON_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{loc(t.labelKey)}</option>
              ))}
            </select>
          </Field>
          <Field label={loc("ANIMA.Damage")}>
            <NumberField system={system} path="damage" isEditable={isEditable} onUpdate={onUpdate} />
          </Field>
          <Field label={loc("ANIMA.Speed")}>
            <NumberField system={system} path="speed" isEditable={isEditable} onUpdate={onUpdate} />
          </Field>
          <Field label={loc("ANIMA.ItemRequiredStr")}>
            <NumberField system={system} path="requiredStr" isEditable={isEditable} onUpdate={onUpdate} min={0} />
          </Field>
          <Field label={loc("ANIMA.ItemRange")}>
            <NumberField system={system} path="range" isEditable={isEditable} onUpdate={onUpdate} min={0} />
          </Field>
          <Field label={loc("ANIMA.ItemReload")}>
            <NumberField system={system} path="reload" isEditable={isEditable} onUpdate={onUpdate} min={0} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title={loc("ANIMA.ItemPrimaryType")} light>
        <div className="a-item-grid">
          <Field label={loc("ANIMA.ItemPrimaryType")}>
            <select
              className="a-input"
              value={system.primaryType ?? "FIL"}
              disabled={!isEditable}
              onChange={(e) => onUpdate("system.primaryType", e.target.value)}
            >
              {DAMAGE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label={loc("ANIMA.ItemSecondaryType")}>
            <TextField system={system} path="secondaryType" isEditable={isEditable} onUpdate={onUpdate} />
          </Field>
          <Field label={loc("ANIMA.ItemCritical")}>
            <NumberField system={system} path="critical" isEditable={isEditable} onUpdate={onUpdate} />
          </Field>
          <Field label={loc("ANIMA.Size")}>
            <select
              className="a-input"
              value={system.size ?? "medium"}
              disabled={!isEditable}
              onChange={(e) => onUpdate("system.size", e.target.value)}
            >
              {SIZES.map((s) => (
                <option key={s.value} value={s.value}>{loc(s.labelKey)}</option>
              ))}
            </select>
          </Field>
          <Field label={loc("ANIMA.ItemSpecial")}>
            <TextField system={system} path="special" isEditable={isEditable} onUpdate={onUpdate} />
          </Field>
        </div>
      </SectionCard>
    </>
  );
}
