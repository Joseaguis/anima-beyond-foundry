/**
 * Numeric-regression test for the derived-data pipeline.
 *
 * `legacyPrepare` is a faithful copy of the formulas from the original
 * monolithic CharacterModel.prepareDerivedData() (pre-refactor). The new
 * phased pipeline (src/actors/creature/prep) must produce identical numbers
 * for the same inputs — including item modifiers.
 *
 * Formula fixes verified against the filled sheet (tests/ficha-test01.test.ts)
 * are applied to BOTH sides, marked with "fix:" comments: presence 25+5·level,
 * regeneration table, size = STR+CON, +50 cap on innate attack/parry/dodge,
 * innate CVs, and the −30 untrained secondaries penalty.
 */
import { describe, expect, it } from "vitest";
import { prepareCharacteristics } from "../src/actors/creature/prep/characteristics";
import { prepareState } from "../src/actors/creature/prep/state";
import { prepareVitals } from "../src/actors/creature/prep/vitals";
import { prepareCombat } from "../src/actors/creature/prep/combat";
import { prepareSupernatural } from "../src/actors/creature/prep/supernatural";
import { prepareSecondaries } from "../src/actors/creature/prep/secondaries";
import {
  CHARACTERISTIC_KEYS,
  defaultCategoryData,
  type CategoryData,
  type PrepContext,
} from "../src/actors/creature/prep/types";
import {
  getActionsPerTurn,
  getLifePointsBase,
  getModifier,
  getMovementSpeed,
  getRegeneration,
  getRegenerationRow,
} from "../src/actors/creature/tables";
import { getInnateKiAccumulation, getInnateKiPoints } from "../src/domains/ki/tables";
import { getInnateAct, getInnateZeon, getMagicLevelByInt } from "../src/domains/magic/tables";
import {
  getPotentialIncrementBonus,
  getPsychicPotentialByVol,
} from "../src/domains/psychic/tables";
import { stackTotal, type Modifier } from "../src/rules/modifier";

// --- fixtures -------------------------------------------------------------

/** The old "warrior" entry from the deleted src/data/categories.ts. */
function warriorCategory(): CategoryData {
  return {
    labelName: "Guerrero",
    lpPerLevel: 15,
    initiativePerLevel: 5,
    martialKnowledgePerLevel: 25,
    combatCosts: { attack: 2, parry: 2, dodge: 2, wearArmor: 2 },
    combatBonusPerLevel: { attack: 5, parry: 5, dodge: 0, wearArmor: 5 },
    supernatural: {
      zeon: 3,
      actMultiple: 70,
      magicProjection: 3,
      ki: 2,
      kiAccMultiple: 20,
      psychicProjection: 3,
      cv: 20,
    },
    secondaryCosts: {
      athletics: 2, social: 2, perceptive: 2, intellectual: 2,
      vigor: 2, subterfuge: 2, creative: 2,
    },
    secondaryBonusPerLevel: {
      athletics: 5, social: 5, perceptive: 5, intellectual: 5,
      vigor: 5, subterfuge: 5, creative: 5,
    },
  };
}

const SECONDARIES = [
  { key: "acrobatics", labelKey: "x", group: "athletics", baseChar: "agi" as const },
  { key: "style", labelKey: "x", group: "social", baseChar: "pow" as const },
  { key: "notice", labelKey: "x", group: "perceptive", baseChar: "per" as const },
  { key: "occult", labelKey: "x", group: "intellectual", baseChar: "int" as const },
];

