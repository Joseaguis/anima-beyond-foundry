import { baseFromDp, sumPerLevel, type PrepContext } from "../../actors/creature/prep/types";
import type { DpSkill, MagicPathData, MagicSystemSlice, SpellData } from "./data";
import { FREE_ACCESS_LABEL, FREE_ACCESS_LEVELS, SUB_PATH_LEVELS } from "./free-access.generated";
import {
  getFreeSpellCost,
  getInnateAct,
  getInnateZeon,
  getMagicLevelByInt,
  parseOpposedPaths,
} from "./tables";
import { resolveMetamagias } from "./metamagia";

/** Magic (zeon, ACT, projection, magic level, Convocatoria) derived values. */
export function prepareMagic(system: MagicSystemSlice, ctx: PrepContext): void {
  const { categories, mod, charFinals, charMods } = ctx;

  const mg = system.magic;
  if (!mg) return;

  // Projections are actions (magic attacks and defenses), so the aggregated
  // "all actions" modifiers and the fatigue penalty apply to them — but not
  // the physical-action ones.
  const allActions = mod("allActions") + (system.state?.fatiguePenalty ?? 0);

  // Innate zeon and ACT come from the Power table; magic level from INT.
  const innateZeon = getInnateZeon(charFinals.pow);
  const innateAct = getInnateAct(charFinals.pow);

  // Metamagia spheres are the source for both metamagia outputs below; the
  // cost comes from the graph node and the effect from the label catalog.
  const metamagia = resolveMetamagias(mg.metamagias ?? []);
  mg.metamagiaRegen = metamagia.regenSteps;
  mg.metamagiaMagicLevel = metamagia.magicLevelSpent;

  // Zeón = innate(POD) + 5 per bought multiple + zeonPerLevel·level + special.
  mg.zeonMax =
    innateZeon +
    baseFromDp(categories, mg.zeonDp, (d) => d.supernatural.zeon) * 5 +
    sumPerLevel(categories, (d) => d.supernatural.zeonPerLevel ?? 0) +
    (mg.zeonSpecial ?? 0) +
    mod("zeonMax");

  // ACT = innate(POD) × (1 + bought multiples). Each CosteACT (70/60/50) DP
  // buys one more multiple of the innate value (Excel PDs!AA94).
  const actMultiples = baseFromDp(categories, mg.actDp, (d) => d.supernatural.actMultiple);
  mg.act = innateAct * (1 + actMultiples) + (mg.actSpecial ?? 0) + mod("act");

  // Múltiplo de regeneración = ACT total + 10·metamagia + bought multiples of
  // the innate ACT (regen costs half of ACT: CosteACT/2). Excel PDs!AA95.
  const regenMultiples = baseFromDp(
    categories,
    mg.regenDp,
    (d) => Math.max(1, Math.floor(d.supernatural.actMultiple / 2)),
  );
  mg.zeonRegen =
    mg.act +
    10 * (mg.metamagiaRegen ?? 0) +
    regenMultiples * innateAct +
    (mg.regenSpecial ?? 0) +
    mod("zeonRegen");

  // Proyección Mágica = bought base + DES bonus + special + all-action mods.
  mg.magicProjectionBase = baseFromDp(categories, mg.magicProjectionDp, (d) => d.supernatural.magicProjection);
  mg.magicProjectionFinal =
    mg.magicProjectionBase + charMods.dex + (mg.magicProjectionSpecial ?? 0) + mod("magicProjection") + allActions;
  // Desequilibrio ofensivo shifts the projection to attack (+) or defense (−),
  // clamped to ±30 (Core p. 117).
  const imbalance = Math.max(-30, Math.min(30, mg.offensiveImbalance ?? 0));
  mg.magicProjectionAttack = mg.magicProjectionFinal + imbalance;
  mg.magicProjectionDefense = mg.magicProjectionFinal - imbalance;

  // Nivel de Magia = innate(INT) + 5 per bought unit (fixed cost 5). Metamagia
  // is *spent* magic level (Excel box "Nivel Máximo | Nivel Usado | Metamagia"),
  // so it belongs on the used side — which also keeps the max independent of
  // the metamagia tree that it gates.
  mg.magicLevelMax =
    getMagicLevelByInt(charFinals.int) +
    baseFromDp(categories, mg.magicLevelDp, () => 5) * 5 +
    (mg.magicLevelSpecial ?? 0) +
    mod("magicLevel");

  const owned = system.magicPaths ?? [];
  const paths = owned.filter((p) => p.subtype === "path");
  const subPaths = owned.filter((p) => p.subtype === "subPath");
  // Sub-paths are excluded: they occupy free-access slots of a path they are
  // linked to, and cost no magic level of their own (Arcana Exxet cap. 4).
  mg.magicLevelPaths = paths.reduce(
    (sum, p) => sum + (p.level ?? 0) * (isOpposedToOwned(p, paths) ? 2 : 1),
    0,
  );

  const access = resolveFreeAccess(paths, subPaths, system.spells ?? []);
  mg.freeAccessSlots = access.slots;
  mg.freeAccessUsed = access.used;
  mg.freeAccessFree = access.slots - access.used;
  mg.warnings = access.warnings;

  mg.magicLevelSpells = access.looseCost;
  mg.magicLevelUsed = mg.magicLevelPaths + mg.magicLevelSpells + mg.metamagiaMagicLevel;
  mg.magicLevelAvailable = mg.magicLevelMax - mg.magicLevelUsed;
  // Like the Ki CM budget, an overspend is flagged rather than clamped.
  mg.magicLevelOver = mg.magicLevelAvailable < 0;

  // Maintenance totals (Core p. 120). There is no runtime spending these yet:
  // they exist so the sheet shows the per-round and per-day commitment.
  const active = mg.activeSpells ?? [];
  const upkeep = (mode: string) =>
    active
      .filter((s) => (s.upkeepMode ?? "round") === mode)
      .reduce((sum, s) => sum + (s.zeonUpkeep ?? 0), 0);
  mg.upkeepRound = upkeep("round");
  mg.upkeepDaily = upkeep("daily");

  // Convocatoria: base bought at CosteConvocar + characteristic bonus (Convocar/
  // Atadura/Desconvocar → POD; Dominación/Controlar → VOL). Excel PDs!98-101.
  const sm = mg.summoning;
  if (sm) {
    const summonCost = (d: (typeof categories)[number]["data"]) => d.supernatural.summoning ?? 3;
    const skill = (s: DpSkill | undefined, charBonus: number, key: string) =>
      baseFromDp(categories, s?.dp, summonCost) + charBonus + (s?.special ?? 0) + mod(key);
    mg.summon = skill(sm.summon, charMods.pow, "summon");
    mg.control = skill(sm.control, charMods.wp, "control");
    mg.bind = skill(sm.bind, charMods.pow, "bind");
    mg.banish = skill(sm.banish, charMods.pow, "banish");
  }
}

