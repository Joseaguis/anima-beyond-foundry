/**
 * Unit tests for the mystic (magic) derived data: zeon, ACT, regeneration,
 * magic projection (+ offensive imbalance), magic level (innate by INT + bought
 * + spent by paths) and the four Summoning skills. Every expected value is
 * hand-computed from the Excel formulas (hoja PDs, filas 93-101) and the base
 * tables (POD → zeon/ACT, INT → magic level).
 */
import { beforeAll, describe, expect, it } from "vitest";
import { prepareCharacteristics } from "../src/actors/creature/prep/characteristics";
import { prepareSupernatural } from "../src/actors/creature/prep/supernatural";
import type { MagicPathData } from "../src/domains/magic/data";
import { prepareDevelopment } from "../src/actors/creature/prep/development";
import { defaultCategoryData, type CategoryData, type PrepContext } from "../src/actors/creature/prep/types";

/** A pure-mage category (Hechicero-like) with the Excel magic costs. */
function mageCategory(): CategoryData {
  const cat = defaultCategoryData();
  cat.labelName = "Hechicero";
  cat.supernatural = {
    ...cat.supernatural,
    zeon: 1, // CosteZeón
    actMultiple: 50, // CosteACT
    magicProjection: 2, // CosteProyección
    summoning: 2, // CosteConvocatoria
    zeonPerLevel: 100, // innate zeon per level
  };
  cat.dpLimits = { combat: 0.5, magic: 0.6, psychic: 0.5 };
  return cat;
}

function mageSystem(): Record<string, any> {
  return {
    level: 5,
    str: { base: 5, bonus: 0 },
    dex: { base: 10, bonus: 0 }, // mod +15
    agi: { base: 5, bonus: 0 },
    con: { base: 8, bonus: 0 },
    int: { base: 12, bonus: 0 }, // magic level 100
    pow: { base: 12, bonus: 0 }, // innate zeon 160, ACT 15, mod +20
    wp: { base: 10, bonus: 0 }, // mod +15
    per: { base: 5, bonus: 0 },
    lifePoints: { max: 0, current: 0, multiples: 0 },
    fatigue: { max: 0, current: 0 },
    initiative: { base: 20, armorPenalty: 0, weaponBonus: 0 },
    magic: {
      zeonDp: { c1: 50 },
      zeonSpecial: 0,
      actDp: { c1: 100 },
      regenDp: { c1: 50 },
      magicProjectionDp: { c1: 20 },
      offensiveImbalance: 20,
      magicLevelDp: { c1: 25 },
      summoning: {
        summon: { dp: { c1: 20 }, special: 0 },
        control: { dp: { c1: 10 }, special: 0 },
        bind: { dp: { c1: 6 }, special: 0 },
        banish: { dp: { c1: 4 }, special: 0 },
      },
    },
    // Two paths count against magic level; the metamagic subtype does not.
    magicPaths: [
      { name: "Fuego", subtype: "path", level: 40 },
      { name: "Aire", subtype: "path", level: 30 },
      { name: "Doble conjuro", subtype: "metamagic", level: 10 },
    ] as MagicPathData[],
    dpConfig: { limitMode: "combined" },
  };
}

function ctxFor(system: Record<string, any>): PrepContext {
  const cat = mageCategory();
  return {
    level: system.level,
    categories: [
      { key: "c1", data: cat, levels: system.level, cumulativeLevels: system.level, changeCost: 0 },
    ],
    mode: "dp",
    mod: () => 0,
    flag: () => 0,
    charFinals: {} as PrepContext["charFinals"],
    charMods: {} as PrepContext["charMods"],
  };
}

let system: Record<string, any>;

beforeAll(() => {
  system = mageSystem();
  const ctx = ctxFor(system);
  prepareCharacteristics(system, ctx);
  prepareSupernatural(system, ctx);
  prepareDevelopment(system, ctx);
});

