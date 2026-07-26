import { useEffect, useState } from "react";
import { SectionCard } from "./SectionCard";
import type { OnUpdate } from "./fields";

export interface Summon {
  name: string;
  difficulty: number;
  zeonUpkeep: number;
}

interface SummonsListProps {
  summons: Summon[];
  isEditable: boolean;
  onUpdate: OnUpdate;
  style?: React.CSSProperties;
}

const GRID = "1.6fr 96px 96px 58px";

const emptyRow = (): Summon => ({ name: "", difficulty: 0, zeonUpkeep: 0 });

/**
 * Editable list of Invocaciones y Encarnaciones (system.magic.summons).
 * Keeps a local copy synced from props and commits the whole array on blur,
 * matching the field commit pattern used across the sheet.
 */
export function SummonsList({ summons, isEditable, onUpdate, style }: SummonsListProps) {
  const [rows, setRows] = useState<Summon[]>(summons);

  useEffect(() => {
    setRows(summons);
  }, [summons]);

  const commit = (next: Summon[]) => {
    setRows(next);
    onUpdate("system.magic.summons", next);
  };

  const patch = (index: number, field: keyof Summon, value: string | number) => {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)),
    );
  };

  const addBtn = isEditable ? (
    <button
      type="button"
      className="text-[11px] font-semibold px-2 py-0.5 rounded-[5px] cursor-pointer"
      style={{ background: "var(--acc)", color: "#fff" }}
      onClick={() => commit([...rows, emptyRow()])}
    >
      + Invocación
    </button>
  ) : undefined;

  return (
    <SectionCard
      title="Invocaciones y Encarnaciones"
      dot="blue"
      padded={false}
      right={addBtn}
      style={style}
    >
      <div className="scl overflow-x-auto">
        <div style={{ minWidth: 360 }}>
          <div className="a-thead" style={{ gridTemplateColumns: GRID }}>
            <div>Nombre</div>
            <div className="text-center">Dificultad</div>
            <div className="text-center">Zeón/día</div>
            <div className="text-center" />
          </div>

          {rows.length === 0 ? (
            <div className="px-3 py-2 text-[11.5px] a-muted">
              Sin invocaciones ni encarnaciones activas.
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
                    onKeyDown={(e) =>
                      e.key === "Enter" && (e.target as HTMLInputElement).blur()
                    }
                  />
                </div>
                <div className="px-1.5 py-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    className="a-input"
                    value={String(row.difficulty)}
                    disabled={!isEditable}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) =>
                      patch(index, "difficulty", parseInt(e.target.value, 10) || 0)
                    }
                    onBlur={() => commit(rows)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && (e.target as HTMLInputElement).blur()
                    }
                  />
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
                    onKeyDown={(e) =>
                      e.key === "Enter" && (e.target as HTMLInputElement).blur()
                    }
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