/** Match a path by its own name or by the element it represents. */
function isPath(path: MagicPathData, name: string): boolean {
  const wanted = name.trim().toLowerCase();
  return path.name.trim().toLowerCase() === wanted || (path.element ?? "").trim().toLowerCase() === wanted;
}

/**
 * Developing a path antagonistic to one already mastered costs double magic
 * level (Core p. 118). The full opposition map lives on each path item
 * (Excel Tabla_VíasOpuestas); Nigromancia opposes the other ten.
 */
function isOpposedToOwned(path: MagicPathData, owned: readonly MagicPathData[]): boolean {
  return parseOpposedPaths(path.opposedPath).some((opposed) =>
    owned.some((other) => other !== path && isPath(other, opposed)),
  );
}

interface FreeAccessResult {
  /** Slots the owned paths grant, up to each path's level. */
  slots: number;
  /** Slots taken by linked sub-paths plus assigned free-access spells. */
  used: number;
  /** Tabla 60 cost of every spell not covered by a path or a slot. */
  looseCost: number;
  warnings: string[];
}

/**
 * Fill each path's free-access slots (Core p. 118, Arcana Exxet cap. 4).
 *
 * A path's slots are the levels its printed list leaves empty: one per decade
 * in major paths, two in minor ones. Linking a sub-path fills the first slot of
 * each decade, so it consumes all ten slots of a major path but only half of a
 * minor one, which keeps its second slot per decade open for Libre Acceso.
 *
 * Anything that does not fit is charged by Tabla 60 and reported — like the Ki
 * CM budget, an overspend is flagged, never clamped.
 */