describe("místicas: zeon, ACT y regeneración", () => {
  it("Zeón = innato(160) + comprado(50/1·5=250) + porNivel(100·5=500) = 910", () => {
    expect(system.magic.zeonMax).toBe(910);
  });

  it("ACT = innato(15) × (1 + ⌊100/50⌋=2) = 45", () => {
    expect(system.magic.act).toBe(45);
  });

  it("Regeneración = ACT(45) + ⌊50/25⌋=2 · innato(15) = 75", () => {
    expect(system.magic.zeonRegen).toBe(75);
  });
});

describe("místicas: proyección mágica y desequilibrio", () => {
  it("Proyección final = ⌊20/2⌋(10) + DES(+15) = 25", () => {
    expect(system.magic.magicProjectionFinal).toBe(25);
  });

  it("Desequilibrio +20: ataque 45, defensa 5", () => {
    expect(system.magic.magicProjectionAttack).toBe(45);
    expect(system.magic.magicProjectionDefense).toBe(5);
  });
});

describe("místicas: nivel de magia y vías", () => {
  it("Nivel de Magia máximo = innato(INT 12 → 100) + comprado(⌊25/5⌋·5=25) = 125", () => {
    expect(system.magic.magicLevelMax).toBe(125);
  });

  it("Nivel usado = 40 + 30 (solo vías, no metamagia) = 70; disponible = 55", () => {
    expect(system.magic.magicLevelUsed).toBe(70);
    expect(system.magic.magicLevelAvailable).toBe(55);
  });
});

describe("místicas: convocatoria (POD/POD/POD, VOL en Controlar)", () => {
  it("Convocar = ⌊20/2⌋(10) + POD(+20) = 30", () => {
    expect(system.magic.summon).toBe(30);
  });
  it("Controlar = ⌊10/2⌋(5) + VOL(+15) = 20", () => {
    expect(system.magic.control).toBe(20);
  });
  it("Atar = ⌊6/2⌋(3) + POD(+20) = 23", () => {
    expect(system.magic.bind).toBe(23);
  });
  it("Desconvocar = ⌊4/2⌋(2) + POD(+20) = 22", () => {
    expect(system.magic.banish).toBe(22);
  });
});

describe("místicas: reserva de PD mágica", () => {
  it("cuenta todos los gastos mágicos (50+20+100+50+25+40 = 285)", () => {
    expect(system.development.limits.magic.spent).toBe(285);
  });
});

// ---------------------------------------------------------------------------
// Nivel de magia gastado: metamagia, vías opuestas y conjuros sueltos.
// Cada bloque parte de una copia del sistema base para no acoplar los casos.
// ---------------------------------------------------------------------------

/** Run the magic prep over a mage whose system has been patched. */
function prepared(patch: (system: Record<string, any>) => void): Record<string, any> {
  const s = mageSystem();
  patch(s);
  const ctx = ctxFor(s);
  prepareCharacteristics(s, ctx);
  prepareSupernatural(s, ctx);
  return s;
}

describe("místicas: metamagia", () => {
  it("las esferas gastan Nivel de Magia, no lo amplían", () => {
    // c0n1 "Escudos potenciados" (coste 5) + c1n1 "Área potenciada" (coste 10).
    const s = prepared((sys) => {
      sys.magic.metamagias = ["c0n1", "c1n1"];
    });
    expect(s.magic.metamagiaMagicLevel).toBe(15);
    // El máximo no cambia: sigue siendo innato(100) + comprado(25).
    expect(s.magic.magicLevelMax).toBe(125);
    // Usado = vías (70) + metamagia (15).
    expect(s.magic.magicLevelUsed).toBe(85);
    expect(s.magic.magicLevelAvailable).toBe(40);
  });

  it("las esferas raíz no cuestan Nivel de Magia", () => {
    // c0n0 "Eliminar protección" es raíz (requiredLevel 0, sin coste).
    const s = prepared((sys) => {
      sys.magic.metamagias = ["c0n0"];
    });
    expect(s.magic.metamagiaMagicLevel).toBe(0);
  });

  it("cada esfera de Regeneración zeónica avanzada añade 10 a la regeneración", () => {
    // c5n2 y c6n2 son ambas "Regeneración zeónica avanzada".
    const s = prepared((sys) => {
      sys.magic.metamagias = ["c5n2", "c6n2"];
    });
    expect(s.magic.metamagiaRegen).toBe(2);
    // Base 75 (ver arriba) + 10 × 2 esferas.
    expect(s.magic.zeonRegen).toBe(95);
  });

  it("ignora ids que ya no existen en el grafo", () => {
    const s = prepared((sys) => {
      sys.magic.metamagias = ["c0n1", "inexistente"];
    });
    expect(s.magic.metamagiaMagicLevel).toBe(5);
  });
});

