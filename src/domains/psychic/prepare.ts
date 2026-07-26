import { baseFromDp, type PrepContext } from "../../actors/creature/prep/types";
import type { PsychicSystemSlice } from "./data";
import { getPotentialIncrementBonus, getPsychicPotentialByVol } from "./tables";

/**
 * Innate CVs from the progression: the first category with levels grants 1 CV
 * plus 1 per levelsPerCv extra levels; later categories grant levels/levelsPerCv.
 * Fractions accumulate across stages and truncate at the end.
 */
function innateCv(ctx: PrepContext): number {
  if (ctx.mode !== "dp" || ctx.level === 0) return 0;
  let cv = 0;
  let first = true;
  for (const c of ctx.categories) {
    if (c.levels <= 0) continue;
    const perCv = c.data.supernatural.levelsPerCv ?? 3;
    cv += first ? 1 + (c.levels - 1) / perCv : c.levels / perCv;
    first = false;
  }
  return Math.trunc(cv);
}

/** Psychic (CVs, potential, projection) derived values. */
export function preparePsychic(system: PsychicSystemSlice, ctx: PrepContext): void {
  const { categories, mod, charFinals, charMods } = ctx;

  const psy = system.psychic;
  if (!psy) return;

  // Projections are actions (psychic attacks and defenses), so the aggregated
  // "all actions" modifiers and the fatigue penalty apply to them — but not
  // the physical-action ones.
  const allActions = mod("allActions") + (system.state?.fatiguePenalty ?? 0);

  psy.cvMax =
    innateCv(ctx) + baseFromDp(categories, psy.cvDp, (d) => d.supernatural.cv) + mod("psychicCv");
  psy.projectionBase = baseFromDp(categories, psy.projectionDp, (d) => d.supernatural.psychicProjection);
  psy.projectionFinal =
    psy.projectionBase + charMods.dex + (psy.projectionSpecial ?? 0) + mod("psychicProjection") + allActions;

  // Potencial Psíquico = base por Voluntad (Tabla 68) + Incrementar Potencial
  // permanente (Tabla 70) + especial + modificadores.
  const potentialCv = psy.potentialIncrementCvs ?? 0;
  psy.potentialBase = getPsychicPotentialByVol(charFinals.wp);
  psy.potentialIncrement = getPotentialIncrementBonus(potentialCv);
  psy.potentialFinal =
    psy.potentialBase + psy.potentialIncrement + (psy.potentialSpecial ?? 0) + mod("psychicPotential");

  // Cristal psíquico (Core p. 229): +5..+30 al potencial mientras se esté en
  // contacto con él. Un cristal atado a una disciplina sólo bonifica los poderes
  // de esa disciplina, así que no puede entrar en el potencial global: se deja
  // expuesto aparte para que la ficha lo muestre como condicional. Su contrapeso
  // sí es incondicional: cada +5 sube en 1 el nivel de la fatiga al fracasar.
  const crystalBonus = psy.crystalBonus ?? 0;
  if (crystalBonus > 0 && !psy.crystalDiscipline) psy.potentialFinal += crystalBonus;
  psy.crystalFatiguePenalty = Math.floor(crystalBonus / 5);

  // Economía de CVs (Recuadro XII, Core p. 212): cada afinidad y cada poder
  // dominado gastan 1 CV, cada innato 2 CV, más los CV de Fortalecer e
  // Incrementar Potencial. CVs libres = totales − usados.
  const disciplines = system.psychicDisciplines ?? [];
  const powers = system.psychicPowers ?? [];
  const innatos = psy.innatos ?? [];
  const affinityCv = disciplines.reduce((sum, d) => sum + (d.affinityCost ?? 1), 0);
  const masteryCv = powers.reduce((sum, p) => sum + (p.masteryCost ?? 1), 0);
  const fortifyCv = powers.reduce((sum, p) => sum + (p.fortifyCvs ?? 0), 0);
  const innatoCv = innatos.length * 2;
  psy.innatosCount = innatos.length;
  psy.cvUsed = affinityCv + masteryCv + fortifyCv + innatoCv + potentialCv;
  psy.cvFree = psy.cvMax - psy.cvUsed;
  // Overspend is flagged, never clamped — same contract as Ki's `cmOver` and
  // magic's `magicLevelOver`.
  psy.cvOver = Math.max(0, -psy.cvFree);
}
