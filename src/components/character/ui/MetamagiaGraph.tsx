import { useMemo } from "react";
import {
  METAMAGIA_GRAPH,
  META_LAYOUT,
  nodeX,
  nodeY,
  type MetaNode,
} from "../data/metamagiaGraph";
import { metamagiaDef } from "../../../domains/magic/metamagia";

interface MetamagiaGraphProps {
  /** Acquired node ids (system.magic.metamagias). */
  acquiredIds: string[];
  /** Max magic level available; nodes above it are locked. */
  magicLevelMax: number;
  isEditable: boolean;
  onToggle: (nextIds: string[]) => void;
}

const OWNED = "#2f9e44";
const { nodeW, nodeH } = META_LAYOUT;

/**
 * 2D skill graph of Habilidades Metamágicas. Nodes are positioned on a grid and
 * connected by prerequisite edges. A node unlocks when its prerequisite is
 * acquired and the required magic level is met; it can't be released while a
 * dependent node is still acquired.
 */
export function MetamagiaGraph({
  acquiredIds,
  magicLevelMax,
  isEditable,
  onToggle,
}: MetamagiaGraphProps) {
  const { nodes, edges } = METAMAGIA_GRAPH;
  const owned = useMemo(() => new Set(acquiredIds), [acquiredIds]);

  const { parentOf, childrenOf } = useMemo(() => {
    const parent = new Map<string, string>();
    const children = new Map<string, string[]>();
    for (const [from, to] of edges) {
      parent.set(to, from);
      const list = children.get(from) ?? [];
      list.push(to);
      children.set(from, list);
    }
    return { parentOf: parent, childrenOf: children };
  }, [edges]);

  const byId = useMemo(() => {
    const m = new Map<string, MetaNode>();
    for (const n of nodes) m.set(n.id, n);
    return m;
  }, [nodes]);

  const { width, height } = useMemo(() => {
    let w = 0;
    let h = 0;
    for (const n of nodes) {
      w = Math.max(w, nodeX(n.col) + nodeW);
      h = Math.max(h, nodeY(n.row) + nodeH);
    }
    return { width: w + META_LAYOUT.padX, height: h + META_LAYOUT.padY };
  }, [nodes]);

  const hasOwnedChild = (id: string): boolean =>
    (childrenOf.get(id) ?? []).some((c) => owned.has(c) || hasOwnedChild(c));

  const state = (n: MetaNode) => {
    const isOwned = owned.has(n.id);
    const parent = parentOf.get(n.id);
    const prereqMet = parent == null || owned.has(parent);
    const levelMet = n.requiredLevel <= magicLevelMax;
    return {
      isOwned,
      prereqMet,
      levelMet,
      available: !isOwned && prereqMet && levelMet,
      locked: !isOwned && (!prereqMet || !levelMet),
      blockedRelease: isOwned && hasOwnedChild(n.id),
    };
  };

  const toggle = (n: MetaNode) => {
    if (!isEditable) return;
    const s = state(n);
    if (s.isOwned) {
      if (s.blockedRelease) return;
      onToggle(acquiredIds.filter((id) => id !== n.id));
    } else if (s.available) {
      onToggle([...acquiredIds, n.id]);
    }
  };

  const center = (n: MetaNode) => ({ x: nodeX(n.col) + nodeW / 2, y: nodeY(n.row) + nodeH / 2 });

  return (
    <div className="scl overflow-auto" style={{ maxHeight: 520 }}>
      <div style={{ position: "relative", width, height }}>
        <svg
          width={width}
          height={height}
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        >
          {edges.map(([from, to], i) => {
            const a = byId.get(from);
            const b = byId.get(to);
            if (!a || !b) return null;
            const pa = center(a);
            const pb = center(b);
            const active = owned.has(from) && owned.has(to);
            return (
              <line
                key={i}
                x1={pa.x}
                y1={pa.y}
                x2={pb.x}
                y2={pb.y}
                stroke={active ? OWNED : "#c7ccd3"}
                strokeWidth={active ? 2 : 1.5}
              />
            );
          })}
        </svg>

        {nodes.map((n) => {
          const s = state(n);
          const status = s.locked
            ? !s.levelMet
              ? `Requiere Nivel de Magia ${n.requiredLevel}`
              : "Requiere el nodo anterior"
            : s.isOwned
              ? s.blockedRelease
                ? "No se puede soltar: tiene nodos dependientes"
                : "Adquirido — click para soltar"
              : "Disponible — click para adquirir";
          // Printed effect of the principle (Arcana Exxet cap. 3), plus what it
          // costs in magic level from this particular branch.
          const effect = metamagiaDef(n.label)?.effect;
          const title = [
            n.label,
            n.cost ? `Coste: ${n.cost} de Nivel de Magia` : "Esfera inicial (sin coste)",
            effect,
            status,
          ]
            .filter(Boolean)
            .join("\n\n");

          const clickable = isEditable && (s.available || (s.isOwned && !s.blockedRelease));

          return (
            <div
              key={n.id}
              title={title}
              onClick={() => toggle(n)}
              className="absolute flex flex-col items-center justify-center text-center select-none"
              style={{
                left: nodeX(n.col),
                top: nodeY(n.row),
                width: nodeW,
                height: nodeH,
                padding: "3px 5px",
                borderRadius: 6,
                border: `1.5px solid ${s.isOwned ? OWNED : s.locked ? "#d7dbe0" : "var(--bd)"}`,
                background: s.isOwned ? "#eaf7ee" : s.locked ? "#f1f3f5" : "#fff",
                color: s.locked ? "var(--mut)" : "#2b313a",
                opacity: s.locked ? 0.7 : 1,
                cursor: clickable ? "pointer" : "default",
                boxShadow: "0 1px 2px rgba(0,0,0,.06)",
              }}
            >
              <span
                className="leading-[1.1] font-medium"
                style={{
                  fontSize: 9.5,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {n.label}
              </span>
              {n.requiredLevel > 0 && (
                <span
                  className="font-bold"
                  style={{ fontSize: 9, color: s.isOwned ? OWNED : "var(--acc)", marginTop: 1 }}
                >
                  Nv {n.requiredLevel}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
