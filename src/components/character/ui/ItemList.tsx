import { useState, type ReactNode } from "react";
import { SectionCard } from "./SectionCard";
import { CompendiumPicker } from "./CompendiumPicker";
import type { AnimaItem, ItemOps } from "../../../sheets/ReactSheet";

export interface ItemColumn {
  label: ReactNode;
  /** Grid track width, e.g. "1fr" or "64px". Defaults to "1fr". */
  width?: string;
  render: (item: AnimaItem) => ReactNode;
}

interface ItemListProps {
  title: ReactNode;
  dot?: "acc" | "blue" | "red";
  items: AnimaItem[];
  /** Item type to filter by, e.g. "weapon". */
  type: string;
  /** Optional subtype to filter by, e.g. "kiPower". */
  subtype?: string;
  isEditable: boolean;
  /** Grouped create/edit/delete/compendium operations. */
  itemOps: ItemOps;
  /** Columns shown after the name column. The name column is always first. */
  columns?: ItemColumn[];
  emptyLabel?: string;
  addLabel?: string;
  style?: React.CSSProperties;
  /** Optional footer row (e.g. cost totals), rendered after the rows. */
  footer?: ReactNode;
}

/**
 * Generic table of embedded items of a given type/subtype with
 * add / edit / delete controls. Reused across every character tab.
 */
export function ItemList({
  title,
  dot = "acc",
  items,
  type,
  subtype,
  isEditable,
  itemOps,
  columns = [],
  emptyLabel = "Sin elementos.",
  addLabel = "+ Añadir",
  style,
  footer,
}: ItemListProps) {
  const [picking, setPicking] = useState(false);
  const { onItemEdit, onItemDelete } = itemOps;

  const filtered = items.filter(
    (i) => i.type === type && (!subtype || i.system?.subtype === subtype),
  );

  const nameCol: ItemColumn = {
    label: "Nombre",
    width: "1.6fr",
    render: (i) => i.name,
  };
  const cols = [nameCol, ...columns];
  const gridCols = [...cols.map((c) => c.width ?? "1fr"), "58px"].join(" ");

  const addBtn = isEditable ? (
    <button
      type="button"
      className="text-[11px] font-semibold px-2 py-0.5 rounded-[5px] cursor-pointer"
      style={{ background: "var(--acc)", color: "#fff" }}
      onClick={() => setPicking(true)}
    >
      {addLabel}
    </button>
  ) : undefined;

  const pickerTitle = typeof title === "string" ? `Añadir · ${title}` : "Añadir desde compendio";

  return (
    <SectionCard title={title} dot={dot} padded={false} right={addBtn} style={style}>
      {picking && (
        <CompendiumPicker
          title={pickerTitle}
          type={type}
          subtype={subtype}
          itemOps={itemOps}
          onClose={() => setPicking(false)}
        />
      )}
      <div className="scl overflow-x-auto">
        <div style={{ minWidth: 360 }}>
          <div className="a-thead" style={{ gridTemplateColumns: gridCols }}>
            {cols.map((c, i) => (
              <div key={i} className={i === 0 ? "" : "text-center"}>
                {c.label}
              </div>
            ))}
            <div className="text-center" />
          </div>

          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-[11.5px] a-muted">{emptyLabel}</div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="a-trow"
                style={{ gridTemplateColumns: gridCols }}
              >
                {cols.map((c, i) => (
                  <div
                    key={i}
                    className={
                      i === 0
                        ? "px-2 py-1 flex items-center gap-1.5 min-w-0"
                        : "text-center self-center text-[11.5px]"
                    }
                  >
                    {i === 0 && (
                      <img
                        src={item.img}
                        alt=""
                        width={18}
                        height={18}
                        className="rounded-[3px] shrink-0"
                      />
                    )}
                    <span className={i === 0 ? "truncate" : undefined}>
                      {c.render(item)}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-center gap-1">
                  <button
                    type="button"
                    title="Editar"
                    className="w-[22px] h-[22px] rounded-[4px] cursor-pointer a-muted hover:a-acc"
                    style={{ background: "var(--fld)" }}
                    onClick={() => onItemEdit(item.id)}
                  >
                    ✎
                  </button>
                  {isEditable && (
                    <button
                      type="button"
                      title="Borrar"
                      className="w-[22px] h-[22px] rounded-[4px] cursor-pointer a-red"
                      style={{ background: "var(--fld)" }}
                      onClick={() => onItemDelete(item.id)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
          {footer}
        </div>
      </div>
    </SectionCard>
  );
}