describe("místicas: vías opuestas (Excel Tabla_VíasOpuestas)", () => {
  it("desarrollar una vía opuesta a otra que ya se domina cuesta el doble", () => {
    // Fuego 40 y Agua 30 son antagónicas: ambas cuentan ×2 → 140.
    const s = prepared((sys) => {
      sys.magicPaths = [
        { name: "Fuego", subtype: "path", level: 40, opposedPath: "Agua, Nigromancia" },
        { name: "Agua", subtype: "path", level: 30, opposedPath: "Fuego, Nigromancia" },
      ];
    });
    expect(s.magic.magicLevelPaths).toBe(140);
  });

  it("no dobla vías que no son antagónicas", () => {
    const s = prepared((sys) => {
      sys.magicPaths = [
        { name: "Fuego", subtype: "path", level: 40, opposedPath: "Agua, Nigromancia" },
        { name: "Aire", subtype: "path", level: 30, opposedPath: "Tierra, Nigromancia" },
      ];
    });
    expect(s.magic.magicLevelPaths).toBe(70);
  });

  it("Nigromancia es antagónica de las otras diez", () => {
    const s = prepared((sys) => {
      sys.magicPaths = [
        { name: "Nigromancia", subtype: "path", level: 20, opposedPath: "Luz, Fuego" },
        { name: "Luz", subtype: "path", level: 10, opposedPath: "Oscuridad, Nigromancia" },
      ];
    });
    // Ambas se ven mutuamente como opuestas: 20·2 + 10·2.
    expect(s.magic.magicLevelPaths).toBe(60);
  });
});

describe("místicas: Tabla 60 (conjuros sueltos)", () => {
  it("no cobra los conjuros que la vía ya cubre", () => {
    // Fuego está a nivel 40, así que un conjuro de Fuego 20 va incluido.
    const s = prepared((sys) => {
      sys.spells = [{ name: "Bola de fuego", magicPath: "Fuego", spellLevel: 20 }];
    });
    expect(s.magic.magicLevelSpells).toBe(0);
  });

  it("cobra el conjuro que supera el nivel de su vía", () => {
    // Fuego 40 no alcanza un conjuro de nivel 62 → banda 61-70 = 14.
    const s = prepared((sys) => {
      sys.spells = [{ name: "Consumir esencia", magicPath: "Fuego", spellLevel: 62 }];
    });
    expect(s.magic.magicLevelSpells).toBe(14);
    expect(s.magic.magicLevelUsed).toBe(70 + 14);
  });

  it("cobra los conjuros de una vía que no se posee", () => {
    const s = prepared((sys) => {
      sys.spells = [{ name: "Crear luz", magicPath: "Luz", spellLevel: 2 }];
    });
    expect(s.magic.magicLevelSpells).toBe(2);
  });
});

