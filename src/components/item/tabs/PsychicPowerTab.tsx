import type { ItemTabProps } from "../types";
import { SectionCard } from "../../character/ui/SectionCard";
import { Field, NumberField, TextField, CheckboxField } from "../../character/ui/fields";
import { RichTextEditor } from "../../ui/RichTextEditor";
import { DIFFICULTY_LEVELS } from "../../../actors/creature/tables";

const ACTIONS = [
  { value: "active", label: "Activa" },
  { value: "passive", label: "Pasiva" },
];

interface Grade {
  difficulty: string;
  effect: string;
  /** Cifras que consume el motor de tiradas; ver src/domains/psychic/psychic-power.ts. */
  damage: number;
  shieldPoints: number;
  damageBarrier: number;
}

const EMPTY_GRADE: Grade = {
  difficulty: "",
  effect: "",
  damage: 0,
  shieldPoints: 0,
  damageBarrier: 0,
};

/**
 * A numeric cell of one grade row. `NumberField` commits by path, which does not
 * work here: the grades are an ArrayField, so the whole array has to be written
 * at once. Commits on blur, like the rest of the sheet.
 */
function GradeNumber({
  label,
  value,
  isEditable,
  onCommit,
}: {
  label: string;
  value: number;
  isEditable: boolean;
  onCommit: (value: number) => void;
}) {
  return (
    <input
      type="number"
      className="a-input w-16!"
      title={label}
      placeholder={label}
      defaultValue={value}
      disabled={!isEditable}
      min={0}
      onBlur={(e) => {
        const next = Number(e.target.value) || 0;
        if (next !== value) onCommit(next);
      }}
    />
  );
}

export function PsychicPowerTab({ itemUuid, system, isEditable, onUpdate }: ItemTabProps) {
  const loc = (k: string) => game.i18n.localize(k);

  const grades: Grade[] = Array.isArray(system.grades) ? system.grades : [];

  const updateGrade = (index: number, patch: Partial<Grade>) => {
    const next = grades.map((g, i) => (i === index ? { ...g, ...patch } : g));
    void onUpdate("system.grades", next);
  };

  const addGrade = () => {
    void onUpdate("system.grades", [...grades, { ...EMPTY_GRADE }]);
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
        </div>
        <Field label={loc("ANIMA.ItemEffect")}>
          <RichTextEditor
            path="effect"
            value={system.effect ?? ""}
            isEditable={isEditable}
            onUpdate={onUpdate}
            ownerKey={itemUuid}
            height={140}
          />
        </Field>
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
            {/* Los grados viven en un ArrayField: se commitea el array entero,
                así que el editor y los números reciben su propio onUpdate en
                vez de un path. */}
            <div style={{ flex: 2 }}>
              <RichTextEditor
                path={`grades.${i}.effect`}
                value={g.effect}
                isEditable={isEditable}
                onUpdate={async (_path, value) => updateGrade(i, { effect: String(value) })}
                ownerKey={itemUuid}
                toggled
                height={90}
              />
            </div>
            <GradeNumber
              label={loc("ANIMA.ItemSpellDamage")}
              value={g.damage}
              isEditable={isEditable}
              onCommit={(v) => updateGrade(i, { damage: v })}
            />
            <GradeNumber
              label={loc("ANIMA.ItemShieldPoints")}
              value={g.shieldPoints}
              isEditable={isEditable}
              onCommit={(v) => updateGrade(i, { shieldPoints: v })}
            />
            <GradeNumber
              label={loc("ANIMA.ItemDamageBarrier")}
              value={g.damageBarrier}
              isEditable={isEditable}
              onCommit={(v) => updateGrade(i, { damageBarrier: v })}
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
