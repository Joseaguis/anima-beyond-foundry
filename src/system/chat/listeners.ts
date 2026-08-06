/**
 * Chat card interactivity: the defence buttons that complete an opposed roll,
 * and the "apply damage" button.
 *
 * Cards are plain HTML (see ./card.ts), so this is one delegated click handler
 * per rendered message rather than a framework. Everything it needs to act on
 * lives in `message.flags.animabfv2`.
 */

import { renderRoundResult, renderShieldResult } from "./card";
import { readAnimaFlags, SOCKET_NAME, SYSTEM_ID, type ApplyDamageRequest } from "./flags";
import { resolveRound } from "../combat/resolution";
import { resolveShieldDefense, type ActiveShield, type ShieldDefenseResult } from "../combat/shield";
import type { AnimaActor } from "../../documents/actor";
import type { AnimaStatistic } from "../statistic/statistic";

/** Which statistic each defence button rolls. */
const DEFENSE_STATISTICS: Record<string, string[]> = {
  parry: ["parry"],
  dodge: ["dodge"],
  "magic-shield": ["magic-projection-defense"],
  "psychic-defense": ["psychic-projection"],
};

export function registerChatListeners(): void {
  // Foundry v13+ renders chat messages to an HTMLElement; the older hook is
  // kept so a jQuery-era build still wires up.
  Hooks.on("renderChatMessageHTML", (message, element) => {
    attach(message as ChatMessage, element as HTMLElement);
  });

  if (game.socket) {
    game.socket.on(SOCKET_NAME, (request: unknown) => {
      void handleSocketRequest(request as ApplyDamageRequest);
    });
  }
}

function attach(message: ChatMessage, element: HTMLElement): void {
  for (const button of element.querySelectorAll<HTMLElement>("[data-anima-action]")) {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      const action = button.dataset.animaAction;
      if (action === "defend") void onDefend(message, button);
      else if (action === "apply-damage") void onApplyDamage(message, button);
      else if (action === "spend-zeon") void onSpendZeon(message, button);
      else if (action === "raise-shield") void onRaiseShield(message);
      else if (action === "psychic-project") void onPsychicProject(message);
    });
  }
}

// ------------------------------------------------------------- defending ---

async function onDefend(attackMessage: ChatMessage, button: HTMLElement): Promise<void> {
  const flags = readAnimaFlags(attackMessage);
  if (!flags?.opposed || flags.opposed.state === "resolved") return;

  const defender = resolveDefender(flags.opposed.targetUuid);
  if (!defender) {
    ui.notifications?.warn(
      game.i18n.localize("ANIMA.RollNoDefender") ||
        "Selecciona el token que se defiende antes de tirar.",
    );
    return;
  }

  const kind = button.dataset.defense ?? "parry";
  const statistic = pickDefenseStatistic(defender, kind);
  if (!statistic) {
    ui.notifications?.warn(
      game.i18n.format("ANIMA.RollNoDefenseStatistic", { kind }) ||
        `${defender.name} no tiene esa defensa.`,
    );
    return;
  }

  // A shield is not a defence ability but a pool of points, and a character
  // may only use one kind of defence per attack (Core p. 98), so picking the
  // shield button means the shield is what takes the blow.
  const shieldKinds = new Set(["magic-shield", "psychic-defense"]);
  const shield = shieldKinds.has(kind) ? pickShield(defender, kind) : null;
  if (shieldKinds.has(kind) && !shield) {
    ui.notifications?.warn(
      game.i18n.localize("ANIMA.NoActiveShield") ||
        `${defender.name} no tiene ningún escudo levantado.`,
    );
    return;
  }

  // Defences are rolled without the dialog: the attack is already on the table
  // and the defender's situational modifiers are the ones prep knows about.
  const outcome = await statistic.roll({ skipDialog: true });
  if (!outcome) return;

  const attack = flags.check.result;
  const baseDamage = flags.strike?.finalDamage ?? 0;
  const absorption = {
    at: readArmorTypes(defender),
    attackType: flags.strike?.attackType ?? null,
    atPiercing: flags.strike?.atPiercing ?? 0,
    ignoresArmor: flags.strike?.ignoresArmor,
  };

  let shieldOutcome: ShieldDefenseResult | null = null;
  let resolution;

  if (shield) {
    shieldOutcome = resolveShieldDefense({
      attackTotal: attack.total,
      defenseTotal: outcome.result.total,
      baseDamage,
      attackType: flags.strike?.attackType ?? null,
      shield,
    });

    // Breaking through skips the defence entirely: the victim takes the blow
    // "con la habilidad plena del espadachín", with the damage cut down to
    // whatever crossed the barrier.
    resolution = shieldOutcome.broken
      ? resolveRound({
          attackTotal: attack.total,
          defenseTotal: 0,
          finalDamage: shieldOutcome.penetratingDamage,
          attackerFumbled: attack.isFumble,
          attackerFumbleLevel: attack.fumbleLevel,
          absorption,
        })
      : resolveRound({
          attackTotal: attack.total,
          defenseTotal: outcome.result.total,
          finalDamage: baseDamage,
          attackerFumbled: attack.isFumble,
          attackerFumbleLevel: attack.fumbleLevel,
          absorption,
        });

    await writeShield(defender, shield.id, shieldOutcome);
  } else {
    resolution = resolveRound({
      attackTotal: attack.total,
      defenseTotal: outcome.result.total,
      finalDamage: baseDamage,
      attackerFumbled: attack.isFumble,
      attackerFumbleLevel: attack.fumbleLevel,
      absorption,
    });
  }

  const targetUuid = defender.uuid ?? null;
  await attackMessage.update({
    content:
      stripDefenseButtons(attackMessage.content) +
      (shieldOutcome ? renderShieldResult(shield!.name, shieldOutcome) : "") +
      renderRoundResult(resolution, { messageId: attackMessage.id ?? "", targetUuid }),
    flags: {
      [SYSTEM_ID]: {
        opposed: { ...flags.opposed, state: "resolved", resolution, targetUuid },
      },
    },
  } as never);
}

