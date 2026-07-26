import { SectionCard } from "../ui/SectionCard";
import { NumberField, TextField } from "../ui/fields";
import { SPECIAL_RULES } from "../../../rules/special-rules";
import type { TabProps } from "./types";

/**
 * "Reglas especiales" as a standalone tab: a fixed checklist of every catalog
 * entry (src/rules/special-rules.ts), instead of the old "add one from a
 * dropdown" flow. Checking a row activates it (writes system.specialRules.<key>);
 * unchecking removes it. The pipeline still reads it through PrepContext.flag(key).
 */
export function ReglasEspecialesTab({ system, isEditable, onUpdate }: TabProps) {
  const loc = (k: string) => game.i18n.localize(k);
  const active: Record<string, { value?: number | null; note?: string }> = system.specialRules ?? {};
  const defs = Object.values(SPECIAL_RULES);

  const toggle = (key: string, checked: boolean) => {
    if (checked) onUpdate(`system.specialRules.${key}`, { value: null, note: "" });
    else onUpdate(`system.specialRules.-=${key}`, null);
  };

  return (
    <div className="a-screen a-grid12">
      <SectionCard title={loc("ANIMA.SpecialRules")} dot="acc" padded={false} style={{ gridColumn: "span 12" }}>
        {defs.length === 0 && (
          <div className="px-3 py-2 text-[11.5px] a-muted">Sin reglas en el catálogo.</div>
        )}
        {defs.map((def) => {
          const checked = def.key in active;
          return (
            <div key={def.key} className="a-trow px-2.5 py-1.5 flex items-center gap-2.5 text-xs">
              <input
                type="checkbox"
                className="a-checkbox"
                checked={checked}
                disabled={!isEditable}
                onChange={(e) => toggle(def.key, e.target.checked)}
              />
              <span className="font-semibold flex-1 min-w-0" title={loc(def.hintKey)}>
                {loc(def.labelKey)}
              </span>
              {def.hasValue && (
                <NumberField
                  system={system}
                  path={`specialRules.${def.key}.value`}
                  isEditable={isEditable && checked}
                  onUpdate={onUpdate}
                  className="h-[22px]! w-16!"
                />
              )}
              <div className="w-56 shrink-0">
                <TextField
                  system={system}
                  path={`specialRules.${def.key}.note`}
                  isEditable={isEditable && checked}
                  onUpdate={onUpdate}
                  className="h-[22px]! w-full"
                  placeholder={loc("ANIMA.SpecialRuleNote")}
                />
              </div>
            </div>
          );
        })}
      </SectionCard>
    </div>
  );
}
