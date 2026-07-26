import type { ItemTabProps } from "../types";
import { SectionCard } from "../../character/ui/SectionCard";
import { CheckboxField, DerivedValue, Field, StatCard, TextField } from "../../character/ui/fields";
import { KI_CHAR_KEYS, type KiCharKey } from "../../../domains/ki/data";
import { formatKiCost } from "../../../domains/ki/technique-build";
import type {
  TechniqueBuildResult,
  TechniqueDisadvantageEntry,
  TechniqueDuration,
  TechniqueEffectEntry,
} from "../../../domains/ki/technique-data";
import {
  REFERENCE_SHEET_EFFECT_ROWS,
  TECHNIQUE_DISADVANTAGES,
  TECHNIQUE_LEVELS,
  effectsBySection,
  getDisadvantageDef,
  getEffectDef,
} from "../../../domains/ki/technique-tables";

/**
 * The Ki technique builder, laid out like the `Creación de Técnicas` sheet of
 * the reference Excel: one Efecto Primario plus up to four Secundarios, each
 * with its options, duration and per-characteristic Ki split, then the
 * Desventajas and the Ki/CM adjustment, with the CM, the cost and the rule
 * violations recomputed live.
 */

const DURATIONS: { value: TechniqueDuration; label: string }[] = [
  { value: "none", label: "—" },
  { value: "maintained", label: "Mantenido" },
  { value: "sustainedMinor", label: "Sost. Menor (5 asaltos)" },
  { value: "sustainedMajor", label: "Sost. Mayor (20 asaltos)" },
];

/** Excel display order, matching the Ki tab of the character sheet. */
const CHAR_ORDER: { key: KiCharKey; label: string }[] = [
  { key: "agi", label: "AGI" },
  { key: "con", label: "CON" },
  { key: "dex", label: "DES" },
  { key: "str", label: "FUE" },
  { key: "pow", label: "POD" },
  { key: "wp", label: "VOL" },
];

const SECTIONS = effectsBySection();

function emptyEffect(role: TechniqueEffectEntry["role"]): TechniqueEffectEntry {
  return {
    effect: "",
    role,
    options: [],
    duration: "none",
    distribution: {},
    upkeepDistribution: {},
  };
}

/** A small numeric cell that commits on blur, for the Ki distribution grids. */
function KiCell({
  value,
  isEditable,
  onCommit,
}: {
  value: number;
  isEditable: boolean;
  onCommit: (next: number) => void;
}) {
  return (
    <input
      type="number"
      className="a-input text-center"
      style={{ width: 44 }}
      min={0}
      value={value}
      disabled={!isEditable}
      onChange={(e) => onCommit(Math.max(0, Number(e.target.value) || 0))}
    />
  );
}

