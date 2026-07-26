import type { PrepContext } from "./types";
import { prepareMagic } from "../../../domains/magic/prepare";
import type { MagicSystemSlice } from "../../../domains/magic/data";
import { prepareKi } from "../../../domains/ki/prepare";
import type { KiSystemSlice } from "../../../domains/ki/data";
import { preparePsychic } from "../../../domains/psychic/prepare";
import type { PsychicSystemSlice } from "../../../domains/psychic/data";

/**
 * The supernatural block of the actor system: the union of the three domain
 * slices. Each domain (src/domains/magic|ki|psychic) owns its data shapes,
 * tables and preparation; this module only orchestrates them so the pipeline
 * (character/model.ts) keeps a single supernatural step and its ordering
 * contract (runs after prepareState and prepareVitals).
 */
export interface SupernaturalSystemSlice extends MagicSystemSlice, KiSystemSlice, PsychicSystemSlice {}

/** Magic (zeon, ACT, projection), Ki and Psychic derived values. */
export function prepareSupernatural(system: SupernaturalSystemSlice, ctx: PrepContext): void {
  prepareMagic(system, ctx);
  prepareKi(system, ctx);
  preparePsychic(system, ctx);
}