function sampleSystem(): Record<string, any> {
  return {
    level: 4,
    str: { base: 8, bonus: 1 },
    dex: { base: 9, bonus: 0 },
    agi: { base: 7, bonus: 0 },
    con: { base: 8, bonus: 0 },
    int: { base: 6, bonus: 0 },
    pow: { base: 5, bonus: 2 },
    wp: { base: 6, bonus: 0 },
    per: { base: 7, bonus: 0 },
    lifePoints: { max: 0, current: 100, multiples: 2 },
    fatigue: { max: 0, current: 5, special: 1 },
    initiative: { base: 20, armorPenalty: 15, weaponBonus: 5, special: 4 },
    regeneration: { special: 2 },
    movement: { special: 1 },
    resistances: {
      rf: { special: 5 }, rm: { special: 0 }, rp: { special: 0 },
      rv: { special: 0 }, re: { special: 0 }, notes: "",
    },
    mentalHealth: { insanityThreshold: 0 },
    creationPoints: { total: 3, spent: 1 },
    combat: {
      attack: { dp: 100, special: 5 },
      parry: { dp: 80, special: 0 },
      dodge: { dp: 40, special: 0 },
      wearArmor: { dp: 30, special: 10 },
    },
    magic: { zeonDp: 60, zeonSpecial: 10, magicProjectionDp: 45, magicProjectionSpecial: 0 },
    ki: { pointsDp: { agi: 20 }, accDp: { agi: 40 }, special: 3 },
    psychic: { cvDp: 40, projectionDp: 30, projectionSpecial: 5 },
    secondary: {
      acrobatics: { dp: 30, naturalBonus: 1, naturalAbilities: 0, novelBonus: 0, special: 0 },
      style: { dp: 0, naturalBonus: 0, naturalAbilities: 0, novelBonus: 0, special: 0 },
      notice: { dp: 20, naturalBonus: 0, naturalAbilities: 1, novelBonus: 0, special: 10 },
      occult: { dp: 15, naturalBonus: 0, naturalAbilities: 0, novelBonus: 0, special: 0 },
    },
    customSecondary: {
      tracking: { name: "Rastreo", dp: 20, cost: 2, group: "perceptive", baseChar: "per", special: 0 },
    },
  };
}

/** Item modifiers grouped by target, as the synthetics would hold them. */
function sampleModifiers(): Record<string, Modifier[]> {
  return {
    attack: [
      { target: "attack", value: 10, type: "magic", enabled: true },
      { target: "attack", value: 5, type: "magic", enabled: true }, // dropped by stacking
      { target: "attack", value: 3, type: "untyped", enabled: true },
    ],
    str: [{ target: "str", value: 1, type: "item", enabled: true }],
    lifePoints: [{ target: "lifePoints", value: 20, type: "untyped", enabled: true }],
    initiative: [{ target: "initiative", value: -10, type: "status", enabled: true }],
    "secondary.notice": [{ target: "secondary.notice", value: 25, type: "item", enabled: true }],
    allActions: [{ target: "allActions", value: -10, type: "status", enabled: true }],
    physicalActions: [{ target: "physicalActions", value: -5, type: "untyped", enabled: true }],
  };
}

// --- reference implementation (the old monolith, verbatim formulas) --------