function resolveFreeAccess(
  paths: readonly MagicPathData[],
  subPaths: readonly MagicPathData[],
  spells: readonly SpellData[],
): FreeAccessResult {
  const warnings: string[] = [];
  let slots = 0;
  let used = 0;
  let looseCost = 0;

  const subByParent = new Map<string, MagicPathData>();
  for (const sub of subPaths) {
    if (!sub.parentPathId) {
      warnings.push(`Sub-vía "${sub.name}": sin vía asignada.`);
      continue;
    }
    const parent = paths.find((p) => p.id === sub.parentPathId);
    if (!parent) {
      warnings.push(`Sub-vía "${sub.name}": la vía asignada ya no existe.`);
      continue;
    }
    const taken = subByParent.get(parent.id ?? "");
    if (taken) {
      warnings.push(`Vía "${parent.name}": tiene dos sub-vías ("${taken.name}" y "${sub.name}").`);
      continue;
    }
    subByParent.set(parent.id ?? "", sub);
  }

  const freeAccessSpells = spells.filter((s) => s.magicPath === FREE_ACCESS_LABEL);
  const assigned = new Set<SpellData>();

  for (const path of paths) {
    const level = path.level ?? 0;
    const all = (FREE_ACCESS_LEVELS[path.name] ?? FREE_ACCESS_LEVELS[path.element ?? ""] ?? [])
      .filter((l) => l <= level);
    slots += all.length;

    // The linked sub-path takes the slot at each of its own spell levels.
    const sub = subByParent.get(path.id ?? "");
    const subLevels = sub ? new Set(SUB_PATH_LEVELS.filter((l) => l <= level)) : new Set<number>();
    const takenBySub = all.filter((l) => subLevels.has(l));
    used += takenBySub.length;

    // Remaining slots, smallest first, so greedy matching never wastes a big
    // slot on a low-level spell.
    const open = all.filter((l) => !subLevels.has(l)).sort((a, b) => a - b);
    const mine = freeAccessSpells
      .filter((s) => s.hostPathId === path.id)
      .sort((a, b) => a.spellLevel - b.spellLevel);

    for (const spell of mine) {
      assigned.add(spell);
      if (isClosedTo(spell, path)) {
        warnings.push(`"${spell.name}" está cerrado para la vía ${path.name}.`);
      }
      const slot = open.findIndex((l) => l >= spell.spellLevel);
      if (slot < 0) {
        const why = takenBySub.length
          ? `no queda hueco libre en ${path.name} (la sub-vía "${sub?.name}" ocupa los suyos)`
          : `no queda hueco de nivel ${spell.spellLevel} o superior en ${path.name}`;
        warnings.push(`"${spell.name}": ${why}.`);
        looseCost += getFreeSpellCost(spell.spellLevel);
        continue;
      }
      open.splice(slot, 1);
      used++;
    }
  }

  for (const spell of spells) {
    if (spell.magicPath === FREE_ACCESS_LABEL) {
      if (assigned.has(spell)) continue;
      warnings.push(`"${spell.name}": conjuro de Libre Acceso sin vía asignada.`);
      looseCost += getFreeSpellCost(spell.spellLevel);
      continue;
    }

    // A sub-path spell is granted by its linked path, up to that path's level.
    const sub = subPaths.find((s) => isPath(s, spell.magicPath));
    if (sub) {
      const parent = paths.find((p) => p.id === sub.parentPathId);
      if (parent && (parent.level ?? 0) >= spell.spellLevel) continue;
      looseCost += getFreeSpellCost(spell.spellLevel);
      continue;
    }

    // Tabla 60: a spell its own path does not reach was bought individually.
    const path = paths.find((p) => isPath(p, spell.magicPath));
    if (path && (path.level ?? 0) >= spell.spellLevel) continue;
    looseCost += getFreeSpellCost(spell.spellLevel);
  }

  return { slots, used, looseCost, warnings };
}

/** A Libre Acceso spell can be closed to a path by name or by element. */
function isClosedTo(spell: SpellData, path: MagicPathData): boolean {
  return parseOpposedPaths(spell.closedPaths).some((closed) => isPath(path, closed));
}
