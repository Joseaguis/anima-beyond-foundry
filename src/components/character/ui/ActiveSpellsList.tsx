import { useEffect, useState } from "react";
import { SectionCard } from "./SectionCard";
import type { OnUpdate } from "./fields";

export interface ActiveSpell {
  name: string;
  /** Grade it was cast at — each has its own maintenance cost (Core p. 119). */
  grade: string;
  /** "round" (sostenido) or "daily" (declarado al iniciar la jornada). */
  upkeepMode: string;
  zeonUpkeep: number;
  /** Contra quién se mantiene, para repetir la RM cada 5 asaltos (p. 121). */
  against: string;
  note: string;
}

interface ActiveSpellsListProps {
  spells: ActiveSpell[];
  /** Derived per-round total (prepareMagic). */
  upkeepRound: number;
  /** Derived per-day total (prepareMagic). */
  upkeepDaily: number;
  isEditable: boolean;
  onUpdate: OnUpdate;
  style?: React.CSSProperties;
}

const GRID = "1.5fr 92px 84px 78px 1fr 58px";

const GRADES = [
  { value: "base", label: "Base" },
  { value: "intermediate", label: "Intermedio" },
  { value: "advanced", label: "Avanzado" },
  { value: "arcane", label: "Arcano" },
];

const UPKEEP_MODES = [
  { value: "round", label: "Asalto" },
  { value: "daily", label: "Diario" },
];

const emptyRow = (): ActiveSpell => ({
  name: "",
  grade: "base",
  upkeepMode: "round",
  zeonUpkeep: 0,
  against: "",
  note: "",
});

/**
 * "Conjuros activos / Criaturas atadas" (Excel Místicos sheet): editable list
 * over system.magic.activeSpells. The upkeep totals are derived in
 * `prepareMagic`; nothing spends the Zeón yet (there is no turn runtime).
 * Same commit-on-blur pattern as SummonsList.
 */
export function ActiveSpellsList({
  spells,
  upkeepRound,
  upkeepDaily,
  isEditable,
  onUpdate,
  style,
}: ActiveSpellsListProps) {
  const [rows, setRows] = useState<ActiveSpell[]>(spells);

  useEffect(() => {
    setRows(spells);
  }, [spells]);

  const commit = (next: ActiveSpell[]) => {
    setRows(next);
    onUpdate("system.magic.activeSpells", next);
  };

  const patch = (index: number, field: keyof ActiveSpell, value: string | number) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };

  const addBtn = isEditable ? (
    <button
      type="button"
      className="text-[11px] font-semibold px-2 py-0.5 rounded-[5px] cursor-pointer"
      style={{ background: "var(--acc)", color: "#fff" }}
      onClick={() => commit([...rows, emptyRow()])}
    >
      + Conjuro
    </button>
  ) : undefined;

  return (
    <SectionCard
      title="Conjuros activos / Criaturas atadas"
      dot="blue"
      padded={false}
      right={addBtn}
      style={style}
    >
      <div className="scl overflow-x-auto">
        <div style={{ minWidth: 380 }}>
          <div className="a-thead" style={{ gridTemplateColumns: GRID }}>
            <div>Conjuro / Criatura</div>
            <div className="text-center">Grado</div>
            <div className="text-center">Coste</div>
            <div className="text-center">Zeón</div>
            <div>Contra / Nota</div>
            <div />
          </div>

          {rows.length === 0 ? (
            <div className="px-3 py-2 text-[11.5px] a-muted">
              Sin conjuros activos ni criaturas atadas.
            </div>
          ) : (
            rows.map((row, index) => (
              <div key={index} className="a-trow" style={{ gridTemplateColumns: GRID }}>
                <div className="px-2 py-1">
                  <input
                    type="text"
                    className="a-input a-input--left"
                    value={row.name}
                    placeholder="Nombre"
                    disabled={!isEditable}
                    onChange={(e) => patch(index, "name", e.target.value)}
                    onBlur={() => commit(rows)}
                    onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                  />
                </div>
                <div className="px-1.5 py-1">
                  <select
                    className="a-input"
                    value={row.grade}
                    disabled={!isEditable}
                    onChange={(e) => {
                      patch(index, "grade", e.target.value);
                      commit(rows.map((r, i) => (i === index ? { ...r, grade: e.target.value } : r)));
                    }}
                  >
                    {GRADES.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="px-1.5 py-1">
                  <select
                    className="a-input"
                    value={row.upkeepMode}
                    disabled={!isEditable}
                    onChange={(e) => {
                      patch(index, "upkeepMode", e.target.value);
                      commit(
                        rows.map((r, i) => (i === index ? { ...r, upkeepMode: e.target.value } : r)),
                      );
                    }}
                  >
                    {UPKEEP_MODES.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="px-1.5 py-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    className="a-input"
                    value={String(row.zeonUpkeep)}
                    disabled={!isEditable}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) =>
                      patch(index, "zeonUpkeep", Math.max(0, parseInt(e.target.value, 10) || 0))
                    }
                    onBlur={() => commit(rows)}
                    onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                  />
                </div>
                <div className="px-1.5 py-1 flex gap-1">
                  <input
                    type="text"
                    className="a-input a-input--left"
                    value={row.against}
                    placeholder="Contra"
                    title="Contra quién se mantiene: da derecho a repetir la RM cada 5 asaltos"
                    disabled={!isEditable}
                    onChange={(e) => patch(index, "against", e.target.value)}
                    onBlur={() => commit(rows)}
                    onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                  />
                  <input
                    type="text"
                    className="a-input a-input--left"
                    value={row.note}
                    placeholder="Nota"
                    disabled={!isEditable}
                    onChange={(e) => patch(index, "note", e.target.value)}
                    onBlur={() => commit(rows)}
                    onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                  />
                </div>
                <div className="flex items-center justify-center">
                  {isEditable && (
                    <button
                      type="button"
                      title="Borrar"
                      className="w-[22px] h-[22px] rounded-[4px] cursor-pointer a-red"
                      style={{ background: "var(--fld)" }}
                      onClick={() => commit(rows.filter((_, i) => i !== index))}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))
          )}

          <div className="a-tfoot text-[11.5px]" style={{ gridTemplateColumns: GRID }}>
            <div className="px-2 py-1.5 font-semibold">Coste zeónico por asalto / al día</div>
            <div className="text-center py-1.5 font-bold" style={{ gridColumn: "span 2" }}>
              {upkeepRound}
            </div>
            <div className="text-center py-1.5 font-bold">{upkeepDaily}</div>
            <div style={{ gridColumn: "span 2" }} />
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
