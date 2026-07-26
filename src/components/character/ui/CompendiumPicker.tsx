import { useEffect, useMemo, useState } from "react";
import type { CompendiumEntry, ItemOps } from "../../../sheets/ReactSheet";

interface CompendiumPickerProps {
  title: string;
  type: string;
  subtype?: string;
  itemOps: ItemOps;
  onClose: () => void;
}

/**
 * Modal that lists matching compendium entries for the given item type/subtype.
 * Picking an entry copies it onto the actor; "Crear en blanco" makes a new
 * empty item of the type. Mirrors the D&D5e / Pathfinder "add from compendium"
 * flow.
 */
export function CompendiumPicker({ title, type, subtype, itemOps, onClose }: CompendiumPickerProps) {
  const [entries, setEntries] = useState<CompendiumEntry[] | null>(null);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    itemOps.getCompendiumItems(type, subtype).then((list) => {
      if (alive) setEntries(list);
    });
    return () => {
      alive = false;
    };
  }, [type, subtype, itemOps]);

  const filtered = useMemo(() => {
    if (!entries) return [];
    const q = query.trim().toLowerCase();
    return q ? entries.filter((e) => e.name.toLowerCase().includes(q)) : entries;
  }, [entries, query]);

  const pick = async (uuid: string) => {
    setBusy(true);
    await itemOps.onItemAddFromCompendium(uuid);
    onClose();
  };

  const createBlank = async () => {
    setBusy(true);
    await itemOps.onItemCreate(type, subtype);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(20,22,28,.45)" }}
      onClick={onClose}
    >
      <div
        className="a-card flex flex-col"
        style={{ width: 420, maxHeight: "82%", boxShadow: "0 12px 40px rgba(0,0,0,.35)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="a-card-head flex items-center justify-between">
          <span className="a-card-head-title">
            <span className="a-dot a-dot--acc" />
            {title}
          </span>
          <button
            type="button"
            className="cursor-pointer a-muted px-1"
            title="Cerrar"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="px-3 pt-2.5">
          <input
            type="text"
            autoFocus
            className="a-input a-input--left w-full"
            placeholder="Buscar en compendios…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="scl overflow-y-auto px-2 py-2 flex-1" style={{ minHeight: 120 }}>
          {entries === null ? (
            <div className="px-2 py-3 text-[11.5px] a-muted">Cargando compendios…</div>
          ) : filtered.length === 0 ? (
            <div className="px-2 py-3 text-[11.5px] a-muted">
              {entries.length === 0
                ? "No hay entradas en los compendios para este tipo."
                : "Sin resultados para la búsqueda."}
            </div>
          ) : (
            filtered.map((e) => (
              <button
                key={e.uuid}
                type="button"
                disabled={busy}
                onClick={() => pick(e.uuid)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-[6px] text-left cursor-pointer hover:bg-[var(--fld)]"
              >
                <img src={e.img} alt="" width={22} height={22} className="rounded-[3px] shrink-0" />
                <span className="flex-1 min-w-0">
                  <span className="block truncate text-[12.5px]" style={{ color: "#2b313a" }}>
                    {e.name}
                  </span>
                  <span className="block truncate text-[10px] a-muted">{e.pack}</span>
                </span>
              </button>
            ))
          )}
        </div>

        <div className="px-3 py-2.5 border-t border-[var(--bd)] flex items-center justify-between">
          <span className="text-[10.5px] a-muted">
            {entries ? `${filtered.length} resultado(s)` : ""}
          </span>
          <button
            type="button"
            disabled={busy}
            onClick={createBlank}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-[5px] cursor-pointer"
            style={{ background: "var(--fld)", color: "#454c56" }}
          >
            + Crear en blanco
          </button>
        </div>
      </div>
    </div>
  );
}
