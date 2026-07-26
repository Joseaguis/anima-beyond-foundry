import { Fragment, useState, type ReactNode } from "react";
import { SectionCard } from "../ui/SectionCard";
import { NumberField, DerivedValue } from "../ui/fields";
import { ItemList } from "../ui/ItemList";
import {
  DEFAULT_SECONDARY_ABILITIES,
  SECONDARY_ABILITY_GROUPS,
  SECONDARY_ABILITIES_BY_GROUP,
} from "../../../data/secondaryAbilities";
import {
  defaultCategoryData,
  dpRecord,
  type CategoryData,
  type ResolvedCategory,
} from "../../../actors/creature/prep/types";
import type { TabProps } from "./types";

const ARCHETYPE_LABELS: Record<string, string> = {
  fighter: "Guerrero",
  stalker: "Acechador",
  mystic: "Místico",
  domine: "Dominus",
  freelancer: "Novel",
};

const CHAR_TAGS: Record<string, string> = {
  str: "FUE",
  dex: "DES",
  agi: "AGI",
  con: "CON",
  int: "INT",
  pow: "POD",
  wp: "VOL",
  per: "PER",
};

/** The six Ki characteristics, in Excel Ki-sheet order (AGI/CON/DES/FUE/POD/VOL). */
const KI_CHARS = [
  { key: "agi", tag: "AGI" },
  { key: "con", tag: "CON" },
  { key: "dex", tag: "DES" },
  { key: "str", tag: "FUE" },
  { key: "pow", tag: "POD" },
  { key: "wp", tag: "VOL" },
] as const;

/** DP paths whose spend counts against each reserve (mirrors development.ts). */
const RESERVE_PATHS = {
  combat: [
    "combat.attack.dp",
    "combat.parry.dp",
    "combat.dodge.dp",
    "combat.wearArmor.dp",
    "combat.martialKnowledge.dp",
    // Ki points and accumulation are bought per characteristic (6 each).
    ...KI_CHARS.flatMap((c) => [`ki.pointsDp.${c.key}`, `ki.accDp.${c.key}`]),
  ],
  magic: ["magic.zeonDp", "magic.magicProjectionDp"],
  psychic: ["psychic.cvDp", "psychic.projectionDp"],
} as const;

type ReserveKey = keyof typeof RESERVE_PATHS;

