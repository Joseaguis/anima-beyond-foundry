import type { ItemTabProps } from "../types";
import { SectionCard } from "../../character/ui/SectionCard";
import { Field, NumberField, TextField, CheckboxField } from "../../character/ui/fields";
import { DIFFICULTY_LEVELS } from "../../../actors/creature/tables";

const ACTIONS = [
  { value: "active", label: "Activa" },
  { value: "passive", label: "Pasiva" },
];

interface Grade {
  difficulty: string;
  effect: string;
}

export function PsychicPowerTab({ system, isEditable, onUpdate }: ItemTabProps) {
  const loc = (k: string) => game.i18n.localize(k);

  const grades: Grade[] = Array.isArray(system.grades) ? system.grades : [];

  const updateGrade = (index: number, patch: Partial<Grade>) => {
    const next = grades.map((g, i) => (i === index ? { ...g, ...patch } : g));
    void onUpdate("system.grades", next);
  };

  const addGrade = () => {
    void onUpdate("system.grades", [...grades, { difficulty: "", effect: "" }]);
  };

  const removeGrade = (index: number) => {
    void onUpdate("system.grades", grades.filter((_, i) => i !== index));
  };

  return (
    <>
      <SectionCard title={loc("ANIMA.ItemPsychicPower")} dot="red">
        <div className="a-item-grid">
          <Field label={loc("ANIMA.ItemDiscipline")}>
            <TextField system={system} path="discipline" isEditable={isEditable} onUpdate={onUpdate} />
          </Field>
          <Field label={loc("ANIMA.ItemPowerLevel")}>
            <NumberField system={system} path="powerLevel" isEditable={isEditable} onUpdate={onUpdate} min={0} />
          </Field>
          <Field label={loc("ANIMA.ItemAction")}>
            <select
              className="a-input"
              value={system.action ?? "active"}
              disabled={!isEditable}
              onChange={(e) => onUpdate("system.action", e.target.value)}
            >
              {ACTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label={loc("ANIMA.ItemMasteryCost")}>
            <NumberField system={system} path="masteryCost" isEditable={isEditable} onUpdate={onUpdate} min={0} />
          </Field>
          <Field label={loc("ANIMA.ItemFortifyCvs")}>
            <NumberField system={system} path="fortifyCvs" isEditable={isEditable} onUpdate={onUpdate} min={0} />
          </Field>
          <Field label={loc("ANIMA.ItemMaintainable")}>
            <CheckboxField system={system} path="maintainable" isEditable={isEditable} onUpdate={onUpdate} />
          </Field>
          {/* Only meaningful while the power is maintainable (Core p. 212). */}
          <Field label={loc("ANIMA.ItemMaintenanceDifficulty")}>
            <select
              className="a-input"
              value={system.maintenanceDifficulty ?? ""}
              disabled={!isEditable || !system.maintainable}
              onChange={(e) => onUpdate("system.maintenanceDifficulty", e.target.value)}
            >
              <option value="">—</option>
              {DIFFICULTY_LEVELS.map((d) => (
                <option key={d.key} value={d.key}>
                  {d.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label={loc("ANIMA.ItemIsMatrix")}>
            <CheckboxField system={system} path="isMatrix" isEditable={isEditable} onUpdate={onUpdate} />
          </Field>
          <Field label={loc("ANIMA.ItemEffect")}>
            <TextField system={system} path="effect" isEditable={isEditable} onUpdate={onUpdate} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title={loc("ANIMA.ItemGrades")} light>
        {grades.map((g, i) => (
          <div key={i} className="a-modifier-row">
            <input
              type="text"
              className="a-input"
              style={{ flex: 1 }}
              value={g.difficulty}
              disabled={!isEditable}
              placeholder={loc("ANIMA.ItemDifficulty")}
              onChange={(e) => updateGrade(i, { difficulty: e.target.value })}
            />
            <input
              type="text"
              className="a-input"
              style={{ flex: 2 }}
              value={g.effect}
              disabled={!isEditable}
              placeholder={loc("ANIMA.ItemEffect")}
              onChange={(e) => updateGrade(i, { effect: e.target.value })}
            />
            {isEditable && (
              <button type="button" onClick={() => removeGrade(i)} className="a-modifier-row button">
                ✕
              </button>
            )}
          </div>
        ))}
        {isEditable && (
          <button type="button" className="a-modifier-add" onClick={addGrade}>
            + {loc("ANIMA.ItemAddGrade")}
          </button>
        )}
      </SectionCard>
    </>
  );
}
