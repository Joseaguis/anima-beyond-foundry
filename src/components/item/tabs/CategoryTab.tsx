import React from "react";
import type { ItemTabProps } from "../types";
import { SectionCard } from "../../character/ui/SectionCard";
import { Field, NumberField, TextField } from "../../character/ui/fields";

const COMBAT_KEYS = ["attack", "parry", "dodge", "wearArmor"] as const;
const COMBAT_LABELS: Record<string, string> = {
  attack: "ANIMA.Attack", parry: "ANIMA.Parry", dodge: "ANIMA.Dodge", wearArmor: "ANIMA.WearArmor",
};

const SEC_GROUPS = ["athletics", "social", "perceptive", "intellectual", "vigor", "subterfuge", "creative"] as const;
const SEC_LABELS: Record<string, string> = {
  athletics: "ANIMA.SecGroupAthletics", social: "ANIMA.SecGroupSocial", perceptive: "ANIMA.SecGroupPerceptive",
  intellectual: "ANIMA.SecGroupIntellectual", vigor: "ANIMA.SecGroupVigor", subterfuge: "ANIMA.SecGroupSubterfuge",
  creative: "ANIMA.SecGroupCreative",
};

/** Edits a 0..1 fraction as a percentage (Excel "Límite" columns). */
function PercentField({
  system,
  path,
  isEditable,
  onUpdate,
}: {
  system: Record<string, any>;
  path: string;
  isEditable: boolean;
  onUpdate: ItemTabProps["onUpdate"];
}) {
  const fraction = Number(path.split(".").reduce((o: any, k) => o?.[k], system) ?? 0);
  const [local, setLocal] = React.useState(String(Math.round(fraction * 100)));

  React.useEffect(() => {
    setLocal(String(Math.round(fraction * 100)));
  }, [fraction]);

  const commit = () => {
    const pct = Math.min(100, Math.max(0, parseInt(local, 10) || 0));
    setLocal(String(pct));
    if (pct / 100 !== fraction) onUpdate(`system.${path}`, pct / 100);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      className="a-input"
      value={local}
      disabled={!isEditable}
      onChange={(e) => setLocal(e.target.value)}
      onFocus={(e) => e.target.select()}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
    />
  );
}

export function CategoryTab({ system, isEditable, onUpdate }: ItemTabProps) {
  const loc = (k: string) => game.i18n.localize(k);

  return (
    <>
      <SectionCard title={loc("ANIMA.Category")} dot="acc">
        <div className="a-item-grid">
          <Field label={loc("ANIMA.ItemArchetype")}>
            <TextField system={system} path="archetype" isEditable={isEditable} onUpdate={onUpdate} />
          </Field>
          <Field label={loc("ANIMA.ItemLifeMultiple")}>
            <NumberField system={system} path="lifeMultiple" isEditable={isEditable} onUpdate={onUpdate} min={1} />
          </Field>
          <Field label={loc("ANIMA.ItemLpPerLevel")}>
            <NumberField system={system} path="lpPerLevel" isEditable={isEditable} onUpdate={onUpdate} min={0} />
          </Field>
          <Field label={loc("ANIMA.ItemInitPerLevel")}>
            <NumberField system={system} path="initiativePerLevel" isEditable={isEditable} onUpdate={onUpdate} min={0} />
          </Field>
          <Field label={loc("ANIMA.ItemMkPerLevel")}>
            <NumberField system={system} path="martialKnowledgePerLevel" isEditable={isEditable} onUpdate={onUpdate} min={0} />
          </Field>
          <Field label={loc("ANIMA.ItemNovelPerLevel")}>
            <NumberField system={system} path="novelPerLevel" isEditable={isEditable} onUpdate={onUpdate} min={0} />
          </Field>
        </div>
        <div className="a-item-grid" style={{ marginTop: 8 }}>
          <Field label="Límite Combate (%)">
            <PercentField system={system} path="dpLimits.combat" isEditable={isEditable} onUpdate={onUpdate} />
          </Field>
          <Field label="Límite Magia (%)">
            <PercentField system={system} path="dpLimits.magic" isEditable={isEditable} onUpdate={onUpdate} />
          </Field>
          <Field label="Límite Psíquica (%)">
            <PercentField system={system} path="dpLimits.psychic" isEditable={isEditable} onUpdate={onUpdate} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title={loc("ANIMA.ItemCombatCosts")} light>
        <div className="a-item-grid">
          {COMBAT_KEYS.map((k) => (
            <Field key={k} label={`${loc(COMBAT_LABELS[k])} (${loc("ANIMA.ItemCost")})`}>
              <NumberField system={system} path={`combatCosts.${k}`} isEditable={isEditable} onUpdate={onUpdate} min={1} />
            </Field>
          ))}
        </div>
        <div className="a-item-grid" style={{ marginTop: 8 }}>
          {COMBAT_KEYS.map((k) => (
            <Field key={k} label={`${loc(COMBAT_LABELS[k])} (${loc("ANIMA.Bonus")})`}>
              <NumberField system={system} path={`combatBonusPerLevel.${k}`} isEditable={isEditable} onUpdate={onUpdate} min={0} />
            </Field>
          ))}
        </div>
      </SectionCard>

      <SectionCard title={loc("ANIMA.SecondaryAbilities")} light>
        <div className="a-item-grid">
          {SEC_GROUPS.map((g) => (
            <Field key={g} label={`${loc(SEC_LABELS[g])} (${loc("ANIMA.ItemCost")})`}>
              <NumberField system={system} path={`secondaryCosts.${g}`} isEditable={isEditable} onUpdate={onUpdate} min={1} />
            </Field>
          ))}
        </div>
        <div className="a-item-grid" style={{ marginTop: 8 }}>
          {SEC_GROUPS.map((g) => (
            <Field key={g} label={`${loc(SEC_LABELS[g])} (${loc("ANIMA.Bonus")})`}>
              <NumberField system={system} path={`secondaryBonusPerLevel.${g}`} isEditable={isEditable} onUpdate={onUpdate} min={0} />
            </Field>
          ))}
        </div>
      </SectionCard>

      <SectionCard title={loc("ANIMA.Supernatural")} light>
        <div className="a-item-grid">
          <Field label={loc("ANIMA.ItemZeonCost")}><NumberField system={system} path="supernatural.zeon" isEditable={isEditable} onUpdate={onUpdate} min={1} /></Field>
          <Field label={loc("ANIMA.ItemActMultiple")}><NumberField system={system} path="supernatural.actMultiple" isEditable={isEditable} onUpdate={onUpdate} min={1} /></Field>
          <Field label={loc("ANIMA.MagicProj")}><NumberField system={system} path="supernatural.magicProjection" isEditable={isEditable} onUpdate={onUpdate} min={1} /></Field>
          <Field label={loc("ANIMA.Ki")}><NumberField system={system} path="supernatural.ki" isEditable={isEditable} onUpdate={onUpdate} min={1} /></Field>
          <Field label={loc("ANIMA.ItemKiAccMultiple")}><NumberField system={system} path="supernatural.kiAccMultiple" isEditable={isEditable} onUpdate={onUpdate} min={1} /></Field>
          <Field label={loc("ANIMA.PsiProj")}><NumberField system={system} path="supernatural.psychicProjection" isEditable={isEditable} onUpdate={onUpdate} min={1} /></Field>
          <Field label={loc("ANIMA.ItemCvCost")}><NumberField system={system} path="supernatural.cv" isEditable={isEditable} onUpdate={onUpdate} min={1} /></Field>
        </div>
      </SectionCard>
    </>
  );
}
