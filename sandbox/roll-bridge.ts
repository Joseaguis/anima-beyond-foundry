/**
 * Rolling inside the sandbox. The real `AnimaStatistic.roll()` needs Foundry
 * (ChatMessage, ApplicationV2, the Roll class), but everything below it is
 * Foundry-free — so the sandbox reuses the actual statistic builder, the actual
 * check resolver and the actual card renderer, and only swaps the dice backend
 * and the chat sink.
 *
 * That means a card you see here is byte-for-byte the one Foundry will show.
 */

import { buildStatistics } from "../src/system/statistic/build";
import { resolveCheck } from "../src/system/check/resolve";
import { renderCheckHtml } from "../src/system/chat/card";
import { randomBackend } from "../src/system/dice/backend";
import { emptySynthetics } from "../src/rules/synthetics";
import { stackBreakdown } from "../src/rules/modifier";
import { sandboxChat } from "./foundry-shim";
import type { RollOps } from "../src/sheets/ReactSheet";
import type { AnimaActor } from "../src/documents/actor";

export function buildRollOps(actor: unknown): RollOps {
  // The mock actor has no preparation cycle, so give it the empty synthetics
  // the statistic layer expects to read.
  const target = actor as AnimaActor & { synthetics?: unknown };
  if (!target.synthetics) target.synthetics = emptySynthetics();
  if (typeof target.getRollOptions !== "function") {
    target.getRollOptions = () => new Set<string>();
  }

  const statistics = buildStatistics(target);

  return {
    rollable: new Set(statistics.keys()),
    onRoll: async (slug) => {
      const statistic = statistics.get(slug);
      if (!statistic) {
        sandboxChat.push("warn", "Tirada", `No existe la estadística "${slug}"`);
        return;
      }

      const modifiers = statistic.modifiers();
      const result = await resolveCheck(randomBackend(), {
        type: statistic.type,
        base: statistic.base,
        modifiers,
      });

      sandboxChat.push(
        "roll",
        statistic.label,
        `${statistic.base + stackBreakdown(modifiers).total} → ${result.total}`,
        renderCheckHtml(result, statistic.label),
      );
    },
  };
}
