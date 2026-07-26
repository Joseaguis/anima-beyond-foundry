/**
 * Static dataset for the Metamagia skill graph (Habilidades metamágicas).
 * Transcribed from the "Metamagia" sheet of the Ficha Anima Excel (v8.7.0),
 * which is also the source for the in-game screenshot layout.
 *
 * The tree is organised as vertical branches (columns). Each column is a chain
 * where a node's prerequisite is the node directly above it; the first node of
 * a column (requiredLevel 0) is a root. Labels repeat across branches (you can
 * take the same metamagia in different chains), so node ids are positional and
 * unique, independent of the label — and the *same* label can cost a different
 * amount of magic level depending on the branch it is taken from. That is why
 * the cost is read from the node and the effect from the label catalog
 * (see `metamagia.ts`).
 *
 * This is game data, not presentation: it lives in the domain so the (pure,
 * Foundry-free) magic preparation can consume it. The renderer's layout
 * constants stay in `src/components/character/data/metamagiaGraph.ts`.
 */

export interface MetaNode {
  id: string;
  label: string;
  /** Magic level required to unlock (0 = root, always available). */
  requiredLevel: number;
  /** Magic level this node spends when acquired (roots are free). */
  cost?: number;
  col: number;
  row: number;
}

export interface MetaGraph {
  nodes: MetaNode[];
  edges: [string, string][];
}

interface Cell {
  label: string;
  nv: number; // 0 => root
  cost?: number;
}

// Each inner array is a top-to-bottom branch (column) from the screenshot.
const COLUMNS: Cell[][] = [
  // Col 0
  [
    { label: "Eliminar protección", nv: 0 },
    { label: "Escudos potenciados", nv: 4, cost: 5 },
    { label: "Erudición defensiva", nv: 5, cost: 10 },
    { label: "Forzar velocidad", nv: 2, cost: 5 },
    { label: "Sentir la magia", nv: 0 },
  ],
  // Col 1
  [
    { label: "Escudos potenciados", nv: 0 },
    { label: "Área potenciada", nv: 3, cost: 10 },
    { label: "Erudición defensiva", nv: 6, cost: 10 },
    { label: "Doble daño", nv: 10, cost: 5 },
    { label: "Erudición defensiva", nv: 5, cost: 10 },
    { label: "Control del espacio", nv: 6, cost: 10 },
    { label: "Transmisión de magia", nv: 3, cost: 10 },
    { label: "Seguridad defensiva", nv: 0 },
  ],
  // Col 2
  [
    { label: "Incremento destructivo", nv: 0 },
    { label: "Erudición ofensiva", nv: 4, cost: 10 },
    { label: "Precisión mística", nv: 6, cost: 10 },
    { label: "Erudición ofensiva", nv: 7, cost: 10 },
    { label: "Doble conjuro innato", nv: 7, cost: 20 },
    { label: "Bucle existencial", nv: 6, cost: 15 },
    { label: "Magia vital", nv: 3, cost: 5 },
    { label: "Control de la energía", nv: 0 },
    { label: "Magia vital", nv: 0 },
  ],
  // Col 3
  [
    { label: "Eliminar protección", nv: 0 },
    { label: "Precisión mística", nv: 2, cost: 5 },
    { label: "Área potenciada", nv: 6, cost: 10 },
    { label: "Mantenimiento añadido", nv: 10, cost: 20 },
    { label: "Bucle existencial", nv: 9, cost: 25 },
    { label: "Forzar velocidad", nv: 2, cost: 5 },
    { label: "Aguante al daño sobrenatural", nv: 3, cost: 10 },
    { label: "Forzar velocidad", nv: 0 },
  ],
  // Col 4
  [
    { label: "Incremento destructivo", nv: 4, cost: 5 },
    { label: "Magia oculta", nv: 0 },
  ],
  // Col 5
  [
    { label: "Erudición ofensiva", nv: 5, cost: 10 },
    { label: "Proyección mágica determinada", nv: 5, cost: 5 },
    { label: "Regeneración zeónica avanzada", nv: 5, cost: 5 },
    { label: "Proyección mágica determinada", nv: 0 },
  ],
  // Col 6
  [
    { label: "Distancia incrementada", nv: 0 },
    { label: "Proyección mágica determinada", nv: 4, cost: 5 },
    { label: "Regeneración zeónica avanzada", nv: 0 },
  ],
  // Col 7
  [
    { label: "Concentración mística", nv: 0 },
    { label: "Conjuro especializado Nv 60", nv: 3, cost: 5 },
    { label: "Doble conjuro", nv: 7, cost: 20 },
    { label: "Alta Magia", nv: 10, cost: 20 },
    { label: "Regeneración zeónica avanzada", nv: 8, cost: 5 },
    { label: "Magia combinada", nv: 3, cost: 5 },
    { label: "Proyección mágica determinada", nv: 0 },
  ],
  // Col 8
  [
    { label: "Conjuro especializado Nv 30", nv: 0 },
    { label: "Maximización de conjuros", nv: 5, cost: 10 },
    { label: "Conjuro especializado Nv 80", nv: 8, cost: 5 },
    { label: "Conjuro innato superior", nv: 9, cost: 20 },
    { label: "Avatar", nv: 9, cost: 20 },
    { label: "Elevación", nv: 6, cost: 5 },
    { label: "Proyección mágica determinada", nv: 6, cost: 5 },
  ],
  // Col 9
  [
    { label: "Distancia incrementada", nv: 0 },
    { label: "Romper resistencias", nv: 2, cost: 5 },
    { label: "Enlazar conjuros", nv: 8, cost: 25 },
    { label: "Proyección mágica determinada", nv: 10, cost: 5 },
    { label: "Efectos persistentes", nv: 3, cost: 5 },
  ],
  // Col 10
  [
    { label: "Conjuro especializado Nv 30", nv: 0 },
    { label: "Conjuro especializado Nv 60", nv: 3, cost: 5 },
    { label: "Romper resistencias", nv: 4, cost: 5 },
    { label: "Conjuro especializado Nv 70", nv: 5, cost: 5 },
    { label: "Zeón ilimitado", nv: 10, cost: 5 },
    { label: "Proyección mágica determinada", nv: 3, cost: 5 },
    { label: "Explotación de la energía física", nv: 3, cost: 5 },
  ],
];

function build(): MetaGraph {
  const nodes: MetaNode[] = [];
  const edges: [string, string][] = [];
  COLUMNS.forEach((column, col) => {
    column.forEach((cell, row) => {
      const id = `c${col}n${row}`;
      nodes.push({ id, label: cell.label, requiredLevel: cell.nv, cost: cell.cost, col, row });
      if (row > 0) edges.push([`c${col}n${row - 1}`, id]);
    });
  });
  return { nodes, edges };
}

export const METAMAGIA_GRAPH: MetaGraph = build();

/** Node lookup by positional id, for resolving an actor's acquired list. */
export const METAMAGIA_NODES: ReadonlyMap<string, MetaNode> = new Map(
  METAMAGIA_GRAPH.nodes.map((n) => [n.id, n]),
);
