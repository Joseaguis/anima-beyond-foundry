/**
 * Supernatural shields (Core Exxet pp. 97-98).
 *
 * A shield is a pool of resistance points that stands in for a parry or a
 * dodge. Three rules make it different from any other defence, and all three
 * are counter-intuitive enough to be worth stating plainly:
 *
 * 1. **Stopping a blow still costs points.** The shield loses the attack's
 *    *base damage*, not the percentage the Resultado del Asalto would have
 *    dealt: *"Aunque Serenade para el golpe […] el impacto reduce
 *    automáticamente 60 puntos el aguante de la barrera"*.
 * 2. **Breaking through skips the defence entirely.** If the base damage
 *    exceeds what is left, the shield shatters and the victim *"sufre
 *    automáticamente el impacto sin la posibilidad de defenderse, pero
 *    reduciendo el daño base a la cifra que ha conseguido traspasar la
 *    barrera"* — so the round is re-resolved with no defence at all and the
 *    leftover damage.
 * 3. **A damage barrier makes small hits free.** An attack whose base damage
 *    never reaches the barrier cannot wear the shield down at all (Core p. 236),
 *    with one exception: energy damage always gets through, because it attacks
 *    the essence of a thing and not only its form.
 *
 * Pure and Foundry-free, like the rest of `combat/`.
 */

import { toAtType } from "./absorption";

/** What a spell or power creates when it is cast, before it takes any hits. */
export interface ShieldTemplate {
  name: string;
  origin: "magic" | "psychic" | "ki";
  itemId?: string;
  grade?: string;
  maxPoints: number;
  damageBarrier?: number;
  /** Shields that wear off on their own (the telekinetic one loses 5/round). */
  decayPerRound?: number;
}

/** A shield currently standing on an actor. */
export interface ActiveShield extends ShieldTemplate {
  id: string;
  /** Points left right now. */
  points: number;
  /**
   * Kept on the list after shattering instead of being deleted, so the round
   * that broke it can still be read on the sheet. The UI greys it out and the
   * defence flow skips it.
   */
  broken?: boolean;
  note?: string;
}

export interface ShieldDefenseInput {
  /** Attacker's ability plus dice. */
  attackTotal: number;
  /** Defender's projection roll. */
  defenseTotal: number;
  /** The attack's base damage — what wears the shield down. */
  baseDamage: number;
  /** `FIL`, `ENE`… Energy ignores the damage barrier. */
  attackType: string | null;
  shield: { points: number; damageBarrier?: number };
}

export interface ShieldDefenseResult {
  /** The projection roll beat the attack. */
  stopped: boolean;
  /** The blow was too weak to reach the barrier, so nothing was spent. */
  blockedByBarrier: boolean;
  pointsSpent: number;
  pointsRemaining: number;
  broken: boolean;
  /**
   * Damage that gets through when the shield shatters: base damage minus the
   * points it had left. Zero unless `broken`.
   */
  penetratingDamage: number;
}

/** Energy damage always crosses a damage barrier (Core p. 236). */
export function piercesBarrier(attackType: string | null | undefined): boolean {
  return toAtType(attackType) === "ene";
}

export function resolveShieldDefense(input: ShieldDefenseInput): ShieldDefenseResult {
  const points = Math.max(0, input.shield.points);
  const barrier = Math.max(0, input.shield.damageBarrier ?? 0);
  const baseDamage = Math.max(0, input.baseDamage);
  const stopped = input.attackTotal <= input.defenseTotal;

  // Under the barrier the shield does not even notice the hit — but only while
  // the defence actually holds. A blow that beats the projection gets through
  // whatever the barrier says.
  const blockedByBarrier =
    stopped && barrier > 0 && baseDamage < barrier && !piercesBarrier(input.attackType);

  if (!stopped || blockedByBarrier) {
    return {
      stopped,
      blockedByBarrier,
      pointsSpent: 0,
      pointsRemaining: points,
      broken: false,
      penetratingDamage: 0,
    };
  }

  const broken = baseDamage > points;
  const pointsSpent = Math.min(points, baseDamage);

  return {
    stopped,
    blockedByBarrier: false,
    pointsSpent,
    pointsRemaining: points - pointsSpent,
    broken,
    penetratingDamage: broken ? baseDamage - points : 0,
  };
}

/** Points a shield has left after a round of self-decay. */
export function decayShield(shield: ActiveShield): number {
  return Math.max(0, shield.points - (shield.decayPerRound ?? 0));
}
