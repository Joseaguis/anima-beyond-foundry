/**
 * Layout constants for the Metamagia graph renderer.
 *
 * The dataset itself lives in `src/domains/magic/metamagia-graph.ts` — it is
 * game data consumed by the (Foundry-free) magic preparation, so it cannot sit
 * under `components/`. Re-exported here so the renderer keeps a single import.
 */
export {
  METAMAGIA_GRAPH,
  METAMAGIA_NODES,
  type MetaGraph,
  type MetaNode,
} from "../../../domains/magic/metamagia-graph";

export const META_LAYOUT = {
  colGap: 150,
  rowGap: 74,
  nodeW: 126,
  nodeH: 46,
  padX: 16,
  padY: 16,
};

export function nodeX(col: number): number {
  return META_LAYOUT.padX + col * META_LAYOUT.colGap;
}
export function nodeY(row: number): number {
  return META_LAYOUT.padY + row * META_LAYOUT.rowGap;
}
