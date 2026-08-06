import { useEffect, useState } from "react";
import { SectionCard } from "./SectionCard";
import type { OnUpdate } from "./fields";

export interface ActiveShieldRow {
  id: string;
  name: string;
  /** "magic" | "psychic" | "ki". */
  origin: string;
  itemId: string;
  grade: string;
  points: number;
  maxPoints: number;
  damageBarrier: number;
  decayPerRound: number;
  broken: boolean;
  note: string;
}

interface ActiveShieldsListProps {
  shields: ActiveShieldRow[];
  isEditable: boolean;
  onUpdate: OnUpdate;
  style?: React.CSSProperties;
}

const GRID = "1.4fr 74px 108px 70px 70px 46px";

const ORIGIN_LABELS: Record<string, string> = {
  magic: "Magia",
  psychic: "Psíquica",
  ki: "Ki",
};

function emptyRow(): ActiveShieldRow {
  return {
    // Only needs to be unique within the actor; the chat flow uses randomID.
    id: `manual-${Date.now().toString(36)}`,
    name: "",
    origin: "magic",
    itemId: "",
    grade: "",
    points: 0,
    maxPoints: 0,
    damageBarrier: 0,
    decayPerRound: 0,
    broken: false,
    note: "",
  };
}

/**
 * Supernatural shields currently standing (Core pp. 97-98). Normally these
 * arrive from the chat card's "Levantar escudo" button, but the list stays
 * editable: a GM needs to be able to hand a creature a barrier without casting
 * anything, and to patch the points after a ruling.
 *
 * Same commit-on-blur pattern as ActiveSpellsList.
 */
export function ActiveShieldsList({
  shields,
  isEditable,
  onUpdate,
  style,
}: ActiveShieldsListProps) {
  const [rows, setRows] = useState<ActiveShieldRow[]>(shields);

  useEffect(() => {
    setRows(shields);
  }, [shields]);

  const commit = (next: ActiveShieldRow[]) => {
    setRows(next);
    onUpdate("system.shields", next);
  };

  const patch = (index: number, field: keyof ActiveShieldRow, value: string | number | boolean) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };

  const commitPatch = (
    index: number,
    field: keyof ActiveShieldRow,
    value: string | number | boolean,
  ) => {
    commit(rows.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };

  const addBtn = isEditable ? (
    <button
      type="button"
      className="text-[11px] font-semibold px-2 py-0.5 rounded-[5px] cursor-pointer"
      style={{ background: "var(--acc)", color: "#fff" }}
      onClick={() => commit([...rows, emptyRow()])}
    >
      + Escudo
    </button>
  ) : undefined;

  const totalPoints = rows.filter((r) => !r.broken).reduce((sum, r) => sum + r.points, 0);

  return (
    <SectionCard
      title={`Escudos activos${totalPoints > 0 ? ` · ${totalPoints} pts` : ""}`}
      dot="blue"
      padded={false}
      right={addBtn}
      style={style}
    >
      <div className="scl overflow-x-auto">
        <div style={{ minWidth: 420 }}>
          <div className="a-thead" style={{ gridTemplateColumns: GRID }}>
            <div>Escudo</div>
            <div className="text-center">Origen</div>
            <div className="text-center">Aguante</div>
            <div className="text-center" title="Ataques con daño base inferior no lo desgastan">
              Barrera
            </div>
            <div className="text-center" title="Puntos que pierde por asalto por sí solo">
              Desgaste
            </div>
            <div />
          </div>

          {rows.length === 0 ? (
            <div className="px-3 py-2 text-[11.5px] a-muted">Sin escudos levantados.</div>
          ) : (
            rows.map((row, index) => (
              <div
                key={row.id || index}
                className="a-trow"
                style={{ gridTemplateColumns: GRID, opacity: row.broken ? 0.45 : 1 }}
              >
                <div className="px-2 py-1 flex items-center gap-1 min-w-0">
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
                  {row.broken && (
                    <span className="a-red text-[10px] font-semibold shrink-0" title="Roto">
                      ✕
                    </span>
                  )}
                </div>
                <div className="px-1 py-1">
                  <select
                    className="a-input"
                    value={row.origin}
                    disabled={!isEditable}
                    onChange={(e) => commitPatch(index, "origin", e.target.value)}
                  >
                    {Object.entries(ORIGIN_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Aguante actual / máximo: lo que queda es lo que se gasta al
                    parar, y romperse depende de esta cifra. */}
                <div className="px-1 py-1 flex items-center gap-1">
                  <input
                    type="number"
                    className="a-input"
                    value={row.points}
                    min={0}
                    disabled={!isEditable}
                    onChange={(e) => patch(index, "points", Number(e.target.value) || 0)}
                    onBlur={() => commit(rows)}
                  />
                  <span className="a-muted text-[10px]">/</span>
                  <input
                    type="number"
                    className="a-input"
                    value={row.maxPoints}
                    min={0}
                    disabled={!isEditable}
                    onChange={(e) => patch(index, "maxPoints", Number(e.target.value) || 0)}
                    onBlur={() => commit(rows)}
                  />
                </div>
                <div className="px-1 py-1">
                  <input
                    type="number"
                    className="a-input"
                    value={row.damageBarrier}
                    min={0}
                    disabled={!isEditable}
                    onChange={(e) => patch(index, "damageBarrier", Number(e.target.value) || 0)}
                    onBlur={() => commit(rows)}
                  />
                </div>
                <div className="px-1 py-1">
                  <input
                    type="number"
                    className="a-input"
                    value={row.decayPerRound}
                    min={0}
                    disabled={!isEditable}
                    onChange={(e) => patch(index, "decayPerRound", Number(e.target.value) || 0)}
                    onBlur={() => commit(rows)}
                  />
                </div>
                <div className="px-1 py-1 text-center">
                  {isEditable && (
                    <button
                      type="button"
                      className="a-red text-[12px] cursor-pointer"
                      title="Quitar"
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
