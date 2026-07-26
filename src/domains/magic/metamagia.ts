import { METAMAGIA_NODES } from "./metamagia-graph";

/**
 * Metamagia (Arcana Exxet cap. 3, "Arcana Shepirah"). The tree is walked in
 * *esferas*: each acquired node is one sphere of its principle, and a
 * principle's power scales with how many spheres of the same name you own.
 *
 * Almost every principle is spent at cast time (extra Zeon for a bigger area,
 * a lower armour type, a fixed projection…), so it cannot be a number on the
 * sheet. The single exception is "Regeneración zeónica avanzada", which raises
 * the base zeon regeneration by 10 per sphere — that is why `prepareMagic`
 * only reads `regenSteps` and leaves everything else as displayable text.
 */
export interface MetamagiaDef {
  /** How many spheres this principle can reach (Arcana caps most at 2-3). */
  maxSpheres?: number;
  /** Adds 10 × spheres to the zeon regeneration multiple (Excel PDs!AA95). */
  regenSteps?: boolean;
  /** Summary of the printed "Efectos de Juego", shown in the sheet. */
  effect: string;
}

/** Accent- and case-insensitive key, so graph labels and lookups always match. */
export function metamagiaKey(label: string): string {
  return label
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function entry(label: string, def: MetamagiaDef): [string, MetamagiaDef] {
  return [metamagiaKey(label), def];
}

/** Effects transcribed from Arcana Exxet pp. 20-29, keyed by normalized label. */
export const METAMAGIA_CATALOG: Readonly<Record<string, MetamagiaDef>> = Object.fromEntries([
  // --- Bellum Domini Archanum (combat magic) ---------------------------------
  entry("Escudos potenciados", {
    maxSpheres: 2,
    effect: "El aguante de los escudos se dobla (1 esfera) o se triplica (2 esferas).",
  }),
  entry("Precisión mística", {
    maxSpheres: 2,
    effect:
      "Los conjuros de ataque ganan la regla de Preciso; con 2 esferas también los de área, " +
      "pudiendo designar blancos específicos.",
  }),
  entry("Incremento destructivo", {
    maxSpheres: 2,
    effect:
      "El daño base de los conjuros de ataque sube +10/+20/+30/+40 por grado (1 esfera) " +
      "o +20/+40/+60/+80 (2 esferas).",
  }),
  entry("Área potenciada", {
    maxSpheres: 2,
    effect: "El área de efecto de los conjuros aumenta un 50% (1 esfera) o se dobla (2 esferas).",
  }),
  entry("Eliminar protección", {
    maxSpheres: 3,
    effect:
      "Al lanzar un conjuro de Ataque o Anímico puede invertir Zeón extra para reducir 1 punto " +
      "de TA del blanco cada 10 Zeón. Límite +20/+40/+60 según esferas.",
  }),
  entry("Erudición defensiva", {
    maxSpheres: 3,
    effect:
      "Al lanzar un escudo puede invertir Zeón extra para un bono igual a su Proyección Mágica " +
      "defensiva mientras dure el conjuro. Límite 20/40/60 Zeón. No acumula con el conjuro de " +
      "Libre Acceso homónimo.",
  }),
  entry("Erudición ofensiva", {
    maxSpheres: 3,
    effect:
      "Al lanzar un conjuro de Ataque o Anímico puede invertir Zeón extra para un bono igual a " +
      "su Proyección Mágica ofensiva. Límite 20/40/60 Zeón.",
  }),
  entry("Doble daño", {
    maxSpheres: 1,
    effect:
      "El daño base de todos los conjuros ofensivos se dobla. No afecta a bonos adicionales al " +
      "daño de otras fuentes.",
  }),
  entry("Seguridad defensiva", {
    effect:
      "Una pifia al lanzar un escudo mágico no anula el conjuro: solo se resta el valor de la " +
      "pifia a la habilidad.",
  }),
  entry("Control del espacio", {
    effect:
      "Permite elegir qué blancos reciben el ataque dentro del área de sus conjuros ofensivos, " +
      "incluso en los que indican lo contrario.",
  }),
  entry("Control de la energía", {
    effect:
      "Invirtiendo 10 Zeón, cualquier conjuro de Ataque pasa a poder dañar energía.",
  }),
  entry("Romper resistencias", {
    maxSpheres: 2,
    effect:
      "Los conjuros Anímicos aumentan la RM a superar 5 puntos (1 esfera) o 10 (2 esferas) por " +
      "cada 50% de daño obtenido.",
  }),
  entry("Efectos persistentes", {
    effect:
      "Los conjuros Anímicos que permiten repetir la RM cada 5 asaltos pasan a permitirla cada 10.",
  }),
  entry("Enlazar conjuros", {
    effect:
      "Lanza dos conjuros enlazados con una sola tirada de Proyección Mágica. Dos ataques se " +
      "combinan tomando el daño mayor más la mitad del menor.",
  }),

  // --- Potestas Archanum (zeon economy) -------------------------------------
  entry("Regeneración zeónica avanzada", {
    maxSpheres: 3,
    regenSteps: true,
    effect:
      "Incrementa la Regeneración zeónica base en 10 puntos por esfera (+10/+20/+30), antes de " +
      "cualquier otro modificador.",
  }),
  entry("Zeón ilimitado", {
    effect:
      "Al lanzar un conjuro gasta solo la mitad del Zeón que cuesta. Sigue necesitando acumular " +
      "el valor completo.",
  }),
  entry("Explotación de la energía física", {
    maxSpheres: 2,
    effect:
      "Cada punto de Cansancio invertido en el ACT da +25 (1 esfera) o +40 (2 esferas) en lugar " +
      "del +15 habitual.",
  }),
  entry("Elevación", {
    effect:
      "Entra en un trance (-200 a Advertir) en el que el tiempo cuenta doble para la regeneración " +
      "zeónica. Salir bruscamente cuesta la mitad del Cansancio actual.",
  }),
  entry("Avatar", {
    effect:
      "Se convierte en una criatura intangible que sustituye sus PV por sus puntos de Zeón. Dura " +
      "tantos asaltos como su Poder.",
  }),
  entry("Forzar velocidad", {
    maxSpheres: 3,
    effect:
      "Puede gastar Zeón antes de la iniciativa para un bono al Turno igual a lo invertido. " +
      "Límite 20/40/… según esferas.",
  }),
  entry("Concentración mística", {
    effect:
      "Reduce a la mitad la Dificultad del control de Resistir el Dolor necesario para conservar " +
      "el Zeón acumulado al sufrir daño.",
  }),
  entry("Transmisión de magia", {
    effect:
      "Puede transmitir o absorber Zeón sin contacto físico, hasta una distancia en metros igual " +
      "a su Presencia.",
  }),
  entry("Aguante al daño sobrenatural", {
    effect:
      "Puede sufrir la mitad del daño de un ataque mágico en puntos de Zeón en lugar de PV. No " +
      "funciona contra entidades con 20 puntos de Gnosis por encima.",
  }),
  entry("Magia vital", {
    maxSpheres: 2,
    effect:
      "Los conjuros de curación aumentan +20/+40/+60/+80 PV por grado (1 esfera) o el doble " +
      "(2 esferas).",
  }),

  // --- Esoteros / Cognos Archanum -------------------------------------------
  entry("Proyección mágica determinada", {
    maxSpheres: 4,
    effect:
      "Gastando Zeón, el conjuro se proyecta con una Habilidad Final fija en vez de tirar: " +
      "10 Zeón → 120, 20 Zeón → 140, y así según esferas.",
  }),
  entry("Distancia incrementada", {
    maxSpheres: 2,
    effect:
      "El alcance que marca la Proyección Mágica se dobla (1 esfera) o se cuadruplica (2 esferas).",
  }),
  entry("Doble conjuro", {
    effect:
      "Lanza dos conjuros distintos en un asalto usando el doble de su ACT; ninguno puede superar " +
      "individualmente su ACT base.",
  }),
  entry("Doble conjuro innato", {
    effect:
      "Puede lanzar dos conjuros innatos distintos por asalto. No cambia cuántos puede mantener " +
      "gratis (sigue siendo uno).",
  }),
  entry("Conjuro innato superior", {
    effect: "Puede lanzar conjuros innatos mientras acumula Zeón (no mientras lanza un conjuro).",
  }),
  entry("Mantenimiento añadido", {
    effect:
      "Los conjuros con mantenimiento por asalto pasan a pagarse cada 5 turnos, y los diarios " +
      "pasan a semanales. Limitado a un conjuro por cada 2 puntos de Poder.",
  }),
  entry("Alta Magia", {
    effect:
      "Permite lanzar conjuros de Alta Magia sin tener Gnosis 25, invirtiendo cantidades de Zeón " +
      "muy superiores. Solo con conjuro determinado.",
  }),
  entry("Maximización de conjuros", {
    effect: "Otorga +1 a Inteligencia a la hora de calcular el requisito de grado de los conjuros.",
  }),
  entry("Magia combinada", {
    effect:
      "Varios brujos pueden aunar su Zeón para lanzar un mismo conjuro, usando la Proyección " +
      "Mágica más alta y el turno más lento.",
  }),
  entry("Bucle existencial", {
    effect:
      "Consume grandes cantidades de magia para aislarse del fluir del tiempo unos instantes. " +
      "Dentro no puede moverse más de un metro ni afectar a terceros.",
  }),
  entry("Sentir la magia", {
    effect:
      "Percibe los rastros y emanaciones sobrenaturales de cualquier fuente de magia, facilitando " +
      "detectar sortilegios y acumulaciones de Zeón.",
  }),
  entry("Magia oculta", {
    effect:
      "Reduce a la mitad los penalizadores de Valoración Mágica para ocultar sus conjuros mientras " +
      "acumula Zeón, y dificulta que otros lo detecten.",
  }),
  // The tree carries four "Conjuro especializado" spheres, each capped at a
  // different spell level; the printed rule is the same for all of them.
  ...["Conjuro especializado Nv 30", "Conjuro especializado Nv 60", "Conjuro especializado Nv 70", "Conjuro especializado Nv 80"].map(
    (label) =>
      entry(label, {
        effect:
          "Elige un conjuro conocido (hasta el nivel indicado): al prepararlo obtiene +10 ACT y " +
          "+1 a Inteligencia para calcular su Grado.",
      }),
  ),
]);

/** What an actor's acquired metamagia list contributes to the derived values. */
export interface ResolvedMetamagia {
  /** Magic level spent on the acquired spheres (roots are free). */
  magicLevelSpent: number;
  /** Spheres of "Regeneración zeónica avanzada" (10 zeon regen each). */
  regenSteps: number;
  /** Acquired ids that are not in the graph (stale data after a tree edit). */
  unknownIds: string[];
}

/**
 * Resolve the actor's acquired node ids. The cost comes from the *node* (the
 * same principle costs a different amount depending on the branch it is taken
 * from) and the effect from the *label* catalog, because node ids are
 * positional and labels repeat across branches.
 */
export function resolveMetamagias(ids: readonly string[]): ResolvedMetamagia {
  let magicLevelSpent = 0;
  let regenSteps = 0;
  const unknownIds: string[] = [];

  for (const id of ids) {
    const node = METAMAGIA_NODES.get(id);
    if (!node) {
      unknownIds.push(id);
      continue;
    }
    magicLevelSpent += node.cost ?? 0;
    if (METAMAGIA_CATALOG[metamagiaKey(node.label)]?.regenSteps) regenSteps++;
  }

  return { magicLevelSpent, regenSteps, unknownIds };
}

/** Catalog entry for a graph node label, for the sheet tooltip. */
export function metamagiaDef(label: string): MetamagiaDef | undefined {
  return METAMAGIA_CATALOG[metamagiaKey(label)];
}