function legacyPrepare(
  data: Record<string, any>,
  cat: CategoryData | undefined,
  mod: (key: string) => number,
): void {
  const characteristics = ["str", "dex", "agi", "con", "int", "pow", "wp", "per"] as const;

  for (const key of characteristics) {
    const char = data[key];
    if (char) {
      char.final = char.base + char.bonus + mod(key);
      char.mod = getModifier(char.final);
    }
  }

  const strFinal = data.str?.final ?? 5;
  const dexFinal = data.dex?.final ?? 5;
  const agiFinal = data.agi?.final ?? 5;
  const conFinal = data.con?.final ?? 5;
  const powFinal = data.pow?.final ?? 5;
  const wpFinal = data.wp?.final ?? 5;

  const strMod = getModifier(strFinal);
  const dexMod = getModifier(dexFinal);
  const agiMod = getModifier(agiFinal);
  const conMod = getModifier(conFinal);
  const intMod = getModifier(data.int?.final ?? 5);
  const powMod = getModifier(powFinal);
  const wpMod = getModifier(wpFinal);
  const perMod = getModifier(data.per?.final ?? 5);

  const charMods: Record<string, number> = {
    str: strMod, dex: dexMod, agi: agiMod, con: conMod,
    int: intMod, pow: powMod, wp: wpMod, per: perMod,
  };

  const level = data.level ?? 0;
  // fix: presence is 25 + 5·level (20 at level 0), not 20 + 5·level.
  const presence = (level === 0 ? 20 : 25 + level * 5) + mod("presence");
  data.presence = presence;

  // fix: resistances carry a persisted "Esp." bonus and publish totals in place.
  data.resistances ??= { rf: {}, rm: {}, rp: {}, rv: {}, re: {} };
  const resChar: Record<string, number> = { rf: conMod, rm: powMod, rp: wpMod, rv: conMod, re: conMod };
  for (const key of ["rf", "rm", "rp", "rv", "re"]) {
    const res = (data.resistances[key] ??= {});
    res.total = presence + resChar[key] + (res.special ?? 0) + mod(key);
  }

  const lpBase = getLifePointsBase(conFinal);
  const lpFromCategory = cat ? cat.lpPerLevel * level : 0;
  const multiples = data.lifePoints?.multiples ?? 0;
  data.lifePoints.max = lpBase + lpFromCategory + multiples * conFinal + mod("lifePoints");

  // fix: fatigue max takes the "Esp." bonus and drives the exhaustion penalty.
  data.fatigue.max = conFinal + (data.fatigue.special ?? 0) + mod("fatigue");
  const fatigueCurrent = Math.max(0, data.fatigue.current ?? 0);
  const fatigueApplies =
    data.fatigue.max >= 5 ? fatigueCurrent <= 4 : fatigueCurrent < data.fatigue.max;
  const fatiguePenalties: Record<number, number> = { 0: -120, 1: -80, 2: -40, 3: -20, 4: -10 };
  const fatiguePenalty = fatigueApplies ? fatiguePenalties[fatigueCurrent] ?? 0 : 0;
  data.state = { fatiguePenalty };
  const legacyAllActions = mod("allActions") + fatiguePenalty;

  const initFromCategory = cat ? cat.initiativePerLevel * level : 0;
  // The phased pipeline also publishes the per-term breakdown for the sheet's
  // Turno table; mirror it so the deep-equal comparison stays exact.
  data.initiative.charPart = dexMod + agiMod;
  data.initiative.catPart = initFromCategory;
  data.initiative.weaponPart = data.initiative.weaponBonus ?? 0;
  data.initiative.armorPart = -(data.initiative.armorPenalty ?? 0);
  data.initiative.final = data.initiative.base + dexMod + agiMod + initFromCategory
    - (data.initiative.armorPenalty ?? 0) + (data.initiative.weaponBonus ?? 0)
    + (data.initiative.special ?? 0) + mod("initiative");

  data.martialKnowledge = cat ? cat.martialKnowledgePerLevel * level : 0;
  data.developmentPoints = level === 0 ? 400 : 600 + (level - 1) * 100;
  data.creationPoints.remaining = (data.creationPoints?.total ?? 3) - (data.creationPoints?.spent ?? 0);
  // fix: movement and regeneration are 0..20 table levels ("Esp." shifts the
  // level) publishing the Tabla 21 / Tabla 19-20 texts.
  data.movement ??= {};
  const movLevel = Math.min(
    20,
    Math.max(0, agiFinal + (data.movement.special ?? 0) + mod("movement")),
  );
  data.movement.final = movLevel;
  data.movement.speedText = getMovementSpeed(movLevel);

  data.regeneration ??= {};
  const regenNatural = getRegeneration(conFinal);
  const regenLevel = Math.min(
    20,
    Math.max(0, regenNatural + (data.regeneration.special ?? 0) + mod("regeneration")),
  );
  const regenRow = getRegenerationRow(regenLevel);
  data.regeneration.natural = regenNatural;
  data.regeneration.final = regenLevel;
  data.regeneration.amountText = regenRow.amount;
  data.regeneration.removalText = regenRow.removal;
  data.regeneration.specialText = regenRow.special;

  data.size = strFinal + conFinal;

  if (data.mentalHealth && !data.mentalHealth.insanityThreshold) {
    data.mentalHealth.insanityThreshold = wpFinal;
  }

  const costs = cat?.combatCosts ?? { attack: 2, parry: 2, dodge: 2, wearArmor: 2 };
  const bonuses = cat?.combatBonusPerLevel ?? { attack: 0, parry: 0, dodge: 0, wearArmor: 0 };
  const cb = data.combat;
  if (cb) {
    // fix: every combat ability takes the aggregated action modifiers
    // (allActions + physicalActions + fatigue penalty).
    const actionMod = legacyAllActions + mod("physicalActions");
    cb.actionModBreakdown = {
      allActions: mod("allActions"),
      physicalActions: mod("physicalActions"),
      fatigue: fatiguePenalty,
    };
    // fix: actions per turn come from Tabla 37 (DEX + AGI).
    cb.actionsPerTurn = getActionsPerTurn(dexFinal + agiFinal);

    // fix: the innate category bonus to attack/parry/dodge caps at +50.
    cb.attack.base = Math.floor((cb.attack.dp ?? 0) / costs.attack);
    cb.attack.catBonus = Math.min(50, bonuses.attack * level);
    cb.attack.final = cb.attack.base + dexMod + cb.attack.catBonus + (cb.attack.special ?? 0) + mod("attack") + actionMod;

    cb.parry.base = Math.floor((cb.parry.dp ?? 0) / costs.parry);
    cb.parry.catBonus = Math.min(50, bonuses.parry * level);
    cb.parry.final = cb.parry.base + dexMod + cb.parry.catBonus + (cb.parry.special ?? 0) + mod("parry") + actionMod;

    cb.dodge.base = Math.floor((cb.dodge.dp ?? 0) / costs.dodge);
    cb.dodge.catBonus = Math.min(50, bonuses.dodge * level);
    cb.dodge.final = cb.dodge.base + agiMod + cb.dodge.catBonus + (cb.dodge.special ?? 0) + mod("dodge") + actionMod;

    cb.wearArmor.base = Math.floor((cb.wearArmor.dp ?? 0) / costs.wearArmor);
    cb.wearArmor.catBonus = bonuses.wearArmor * level;
    cb.wearArmor.final = cb.wearArmor.base + strMod + cb.wearArmor.catBonus + (cb.wearArmor.special ?? 0) + mod("wearArmor") + actionMod;

    cb.damageBonus = mod("damage");
  }

  const sn = cat?.supernatural ?? { zeon: 2, actMultiple: 60, magicProjection: 2, ki: 2, kiAccMultiple: 20, psychicProjection: 2, cv: 20 };
  const mg = data.magic;
  if (mg) {
    // fix: innate zeon/ACT by POD table, magic level by INT table, ACT as
    // innate×(1+multiples), regen = ACT + purchases, projection imbalance.
    const innateZeon = getInnateZeon(powFinal);
    const innateAct = getInnateAct(powFinal);
    mg.zeonMax =
      innateZeon +
      Math.floor((mg.zeonDp ?? 0) / sn.zeon) * 5 +
      ((sn as { zeonPerLevel?: number }).zeonPerLevel ?? 0) * level +
      (mg.zeonSpecial ?? 0) +
      mod("zeonMax");
    const actMultiples = sn.actMultiple > 0 ? Math.floor((mg.actDp ?? 0) / sn.actMultiple) : 0;
    mg.act = innateAct * (1 + actMultiples) + (mg.actSpecial ?? 0) + mod("act");
    const regenCost = Math.max(1, Math.floor(sn.actMultiple / 2));
    const regenMultiples = Math.floor((mg.regenDp ?? 0) / regenCost);
    // fix: metamagia is derived from the acquired spheres, not a manual input.
    mg.metamagiaRegen = 0;
    mg.metamagiaMagicLevel = 0;
    mg.zeonRegen =
      mg.act + 10 * (mg.metamagiaRegen ?? 0) + regenMultiples * innateAct + (mg.regenSpecial ?? 0) + mod("zeonRegen");
    mg.magicProjectionBase = Math.floor((mg.magicProjectionDp ?? 0) / sn.magicProjection);
    // fix: magic projection is an action — allActions (+ fatigue) applies.
    mg.magicProjectionFinal = mg.magicProjectionBase + dexMod + (mg.magicProjectionSpecial ?? 0) + mod("magicProjection") + legacyAllActions;
    const imbalance = Math.max(-30, Math.min(30, mg.offensiveImbalance ?? 0));
    mg.magicProjectionAttack = mg.magicProjectionFinal + imbalance;
    mg.magicProjectionDefense = mg.magicProjectionFinal - imbalance;
    // fix: metamagia is spent magic level (Excel "Nivel Máximo | Nivel Usado |
    // Metamagia"), so it moved out of the max and onto the used side, together
    // with the opposed-path double cost and the Tabla 60 loose-spell cost.
    mg.magicLevelMax =
      getMagicLevelByInt(data.int?.final ?? 5) +
      Math.floor((mg.magicLevelDp ?? 0) / 5) * 5 +
      (mg.magicLevelSpecial ?? 0) +
      mod("magicLevel");
    mg.magicLevelPaths = 0;
    // fix: los conjuros sueltos y los huecos de Libre Acceso se resuelven a la
    // vez; sin vías ni conjuros no hay huecos ni avisos.
    mg.magicLevelSpells = 0;
    mg.freeAccessSlots = 0;
    mg.freeAccessUsed = 0;
    mg.freeAccessFree = 0;
    mg.warnings = [];
    mg.magicLevelUsed = 0;
    mg.magicLevelAvailable = mg.magicLevelMax - mg.magicLevelUsed;
    mg.magicLevelOver = mg.magicLevelAvailable < 0;
    // fix: maintenance totals derived from the active-spell list.
    mg.upkeepRound = 0;
    mg.upkeepDaily = 0;
  }

  const ki = data.ki;
  if (ki) {
    // fix: per-characteristic ki points (value, or 10 + 2·(v−10) above 10) and
    // accumulation (innate by value + bought), plus CM as a resource.
    const kiChars: [string, number, unknown, unknown][] = [
      ["str", strFinal, ki.pointsDp?.str, ki.accDp?.str],
      ["dex", dexFinal, ki.pointsDp?.dex, ki.accDp?.dex],
      ["agi", agiFinal, ki.pointsDp?.agi, ki.accDp?.agi],
      ["con", conFinal, ki.pointsDp?.con, ki.accDp?.con],
      ["pow", powFinal, ki.pointsDp?.pow, ki.accDp?.pow],
      ["wp", wpFinal, ki.pointsDp?.wp, ki.accDp?.wp],
    ];
    const perChar: Record<string, unknown> = {};
    let pointsInnate = 0, pointsBought = 0, accInnate = 0, accBought = 0;
    for (const [key, value, pDp, aDp] of kiChars) {
      const pInnate = getInnateKiPoints(value);
      const pBought = Math.floor((Number(pDp) || 0) / sn.ki);
      const aInnate = getInnateKiAccumulation(value);
      const aBought = Math.floor((Number(aDp) || 0) / sn.kiAccMultiple);
      perChar[key] = {
        value,
        pointsInnate: pInnate,
        pointsBought: pBought,
        pointsTotal: pInnate + pBought,
        accInnate: aInnate,
        accBought: aBought,
        accTotal: aInnate + aBought,
      };
      pointsInnate += pInnate;
      pointsBought += pBought;
      accInnate += aInnate;
      accBought += aBought;
    }
    ki.perChar = perChar;
    ki.pointsInnate = pointsInnate;
    ki.pointsBought = pointsBought;
    ki.totalPoints = pointsInnate + pointsBought + (ki.special ?? 0) + mod("ki");
    ki.accInnate = accInnate;
    ki.accBought = accBought;
    ki.accumulation = accInnate + accBought + mod("kiAccumulation");
    ki.cmTotal = data.martialKnowledge ?? 0;
    ki.cmUsed = (data.kiAbilities ?? []).reduce(
      (sum: number, a: { mkCost?: number }) => sum + (a.mkCost ?? 0),
      0,
    );
    ki.cmAvailable = ki.cmTotal - ki.cmUsed;
    ki.cmOver = ki.cmAvailable < 0;
  }

  const psy = data.psychic;
  if (psy) {
    // fix: innate CVs — 1 at level 1 plus 1 per levelsPerCv extra levels.
    const levelsPerCv = (sn as { levelsPerCv?: number }).levelsPerCv ?? 3;
    const innateCv = level === 0 ? 0 : Math.trunc(1 + (level - 1) / levelsPerCv);
    psy.cvMax = innateCv + Math.floor((psy.cvDp ?? 0) / sn.cv) + mod("psychicCv");
    psy.projectionBase = Math.floor((psy.projectionDp ?? 0) / sn.psychicProjection);
    // fix: psychic projection is an action — allActions (+ fatigue) applies.
    psy.projectionFinal = psy.projectionBase + dexMod + (psy.projectionSpecial ?? 0) + mod("psychicProjection") + legacyAllActions;
    // fix: Potencial derivado de VOL (Tabla 68) + Incrementar (Tabla 70), y la
    // economía de CVs (afinidades, poderes, fortalecer, innatos, incrementar).
    const potentialCv = psy.potentialIncrementCvs ?? 0;
    psy.potentialBase = getPsychicPotentialByVol(wpFinal);
    psy.potentialIncrement = getPotentialIncrementBonus(potentialCv);
    psy.potentialFinal =
      psy.potentialBase + psy.potentialIncrement + (psy.potentialSpecial ?? 0) + mod("psychicPotential");
    // fix: cristal psíquico (Core p. 229). Sólo entra en el potencial si no está
    // atado a una disciplina; la penalización de fatiga se aplica siempre.
    const crystalBonus = psy.crystalBonus ?? 0;
    if (crystalBonus > 0 && !psy.crystalDiscipline) psy.potentialFinal += crystalBonus;
    psy.crystalFatiguePenalty = Math.floor(crystalBonus / 5);
    const disciplines = (data.psychicDisciplines ?? []) as { affinityCost?: number }[];
    const powers = (data.psychicPowers ?? []) as { masteryCost?: number; fortifyCvs?: number }[];
    const innatos = (psy.innatos ?? []) as unknown[];
    const affinityCv = disciplines.reduce((s: number, d) => s + (d.affinityCost ?? 1), 0);
    const masteryCv = powers.reduce((s: number, p) => s + (p.masteryCost ?? 1), 0);
    const fortifyCv = powers.reduce((s: number, p) => s + (p.fortifyCvs ?? 0), 0);
    psy.innatosCount = innatos.length;
    psy.cvUsed = affinityCv + masteryCv + fortifyCv + innatos.length * 2 + potentialCv;
    psy.cvFree = psy.cvMax - psy.cvUsed;
    // fix: el sobregasto se señala sin recortar, como el CM de Ki.
    psy.cvOver = Math.max(0, -psy.cvFree);
  }

  const secCosts = cat?.secondaryCosts ?? { athletics: 2, social: 2, perceptive: 2, intellectual: 2, vigor: 2, subterfuge: 2, creative: 2 };
  const secBonuses = cat?.secondaryBonusPerLevel ?? { athletics: 5, social: 5, perceptive: 5, intellectual: 5, vigor: 5, subterfuge: 5, creative: 5 };

  // fix: the Excel "Bonos" cube — charMod·(1+Bon.) + 10·Hab., capped at 100 —
  // replaces the plain charMod, and 10·Novel joins the category bonus.
  const cube = (ad: Record<string, any>) => {
    ad.bonusRaw = (ad.charMod ?? 0) * (1 + (ad.naturalBonus ?? 0)) + 10 * (ad.naturalAbilities ?? 0);
    ad.bonusTotal = Math.min(ad.bonusRaw, 100);
  };

  const sec = data.secondary;
  if (sec) {
    for (const ability of SECONDARIES) {
      const ad = sec[ability.key];
      if (!ad) continue;
      const cost = (secCosts as Record<string, number>)[ability.group] ?? 2;
      ad.base = cost > 0 ? Math.floor((ad.dp ?? 0) / cost) : 0;
      ad.charMod = charMods[ability.baseChar] ?? 0;
      cube(ad);
      ad.catBonus = ((secBonuses as Record<string, number>)[ability.group] ?? 0) * level + 10 * (ad.novelBonus ?? 0);
      // fix: −30 untrained until 5 base points are bought.
      const untrained = ad.base < 5 ? -30 : 0;
      // fix: allActions (+ fatigue) hits every secondary; physical ones also
      // take the physicalActions modifiers.
      const physical = ["str", "dex", "agi", "con"].includes(ability.baseChar)
        ? mod("physicalActions")
        : 0;
      ad.final = ad.base + ad.bonusTotal + ad.catBonus + (ad.special ?? 0) + untrained + mod(`secondary.${ability.key}`) + legacyAllActions + physical;
    }
  }

  const customSec = data.customSecondary;
  if (customSec && typeof customSec === "object") {
    for (const [, custom] of Object.entries(customSec as Record<string, any>)) {
      if (!custom || !custom.name) continue;
      const cost = custom.cost ?? 2;
      const group = custom.group ?? "intellectual";
      custom.base = cost > 0 ? Math.floor((custom.dp ?? 0) / cost) : 0;
      custom.charMod = charMods[custom.baseChar ?? "int"] ?? 0;
      cube(custom);
      custom.catBonus = ((secBonuses as Record<string, number>)[group] ?? 0) * level + 10 * (custom.novelBonus ?? 0);
      // fix: −30 untrained until 5 base points are bought.
      const customUntrained = custom.base < 5 ? -30 : 0;
      const customPhysical = ["str", "dex", "agi", "con"].includes(custom.baseChar ?? "int")
        ? mod("physicalActions")
        : 0;
      custom.final = custom.base + custom.bonusTotal + custom.catBonus + (custom.special ?? 0) + customUntrained + legacyAllActions + customPhysical;
    }
  }

  // fix: natural-improvement budget counters (Excel footer, warn-only).
  const physicalChars = ["str", "dex", "agi", "con"];
  const tallies = { physical: 0, mental: 0, abilities: 0, novel: 0 };
  const tally = (ad: Record<string, any>, baseChar: string) => {
    if (physicalChars.includes(baseChar)) tallies.physical += ad.naturalBonus ?? 0;
    else tallies.mental += ad.naturalBonus ?? 0;
    tallies.abilities += ad.naturalAbilities ?? 0;
    tallies.novel += ad.novelBonus ?? 0;
  };
  for (const ability of SECONDARIES) {
    if (sec?.[ability.key]) tally(sec[ability.key], ability.baseChar);
  }
  for (const custom of Object.values((customSec ?? {}) as Record<string, any>)) {
    if (custom && custom.name) tally(custom, custom.baseChar ?? "int");
  }
  const levels = Math.max(1, level);
  const novelMax = (cat?.novelPerLevel ?? 0) * level;
  data.secondaryImprovement = {
    physical: { assigned: tallies.physical, max: levels, over: tallies.physical > levels },
    mental: { assigned: tallies.mental, max: levels, over: tallies.mental > levels },
    abilities: { assigned: tallies.abilities, max: 5 * levels, over: tallies.abilities > 5 * levels },
    novel: { assigned: tallies.novel, max: novelMax, over: tallies.novel > novelMax },
    warnings: [],
  };
}

