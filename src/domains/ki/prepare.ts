import { baseFromDp, type PrepContext } from "../../actors/creature/prep/types";
import { KI_CHAR_KEYS, type KiCharBreakdown, type KiCharKey, type KiSystemSlice } from "./data";
import { getInnateKiAccumulation, getInnateKiPoints } from "./tables";

/** Ki points, accumulation and Martial Knowledge (CM) derived values. */
export function prepareKi(system: KiSystemSlice, ctx: PrepContext): void {
  const { categories, mod, charFinals } = ctx;

  const ki = system.ki;
  if (!ki) return;

  // Ki points and accumulation are tracked per characteristic: innate from the
  // characteristic value (with the 10 + 2·(v−10) scale above 10 for points),
  // plus points/accumulation bought with DP in that characteristic.
  const perChar = {} as Record<KiCharKey, KiCharBreakdown>;
  let pointsInnate = 0;
  let pointsBought = 0;
  let accInnate = 0;
  let accBought = 0;
  for (const c of KI_CHAR_KEYS) {
    const value = charFinals[c];
    const pInnate = getInnateKiPoints(value);
    const pBought = baseFromDp(categories, ki.pointsDp?.[c], (d) => d.supernatural.ki);
    const aInnate = getInnateKiAccumulation(value);
    const aBought = baseFromDp(categories, ki.accDp?.[c], (d) => d.supernatural.kiAccMultiple);
    perChar[c] = {
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

  // Conocimiento Marcial (CM) as a resource: total from prepareVitals, used by
  // the mkCost of Ki abilities and techniques plus combat styles / martial arts
  // / ars magnus. Like the DP reserves, an overspend is flagged, not clamped.
  ki.cmTotal = system.martialKnowledge ?? 0;
  ki.cmUsed =
    (system.kiAbilities ?? []).reduce((sum, a) => sum + (a.mkCost ?? 0), 0) +
    (system.kiTechniques ?? []).reduce((sum, t) => sum + (t.mkCost ?? 0), 0) +
    (system.combatStyles ?? []).reduce((sum, s) => sum + (s.mkCost ?? 0), 0);
  ki.cmAvailable = ki.cmTotal - ki.cmUsed;
  ki.cmOver = ki.cmAvailable < 0;
}
