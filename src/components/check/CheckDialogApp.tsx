import React, { useState } from "react";
import { DIFFICULTY_LEVELS } from "../../actors/creature/tables";
import { stackBreakdown, type RollModifier } from "../../rules/modifier";
import { CHECK_TYPES, type AnimaCheckType } from "../../system/check/types";
import type { GradeOption } from "../../system/actions/spellcast";

export interface CheckDialogResult {
  modifiers: RollModifier[];
  difficulty: number | null;
  openThreshold: number;
  fumbleThreshold: number;
  /** Grade the spell is cast at; null for everything without grades. */
  grade: string | null;
}

export interface CheckDialogProps {
  label: string;
  type: AnimaCheckType;
  base: number;
  modifiers: RollModifier[];
  difficulty: number | null;
  openThreshold: number;
  fumbleThreshold: number;
  /** True when the check has no fixed difficulty (attacks, defences). */
  opposed: boolean;
  /** A spell's four grades. Empty for anything else. */
  grades?: GradeOption[];
  grade?: string | null;
  onRoll: (result: CheckDialogResult) => void;
  onCancel: () => void;
}

/**
 * Ánima's answer to PF2e's CheckModifiersDialog: toggle what applies, add a
 * one-off modifier, set the difficulty, and nudge the open/fumble ranges for
 * the odd ruling the sheet cannot know about.
 */
export function CheckDialogApp(props: CheckDialogProps): React.ReactElement {
  const [modifiers, setModifiers] = useState<RollModifier[]>(props.modifiers);
  const [difficulty, setDifficulty] = useState<number | null>(props.difficulty);
  const [openThreshold, setOpenThreshold] = useState(props.openThreshold);
  const [fumbleThreshold, setFumbleThreshold] = useState(props.fumbleThreshold);
  const [adHocLabel, setAdHocLabel] = useState("");
  const [adHocValue, setAdHocValue] = useState(0);
  const grades = props.grades ?? [];
  const [grade, setGrade] = useState<string | null>(props.grade ?? grades[0]?.key ?? null);
  const chosenGrade = grades.find((g) => g.key === grade);

  const active = modifiers.filter((m) => m.enabled && !m.ignored);
  const total = props.base + stackBreakdown(active).total;
  const config = CHECK_TYPES[props.type];

  const toggle = (index: number): void => {
    setModifiers((current) =>
      current.map((modifier, i) =>
        i === index && !modifier.forced ? { ...modifier, ignored: !modifier.ignored } : modifier,
      ),
    );
  };

  const addAdHoc = (): void => {
    if (!adHocValue) return;
    setModifiers((current) => [
      ...current,
      {
        selectors: [],
        label: adHocLabel.trim() || "Situacional",
        value: adHocValue,
        type: "circumstance",
        enabled: true,
      },
    ]);
    setAdHocLabel("");
    setAdHocValue(0);
  };

  const roll = (): void => {
    props.onRoll({
      modifiers: modifiers.filter((m) => !m.ignored),
      difficulty,
      openThreshold,
      fumbleThreshold,
      grade,
    });
  };

  return (
    <div className="a-check-dialog">
      <header className="a-check-dialog__header">
        <h2>
          {props.label}
          {chosenGrade && <small> · {chosenGrade.label}</small>}
        </h2>
        <span className="a-check-dialog__total">{total}</span>
      </header>

      {/* Un conjuro son cuatro acciones distintas (Core p. 119): el grado
          decide el Zeón que cuesta y el daño o el aguante que produce. */}
      {grades.length > 0 && (
        <div className="a-check-dialog__grades-pick">
          {grades.map((g) => (
            <button
              key={g.key}
              type="button"
              className={g.key === grade ? "is-active" : ""}
              onClick={() => setGrade(g.key)}
            >
              <span>{g.label}</span>
              <small>
                {g.cost} Zeón
                {g.damage > 0 ? ` · ${g.damage} daño` : ""}
                {g.shieldPoints > 0 ? ` · ${g.shieldPoints} pts` : ""}
              </small>
            </button>
          ))}
        </div>
      )}

      <ul className="a-check-dialog__modifiers">
        <li className="a-check-dialog__base">
          <span>Habilidad</span>
          <span>{props.base}</span>
        </li>
        {modifiers.map((modifier, index) => (
          <li key={`${modifier.label}-${index}`} className={modifier.ignored ? "is-off" : ""}>
            <label>
              <input
                type="checkbox"
                checked={!modifier.ignored}
                disabled={modifier.forced || !modifier.enabled}
                onChange={() => toggle(index)}
              />
              <span>{modifier.label}</span>
            </label>
            <span>{modifier.value >= 0 ? `+${modifier.value}` : modifier.value}</span>
          </li>
        ))}
      </ul>

      <div className="a-check-dialog__adhoc">
        <input
          type="text"
          placeholder="Modificador situacional"
          value={adHocLabel}
          onChange={(e) => setAdHocLabel(e.target.value)}
        />
        <input
          type="number"
          step={5}
          value={adHocValue}
          onChange={(e) => setAdHocValue(Number(e.target.value) || 0)}
        />
        <button type="button" onClick={addAdHoc}>
          +
        </button>
      </div>

      {!props.opposed && (
        <div className="a-check-dialog__difficulty">
          <label>
            <span>Dificultad</span>
            <input
              type="number"
              value={difficulty ?? ""}
              onChange={(e) =>
                setDifficulty(e.target.value === "" ? null : Number(e.target.value))
              }
            />
          </label>
          {config.die === 100 && (
            <div className="a-check-dialog__grades">
              {DIFFICULTY_LEVELS.map((level) => (
                <button
                  key={level.key}
                  type="button"
                  className={difficulty === level.threshold ? "is-active" : ""}
                  title={level.label}
                  onClick={() => setDifficulty(level.threshold)}
                >
                  {level.abbr}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {config.die === 100 && (
        <div className="a-check-dialog__ranges">
          <label>
            <span>Abre con</span>
            <input
              type="number"
              value={openThreshold}
              disabled={!config.allowOpen}
              onChange={(e) => setOpenThreshold(Number(e.target.value) || 90)}
            />
          </label>
          <label>
            <span>Pifia con</span>
            <input
              type="number"
              value={fumbleThreshold}
              disabled={!config.allowFumble}
              onChange={(e) => setFumbleThreshold(Number(e.target.value) || 0)}
            />
          </label>
        </div>
      )}

      <footer className="a-check-dialog__footer">
        <button type="button" onClick={props.onCancel}>
          Cancelar
        </button>
        <button type="button" className="is-primary" onClick={roll}>
          Tirar
        </button>
      </footer>
    </div>
  );
}