// --- the actual comparison -------------------------------------------------

/** Single-category context: the whole progression is one stage. */
function singleCategoryCtx(
  level: number,
  cat: CategoryData,
  mod: (key: string) => number,
): PrepContext {
  return {
    level,
    categories: [
      { key: "c1", data: cat, levels: level, cumulativeLevels: level, changeCost: 0 },
    ],
    mode: "dp",
    mod,
    flag: () => 0,
    charFinals: {} as PrepContext["charFinals"],
    charMods: {} as PrepContext["charMods"],
  };
}

function runNewPipeline(
  data: Record<string, any>,
  cat: CategoryData,
  mod: (key: string) => number,
): void {
  const ctx = singleCategoryCtx(data.level ?? 0, cat, mod);
  prepareCharacteristics(data, ctx);
  prepareState(data, ctx);
  prepareCombat(data, ctx);
  prepareVitals(data, ctx);
  prepareSupernatural(data, ctx);
  prepareSecondaries(data, ctx, SECONDARIES);
}

function makeMod(groups: Record<string, Modifier[]>): (key: string) => number {
  return (key) => stackTotal(groups[key] ?? []);
}

describe("phased pipeline reproduces the legacy monolith", () => {
  const scenarios: [string, CategoryData, Record<string, Modifier[]>][] = [
    ["warrior + item modifiers", warriorCategory(), sampleModifiers()],
    ["warrior, no modifiers", warriorCategory(), {}],
    ["no category (defaults), with modifiers", defaultCategoryData(), sampleModifiers()],
  ];

  it.each(scenarios)("%s", (_name, cat, modifiers) => {
    const expected = sampleSystem();
    const actual = sampleSystem();
    const mod = makeMod(modifiers);

    legacyPrepare(expected, cat, mod);
    runNewPipeline(actual, cat, mod);

    expect(actual).toEqual(expected);
  });

  it("fills charFinals/charMods for every characteristic", () => {
    const data = sampleSystem();
    const ctx = singleCategoryCtx(data.level, warriorCategory(), () => 0);
    prepareCharacteristics(data, ctx);
    for (const key of CHARACTERISTIC_KEYS) {
      expect(ctx.charFinals[key]).toBeTypeOf("number");
      expect(ctx.charMods[key]).toBe(getModifier(ctx.charFinals[key]));
    }
  });
});