export function KiTechniqueTab({ system, isEditable, onUpdate }: ItemTabProps) {
  const build = system.build as TechniqueBuildResult | undefined;
  const effects: TechniqueEffectEntry[] = Array.isArray(system.effects) ? system.effects : [];
  const disadvantages: TechniqueDisadvantageEntry[] = Array.isArray(system.disadvantages)
    ? system.disadvantages
    : [];
  const level: number = system.level ?? 1;
  const levelDef = TECHNIQUE_LEVELS[level] ?? TECHNIQUE_LEVELS[1];

  const writeEffects = (next: TechniqueEffectEntry[]) => void onUpdate("system.effects", next);
  const patchEffect = (index: number, patch: Partial<TechniqueEffectEntry>) =>
    writeEffects(effects.map((e, i) => (i === index ? { ...e, ...patch } : e)));

  const writeDisadvantages = (next: TechniqueDisadvantageEntry[]) =>
    void onUpdate("system.disadvantages", next);

  const addEffect = () =>
    writeEffects([...effects, emptyEffect(effects.some((e) => e.role === "primary") ? "secondary" : "primary")]);

  return (
    <>
      {/* ---- Cabecera: nivel, árbol, combinable y coste derivado ---- */}
      <SectionCard title="Técnica" dot="acc">
        <div className="a-item-grid">
          <Field label="Árbol de Técnicas">
            <TextField system={system} path="tree" isEditable={isEditable} onUpdate={onUpdate} />
          </Field>
          <Field label="Nivel">
            <select
              className="a-input"
              value={level}
              disabled={!isEditable}
              onChange={(e) => onUpdate("system.level", Number(e.target.value))}
            >
              <option value={1}>1 — Básica</option>
              <option value={2}>2 — Mayor</option>
              <option value={3}>3 — Arcana</option>
            </select>
          </Field>
          <Field label="Combinable">
            <CheckboxField
              system={system}
              path="combinable"
              isEditable={isEditable}
              onUpdate={onUpdate}
            />
          </Field>
          <Field label={`CM (${levelDef.min}–${levelDef.max})`}>
            <DerivedValue
              value={build?.cm ?? 0}
              className={build?.cm && build.cm > levelDef.max ? "a-red" : undefined}
            />
          </Field>
        </div>

        {build && (
          <div className="flex flex-wrap gap-2 mt-2">
            <StatCard label="Coste en Ki" value={formatKiCost(build.kiCost, build.kiUpkeep) || "—"} />
            <StatCard label="Ki total" value={build.kiTotal} color="acc" />
            <StatCard
              label="Mantenimiento"
              value={build.kiUpkeepTotal > 0 ? `${build.kiUpkeepTotal} / asalto` : "—"}
            />
            <StatCard
              label="Desventajas"
              value={`${disadvantages.length} / ${levelDef.maxDisadvantages}`}
            />
          </div>
        )}

        {build?.atLevelMinimum && (
          <p className="a-muted text-[11px] mt-2">
            Los Efectos suman {build.cmEffects} CM, por debajo del mínimo del nivel: la técnica
            cuesta {build.cm} CM.
          </p>
        )}
        {system.usesBookCost && (
          <p className="a-muted text-[11px] mt-1">
            Coste según el libro ({system.bookCost}); reparte el Ki entre las características para
            calcularlo desde los Efectos.
          </p>
        )}
      </SectionCard>

      {/* ---- Efectos ---- */}
      <SectionCard title="Efectos" light>
        {effects.map((entry, index) => {
          const def = getEffectDef(entry.effect);
          const cost = build?.perEffect[index];
          const maintained = entry.duration === "maintained";

          return (
            <div key={index} className="a-zebra" style={{ padding: "6px 4px" }}>
              <div className="flex flex-wrap items-end gap-2">
                <Field label="Rol">
                  <select
                    className="a-input"
                    style={{ width: 108 }}
                    value={entry.role}
                    disabled={!isEditable}
                    onChange={(e) =>
                      patchEffect(index, { role: e.target.value as TechniqueEffectEntry["role"] })
                    }
                  >
                    <option value="primary">Primario</option>
                    <option value="secondary">Secundario</option>
                  </select>
                </Field>

                <Field label="Efecto">
                  <select
                    className="a-input"
                    style={{ minWidth: 210 }}
                    value={entry.effect}
                    disabled={!isEditable}
                    onChange={(e) =>
                      // Changing the Efecto invalidates its options and split.
                      patchEffect(index, {
                        effect: e.target.value,
                        options: [],
                        distribution: {},
                        upkeepDistribution: {},
                      })
                    }
                  >
                    <option value="">—</option>
                    {SECTIONS.map((group) => (
                      <optgroup key={group.section} label={group.section}>
                        {group.effects.map((effect) => (
                          <option key={effect.key} value={effect.key}>
                            {effect.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </Field>

                <Field label="Opción">
                  <select
                    className="a-input"
                    style={{ minWidth: 150 }}
                    value={entry.options[0] ?? ""}
                    disabled={!isEditable || !def}
                    onChange={(e) =>
                      patchEffect(index, {
                        options: [e.target.value, ...entry.options.slice(1)].filter(
                          (o, i) => i === 0 || o !== "",
                        ),
                      })
                    }
                  >
                    {(def?.options ?? []).map((option) => (
                      <option key={option.option} value={option.option}>
                        {option.option || "(base)"}
                        {option.level > 1 ? ` · Nv ${option.level}` : ""}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Duración">
                  <select
                    className="a-input"
                    value={entry.duration}
                    disabled={!isEditable}
                    onChange={(e) =>
                      patchEffect(index, {
                        duration: e.target.value as TechniqueDuration,
                        // Only Mantenido has a per-round cost to allocate.
                        upkeepDistribution:
                          e.target.value === "maintained" ? entry.upkeepDistribution : {},
                      })
                    }
                  >
                    {DURATIONS.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="CM">
                  <DerivedValue value={cost?.cm ?? 0} />
                </Field>
                <Field label="Ki (repartido / necesario)">
                  <DerivedValue
                    value={`${cost?.kiAllocated ?? 0} / ${cost?.kiRequired ?? 0}`}
                    className={
                      cost && cost.kiAllocated !== cost.kiRequired ? "a-red" : undefined
                    }
                  />
                </Field>

                {isEditable && (
                  <button
                    type="button"
                    className="a-modifier-row button"
                    onClick={() => writeEffects(effects.filter((_, i) => i !== index))}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Opciones adicionales del Efecto (Ventajas opcionales). */}
              {def && def.options.length > 1 && (
                <div className="flex flex-wrap items-center gap-1 mt-1">
                  <span className="a-flabel">Opciones extra:</span>
                  {entry.options.slice(1).map((option, oi) => (
                    <span key={oi} className="a-pill">
                      {option}
                      {isEditable && (
                        <button
                          type="button"
                          onClick={() =>
                            patchEffect(index, {
                              options: entry.options.filter((_, i) => i !== oi + 1),
                            })
                          }
                        >
                          ✕
                        </button>
                      )}
                    </span>
                  ))}
                  {isEditable && (
                    <select
                      className="a-input"
                      style={{ width: 170 }}
                      value=""
                      onChange={(e) => {
                        if (!e.target.value) return;
                        patchEffect(index, { options: [...entry.options, e.target.value] });
                      }}
                    >
                      <option value="">+ añadir opción</option>
                      {def.options
                        .filter((o) => o.option && !entry.options.includes(o.option))
                        .map((o) => (
                          <option key={o.option} value={o.option}>
                            {o.option}
                          </option>
                        ))}
                    </select>
                  )}
                </div>
              )}

              {/* Reparto del Ki entre características. */}
              {def && (
                <div className="flex flex-wrap items-end gap-2 mt-1">
                  {CHAR_ORDER.map(({ key, label }) => {
                    const surcharge = def.optionalChars[key];
                    const isPrimary = def.primaryChar === key;
                    const usable = isPrimary || surcharge !== undefined;
                    return (
                      <Field
                        key={key}
                        label={
                          <span title={isPrimary ? "Característica primaria" : undefined}>
                            {label}
                            {isPrimary ? "*" : surcharge ? ` +${surcharge}` : ""}
                          </span>
                        }
                      >
                        <div className="flex gap-1">
                          <KiCell
                            value={entry.distribution?.[key] ?? 0}
                            isEditable={isEditable && usable}
                            onCommit={(next) =>
                              patchEffect(index, {
                                distribution: { ...entry.distribution, [key]: next },
                              })
                            }
                          />
                          {maintained && (
                            <KiCell
                              value={entry.upkeepDistribution?.[key] ?? 0}
                              isEditable={isEditable && usable}
                              onCommit={(next) =>
                                patchEffect(index, {
                                  upkeepDistribution: { ...entry.upkeepDistribution, [key]: next },
                                })
                              }
                            />
                          )}
                        </div>
                      </Field>
                    );
                  })}
                  {maintained && (
                    <span className="a-muted text-[11px]">
                      2ª casilla: Ki de mantenimiento por asalto
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {isEditable && (
          <button type="button" className="a-modifier-add" onClick={addEffect}>
            + Efecto
            {effects.length >= REFERENCE_SHEET_EFFECT_ROWS && (
              <span className="a-muted"> (más de los {REFERENCE_SHEET_EFFECT_ROWS} de la ficha)</span>
            )}
          </button>
        )}
      </SectionCard>

      {/* ---- Desventajas ---- */}
      <SectionCard title="Desventajas" light>
        {disadvantages.map((entry, index) => {
          const def = getDisadvantageDef(entry.disadvantage);
          const option = def?.options.find((o) => o.option === entry.option) ?? def?.options[0];
          return (
            <div key={index} className="a-modifier-row">
              <select
                className="a-input"
                style={{ flex: 2 }}
                value={entry.disadvantage}
                disabled={!isEditable}
                onChange={(e) =>
                  writeDisadvantages(
                    disadvantages.map((d, i) =>
                      i === index ? { disadvantage: e.target.value, option: "" } : d,
                    ),
                  )
                }
              >
                <option value="">—</option>
                {TECHNIQUE_DISADVANTAGES.map((d) => (
                  <option key={d.key} value={d.key}>
                    {d.name}
                  </option>
                ))}
              </select>
              <select
                className="a-input"
                style={{ flex: 2 }}
                value={entry.option}
                disabled={!isEditable || !def || def.options.length <= 1}
                onChange={(e) =>
                  writeDisadvantages(
                    disadvantages.map((d, i) => (i === index ? { ...d, option: e.target.value } : d)),
                  )
                }
              >
                {(def?.options ?? []).map((o) => (
                  <option key={o.option} value={o.option}>
                    {o.option || "(base)"}
                    {o.level > 1 ? ` · Nv ${o.level}` : ""}
                  </option>
                ))}
              </select>
              <DerivedValue value={`${option?.cm ?? 0} CM`} />
              {isEditable && (
                <button
                  type="button"
                  className="a-modifier-row button"
                  onClick={() => writeDisadvantages(disadvantages.filter((_, i) => i !== index))}
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
        {isEditable && (
          <button
            type="button"
            className="a-modifier-add"
            onClick={() => writeDisadvantages([...disadvantages, { disadvantage: "", option: "" }])}
          >
            + Desventaja
          </button>
        )}
      </SectionCard>

      {/* ---- Ajuste de coste (Dominus p. 046) ---- */}
      <SectionCard title="Ajuste de coste" light>
        <p className="a-muted text-[11px]">
          +10 CM por cada punto de Ki reducido (máx. 5, nunca por debajo de la mitad de la base y
          con al menos 3 características). −5 CM por cada 2 puntos de Ki añadidos, hasta −20 CM.
        </p>
        <div className="flex flex-wrap items-end gap-2 mt-1">
          <span className="a-flabel" style={{ width: 90 }}>
            Reducción de Ki
          </span>
          {CHAR_ORDER.map(({ key, label }) => (
            <Field key={key} label={label}>
              <KiCell
                value={system.kiReduction?.[key] ?? 0}
                isEditable={isEditable}
                onCommit={(next) =>
                  onUpdate("system.kiReduction", { ...system.kiReduction, [key]: next })
                }
              />
            </Field>
          ))}
          <Field label="CM del ajuste">
            <DerivedValue value={build?.cmAdjustment ?? 0} />
          </Field>
        </div>

        <div className="flex flex-wrap items-end gap-2 mt-2">
          <span className="a-flabel" style={{ width: 90 }}>
            Ki libre
          </span>
          {CHAR_ORDER.map(({ key, label }) => (
            <Field key={key} label={label}>
              <KiCell
                value={system.freeDistribution?.[key] ?? 0}
                isEditable={isEditable}
                onCommit={(next) =>
                  onUpdate("system.freeDistribution", { ...system.freeDistribution, [key]: next })
                }
              />
            </Field>
          ))}
          <Field label="Ki añadido">
            <KiCell
              value={system.kiIncrease ?? 0}
              isEditable={isEditable}
              onCommit={(next) => onUpdate("system.kiIncrease", next)}
            />
          </Field>
        </div>
        <p className="a-muted text-[11px] mt-1">
          El Ki libre cubre el coste de Combinable y el Ki añadido, que no pertenecen a ningún
          Efecto concreto.
        </p>
      </SectionCard>

      {/* ---- Errores ---- */}
      {build && build.errors.length > 0 && (
        <SectionCard title="Errores" dot="red" light>
          <ul className="text-[11px]">
            {build.errors.map((error, i) => (
              <li key={i} className="a-red">
                {describeError(error.code, error.data)}
              </li>
            ))}
          </ul>
        </SectionCard>
      )}
    </>
  );
}

/** Human-readable rendering of a builder error. */
function describeError(code: string, data?: Record<string, string | number>): string {
  const d = data ?? {};
  switch (code) {
    case "primaryCount":
      return `Una técnica debe tener exactamente un Efecto Primario (tiene ${d.count}).`;
    case "unknownEffect":
      return `Efecto desconocido: ${d.effect}.`;
    case "unknownOption":
      return `Opción "${d.option}" desconocida en ${d.effect}.`;
    case "effectLevelTooHigh":
      return `${d.effect} requiere una técnica de nivel ${d.required}.`;
    case "cannotSustain":
      return `${d.effect} no puede usarse en una técnica Sostenida.`;
    case "maintainedAndSustained":
      return "No se pueden mezclar Efectos Mantenidos y Sostenidos.";
    case "sustainLevel":
      return `Solo las técnicas de nivel ${d.min} o superior pueden sostenerse.`;
    case "sustainEffectLevel":
      return `Una Sostenida solo admite Efectos de nivel inferior al suyo (${d.effect} es de nivel ${d.required}).`;
    case "tooManyDisadvantages":
      return `Como máximo ${d.max} desventajas en este nivel.`;
    case "unknownDisadvantage":
      return `Desventaja desconocida: ${d.disadvantage}.`;
    case "disadvantageLevelTooHigh":
      return `${d.disadvantage} requiere una técnica de nivel ${d.required}.`;
    case "disadvantageClass":
      return `${d.disadvantage} exige un Efecto de clase ${d.klass}.`;
    case "kiReductionTooHigh":
      return `No se pueden reducir más de ${d.max} puntos de Ki.`;
    case "kiIncreaseTooHigh":
      return `No se pueden añadir más de ${d.max} puntos de Ki.`;
    case "kiReductionChars":
      return `Reducir Ki exige al menos ${d.min} características (hay ${d.used}).`;
    case "kiReductionBelowHalf":
      return `${String(d.char).toUpperCase()} no puede bajar de ${d.min} (la mitad de su base).`;
    case "kiNotDistributed":
      return `Ki sin repartir: ${d.allocated} de ${d.required}.`;
    case "upkeepNotDistributed":
      return `Mantenimiento sin repartir: ${d.allocated} de ${d.required}.`;
    case "cmExceedsLevel":
      return `${d.cm} CM supera el máximo de ${d.max} para este nivel.`;
    default:
      return code;
  }
}