/** The shield that steps in: the strongest one of the matching origin. */
function pickShield(defender: AnimaActor, kind: string): ActiveShield | null {
  const origin = kind === "psychic-defense" ? "psychic" : "magic";
  const shields = readShields(defender).filter((s) => s.points > 0 && !s.broken);
  // Magic-shield covers ki barriers too: they behave identically and nothing
  // else in the UI would ever reach them.
  const matching = shields.filter((s) => (origin === "magic" ? s.origin !== "psychic" : s.origin === "psychic"));
  const pool = matching.length > 0 ? matching : shields;
  return pool.sort((a, b) => b.points - a.points)[0] ?? null;
}

function readShields(actor: AnimaActor): ActiveShield[] {
  return ((actor.system as { shields?: ActiveShield[] }).shields ?? []).map((s) => ({ ...s }));
}

/** Commit what the blow cost the shield. A shield at zero is left, but flagged. */
async function writeShield(
  actor: AnimaActor,
  shieldId: string,
  outcome: ShieldDefenseResult,
): Promise<void> {
  if (outcome.pointsSpent === 0 && !outcome.broken) return;
  const shields = readShields(actor).map((s) =>
    s.id === shieldId
      ? { ...s, points: outcome.pointsRemaining, broken: s.broken || outcome.broken }
      : s,
  );
  await actor.update({ "system.shields": shields } as never);
}

/**
 * Who is defending: the token the user controls, else their assigned character,
 * else whoever the attack was aimed at.
 */
function resolveDefender(targetUuid?: string | null): AnimaActor | null {
  const controlled = canvas?.tokens?.controlled?.[0]?.actor;
  if (controlled) return controlled as unknown as AnimaActor;

  const assigned = game.user?.character;
  if (assigned) return assigned as unknown as AnimaActor;

  if (targetUuid) {
    const document = fromUuidSync(targetUuid) as { actor?: unknown } | null;
    const actor = (document as { actor?: unknown })?.actor ?? document;
    if (actor) return actor as AnimaActor;
  }
  return null;
}

/** The first of the candidate statistics the defender actually has. */
function pickDefenseStatistic(defender: AnimaActor, kind: string): AnimaStatistic | null {
  for (const slug of DEFENSE_STATISTICS[kind] ?? []) {
    const statistic = defender.getStatistic(slug);
    if (statistic) return statistic;
  }
  return null;
}

function readArmorTypes(defender: AnimaActor): Record<string, number> {
  const equipment = (defender.system as { equipment?: { at?: Record<string, number> } }).equipment;
  return equipment?.at ?? {};
}

/** The buttons have done their job; drop them so the card cannot be re-rolled. */
function stripDefenseButtons(content: string): string {
  return content.replace(/<div class="anima-card__buttons"[\s\S]*?<\/div>\s*$/, "");
}

// ------------------------------------------------------------- casting ------

/**
 * Spending the Zeón. Separate from the roll on purpose: the cost is owed even
 * when the spell fumbles (Core p. 116), but taking it automatically would make
 * a mis-click expensive, so the player commits it.
 */