describe("místicas: sobregasto de Nivel de Magia", () => {
  it("se señala sin recortar, como el CM de Ki", () => {
    const s = prepared((sys) => {
      sys.magicPaths = [{ name: "Fuego", subtype: "path", level: 100 }];
      sys.magic.metamagias = ["c1n1"]; // 10
    });
    // Máximo 125 frente a 100 + 10 usados: aún cabe.
    expect(s.magic.magicLevelOver).toBe(false);

    const over = prepared((sys) => {
      sys.magicPaths = [
        { name: "Fuego", subtype: "path", level: 100, opposedPath: "Agua" },
        { name: "Agua", subtype: "path", level: 40, opposedPath: "Fuego" },
      ];
    });
    expect(over.magic.magicLevelUsed).toBe(280);
    expect(over.magic.magicLevelAvailable).toBe(-155);
    expect(over.magic.magicLevelOver).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Huecos de Libre Acceso y sub-vías (Core p. 118, Arcana Exxet cap. 4).
// Una vía mayor deja 10 huecos (1 por decena: 4, 14 … 94) y una menor 20
// (2 por decena: 4 y 8, 14 y 18 …). Una sub-vía ocupa el primero de cada decena.
// ---------------------------------------------------------------------------

/** Un mago con una sola vía, para aislar el cálculo de huecos. */
function withPath(
  path: Partial<MagicPathData> & { name: string; level: number },
  patch: (system: Record<string, any>) => void = () => {},
): Record<string, any> {
  return prepared((sys) => {
    sys.magicPaths = [{ id: "p1", subtype: "path", element: path.name, ...path }];
    patch(sys);
  });
}

describe("místicas: huecos de Libre Acceso", () => {
  it("una vía mayor da 1 hueco por decena y una menor 2", () => {
    expect(withPath({ name: "Luz", level: 80 }).magic.freeAccessSlots).toBe(8);
    expect(withPath({ name: "Fuego", level: 80 }).magic.freeAccessSlots).toBe(16);
  });

  it("solo cuentan los huecos hasta el nivel de la vía", () => {
    // Luz 30 llega a los huecos de 4, 14 y 24; el de 34 aún no.
    expect(withPath({ name: "Luz", level: 30 }).magic.freeAccessSlots).toBe(3);
    expect(withPath({ name: "Luz", level: 100 }).magic.freeAccessSlots).toBe(10);
  });
});

describe("místicas: sub-vías", () => {
  const subPath = (parentPathId: string) => ({
    id: "s1",
    name: "Caos",
    subtype: "subPath",
    level: 1,
    parentPathId,
  });

  it("no cuenta Nivel de Magia (regresión del bug)", () => {
    const s = withPath({ name: "Fuego", level: 40 }, (sys) => {
      sys.magicPaths.push({ ...subPath("p1"), level: 94 });
    });
    // Solo la vía Fuego 40; la sub-vía no suma nada.
    expect(s.magic.magicLevelPaths).toBe(40);
    expect(s.magic.magicLevelUsed).toBe(40);
  });

  it("en una vía menor consume la mitad de los huecos", () => {
    // Fuego 80 → 16 huecos; la sub-vía ocupa los 8 de 4, 14 … 74 y quedan 8.
    const s = withPath({ name: "Fuego", level: 80 }, (sys) => {
      sys.magicPaths.push(subPath("p1"));
    });
    expect(s.magic.freeAccessSlots).toBe(16);
    expect(s.magic.freeAccessUsed).toBe(8);
    expect(s.magic.freeAccessFree).toBe(8);
  });

  it("en una vía mayor los consume todos", () => {
    const s = withPath({ name: "Luz", level: 80 }, (sys) => {
      sys.magicPaths.push(subPath("p1"));
    });
    expect(s.magic.freeAccessSlots).toBe(8);
    expect(s.magic.freeAccessUsed).toBe(8);
    expect(s.magic.freeAccessFree).toBe(0);
  });

  it("concede sus conjuros hasta el nivel de la vía anfitriona", () => {
    const s = withPath({ name: "Fuego", level: 40 }, (sys) => {
      sys.magicPaths.push(subPath("p1"));
      sys.spells = [
        { name: "Caos 24", magicPath: "Caos", spellLevel: 24 },
        { name: "Caos 94", magicPath: "Caos", spellLevel: 94 },
      ];
    });
    // El de 24 va incluido; el de 94 supera el nivel de la vía y se cobra.
    expect(s.magic.magicLevelSpells).toBe(20);
  });

  it("avisa si no tiene vía asignada o si esta desapareció", () => {
    const sinVia = withPath({ name: "Fuego", level: 40 }, (sys) => {
      sys.magicPaths.push(subPath(""));
    });
    expect(sinVia.magic.warnings).toContain('Sub-vía "Caos": sin vía asignada.');

    const huerfana = withPath({ name: "Fuego", level: 40 }, (sys) => {
      sys.magicPaths.push(subPath("borrada"));
    });
    expect(huerfana.magic.warnings).toContain('Sub-vía "Caos": la vía asignada ya no existe.');
  });
});

describe("místicas: conjuros de Libre Acceso", () => {
  const freeSpell = (name: string, spellLevel: number, extra: Record<string, any> = {}) => ({
    name,
    magicPath: "Libre acceso",
    spellLevel,
    hostPathId: "p1",
    ...extra,
  });

  it("un conjuro que cabe en un hueco no cuesta Nivel de Magia", () => {
    const s = withPath({ name: "Luz", level: 40 }, (sys) => {
      sys.spells = [freeSpell("Apertura", 2)];
    });
    expect(s.magic.magicLevelSpells).toBe(0);
    expect(s.magic.freeAccessUsed).toBe(1);
    expect(s.magic.warnings).toEqual([]);
  });

  it("cobra por Tabla 60 el que no cabe en ningún hueco", () => {
    // Luz 20 solo tiene huecos de 4 y 14: un conjuro de nivel 32 no entra.
    const s = withPath({ name: "Luz", level: 20 }, (sys) => {
      sys.spells = [freeSpell("Grande", 32)];
    });
    expect(s.magic.magicLevelSpells).toBe(8);
    expect(s.magic.warnings[0]).toContain("no queda hueco de nivel 32");
  });

  it("avisa cuando la sub-vía ya ocupó todos los huecos", () => {
    const s = withPath({ name: "Luz", level: 40 }, (sys) => {
      sys.magicPaths.push({ id: "s1", name: "Caos", subtype: "subPath", level: 1, parentPathId: "p1" });
      sys.spells = [freeSpell("Apertura", 2)];
    });
    expect(s.magic.warnings[0]).toContain('la sub-vía "Caos" ocupa los suyos');
  });

  it("avisa si el conjuro está cerrado para esa vía", () => {
    // Apertura está cerrada a Destrucción y Fuego (Excel col AA).
    const s = withPath({ name: "Fuego", level: 40 }, (sys) => {
      sys.spells = [freeSpell("Apertura", 2, { closedPaths: "Destrucción,Fuego" })];
    });
    expect(s.magic.warnings).toContain('"Apertura" está cerrado para la vía Fuego.');
  });

  it("avisa y cobra el conjuro sin vía asignada", () => {
    const s = withPath({ name: "Luz", level: 40 }, (sys) => {
      sys.spells = [freeSpell("Suelto", 2, { hostPathId: "" })];
    });
    expect(s.magic.warnings).toContain('"Suelto": conjuro de Libre Acceso sin vía asignada.');
    expect(s.magic.magicLevelSpells).toBe(2);
  });

  it("reparte los huecos de menor a mayor sin desperdiciarlos", () => {
    // Luz 40 → huecos 4, 14, 24, 34. Tres conjuros de nivel 2, 12 y 32 caben.
    const s = withPath({ name: "Luz", level: 40 }, (sys) => {
      sys.spells = [freeSpell("A", 32), freeSpell("B", 2), freeSpell("C", 12)];
    });
    expect(s.magic.freeAccessUsed).toBe(3);
    expect(s.magic.magicLevelSpells).toBe(0);
    expect(s.magic.warnings).toEqual([]);
  });
});

describe("místicas: mantenimiento (Core p. 120)", () => {
  it("separa el coste por asalto del coste diario", () => {
    const s = prepared((sys) => {
      sys.magic.activeSpells = [
        { name: "Escudo de luz", grade: "base", upkeepMode: "round", zeonUpkeep: 5 },
        { name: "Armadura de luz", grade: "advanced", upkeepMode: "round", zeonUpkeep: 15 },
        { name: "Ver realmente", grade: "base", upkeepMode: "daily", zeonUpkeep: 10 },
      ];
    });
    expect(s.magic.upkeepRound).toBe(20);
    expect(s.magic.upkeepDaily).toBe(10);
  });

  it("trata las filas sin modo como mantenimiento por asalto", () => {
    const s = prepared((sys) => {
      sys.magic.activeSpells = [{ name: "Legacy", zeonUpkeep: 7 }];
    });
    expect(s.magic.upkeepRound).toBe(7);
    expect(s.magic.upkeepDaily).toBe(0);
  });
});
