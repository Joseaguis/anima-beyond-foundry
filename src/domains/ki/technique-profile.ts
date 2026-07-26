import type { RuleElementSource } from "../../rules/rule-element/base";
import type {
  TechniqueComposition,
  TechniqueDuration,
  TechniqueProfile,
} from "./technique-data";
import { SUSTAIN_ROUNDS, getEffectDef, resolveEffectOptions } from "./technique-tables";

/**
 * Derive what a technique actually does from its Efectos.
 *
 * Efectos of Tipo Asalto benefit everything the character does that round;
 * Efectos of Tipo Acción only the single Action they are tied to. That split is
 * what decides which bonuses can be expressed as plain modifiers and which need
 * the (future) activation runtime to resolve against a specific roll.
 */

/**
 * Efecto -> the stat it modifies, keyed as in `src/rules/targets.ts`.
 *
 * Only Efectos whose value is a flat numeric bonus to an existing stat appear
 * here. The rest (areas, states, extra attacks, intangibility...) land in the
 * structured half of the profile instead, because there is nothing to add them
 * to until the technique is actually used.
 */
const EFFECT_TARGETS: Record<string, string> = {
  "habilidad-de-ataque": "attack",
  "habilidad-de-ataque-completa": "attack",
  "maniobras-de-combate-y-apuntar": "attack",
  "maniobras-de-combate-y-apuntar-reales": "attack",
  "habilidad-de-contraataque": "attack",
  "habilidad-de-parada": "parry",
  "habilidad-de-parada-completa": "parry",
  "habilidad-de-parada-limitada": "parry",
  "habilidad-de-esquiva": "dodge",
  "habilidad-de-esquiva-completa": "dodge",
  "habilidad-de-esquiva-limitada": "dodge",
  "aumento-de-dano": "damage",
  "aumento-de-dano-real": "damage",
  "incrementar-turno": "initiative",
  "incremento-de-movimiento": "movement",
  "incremento-de-resistencia-fisica": "rf",
  "incremento-de-resistencia-magica": "rm",
  "incremento-de-resistencia-psiquica": "rp",
  "capacidad-incrementada-agi": "agi",
  "capacidad-incrementada-fue": "str",
  "capacidad-incrementada-des": "dex",
  "aumentar-entereza": "rf",
  "aumentar-rotura": "damage",
};

/** Efectos whose option label is a count of extra actions rather than a bonus. */
const EXTRA_ATTACK_EFFECTS = new Set([
  "ataque-adicional",
  "ataque-adicional-limitado",
  "acciones-adicionales",
]);
const EXTRA_DEFENSE_EFFECTS = new Set(["defensas-adicionales"]);
const ARMOR_EFFECTS = new Set(["armadura"]);
const RANGE_EFFECTS = new Set(["ataque-a-distancia", "ataque-a-distancia-real", "transporte-automatico"]);
const AREA_EFFECTS = new Set(["ataque-con-area", "ataque-con-area-real", "parada-en-area"]);

/** `"+125"` -> 125, `"-100"` -> −100, `"TA 3"` -> 3, `"100 metros"` -> 100. */
function optionValue(option: string): number | null {
  const m = option.match(/(-?\+?\d+(?:\.\d+)?)/);
  if (!m) return null;
  const value = Number(m[1].replace("+", ""));
  if (!Number.isFinite(value)) return null;
  // "1 kilómetro" and "5 kilómetros" are written in km, everything else in metres.
  if (/kil[oó]metro/i.test(option)) return value * 1000;
  return value;
}

function addTo(bucket: Partial<Record<string, number>>, target: string, value: number): void {
  bucket[target] = (bucket[target] ?? 0) + value;
}

/** The single most persistent duration among the technique's Efectos. */
function overallDuration(durations: TechniqueDuration[]): TechniqueProfile["duration"] {
  const mode: TechniqueDuration = durations.includes("sustainedMajor")
    ? "sustainedMajor"
    : durations.includes("sustainedMinor")
      ? "sustainedMinor"
      : durations.includes("maintained")
        ? "maintained"
        : "none";
  return { mode, rounds: SUSTAIN_ROUNDS[mode] ?? null };
}

export function buildTechniqueProfile(composition: TechniqueComposition): TechniqueProfile {
  const profile: TechniqueProfile = {
    round: {},
    action: {},
    extraAttacks: 0,
    extraDefenses: 0,
    armor: 0,
    range: 0,
    area: 0,
    states: [],
    activation: "passive",
    duration: { mode: "none", rounds: null },
  };

  const durations: TechniqueDuration[] = [];

  for (const entry of composition.effects ?? []) {
    const def = getEffectDef(entry.effect);
    if (!def) continue;
    durations.push(entry.duration);

    // A technique is Active as soon as one of its Efectos needs an Attack;
    // Defensa and Variable Efectos alone leave it Passive (Dominus p. 046).
    if (def.klass === "attack") profile.activation = "active";

    const { resolved } = resolveEffectOptions(def, entry.options);
    const target = EFFECT_TARGETS[def.key];
    const bucket = def.type === "round" ? profile.round : profile.action;

    for (const option of resolved) {
      const value = optionValue(option.option);

      if (option.option.startsWith("Estado añadido")) {
        // "Estado añadido: Terror" -> "Terror"
        profile.states.push(option.option.split(":").slice(1).join(":").trim());
        continue;
      }
      if (value === null) continue;

      // Estados Sobrenaturales and friends carry their reach as a
      // "Distancia: 25 metros" option rather than a separate Efecto.
      if (option.option.startsWith("Distancia:")) {
        profile.range = Math.max(profile.range, value);
        continue;
      }

      if (target) addTo(bucket, target, value);
      else if (EXTRA_ATTACK_EFFECTS.has(def.key)) profile.extraAttacks += value;
      else if (EXTRA_DEFENSE_EFFECTS.has(def.key)) profile.extraDefenses += value;
      else if (ARMOR_EFFECTS.has(def.key)) profile.armor = Math.max(profile.armor, value);
      else if (RANGE_EFFECTS.has(def.key)) profile.range = Math.max(profile.range, value);
      else if (AREA_EFFECTS.has(def.key)) profile.area = Math.max(profile.area, value);
    }
  }

  profile.duration = overallDuration(durations);
  return profile;
}

/**
 * Turn the persistent half of a profile into rule elements.
 *
 * Every modifier is gated on the `technique:<slug>:active` roll option, so
 * merely owning a technique changes nothing: the activation runtime adds that
 * option when the technique is used and the bonuses come to life. Only Tipo
 * Asalto Efectos are emitted — Tipo Acción ones apply to one specific Action and
 * need the runtime to know which.
 */
export function techniqueRuleElements(
  profile: TechniqueProfile,
  slug: string,
): RuleElementSource[] {
  const option = `technique:${slug}:active`;
  return Object.entries(profile.round)
    .filter(([, value]) => typeof value === "number" && value !== 0)
    .map(([target, value]) => ({
      key: "FlatModifier",
      target,
      value: value as number,
      type: "special",
      predicate: [option],
    }));
}