async function onSpendZeon(message: ChatMessage, button: HTMLElement): Promise<void> {
  const flags = readAnimaFlags(message);
  if (!flags) return;
  if (flags.zeonSpent) {
    ui.notifications?.info(game.i18n.localize("ANIMA.ZeonAlreadySpent") || "El Zeón ya se gastó.");
    return;
  }

  const actor = actorFromUuid(flags.check.actorUuid);
  if (!actor) return;

  const amount = Number(button.dataset.amount ?? 0);
  const current = (actor.system as { magic?: { zeonCurrent?: number } }).magic?.zeonCurrent ?? 0;
  await actor.update({ "system.magic.zeonCurrent": current - amount } as never);
  await message.update({ flags: { [SYSTEM_ID]: { zeonSpent: { amount } } } } as never);
}

/** Raising the shield the spell just created, with its full pool of points. */
async function onRaiseShield(message: ChatMessage): Promise<void> {
  const flags = readAnimaFlags(message);
  const template = flags?.cast?.shield;
  if (!flags || !template) return;
  if (flags.shieldRaised) {
    ui.notifications?.info(
      game.i18n.localize("ANIMA.ShieldAlreadyRaised") || "El escudo ya está levantado.",
    );
    return;
  }

  const actor = actorFromUuid(flags.check.actorUuid);
  if (!actor) return;

  const shield: ActiveShield = {
    ...template,
    id: foundry.utils.randomID(),
    points: template.maxPoints,
    broken: false,
  };
  const shields = [...readShields(actor), shield];
  await actor.update({ "system.shields": shields } as never);
  await message.update({
    flags: { [SYSTEM_ID]: { shieldRaised: { shieldId: shield.id } } },
  } as never);
}

/**
 * Reaching a grade on the ladder is not the same as hitting anyone: an
 * offensive power still has to get to its target, which is a Psychic Projection
 * roll of its own (Core p. 212). This posts that second card, carrying the
 * damage of the grade the potential check reached.
 */
async function onPsychicProject(message: ChatMessage): Promise<void> {
  const flags = readAnimaFlags(message);
  const strike = flags?.psychic?.strike;
  if (!flags || !strike) return;

  const actor = actorFromUuid(flags.check.actorUuid);
  const statistic = actor?.getStatistic("psychic-projection");
  if (!statistic) {
    ui.notifications?.warn(
      game.i18n.localize("ANIMA.NoPsychicProjection") || "Este personaje no tiene Proyección Psíquica.",
    );
    return;
  }

  await statistic.roll({
    skipDialog: true,
    label: `${flags.check.label} · ${flags.psychic?.gradeLabel ?? ""}`.trim(),
    strike,
  });
}

function actorFromUuid(uuid: string | null): AnimaActor | null {
  if (!uuid) return null;
  return (fromUuidSync(uuid) as AnimaActor | null) ?? null;
}

// --------------------------------------------------------- applying damage ---

async function onApplyDamage(message: ChatMessage, button: HTMLElement): Promise<void> {
  const flags = readAnimaFlags(message);
  if (flags?.damageApplied) {
    ui.notifications?.info(
      game.i18n.localize("ANIMA.DamageAlreadyApplied") || "El daño ya se aplicó.",
    );
    return;
  }

  const amount = Number(button.dataset.damage ?? 0);
  const targetUuid = button.dataset.targetUuid ?? "";
  if (!amount || !targetUuid) return;

  const request: ApplyDamageRequest = {
    action: "applyDamage",
    targetUuid,
    amount,
    messageId: message.id ?? "",
  };

  // Players rarely own the actor they just hit, so the GM does the writing.
  const target = fromUuidSync(targetUuid) as AnimaActor | null;
  if (target?.isOwner) await applyDamage(request);
  else game.socket?.emit(SOCKET_NAME, request);
}

async function handleSocketRequest(request: ApplyDamageRequest): Promise<void> {
  if (!game.user?.isGM || request?.action !== "applyDamage") return;
  await applyDamage(request);
}

/** Subtract Life Points and mark the message, so damage lands exactly once. */
async function applyDamage(request: ApplyDamageRequest): Promise<void> {
  const actor = fromUuidSync(request.targetUuid) as AnimaActor | null;
  if (!actor) return;

  const lifePoints = (actor.system as { lifePoints?: { current?: number } }).lifePoints;
  const current = lifePoints?.current ?? 0;
  await actor.update({ "system.lifePoints.current": current - request.amount } as never);

  const message = game.messages?.get(request.messageId);
  if (message) {
    await message.update({
      flags: {
        [SYSTEM_ID]: { damageApplied: { amount: request.amount, targetUuid: request.targetUuid } },
      },
    } as never);
  }
}
