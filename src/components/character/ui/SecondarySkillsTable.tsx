import { SectionCard } from "./SectionCard";
import { DerivedValue } from "./fields";
import {
  SECONDARY_ABILITY_GROUPS,
  SECONDARY_ABILITIES_BY_GROUP,
  type ArmorPenaltyKind,
  type SecondaryAbilityDefinition,
} from "../../../data/secondaryAbilities";

const GRID = "1fr 84px 72px";

function sign(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`;
}

interface CustomAbility {
  name?: string;
  group?: string;
  final?: number;
  armorPenalty?: ArmorPenaltyKind;
}

/**
 * Read-only "Habilidades Secundarias" (Excel Principal sheet): groups with a
 * vertical side label and columns Habilidad | Pen. Natural | Total. The armor
 * natural penalty column maps each ability's penalty kind to the equipment
 * summary (full / half / unreducible); the DP breakdown lives in the PDs tab.
 */
export function SecondarySkillsTable({
  system,
  style,
}: {
  system: Record<string, any>;
  style?: React.CSSProperties;
}) {
  const equipment = system.equipment ?? {};
  const penaltyFor = (kind?: ArmorPenaltyKind): number | null => {
    if (!kind) return null;
    if (kind === "half") return equipment.naturalPenaltyHalf ?? 0;
    if (kind === "unreducible") return equipment.naturalPenaltyUnreduced ?? 0;
    return equipment.naturalPenalty ?? 0;
  };

  const custom: Record<string, CustomAbility> = system.customSecondary ?? {};
  const customByGroup: Record<string, CustomAbility[]> = {};
  for (const ability of Object.values(custom)) {
    if (!ability?.name) continue;
    (customByGroup[ability.group || "special"] ??= []).push(ability);
  }

  const row = (
    key: string,
    label: string,
    penalty: number | null,
    final: number,
    tip?: string,
  ) => (
    <div key={key} className="a-trow" style={{ gridTemplateColumns: GRID }}>
      <div className="px-2.5 py-0.5 text-xs truncate">{label}</div>
      <div className={`text-center text-[11px] ${penalty ? "a-red" : "a-muted"}`}>
        {penalty === null ? "—" : penalty}
      </div>
      <div className="text-center text-[12px]">
        <DerivedValue value={sign(final)} tip={tip} />
      </div>
    </div>
  );

  const groupBlock = (id: string, label: string, defs: SecondaryAbilityDefinition[]) => {
    const extra = customByGroup[id] ?? [];
    if (defs.length === 0 && extra.length === 0) return null;
    return (
      <div key={id} className="flex" style={{ borderBottom: "1px solid var(--bd)" }}>
        <div className="a-vlabel">{label}</div>
        <div className="flex-1 min-w-0">
          {defs.map((d) => {
            const o = system.secondary?.[d.key] ?? {};
            return row(
              d.key,
              game.i18n.localize(d.labelKey),
              penaltyFor(d.armorPenalty),
              o.final ?? 0,
              `${game.i18n.localize(d.labelKey)}|Base=${o.base ?? 0}|Bono=${sign(o.bonusTotal ?? 0)}|Cat=${o.catBonus ?? 0}|Especial=${sign(o.special ?? 0)}|=${o.final ?? 0}`,
            );
          })}
          {extra.map((a, i) =>
            row(`custom-${id}-${i}`, a.name ?? "", penaltyFor(a.armorPenalty), a.final ?? 0),
          )}
        </div>
      </div>
    );
  };

  return (
    <SectionCard title="Habilidades Secundarias" padded={false} className="a-zebra" style={style}>
      <div className="a-thead" style={{ gridTemplateColumns: `22px ${GRID}` }}>
        <div />
        <div>Habilidad</div>
        <div className="text-center">Pen. Natural</div>
        <div className="text-center">Total</div>
      </div>
      {SECONDARY_ABILITY_GROUPS.map((g) =>
        groupBlock(g.id, game.i18n.localize(g.labelKey), SECONDARY_ABILITIES_BY_GROUP[g.id] ?? []),
      )}
      {groupBlock("special", "Especial", [])}
    </SectionCard>
  );
}
