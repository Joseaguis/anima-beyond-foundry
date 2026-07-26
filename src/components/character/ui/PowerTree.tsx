import { useMemo, type ReactNode } from "react";
import { SectionCard } from "./SectionCard";
import type { CompendiumEntry } from "../../../sheets/ReactSheet";

interface PowerTreeProps {
  title: ReactNode;
  dot?: "acc" | "blue" | "red";
  /** All tree nodes for this subtype (from the compendium). */
  nodes: CompendiumEntry[];
  /** Map of acquired node name -> embedded item id. */
  ownedIds: Record<string, string>;
  isEditable: boolean;
  loading?: boolean;
  onAcquire: (uuid: string) => void;
  onRelease: (id: string) => void;
  style?: React.CSSProperties;
}

const OWNED = "#2f9e44";

interface TreeRow {
  node: CompendiumEntry;
  depth: number;
  isLast: boolean;
  ancestorsLast: boolean[];
}

/**
 * Fixed hierarchical tree of Ki / Némesis powers. Nodes are acquired in order:
 * a node can only be acquired once its parent (prerequisite) is owned, and it
 * cannot be released while an acquired descendant depends on it.
 */
export function PowerTree({
  title,
  dot = "acc",
  nodes,
  ownedIds,
  isEditable,
  loading,
  onAcquire,
  onRelease,
  style,
}: PowerTreeProps) {
  const { rows, childrenByParent } = useMemo(() => {
    const byParent = new Map<string, CompendiumEntry[]>();
    for (const n of nodes) {
      const key = n.parent || "";
      const list = byParent.get(key) ?? [];
      list.push(n);
      byParent.set(key, list);
    }
    for (const list of byParent.values()) list.sort((a, b) => a.name.localeCompare(b.name));

    const flat: TreeRow[] = [];
    const walk = (parentName: string, depth: number, ancestorsLast: boolean[]) => {
      const list = byParent.get(parentName) ?? [];
      list.forEach((node, i) => {
        const isLast = i === list.length - 1;
        flat.push({ node, depth, isLast, ancestorsLast });
        walk(node.name, depth + 1, [...ancestorsLast, isLast]);
      });
    };
    walk("", 0, []);
    return { rows: flat, childrenByParent: byParent };
  }, [nodes]);

  const hasOwnedDescendant = (name: string): boolean => {
    const children = childrenByParent.get(name) ?? [];
    return children.some((c) => ownedIds[c.name] != null || hasOwnedDescendant(c.name));
  };

  const handleClick = (node: CompendiumEntry) => {
    if (!isEditable) return;
    const owned = ownedIds[node.name];
    const parentOwned = !node.parent || ownedIds[node.parent] != null;
    if (owned != null) {
      if (hasOwnedDescendant(node.name)) return; // blocked: dependents acquired
      onRelease(owned);
    } else if (parentOwned) {
      onAcquire(node.uuid);
    }
  };

  return (
    <SectionCard title={title} dot={dot} padded={false} style={style}>
      <div className="scl overflow-x-auto">
        <div style={{ minWidth: 320 }}>
          {loading ? (
            <div className="px-3 py-2 text-[11.5px] a-muted">Cargando árbol…</div>
          ) : rows.length === 0 ? (
            <div className="px-3 py-2 text-[11.5px] a-muted">Sin poderes en el compendio.</div>
          ) : (
            rows.map(({ node, depth, isLast, ancestorsLast }) => {
              const owned = ownedIds[node.name] != null;
              const parentOwned = !node.parent || ownedIds[node.parent] != null;
              const locked = !owned && !parentOwned;
              const blockedRelease = owned && hasOwnedDescendant(node.name);
              const clickable = isEditable && !locked && !blockedRelease;

              const title = locked
                ? `Requiere: ${node.parent}`
                : owned
                  ? blockedRelease
                    ? "No se puede soltar: tiene poderes dependientes adquiridos"
                    : "Adquirido — click para soltar"
                  : "Disponible — click para adquirir";

              return (
                <div
                  key={node.uuid}
                  className="a-trow"
                  style={{ gridTemplateColumns: "1fr 48px", cursor: clickable ? "pointer" : "default" }}
                  title={title}
                  onClick={() => handleClick(node)}
                >
                  <div className="flex items-center px-2 py-1 min-w-0">
                    <Guides depth={depth} isLast={isLast} ancestorsLast={ancestorsLast} />
                    <span
                      className="inline-flex items-center justify-center shrink-0"
                      style={{
                        width: 16,
                        height: 16,
                        marginRight: 6,
                        fontSize: 11,
                        borderRadius: 4,
                        border: `1px solid ${owned ? OWNED : "var(--bd)"}`,
                        background: owned ? OWNED : locked ? "transparent" : "var(--fld)",
                        color: owned ? "#fff" : "var(--mut)",
                      }}
                    >
                      {owned ? "✓" : locked ? "" : "+"}
                    </span>
                    <span
                      className="truncate text-[12px]"
                      style={{
                        color: owned ? "var(--ink)" : locked ? "var(--mut)" : "#454c56",
                        fontWeight: owned ? 600 : 400,
                      }}
                    >
                      {node.name}
                    </span>
                  </div>
                  <div
                    className="self-center text-center text-[11.5px]"
                    style={{ color: owned ? OWNED : "var(--mut)", fontWeight: owned ? 600 : 400 }}
                  >
                    {node.mkCost ?? 0}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </SectionCard>
  );
}

/** Renders the ├ / └ / │ connector guides for a tree row. */
function Guides({
  depth,
  isLast,
  ancestorsLast,
}: {
  depth: number;
  isLast: boolean;
  ancestorsLast: boolean[];
}) {
  if (depth === 0) return null;
  const cells: ReactNode[] = [];
  for (let i = 1; i < depth; i++) {
    // A vertical line unless the ancestor at this level was the last child.
    cells.push(
      <span key={i} className="a-muted" style={{ width: 14, textAlign: "center", flexShrink: 0 }}>
        {ancestorsLast[i] ? "" : "│"}
      </span>,
    );
  }
  cells.push(
    <span key="branch" className="a-muted" style={{ width: 14, textAlign: "center", flexShrink: 0 }}>
      {isLast ? "└" : "├"}
    </span>,
  );
  return <span className="flex items-center text-[11px] leading-none">{cells}</span>;
}
