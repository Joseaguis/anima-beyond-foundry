/**
 * Chat cards, built as HTML strings rather than Handlebars templates: the
 * sheets are pure React and there is no `templates/` directory in this project,
 * so adding Handlebars just for chat would mean a build step, a `system.json`
 * entry and a second templating language for one feature.
 *
 * Every class here is styled in `src/styles/main.css` under `.anima-card`.
 */

import { CHECK_TYPES } from "../check/types";
import type { AnimaRoll } from "../dice/AnimaRoll";
import type { CheckResult } from "../check/resolve";
import type { RoundResolution } from "../combat/resolution";
import type { ShieldDefenseResult } from "../combat/shield";
import type { CastFlag, PsychicFlag } from "./flags";

/** Escape anything that came from user input before it reaches innerHTML. */
export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function localize(key: string, fallback: string): string {
  if (typeof game === "undefined" || !game.i18n) return fallback;
  const localized = game.i18n.localize(key);
  return localized === key ? fallback : localized;
}

function signed(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`;
}

// ------------------------------------------------------------- check card ---

export function renderCheckCard(roll: AnimaRoll): string {
  const check = roll.check;
  if (!check) return `<div class="anima-card"><div class="anima-card__total">${roll.total}</div></div>`;
  return renderCheckHtml(check, roll.payload.label ?? "");
}

/**
 * The card body. Split out from {@link renderCheckCard} so the sandbox can
 * preview a card without a Foundry Roll behind it.
 */
export function renderCheckHtml(check: CheckResult, label: string): string {
  return [
    `<div class="anima-card anima-card--check ${outcomeClass(check)}">`,
    label ? `<h4 class="anima-card__title">${escapeHtml(label)}</h4>` : "",
    renderDice(check),
    renderBreakdown(check),
    `<div class="anima-card__total" data-total="${check.total}">${check.total}</div>`,
    renderOutcome(check),
    "</div>",
  ]
    .filter(Boolean)
    .join("");
}

function outcomeClass(check: CheckResult): string {
  if (check.isFumble) return "is-fumble";
  if (check.success === true) return "is-success";
  if (check.success === false) return "is-failure";
  if (check.isOpen) return "is-open";
  return "";
}

function renderDice(check: CheckResult): string {
  if (check.automatic) {
    return `<div class="anima-card__dice anima-card__dice--auto">${escapeHtml(
      localize("ANIMA.RollAutomatic", "Éxito automático — sin tirada"),
    )}</div>`;
  }

  const dice = check.dice
    .map((die, index) => {
      const classes = ["anima-card__die"];
      if (index > 0) classes.push("anima-card__die--open");
      if (index === 0 && check.isFumble) classes.push("anima-card__die--fumble");
      if (die === 100) classes.push("anima-card__die--max");
      return `<span class="${classes.join(" ")}">${die}</span>`;
    })
    .join('<span class="anima-card__plus">+</span>');

  const faces = CHECK_TYPES[check.type].die;
  return `<div class="anima-card__dice" data-faces="${faces}">${dice}</div>`;
}

function renderBreakdown(check: CheckResult): string {
  const rows: string[] = [];

  rows.push(row(localize("ANIMA.RollAbility", "Habilidad"), String(check.base)));

  for (const modifier of check.appliedModifiers) {
    rows.push(row(escapeHtml(modifier.label), signed(modifier.value), "is-modifier"));
  }

  if (check.isOpen) {
    rows.push(
      row(
        localize("ANIMA.RollOpen", "Tirada abierta"),
        `×${check.opens}`,
        "is-open",
      ),
    );
  }

  if (check.isFumble) {
    const level = check.fumbleLevel;
    const value =
      level === null
        ? localize("ANIMA.RollFumbleNoLevel", "actúa el último")
        : check.fumbleApplied
          ? signed(-level)
          : String(level);
    rows.push(row(localize("ANIMA.RollFumbleLevel", "Nivel de pifia"), value, "is-fumble"));
  }

  if (check.mastery) {
    rows.push(row(localize("ANIMA.RollMastery", "Maestría"), "≥200", "is-mastery"));
  }

  return `<div class="anima-card__breakdown">${rows.join("")}</div>`;
}

function row(label: string, value: string, extra = ""): string {
  return `<div class="anima-card__row ${extra}"><span>${label}</span><span>${value}</span></div>`;
}

function renderOutcome(check: CheckResult): string {
  const parts: string[] = [];

  if (check.isFumble) {
    parts.push(tag(localize("ANIMA.RollFumble", "¡Pifia!"), "is-fumble"));
  }
  if (check.naturalHundred) {
    parts.push(tag(localize("ANIMA.RollNatural100", "100 natural"), "is-success"));
  }
  if (check.grade) {
    parts.push(tag(escapeHtml(check.grade.label), "is-grade"));
  }
  if (check.difficulty !== null && check.success !== null) {
    const word = check.success
      ? localize("ANIMA.RollSuccess", "Éxito")
      : localize("ANIMA.RollFailure", "Fracaso");
    const margin = check.margin === null ? "" : ` (${signed(check.margin)})`;
    parts.push(tag(`${word}${escapeHtml(margin)}`, check.success ? "is-success" : "is-failure"));
  }

  return parts.length > 0 ? `<div class="anima-card__outcome">${parts.join("")}</div>` : "";
}

function tag(text: string, extra = ""): string {
  return `<span class="anima-card__tag ${extra}">${text}</span>`;
}

// ------------------------------------------------------- opposed sections ---

/** Buttons offering the defender their possible reactions. */
export function renderDefenseButtons(messageId: string): string {
  const options: { action: string; label: string; fallback: string }[] = [
    { action: "parry", label: "ANIMA.Parry", fallback: "Parada" },
    { action: "dodge", label: "ANIMA.Dodge", fallback: "Esquiva" },
    { action: "magic-shield", label: "ANIMA.MagicShield", fallback: "Escudo mágico" },
    { action: "psychic-defense", label: "ANIMA.PsychicDefense", fallback: "Defensa psíquica" },
  ];

  const buttons = options
    .map(
      (option) =>
        `<button type="button" class="anima-card__button" data-anima-action="defend" ` +
        `data-defense="${option.action}" data-message-id="${escapeHtml(messageId)}">` +
        `${escapeHtml(localize(option.label, option.fallback))}</button>`,
    )
    .join("");

  return (
    `<div class="anima-card__buttons" data-state="pending">` +
    `<span class="anima-card__hint">${escapeHtml(
      localize("ANIMA.RollAwaitingDefense", "Esperando defensa"),
    )}</span>${buttons}</div>`
  );
}

/**
 * The grade a spell went off at, its Zeón cost, and the buttons that commit the
 * two consequences a roll cannot commit on its own: spending the Zeón (which is
 * owed even on a fumble, Core p. 116) and raising the shield.
 */
export function renderCastActions(cast: CastFlag, messageId: string): string {
  const rows = [
    row(localize("ANIMA.CastGrade", "Grado"), escapeHtml(gradeLabel(cast.grade))),
    row(localize("ANIMA.ItemZeonCost", "Zeón"), String(cast.zeonCost)),
  ];

  const buttons: string[] = [];
  if (cast.zeonCost > 0) {
    buttons.push(
      button("spend-zeon", `${localize("ANIMA.SpendZeon", "Gastar Zeón")} (${cast.zeonCost})`, {
        "data-amount": String(cast.zeonCost),
        "data-message-id": messageId,
      }),
    );
  }
  if (cast.shield) {
    buttons.push(
      button(
        "raise-shield",
        `${localize("ANIMA.RaiseShield", "Levantar escudo")} (${cast.shield.maxPoints})`,
        { "data-message-id": messageId },
      ),
    );
  }

  return (
    `<div class="anima-card__cast">` +
    `<div class="anima-card__breakdown">${rows.join("")}</div>` +
    (buttons.length ? `<div class="anima-card__buttons">${buttons.join("")}</div>` : "") +
    `</div>`
  );
}

const GRADE_LABELS: Record<string, string> = {
  base: "Base",
  intermediate: "Intermedio",
  advanced: "Avanzado",
  arcane: "Arcano",
};

function gradeLabel(grade: string): string {
  return GRADE_LABELS[grade] ?? grade;
}

function button(action: string, text: string, attrs: Record<string, string> = {}): string {
  const extra = Object.entries(attrs)
    .map(([key, value]) => `${key}="${escapeHtml(value)}"`)
    .join(" ");
  return (
    `<button type="button" class="anima-card__button" data-anima-action="${action}" ${extra}>` +
    `${escapeHtml(text)}</button>`
  );
}

/**
 * What a psychic power achieved: the row of the ladder the potential check
 * reached, and the follow-ups it unlocks. Reaching a grade is not the same as
 * hitting anyone — an offensive power still needs its Psychic Projection roll.
 */
export function renderPsychicOutcome(psychic: PsychicFlag, messageId: string): string {
  const rows = [row(localize("ANIMA.PsychicGrade", "Grado alcanzado"), escapeHtml(psychic.gradeLabel))];
  if (psychic.effect) {
    rows.push(row(localize("ANIMA.ItemEffect", "Efecto"), escapeHtml(stripTags(psychic.effect))));
  }
  if (psychic.strike) {
    rows.push(row(localize("ANIMA.DamagePercent", "Daño"), String(psychic.strike.finalDamage)));
  }

  const buttons: string[] = [];
  if (psychic.strike) {
    buttons.push(
      button("psychic-project", localize("ANIMA.PsiProj", "Proyección psíquica"), {
        "data-message-id": messageId,
      }),
    );
  }
  if (psychic.shield) {
    buttons.push(
      button(
        "raise-shield",
        `${localize("ANIMA.RaiseShield", "Levantar escudo")} (${psychic.shield.maxPoints})`,
        { "data-message-id": messageId },
      ),
    );
  }

  return (
    `<div class="anima-card__cast">` +
    `<div class="anima-card__breakdown">${rows.join("")}</div>` +
    (buttons.length ? `<div class="anima-card__buttons">${buttons.join("")}</div>` : "") +
    `</div>`
  );
}

/** Grade effects come from an HTMLField; the card shows them as plain text. */
function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/** What the blow cost the shield that stopped it. */
export function renderShieldResult(name: string, outcome: ShieldDefenseResult): string {
  const rows: string[] = [];

  if (outcome.blockedByBarrier) {
    rows.push(
      row(
        escapeHtml(name),
        localize("ANIMA.ShieldBarrierHeld", "el golpe no llega a la barrera"),
        "is-success",
      ),
    );
  } else if (!outcome.stopped) {
    rows.push(
      row(escapeHtml(name), localize("ANIMA.ShieldOverwhelmed", "la defensa no alcanzó")),
    );
  } else {
    rows.push(row(escapeHtml(name), `−${outcome.pointsSpent}`));
    rows.push(
      row(
        localize("ANIMA.ShieldRemaining", "Aguante restante"),
        String(outcome.pointsRemaining),
        outcome.broken ? "is-fumble" : "",
      ),
    );
    if (outcome.broken) {
      rows.push(
        row(
          localize("ANIMA.ShieldBroken", "¡Escudo roto!"),
          `${localize("ANIMA.ShieldPenetrating", "daño que pasa")}: ${outcome.penetratingDamage}`,
          "is-fumble",
        ),
      );
    }
  }

  return (
    `<div class="anima-card__shield ${outcome.broken ? "is-broken" : ""}">` +
    `<div class="anima-card__breakdown">${rows.join("")}</div></div>`
  );
}

/** The Resultado del Asalto block appended once the defender has rolled. */
export function renderRoundResult(
  resolution: RoundResolution,
  options: { messageId: string; targetUuid?: string | null } = { messageId: "" },
): string {
  const rows: string[] = [
    row(localize("ANIMA.RoundResult", "Resultado del asalto"), signed(resolution.roundResult)),
  ];

  if (resolution.fumbledAway) {
    rows.push(
      row(
        localize("ANIMA.RollFumble", "¡Pifia!"),
        localize("ANIMA.RoundAutoMiss", "el ataque falla"),
        "is-fumble",
      ),
    );
    if (resolution.fumbleBonusToOpponent > 0) {
      rows.push(
        row(
          localize("ANIMA.RoundFumbleBonus", "Bono al rival"),
          signed(resolution.fumbleBonusToOpponent),
        ),
      );
    }
  } else if (resolution.hit) {
    rows.push(
      row(localize("ANIMA.Absorption", "Absorción"), `−${resolution.absorption.total}`),
    );
    if (resolution.absorption.piercedGrades > 0) {
      rows.push(
        row(
          localize("ANIMA.AtPiercing", "TA ignorada"),
          `${resolution.absorption.piercedGrades}`,
        ),
      );
    }
    rows.push(
      row(localize("ANIMA.DamagePercent", "Daño"), `${resolution.damagePercent}%`),
    );
  } else if (resolution.counterattack) {
    rows.push(
      row(
        localize("ANIMA.Counterattack", "Contraataque"),
        signed(resolution.counterBonus),
        "is-success",
      ),
    );
  }

  const apply =
    resolution.hit && resolution.damage > 0
      ? `<button type="button" class="anima-card__button is-damage" data-anima-action="apply-damage" ` +
        `data-damage="${resolution.damage}" data-target-uuid="${escapeHtml(options.targetUuid ?? "")}" ` +
        `data-message-id="${escapeHtml(options.messageId)}">` +
        `${escapeHtml(localize("ANIMA.ApplyDamage", "Aplicar daño"))} (${resolution.damage})</button>`
      : "";

  return (
    `<div class="anima-card__round ${resolution.hit ? "is-hit" : "is-miss"}">` +
    `<div class="anima-card__breakdown">${rows.join("")}</div>${apply}</div>`
  );
}