function sign(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`;
}

function readPath(obj: Record<string, any>, path: string): any {
  return path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
}

interface CategorySlot {
  key: string;
  itemId: string;
  levels: number;
  changeCost: number;
}

/** One category column pair (Coste | PDs) of the Excel layout. */
interface SlotView {
  key: string;
  label: string;
  data: CategoryData;
  levels: number;
}

/** The category progression as spend columns; single default column when none. */
function slotViews(system: Record<string, any>): SlotView[] {
  const resolved: ResolvedCategory[] = Array.isArray(system.resolvedCategories)
    ? system.resolvedCategories
    : [];
  if (resolved.length > 0) {
    return resolved.map((c, i) => ({
      key: c.key,
      label: c.data.labelName || `Categoría ${i + 1}`,
      data: c.data,
      levels: c.levels,
    }));
  }
  return [
    {
      key: "c1",
      label: system.categoryName || "Categoría",
      data: system.categoryData ?? defaultCategoryData(),
      levels: system.level ?? 0,
    },
  ];
}

interface PdRow {
  name: string;
  charTag?: string;
  dpPath: string;
  specialPath?: string;
  /** Natural improvement counter paths (Excel "Bon. | Hab. | Novel"). */
  naturalPaths?: { bon: string; hab: string; novel: string };
  costOf: (d: CategoryData) => number;
  base?: number;
  bono?: number;
  cat?: number;
  total: number;
  tip: string;
}

interface PdGroup {
  label: string;
  rows: PdRow[];
}

/** Grid template of a spend row (name + Coste/PDs per slot + derived columns). */
function rowCols(nSlots: number, natural: boolean): string {
  const pairs = Array(nSlots).fill("40px 54px").join(" ");
  // Secondary tables append the "Mejora Natural" counters: Bon. | Hab. | Nov.
  const extras = natural
    ? "42px 42px 40px 38px 38px 38px 50px 54px"
    : "42px 42px 40px 54px 54px";
  return `minmax(140px, 1fr) ${pairs} ${extras}`;
}

/** Same template with the group gutter column in front (headers, footers). */
function headCols(nSlots: number, natural: boolean): string {
  return `22px ${rowCols(nSlots, natural)}`;
}

function extrasSpan(natural: boolean): number {
  return natural ? 8 : 5;
}

const CELL_SEP = { borderLeft: "1px solid var(--bd)" } as const;

function SpendRowView({
  row,
  slots,
  natural,
  system,
  isEditable,
  onUpdate,
}: {
  row: PdRow;
  slots: SlotView[];
  natural: boolean;
  system: Record<string, any>;
  isEditable: boolean;
  onUpdate: TabProps["onUpdate"];
}) {
  return (
    <div className="a-trow" style={{ gridTemplateColumns: rowCols(slots.length, natural) }}>
      <div className="px-2 py-1 text-xs flex items-center gap-1.5 min-w-0" style={{ color: "#363c45" }}>
        <span className="truncate">{row.name}</span>
        {row.charTag && <span className="a-pd-chartag">{row.charTag}</span>}
      </div>
      {slots.map((s) => (
        <Fragment key={s.key}>
          <div className="a-pd-cost">{row.costOf(s.data)}</div>
          <div className="px-0.5 py-0.5">
            <NumberField
              system={system}
              path={`${row.dpPath}.${s.key}`}
              isEditable={isEditable}
              onUpdate={onUpdate}
              className="h-[22px]! text-[11.5px]!"
              min={0}
            />
          </div>
        </Fragment>
      ))}
      <div className="text-center text-[11.5px] a-muted" style={CELL_SEP}>
        {row.base ?? "—"}
      </div>
      <div className="text-center text-[11.5px] a-blue">
        {row.bono === undefined ? "—" : sign(row.bono)}
      </div>
      <div className="text-center text-[11.5px] a-muted">{row.cat ?? "—"}</div>
      {natural &&
        (["bon", "hab", "novel"] as const).map((k) => (
          <div key={k} className="px-0.5 py-0.5">
            {row.naturalPaths ? (
              <NumberField
                system={system}
                path={row.naturalPaths[k]}
                isEditable={isEditable}
                onUpdate={onUpdate}
                className="h-[22px]! text-[11.5px]!"
                min={0}
              />
            ) : (
              <span className="block text-center a-muted">—</span>
            )}
          </div>
        ))}
      <div className="px-0.5 py-0.5">
        {row.specialPath ? (
          <NumberField
            system={system}
            path={row.specialPath}
            isEditable={isEditable}
            onUpdate={onUpdate}
            className="h-[22px]! text-[11.5px]! a-input--special"
            placeholder="+0"
          />
        ) : (
          <span className="block text-center a-muted">—</span>
        )}
      </div>
      <div className="text-center font-bold text-[12px]">
        <DerivedValue value={row.total} tip={row.tip} />
      </div>
    </div>
  );
}

/**
 * Excel-like spend table: category header spanning each Coste/PDs pair,
 * vertical group labels on the left gutter and derived columns on the right.
 */
function PdTable({
  title,
  dot,
  slots,
  groups,
  natural = false,
  system,
  isEditable,
  onUpdate,
  footer,
}: {
  title: string;
  dot: "acc" | "blue" | "red";
  slots: SlotView[];
  groups: PdGroup[];
  natural?: boolean;
  system: Record<string, any>;
  isEditable: boolean;
  onUpdate: TabProps["onUpdate"];
  footer?: ReactNode;
}) {
  const cols = headCols(slots.length, natural);
  const span = extrasSpan(natural);
  return (
    <SectionCard title={title} dot={dot} padded={false} className="a-zebra">
      <div className="scl overflow-x-auto">
        <div style={{ minWidth: 420 + slots.length * 96 + (natural ? 110 : 0) }}>
          <div className="a-thead" style={{ gridTemplateColumns: cols }}>
            <div style={{ gridColumn: "span 2" }} />
            {slots.map((s) => (
              <div
                key={s.key}
                className="content-center text-center h-10"
                style={{ gridColumn: "span 2", ...CELL_SEP }}
                title={s.label}
              >
                {s.label}
              </div>
            ))}
            <div style={{ gridColumn: `span ${span}`, ...CELL_SEP }} />
          </div>
          <div className="a-thead" style={{ gridTemplateColumns: cols }}>
            <div />
            <div>Habilidad</div>
            {slots.map((s) => (
              <Fragment key={s.key}>
                <div className="text-center" style={CELL_SEP}>
                  Coste
                </div>
                <div className="text-center">PDs</div>
              </Fragment>
            ))}
            <div className="text-center" style={CELL_SEP}>
              Base
            </div>
            <div className="text-center">Bono</div>
            <div className="text-center">Cat.</div>
            {natural && (
              <>
                <div className="text-center" title="Bonos naturales (re-aplican el bono de característica)">
                  Bon.
                </div>
                <div className="text-center" title="Habilidades naturales (+10 cada una)">
                  Hab.
                </div>
                <div className="text-center" title="Bonos de Novel (+10 como bono de categoría)">
                  Nov.
                </div>
              </>
            )}
            <div className="text-center">Esp.</div>
            <div className="text-center">Total</div>
          </div>
          {groups.map((g) => (
            <div key={g.label} className="flex" style={{ borderBottom: "1px solid var(--bd)" }}>
              <div className="a-pd-gutter">{g.label}</div>
              <div className="flex-1 min-w-0" style={CELL_SEP}>
                {g.rows.map((row) => (
                  <SpendRowView
                    key={row.dpPath}
                    row={row}
                    slots={slots}
                    natural={natural}
                    system={system}
                    isEditable={isEditable}
                    onUpdate={onUpdate}
                  />
                ))}
              </div>
            </div>
          ))}
          {footer}
        </div>
      </div>
    </SectionCard>
  );
}

/**
 * "Límite en Habilidades ..." footer row: per category the stage limit and the
 * cumulative reserve spend up to that stage (mode "combined"), plus the global
 * status on the right.
 */
function LimitRow({
  label,
  reserve,
  slots,
  natural = false,
  system,
}: {
  label: string;
  reserve: ReserveKey;
  slots: SlotView[];
  natural?: boolean;
  system: Record<string, any>;
}) {
  const dev = system.development;
  const status = dev?.limits?.[reserve];
  const firstKey = slots[0]?.key ?? "c1";
  let cumulative = 0;
  return (
    <div
      className="a-tfoot text-[11px]"
      style={{ gridTemplateColumns: headCols(slots.length, natural), borderTop: "1px solid var(--bd)" }}
    >
      <div style={{ gridColumn: "span 2" }} className="px-2 py-1.5 font-semibold">
        {label}
      </div>
      {slots.map((s) => {
        const stage = dev?.perCategory?.find((c: any) => c.key === s.key);
        cumulative += RESERVE_PATHS[reserve].reduce(
          (sum, p) => sum + (dpRecord(readPath(system, p), firstKey)[s.key] ?? 0),
          0,
        );
        const limit = stage?.limits?.[reserve];
        const over = limit != null && cumulative > limit;
        return (
          <Fragment key={s.key}>
            <div className="text-center py-1.5 font-bold" style={CELL_SEP}>
              {limit ?? "—"}
            </div>
            <div className={`text-center py-1.5 ${over ? "a-red font-bold" : "a-muted"}`}>
              {cumulative}
            </div>
          </Fragment>
        );
      })}
      <div
        style={{ gridColumn: `span ${extrasSpan(natural)}`, ...CELL_SEP }}
        className={`px-2 py-1.5 text-right font-semibold ${status?.over ? "a-red" : "a-muted"}`}
      >
        {status ? `${status.spent} / ${status.limit} PD${status.over ? " · ¡límite superado!" : ""}` : ""}
      </div>
    </div>
  );
}

/** Small uncontrolled-ish number cell for the category slots table. */
function SlotNumber({
  value,
  disabled,
  min,
  onCommit,
}: {
  value: number;
  disabled: boolean;
  min?: number;
  onCommit: (v: number) => void;
}) {
  const [local, setLocal] = useState(String(value));
  return (
    <input
      type="text"
      inputMode="numeric"
      className="a-input h-[23px]! w-12!"
      value={local}
      disabled={disabled}
      onChange={(e) => setLocal(e.target.value)}
      onFocus={(e) => e.target.select()}
      onBlur={() => {
        let v = parseInt(local, 10) || 0;
        if (min != null && v < min) v = min;
        setLocal(String(v));
        if (v !== value) onCommit(v);
      }}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
    />
  );
}

function combatRow(system: Record<string, any>, key: string, name: string): PdRow {
  const o = system.combat?.[key] ?? {};
  const base = o.base ?? 0;
  const cat = o.catBonus ?? 0;
  const total = o.final ?? 0;
  const special = o.special ?? 0;
  const bono = total - base - cat - special;
  return {
    name,
    dpPath: `combat.${key}.dp`,
    specialPath: `combat.${key}.special`,
    costOf: (d) => (d.combatCosts as Record<string, number>)[key] ?? 2,
    base,
    bono,
    cat,
    total,
    tip: `${name}|Base=${base}|Mód. característica=${sign(bono)}|Cat=${cat}|Especial=${sign(special)}|=${total}`,
  };
}

function secRow(
  system: Record<string, any>,
  def: { key: string; labelKey: string; group: string; baseChar: string },
): PdRow {
  const o = system.secondary?.[def.key] ?? {};
  const name = game.i18n.localize(def.labelKey);
  const base = o.base ?? 0;
  const charMod = o.charMod ?? 0;
  const bon = o.naturalBonus ?? 0;
  const hab = o.naturalAbilities ?? 0;
  const novel = o.novelBonus ?? 0;
  const bonusRaw = o.bonusRaw ?? charMod;
  const bono = o.bonusTotal ?? charMod;
  const cat = o.catBonus ?? 0;
  const special = o.special ?? 0;
  const total = o.final ?? 0;
  // Tooltip breakdown of the "Bonos" cube: charMod·(1+Bon.) + 10·Hab., capped.
  const cubeTip =
    `Bono=${sign(bono)} (mód ${sign(charMod)}·${1 + bon} + 10·${hab}` +
    (bono !== bonusRaw ? ` = ${sign(bonusRaw)}, cap` : "") +
    ")";
  const catTip = `Cat=${cat}${novel > 0 ? ` (Novel +${10 * novel})` : ""}`;
  return {
    name,
    charTag: CHAR_TAGS[def.baseChar],
    dpPath: `secondary.${def.key}.dp`,
    specialPath: `secondary.${def.key}.special`,
    naturalPaths: {
      bon: `secondary.${def.key}.naturalBonus`,
      hab: `secondary.${def.key}.naturalAbilities`,
      novel: `secondary.${def.key}.novelBonus`,
    },
    costOf: (d) => {
      const group = d.secondaryCosts[def.group] ?? 2;
      const override = d.secondaryCostOverrides?.[def.key];
      return override !== undefined ? Math.min(group, override) : group;
    },
    base,
    bono,
    cat,
    total,
    tip: `${name}|Base=${base}|${cubeTip}|${catTip}|Especial=${sign(special)}|=${total}`,
  };
}

export function PDsTab({ system, items, isEditable, onUpdate, itemOps }: TabProps) {
  const dev = system.development;
  const devPoints = system.developmentPoints ?? 0;
  const rawSlots: CategorySlot[] = Array.isArray(system.categories) ? system.categories : [];
  const categoryItems = items.filter((i: any) => i.type === "category");
  const slots = slotViews(system);
  const firstKey = slots[0]?.key ?? "c1";

  const commitSlots = (next: CategorySlot[]) => onUpdate("system.categories", next);

  const patchSlot = (index: number, patch: Partial<CategorySlot>) =>
    commitSlots(rawSlots.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  const addSlot = () => {
    const key = foundry.utils.randomID(8);
    commitSlots([
      ...rawSlots,
      {
        key,
        itemId: categoryItems[0]?.id ?? "",
        // The first slot absorbs the character's current level (legacy sheets).
        levels: rawSlots.length === 0 ? (system.level ?? 0) : 0,
        changeCost: 0,
      },
    ]);
  };

  const removeSlot = (index: number) => commitSlots(rawSlots.filter((_, i) => i !== index));

  const stageFor = (key: string) => dev?.perCategory?.find((s: any) => s.key === key);

  // ----- Row definitions (Excel PDs sheet order) -----

  const mk = system.combat?.martialKnowledge ?? {};
  const combatGroups: PdGroup[] = [
    {
      label: "Base",
      rows: [
        combatRow(system, "attack", "H. Ataque"),
        combatRow(system, "parry", "H. Parada"),
        combatRow(system, "dodge", "H. Esquiva"),
        combatRow(system, "wearArmor", "Llevar Armadura"),
      ],
    },
    // Ki points and accumulation are per characteristic (Excel Ki sheet). The
    // richer read-only sheet columns (Mitad/Actual, CM Total/Usado) come with
    // the visual pass; here we mirror the DP-spend rows.
    {
      label: "Puntos de Ki",
      rows: KI_CHARS.map((c) => {
        const pc = system.ki?.perChar?.[c.key];
        return {
          name: c.tag,
          dpPath: `ki.pointsDp.${c.key}`,
          costOf: (d) => d.supernatural.ki,
          base: pc?.pointsBought ?? 0,
          bono: pc?.pointsInnate ?? 0,
          total: pc?.pointsTotal ?? 0,
          tip: `Puntos de Ki (${c.tag})|Innatos=${pc?.pointsInnate ?? 0}|Comprados=${pc?.pointsBought ?? 0}|=${pc?.pointsTotal ?? 0}`,
        };
      }),
    },
    {
      label: "Acumulación de Ki",
      rows: KI_CHARS.map((c) => {
        const pc = system.ki?.perChar?.[c.key];
        return {
          name: c.tag,
          dpPath: `ki.accDp.${c.key}`,
          costOf: (d) => d.supernatural.kiAccMultiple,
          base: pc?.accBought ?? 0,
          bono: pc?.accInnate ?? 0,
          total: pc?.accTotal ?? 0,
          tip: `Acumulación de Ki (${c.tag})|Innata=${pc?.accInnate ?? 0}|Comprada=${pc?.accBought ?? 0}|=${pc?.accTotal ?? 0}`,
        };
      }),
    },
    {
      label: "CM",
      rows: [
        {
          name: "Conocimiento Marcial",
          dpPath: "combat.martialKnowledge.dp",
          specialPath: "combat.martialKnowledge.special",
          costOf: () => 5,
          total: system.martialKnowledge ?? 0,
          tip: `Conocimiento Marcial|Especial=${sign(mk.special ?? 0)}|=${system.martialKnowledge ?? 0}`,
        },
      ],
    },
  ];

  const mag = system.magic ?? {};
  const misticGroups: PdGroup[] = [
    {
      label: "Base",
      rows: [
        {
          name: "Zeón",
          dpPath: "magic.zeonDp",
          specialPath: "magic.zeonSpecial",
          costOf: (d) => d.supernatural.zeon,
          total: mag.zeonMax ?? 0,
          tip: `Zeón máximo|Especial=${sign(mag.zeonSpecial ?? 0)}|=${mag.zeonMax ?? 0}`,
        },
        {
          name: "Proyección Mágica",
          dpPath: "magic.magicProjectionDp",
          specialPath: "magic.magicProjectionSpecial",
          costOf: (d) => d.supernatural.magicProjection,
          base: mag.magicProjectionBase ?? 0,
          total: mag.magicProjectionFinal ?? 0,
          tip: `Proyección Mágica|Base=${mag.magicProjectionBase ?? 0}|Especial=${sign(mag.magicProjectionSpecial ?? 0)}|=${mag.magicProjectionFinal ?? 0}`,
        },
      ],
    },
  ];

  const psy = system.psychic ?? {};
  const psiGroups: PdGroup[] = [
    {
      label: "Base",
      rows: [
        {
          name: "CV (Capacidad Volitiva)",
          dpPath: "psychic.cvDp",
          costOf: (d) => d.supernatural.cv,
          total: psy.cvMax ?? 0,
          tip: `CV máximo|=${psy.cvMax ?? 0}`,
        },
        {
          name: "Proyección Psíquica",
          dpPath: "psychic.projectionDp",
          specialPath: "psychic.projectionSpecial",
          costOf: (d) => d.supernatural.psychicProjection,
          base: psy.projectionBase ?? 0,
          total: psy.projectionFinal ?? 0,
          tip: `Proyección psíquica|Base=${psy.projectionBase ?? 0}|=${psy.projectionFinal ?? 0}`,
        },
      ],
    },
  ];

  const secGroups: PdGroup[] = SECONDARY_ABILITY_GROUPS.map((g) => ({
    label: game.i18n.localize(g.labelKey),
    rows: SECONDARY_ABILITIES_BY_GROUP[g.id].map((d) => secRow(system, d)),
  }));

  // Secondary DP spent per category (fixed list + custom abilities).
  const secDpValues = [
    ...DEFAULT_SECONDARY_ABILITIES.map((d) => system.secondary?.[d.key]?.dp),
    ...Object.values(system.customSecondary ?? {}).map((c: any) => c?.dp),
  ];
  const secSpentBySlot = (key: string) =>
    secDpValues.reduce((sum, dp) => sum + (dpRecord(dp, firstKey)[key] ?? 0), 0);

  // "Mejora Natural" budget counters (Excel footer): assigned vs max, red when over.
  const imp = system.secondaryImprovement;
  const impCell = (s: { assigned: number; max: number; over: boolean } | undefined) => (
    <b className={s?.over ? "a-red" : undefined}>
      {s?.assigned ?? 0} de {s?.max ?? 0}
    </b>
  );

  const secFooter = (
    <>
      {imp && (
        <div
          className="a-tfoot text-[11px]"
          style={{
            gridTemplateColumns: headCols(slots.length, true),
            borderTop: "1px solid var(--bd)",
          }}
        >
          <div
            style={{ gridColumn: "1 / -1" }}
            className="px-2 py-1.5 flex items-center gap-4 flex-wrap"
          >
            <span>
              <span className="a-flabel">Nº Bonos Naturales asignados: </span>
              <b className={imp.physical?.over ? "a-red" : undefined}>{imp.physical?.assigned ?? 0}</b>
              {" + "}
              <b className={imp.mental?.over ? "a-red" : undefined}>{imp.mental?.assigned ?? 0}</b>
              <span className="a-muted">
                {" "}de {imp.physical?.max ?? 0} + {imp.mental?.max ?? 0} (físicos + mentales)
              </span>
            </span>
            <span>
              <span className="a-flabel">Nº Habilidades Naturales asignadas: </span>
              {impCell(imp.abilities)}
            </span>
            {((imp.novel?.assigned ?? 0) > 0 || (imp.novel?.max ?? 0) > 0) && (
              <span>
                <span className="a-flabel">Bonos de Novel asignados: </span>
                {impCell(imp.novel)}
              </span>
            )}
          </div>
        </div>
      )}
      <div
        className="a-tfoot text-[11px]"
        style={{ gridTemplateColumns: headCols(slots.length, true), borderTop: "1px solid var(--bd)" }}
      >
        <div style={{ gridColumn: "span 2" }} className="px-2 py-1.5 font-semibold">
          PDs en Habilidades Secundarias
        </div>
        {slots.map((s) => (
          <Fragment key={s.key}>
            <div style={CELL_SEP} />
            <div className="text-center py-1.5 font-bold">{secSpentBySlot(s.key)}</div>
          </Fragment>
        ))}
        <div style={{ gridColumn: `span ${extrasSpan(true)}`, ...CELL_SEP }} />
      </div>
      <div
        className="a-tfoot text-[11px]"
        style={{ gridTemplateColumns: headCols(slots.length, true) }}
      >
        <div style={{ gridColumn: "span 2" }} className="px-2 py-1 font-semibold">
          PVs · Múltiplos de Vida
        </div>
        {slots.map((s) => (
          <Fragment key={s.key}>
            <div className="a-pd-cost">{s.data.lifeMultiple ?? 20}</div>
            <div />
          </Fragment>
        ))}
        <div
          style={{ gridColumn: `span ${extrasSpan(true)}`, ...CELL_SEP }}
          className="px-2 py-1 flex items-center justify-end gap-1.5"
        >
          <span className="a-muted">Múltiplos:</span>
          <NumberField
            system={system}
            path="lifePoints.multiples"
            isEditable={isEditable}
            onUpdate={onUpdate}
            className="h-[22px]! w-12!"
            min={0}
          />
          <span className="a-muted">PV totales:</span>
          <span className="font-bold">{system.lifePoints?.max ?? 0}</span>
        </div>
      </div>
    </>
  );

  // Totales de las capacidades de combate compradas como items (hoja PDs del
  // Excel). El gasto real lo integran prepareDevelopment (PD) y prepareKi (CM);
  // aquí solo se muestran los sumatorios.
  const sumItems = (type: string, subtype: string | undefined, field: string) =>
    items
      .filter((i: any) => i.type === type && (!subtype || i.system?.subtype === subtype))
      .reduce((sum: number, i: any) => sum + (i.system?.[field] ?? 0), 0);
  const itemTotals = {
    weaponTablesDp: sumItems("weaponTable", undefined, "dpCost"),
    stylesDp: sumItems("combatStyle", "styleTable", "dpCost"),
    stylesMk: sumItems("combatStyle", "styleTable", "mkCost"),
    martialArtsDp: sumItems("combatStyle", "martialArt", "dpCost"),
    martialArtsMk: sumItems("combatStyle", "martialArt", "mkCost"),
    arsMagnusMk: sumItems("combatStyle", "arsMagnus", "mkCost"),
  };
  const costFooter = (label: string) => (
    <div className="a-tfoot text-[11px]" style={{ gridTemplateColumns: "1fr" }}>
      <div className="px-2 py-1.5 font-semibold text-right">{label}</div>
    </div>
  );

  const slotName = (slot: CategorySlot): string => {
    const item = categoryItems.find((i: any) => i.id === slot.itemId);
    if (item) return item.name;
    if (!slot.itemId) return categoryItems[0]?.name ?? "(sin categoría)";
    return "(item eliminado)";
  };

  const SLOT_COLS = "1fr 60px 70px 80px 30px";

  return (
    <div className="a-screen flex flex-col gap-3">
      {/* Progresión de categorías + cambio de categoría (cabecera del Excel) */}
      <div className="a-grid12">
        <SectionCard
          title="Categorías"
          dot="acc"
          padded={false}
          style={{ gridColumn: "span 6" }}
          right={`Nivel total ${system.level ?? 0} · ${dev?.total ?? devPoints} PD`}
        >
          <div className="a-thead" style={{ gridTemplateColumns: SLOT_COLS }}>
            <div>Categoría</div>
            <div className="text-center">Niveles</div>
            <div className="text-center">PD tramo</div>
            <div className="text-center">PD acum.</div>
            <div />
          </div>
          {rawSlots.length === 0 && (
            <div className="a-trow" style={{ gridTemplateColumns: "1fr 70px 90px" }}>
              <div className="px-2.5 py-1.5 font-semibold a-acc">{system.categoryName || "—"}</div>
              <div className="px-1 py-1 text-center">
                <NumberField
                  system={system}
                  path="level"
                  isEditable={isEditable}
                  onUpdate={onUpdate}
                  className="w-12!"
                  min={0}
                />
              </div>
              <div className="text-center font-bold">{devPoints}</div>
            </div>
          )}
          {rawSlots.map((slot, index) => {
            const stage = stageFor(slot.key || `c${index + 1}`);
            const prev = index > 0 ? stageFor(rawSlots[index - 1].key || `c${index}`) : undefined;
            const increment = stage ? stage.dpBudget - (prev?.dpBudget ?? 0) : undefined;
            return (
              <div key={slot.key} className="a-trow" style={{ gridTemplateColumns: SLOT_COLS }}>
                <div className="px-1 py-1">
                  <select
                    className="a-input a-input--left h-[23px]! w-full"
                    value={slot.itemId}
                    disabled={!isEditable}
                    onChange={(e) => patchSlot(index, { itemId: e.target.value })}
                  >
                    <option value="">(primera categoría)</option>
                    {categoryItems.map((i: any) => (
                      <option key={i.id} value={i.id}>
                        {i.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="px-1 py-1 text-center">
                  <SlotNumber
                    value={slot.levels ?? 0}
                    disabled={!isEditable}
                    min={0}
                    onCommit={(v) => patchSlot(index, { levels: v })}
                  />
                </div>
                <div className="text-center text-[11.5px] a-muted">{increment ?? "—"}</div>
                <div className="text-center text-[11.5px] font-bold">{stage?.dpBudget ?? "—"}</div>
                <div className="text-center">
                  {isEditable && (
                    <button
                      type="button"
                      className="a-muted hover:text-red-600 text-xs"
                      title="Quitar tramo"
                      onClick={() => removeSlot(index)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {isEditable && (
            <div className="px-2.5 py-1.5">
              <button
                type="button"
                className="text-[11px] font-semibold px-2 py-0.5 rounded-[5px] cursor-pointer"
                style={{ background: "var(--acc)", color: "#fff" }}
                onClick={addSlot}
              >
                + Añadir categoría
              </button>
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Cambio de categoría"
          dot="acc"
          padded={false}
          style={{ gridColumn: "span 6" }}
          right="Límite primarias: combinado"
        >
          {rawSlots.length < 2 && (
            <div className="px-3 py-2 text-[11.5px] a-muted">Sin cambios de categoría.</div>
          )}
          {rawSlots.slice(1).map((slot, i) => {
            const index = i + 1;
            return (
              <div key={slot.key} className="a-trow" style={{ gridTemplateColumns: "1fr 70px" }}>
                <div className="px-2.5 py-1 text-xs">
                  {slotName(rawSlots[index - 1])} → {slotName(slot)}
                </div>
                <div className="px-1 py-1 text-center">
                  <SlotNumber
                    value={slot.changeCost ?? 0}
                    disabled={!isEditable}
                    min={0}
                    onCommit={(v) => patchSlot(index, { changeCost: v })}
                  />
                </div>
              </div>
            );
          })}
          {rawSlots.length >= 2 && (
            <div className="px-2.5 py-1.5 text-[11px] a-muted">
              Coste total: {rawSlots.reduce((a, s) => a + (s.changeCost ?? 0), 0)} PD · Cada
              categoría mantiene los límites de las anteriores.
            </div>
          )}
        </SectionCard>
      </div>

      {/* Resumen de PDs */}
      <div className="a-card px-3 py-2 flex-row! items-center gap-5 flex-wrap text-[12px]">
        <span>
          <span className="a-flabel">PD totales </span>
          <b>{dev?.total ?? devPoints}</b>
        </span>
        <span>
          <span className="a-flabel">Usados </span>
          <b>{dev?.spent ?? 0}</b>
        </span>
        <span>
          <span className="a-flabel">Disponibles </span>
          <b className={(dev?.available ?? devPoints) < 0 ? "a-red" : "a-acc"}>
            {dev?.available ?? devPoints}
          </b>
        </span>
      </div>

      {/* Avisos del reparto (PDs + mejora natural) */}
      {(dev?.warnings?.length > 0 || imp?.warnings?.length > 0) && (
        <div
          className="a-card px-3 py-2 text-[11.5px]"
          style={{ borderLeft: "3px solid var(--red)" }}
        >
          {[...(dev?.warnings ?? []), ...(imp?.warnings ?? [])].map((w: string) => (
            <div key={w}>⚠ {w}</div>
          ))}
        </div>
      )}

      {/* Tablas de gasto (una columna Coste/PDs por categoría, como el Excel) */}
      <PdTable
        title="Habilidades de Combate"
        dot="red"
        slots={slots}
        groups={combatGroups}
        system={system}
        isEditable={isEditable}
        onUpdate={onUpdate}
        footer={
          <LimitRow
            label="Límite en Habilidades de Combate"
            reserve="combat"
            slots={slots}
            system={system}
          />
        }
      />

      {/* Capacidades de combate compradas como items (sección de la hoja PDs
          del Excel): su dpCost cuenta contra la reserva de combate y su
          mkCost contra el CM disponible (prepareDevelopment / prepareKi). */}
      <div className="a-grid12">
        <div style={{ gridColumn: "span 6" }}>
          <ItemList
            title="Tablas de Armas"
            dot="red"
            items={items}
            type="weaponTable"
            isEditable={isEditable}
            itemOps={itemOps}
            emptyLabel="Sin tablas de armas."
            columns={[{ label: "PD", width: "44px", render: (i: any) => i.system?.dpCost ?? 0 }]}
            footer={costFooter(`Total: ${itemTotals.weaponTablesDp} PD`)}
          />
        </div>
        <div style={{ gridColumn: "span 6" }}>
          <ItemList
            title="Tablas de Estilos"
            dot="red"
            items={items}
            type="combatStyle"
            subtype="styleTable"
            isEditable={isEditable}
            itemOps={itemOps}
            addLabel="+ Tabla"
            emptyLabel="Sin tablas de estilo."
            columns={[
              { label: "PD", width: "44px", render: (i: any) => i.system?.dpCost ?? 0 },
              { label: "CM", width: "44px", render: (i: any) => i.system?.mkCost ?? 0 },
            ]}
            footer={costFooter(`Total: ${itemTotals.stylesDp} PD · ${itemTotals.stylesMk} CM`)}
          />
        </div>
        <div style={{ gridColumn: "span 6" }}>
          <ItemList
            title="Artes Marciales"
            dot="red"
            items={items}
            type="combatStyle"
            subtype="martialArt"
            isEditable={isEditable}
            itemOps={itemOps}
            addLabel="+ Arte"
            emptyLabel="Sin artes marciales."
            columns={[
              { label: "PD", width: "44px", render: (i: any) => i.system?.dpCost ?? 0 },
              { label: "CM", width: "44px", render: (i: any) => i.system?.mkCost ?? 0 },
            ]}
            footer={costFooter(
              `Total: ${itemTotals.martialArtsDp} PD · ${itemTotals.martialArtsMk} CM`,
            )}
          />
        </div>
        <div style={{ gridColumn: "span 6" }}>
          <ItemList
            title="Ars Magnus"
            dot="red"
            items={items}
            type="combatStyle"
            subtype="arsMagnus"
            isEditable={isEditable}
            itemOps={itemOps}
            addLabel="+ Ars Magnus"
            emptyLabel="Sin Ars Magnus."
            columns={[{ label: "CM", width: "44px", render: (i: any) => i.system?.mkCost ?? 0 }]}
            footer={costFooter(
              `Total: ${itemTotals.arsMagnusMk} CM · CM disponible: ${system.ki?.cmAvailable ?? 0}`,
            )}
          />
        </div>
      </div>

      <PdTable
        title="Habilidades Místicas"
        dot="blue"
        slots={slots}
        groups={misticGroups}
        system={system}
        isEditable={isEditable}
        onUpdate={onUpdate}
        footer={
          <LimitRow
            label="Límite en Habilidades Místicas"
            reserve="magic"
            slots={slots}
            system={system}
          />
        }
      />
      <PdTable
        title="Habilidades Psíquicas"
        dot="acc"
        slots={slots}
        groups={psiGroups}
        system={system}
        isEditable={isEditable}
        onUpdate={onUpdate}
        footer={
          <LimitRow
            label="Límite en Habilidades Psíquicas"
            reserve="psychic"
            slots={slots}
            system={system}
          />
        }
      />
      <PdTable
        title="Habilidades Secundarias"
        dot="acc"
        slots={slots}
        groups={secGroups}
        natural
        system={system}
        isEditable={isEditable}
        onUpdate={onUpdate}
        footer={secFooter}
      />

      {/* PDs usados por categoría (pie del Excel) */}
      <div className="a-card px-3 py-2 flex-row! items-center gap-2 flex-wrap text-[11.5px]">
        <span className="a-flabel">PDs usados por categoría:</span>
        {slots.map((s) => {
          const stage = stageFor(s.key);
          const used = (stage?.spent ?? 0) + (stage?.changeCost ?? 0);
          return (
            <span key={s.key} className="a-pill">
              {s.label} ({s.levels}): <b>{used} PD</b>
            </span>
          );
        })}
        <span className="ml-auto font-bold">
          TOTAL {dev?.spent ?? 0} / {dev?.total ?? devPoints} PD
        </span>
      </div>

      {/* Categorías como items (multi-clase) */}
      <ItemList
        title="Categorías (items)"
        dot="acc"
        items={items}
        type="category"
        isEditable={isEditable}
        itemOps={itemOps}
        addLabel="+ Categoría"
        emptyLabel="Sin categorías como item. Añade una para usarla en la progresión."
        columns={[
          {
            label: "Arquetipo",
            width: "1fr",
            render: (i: any) => ARCHETYPE_LABELS[i.system?.archetype] ?? i.system?.archetype ?? "—",
          },
          { label: "Vida/Nv", width: "64px", render: (i: any) => i.system?.lpPerLevel ?? 0 },
          {
            label: "CM/Nv",
            width: "64px",
            render: (i: any) => i.system?.martialKnowledgePerLevel ?? 0,
          },
        ]}
      />
    </div>
  );
}
