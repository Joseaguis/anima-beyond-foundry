import { useEffect, useState } from "react";
import { SectionCard } from "./SectionCard";
import type { OnUpdate } from "./fields";

export interface Innato {
  powerName: string;
  potentialAllocated: number;
  note: string;
}

interface InnatosListProps {
  innatos: Innato[];
  /** Names of the actor's maintainable powers — the only ones an innato may hold. */
  maintainablePowers?: string[];
  /** Free CV left; each innato costs 2 more (Core p. 212). */
  cvFree?: number;
  isEditable: boolean;
  onUpdate: OnUpdate;
  style?: React.CSSProperties;
}

const GRID = "1.4fr 100px 1fr 58px";

/** CV a single innato consumes permanently (Core p. 212). */
const CV_PER_INNATO = 2;

const emptyRow = (): Innato => ({ powerName: "", potentialAllocated: 0, note: "" });

/**
 * Editable list of "Innatos activos" (system.psychic.innatos): each entry
 * maintains one power permanently active (Core p. 212, 2 CV each). Same
 * commit-on-blur pattern as SummonsList (magic.summons).
 *
 * Overspending is flagged, never blocked — the same "flagged, not clamped"
 * contract the sheet uses for Ki's CM and the magic level.
 */
export function InnatosList({
  innatos,
  maintainablePowers = [],
  cvFree = 0,
  isEditable,
  onUpdate,
  style,
}: InnatosListProps) {
  const [rows, setRows] = useState<Innato[]>(innatos);

  useEffect(() => {
    setRows(innatos);
  }, [innatos]);

  const commit = (next: Innato[]) => {
    setRows(next);
    onUpdate("system.psychic.innatos", next);
  };

  const patch = (index: number, field: keyof Innato, value: string | number) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };

  const wouldOverspend = cvFree < CV_PER_INNATO;

  const addBtn = isEditable ? (
    <button
      type="button"
      className="text-[11px] font-semibold px-2 py-0.5 rounded-[5px] cursor-pointer"
      style={{ background: "var(--acc)", color: "#fff" }}
      title={wouldOverspend ? `Sin CV libres suficientes (cada innato cuesta ${CV_PER_INNATO} CV)` : undefined}
      onClick={() => commit([...rows, emptyRow()])}
    >
      + Innato
    </button>
  ) : undefined;

  return (
    <SectionCard title="Innatos activos" dot="red" padded={false} right={addBtn} style={style}>
      {wouldOverspend && rows.length > 0 && (
        <div className="px-3 py-1 text-[11px] a-red">
          CV libres insuficientes: cada innato cuesta {CV_PER_INNATO} CV.
        </div>
      )}
      <div className="scl overflow-x-auto">
        <div style={{ minWidth: 360 }}>
          <div className="a-thead" style={{ gridTemplateColumns: GRID }}>
            <div>Poder</div>
            <div className="text-center">Potencial</div>
            <div>Nota</div>
            <div />
          </div>

          {rows.length === 0 ? (
            <div className="px-3 py-2 text-[11.5px] a-muted">Sin innatos activos.</div>
          ) : (
            rows.map((row, index) => (
              <div key={index} className="a-trow" style={{ gridTemplateColumns: GRID }}>
                <div className="px-2 py-1">
                  <select
                    className="a-input a-input--left"
                    value={row.powerName}
                    disabled={!isEditable}
                    onChange={(e) => commit(rows.map((r, i) => (i === index ? { ...r, powerName: e.target.value } : r)))}
                  >
                    <option value="">— Poder —</option>
                    {maintainablePowers.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                    {/* Keep a stale name selectable so dropping a power from the
                        sheet never silently wipes the innato it was holding. */}
                    {row.powerName && !maintainablePowers.includes(row.powerName) && (
                      <option value={row.powerName}>{row.powerName} (no mantenible)</option>
                    )}
                  </select>
                </div>
                <div className="px-1.5 py-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    className="a-input"
                    value={String(row.potentialAllocated)}
                    disabled={!isEditable}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => patch(index, "potentialAllocated", Math.max(0, parseInt(e.target.value, 10) || 0))}
                    onBlur={() => commit(rows)}
                    onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                  />
                </div>
                <div className="px-1.5 py-1">
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
        </div>
      </div>
    </SectionCard>
  );
}
