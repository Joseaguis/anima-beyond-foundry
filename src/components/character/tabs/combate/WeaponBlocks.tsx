import type { ReactNode } from "react";
import { NumberField, DerivedValue } from "../../ui/fields";
import type { TabProps } from "../types";

/**
 * Bloques de armas de la hoja "Combate" del Excel: cabecera "Desarmado" con
 * los bonos de equipo editables y un bloque numerado por arma equipada en dos
 * columnas (cuerpo a cuerpo primero, proyectiles después).
 */

const SIZE_LABELS: Record<string, string> = {
  small: "Pequeña",
  medium: "Normal",
  large: "Grande",
};

const HANDS_LABELS: Record<string, string> = {
  one: "A una mano",
  two: "A dos manos",
};

/** Banner en cursiva del borde derecho de la barra de título (como el Excel). */
function typeBanner(weaponType: string): string {
  return weaponType === "ranged" || weaponType === "thrown"
    ? "Arma de proyectiles"
    : "Cuerpo a cuerpo";
}

const VALUE_GRID = { gridTemplateColumns: "repeat(4, 1fr)" } as const;
const CRIT_GRID = { gridTemplateColumns: "repeat(5, 1fr)" } as const;
const CELL_SEP = { borderLeft: "1px solid var(--bd)" } as const;
const ROW_SEP = { borderBottom: "1px solid var(--bd)" } as const;

/** Barra negra de título del bloque, con el banner de tipo a la derecha. */
function BlockTitle({ left, banner }: { left: ReactNode; banner?: string }) {
  return (
    <div
      className="flex items-center justify-between gap-2 px-2 py-1 text-[11.5px] font-bold"
      style={{ background: "var(--hdr)", color: "#eef0f2" }}
    >
      <span className="truncate">{left}</span>
      {banner && (
        <i className="text-[10.5px] font-semibold shrink-0" style={{ color: "#c3c9d1" }}>
          {banner}
        </i>
      )}
    </div>
  );
}

/** Cabecera Turno | At. | Defensa | Daño + fila de valores grandes. */
function ValueStrip({
  turn,
  attack,
  defense,
  defenseKind,
  damage,
  name,
  tips,
}: {
  turn: number;
  attack: number;
  defense: number;
  /** "Esq" cuando la esquiva supera la parada, "Par." en caso contrario. */
  defenseKind: string;
  damage: number;
  name: string;
  tips?: { attack?: string; defense?: string; damage?: string };
}) {
  const big = "text-center justify-center py-1 text-[17px] font-bold";
  return (
    <>
      <div className="a-thead" style={VALUE_GRID}>
        <div className="text-center">Turno</div>
        <div className="text-center">At.</div>
        <div className="text-center">Defensa</div>
        <div className="text-center">Daño</div>
      </div>
      <div className="grid" style={{ ...VALUE_GRID, ...ROW_SEP }}>
        <div className={big}>{turn}</div>
        <div className={`${big} flex items-center`} style={CELL_SEP}>
          <DerivedValue value={attack} tip={tips?.attack ?? `Ataque con ${name}|=${attack}`} />
        </div>
        <div className={`${big} flex items-center justify-center gap-1`} style={CELL_SEP}>
          <DerivedValue value={defense} tip={tips?.defense ?? `Defensa con ${name}|=${defense}`} />
          <span className="text-[10px] font-semibold a-muted">{defenseKind}</span>
        </div>
        <div className={`${big} flex items-center`} style={CELL_SEP}>
          <DerivedValue value={damage} tip={tips?.damage ?? `Daño con ${name}|=${damage}`} />
        </div>
      </div>
    </>
  );
}

/** Mini-tabla Crit. 1 | Crit. 2 | Ent. | Rotura | Pres. */
function CritStrip({
  crit1,
  crit2,
  fortitude,
  breakage,
  presence,
}: {
  crit1: ReactNode;
  crit2: ReactNode;
  fortitude: ReactNode;
  breakage: ReactNode;
  presence: ReactNode;
}) {
  const head = "text-center py-0.5 text-[9.5px] font-semibold uppercase a-muted";
  const cell = "text-center justify-center py-0.5 text-[11.5px]";
  return (
    <>
      <div className="grid" style={{ ...CRIT_GRID, ...ROW_SEP, background: "#f4f6f8" }}>
        <div className={head}>Crit. 1</div>
        <div className={head} style={CELL_SEP}>Crit. 2</div>
        <div className={head} style={CELL_SEP}>Ent.</div>
        <div className={head} style={CELL_SEP}>Rotura</div>
        <div className={head} style={CELL_SEP}>Pres.</div>
      </div>
      <div className="grid" style={{ ...CRIT_GRID, ...ROW_SEP }}>
        <div className={`${cell} flex items-center`}>{crit1}</div>
        <div className={`${cell} flex items-center`} style={CELL_SEP}>{crit2}</div>
        <div className={`${cell} flex items-center`} style={CELL_SEP}>{fortitude}</div>
        <div className={`${cell} flex items-center`} style={CELL_SEP}>{breakage}</div>
        <div className={`${cell} flex items-center`} style={CELL_SEP}>{presence}</div>
      </div>
    </>
  );
}

/** Fila etiqueta: valor (p. ej. "Calidad arma: 5"). */
function InfoRow({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex items-center gap-x-4 gap-y-0.5 flex-wrap px-2 py-0.5 text-[11px]"
      style={ROW_SEP}
    >
      {children}
    </div>
  );
}

function Label({ children }: { children: ReactNode }) {
  return <span className="a-flabel">{children}</span>;
}

/** Bloque cabecera "Desarmado" + bonos de equipo editables (caja del Excel). */
function UnarmedBlock({ system, isEditable, onUpdate }: Pick<TabProps, "system" | "isEditable" | "onUpdate">) {
  const equipment = system.equipment ?? {};
  const unarmed = equipment.unarmed ?? {};
  const dodge = equipment.dodge ?? system.combat?.dodge?.final ?? 0;
  const parry = unarmed.parry ?? 0;
  const defense = Math.max(parry, dodge);
  const presence = typeof system.presence === "number" ? system.presence : "—";

  const bono = (label: string, path: string) => (
    <div className="flex-1 flex flex-col items-center gap-0.5 px-1.5 py-1 min-w-0" style={CELL_SEP}>
      <Label>{label}</Label>
      <NumberField
        system={system}
        path={path}
        isEditable={isEditable}
        onUpdate={onUpdate}
        className="h-[22px]! text-[11.5px]!"
      />
    </div>
  );

  return (
    <div className="a-card" style={{ borderRadius: 3 }}>
      <BlockTitle left="Desarmado" />
      <InfoRow>
        <i className="text-[11px] font-semibold">Conocida</i>
      </InfoRow>
      <ValueStrip
        turn={unarmed.initiative ?? 20}
        attack={unarmed.attack ?? 0}
        defense={defense}
        defenseKind={dodge >= parry ? "Esq" : "Par."}
        damage={unarmed.finalDamage ?? 0}
        name="Desarmado"
        tips={{
          attack: `Ataque desarmado|H. Ataque + bonos=${unarmed.attack ?? 0}|=${unarmed.attack ?? 0}`,
          defense: `Defensa desarmado|Mejor entre parada (${parry}) y esquiva (${dodge})=${defense}|=${defense}`,
          damage: `Daño desarmado|10 + FUE + mods=${unarmed.finalDamage ?? 0}|=${unarmed.finalDamage ?? 0}`,
        }}
      />
      <CritStrip
        crit1={unarmed.critical ?? "CON"}
        crit2="—"
        fortitude="—"
        breakage="—"
        presence={presence}
      />
      {/* Bonos manuales de equipo: aplican a todas las armas y al desarmado. */}
      <div className="flex" style={{ ...ROW_SEP, marginLeft: -1 }}>
        {bono("Bono Turno", "combat.equipBonus.turn")}
        {bono("Bono Ataque", "combat.equipBonus.attack")}
        {bono("Bono Parada", "combat.equipBonus.parry")}
        {bono("Bono Esq.", "combat.equipBonus.dodge")}
        {bono("Bono Daño", "combat.equipBonus.damage")}
      </div>
    </div>
  );
}

/** Bloque numerado de un arma equipada. */
function WeaponBlock({
  n,
  weapon,
  dodge,
  ammoItems,
  isEditable,
  itemOps,
}: {
  n: number;
  weapon: any;
  dodge: number;
  ammoItems: TabProps["items"];
  isEditable: boolean;
  itemOps: TabProps["itemOps"];
}) {
  const w = weapon;
  const parry = w.parry ?? 0;
  const defense = Math.max(parry, dodge);
  const isProjectile = w.weaponType === "ranged" || w.weaponType === "thrown";

  return (
    <div className="a-card" style={{ borderRadius: 3 }}>
      <BlockTitle
        left={
          <>
            {n}. {w.name}
            {(!w.meetsStrength || !w.meetsSize) && (
              <span className="a-red" title="No cumple los requisitos de FUE/tamaño"> ⚠</span>
            )}
          </>
        }
        banner={typeBanner(w.weaponType)}
      />
      <InfoRow>
        <span className="font-semibold">{HANDS_LABELS[w.hands] ?? HANDS_LABELS.one}</span>
        <span>
          <Label>Tam: </Label>
          <i>{SIZE_LABELS[w.size] ?? w.size ?? "Normal"}</i>
        </span>
      </InfoRow>
      <ValueStrip
        turn={w.initiative ?? 0}
        attack={w.attack ?? 0}
        defense={defense}
        defenseKind={dodge >= parry ? "Esq" : "Par."}
        damage={w.finalDamage ?? 0}
        name={w.name}
        tips={{
          attack: `Ataque con ${w.name}|H. Ataque + calidad − pen. FUE + bonos=${w.attack ?? 0}|=${w.attack ?? 0}`,
          defense: `Defensa con ${w.name}|Mejor entre parada (${parry}) y esquiva (${dodge})=${defense}|=${defense}`,
          damage: `Daño con ${w.name}|Base escalada + FUE + calidad + mods=${w.finalDamage ?? 0}|=${w.finalDamage ?? 0}`,
        }}
      />
      <CritStrip
        crit1={w.primaryType || "—"}
        crit2={w.secondaryType || "—"}
        fortitude={w.fortitude ?? 0}
        breakage={w.breakage ?? 0}
        presence={w.presence ?? 0}
      />
      <InfoRow>
        <span>
          <Label>Calidad arma: </Label>
          <b>{w.quality ?? 0}</b>
        </span>
      </InfoRow>
      {w.weaponType === "ranged" && (
        <InfoRow>
          <span className="flex items-center gap-1.5 min-w-0">
            <Label>Munición</Label>
            <select
              className="a-input a-input--left h-[22px]! w-40!"
              value={w.ammoId ?? ""}
              disabled={!isEditable}
              onChange={(e) => itemOps.onItemUpdate(w.id, { "system.ammoId": e.target.value })}
            >
              <option value="">(sin munición)</option>
              {ammoItems.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </span>
          <span>
            <Label>Calidad munición: </Label>
            <b>{w.ammoQuality ?? "—"}</b>
          </span>
        </InfoRow>
      )}
      {isProjectile && (
        <InfoRow>
          <span>
            <Label>Rango: </Label>
            <b>{w.range ?? 0} m</b>
          </span>
          <span>
            <Label>Rec.: </Label>
            <b>{w.reload ?? 0}</b>
          </span>
        </InfoRow>
      )}
    </div>
  );
}

/** Sección completa: Desarmado + bloques de arma en 2 columnas. */
export function WeaponBlocks({
  system,
  items,
  isEditable,
  onUpdate,
  itemOps,
}: Pick<TabProps, "system" | "items" | "isEditable" | "onUpdate" | "itemOps">) {
  const equipment = system.equipment ?? {};
  const dodge = equipment.dodge ?? system.combat?.dodge?.final ?? 0;
  const weapons: any[] = equipment.weapons ?? [];
  // Cuerpo a cuerpo (y escudos) primero, proyectiles después, como el Excel.
  const sorted = [...weapons].sort(
    (a, b) => Number(typeBanner(a.weaponType) === "Arma de proyectiles") -
      Number(typeBanner(b.weaponType) === "Arma de proyectiles"),
  );
  const ammoItems = items.filter(
    (i) => i.type === "weapon" && i.system?.weaponType === "ammo",
  );

  return (
    <div
      className="grid gap-3 items-start"
      style={{ gridColumn: "span 12", gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}
    >
      <UnarmedBlock system={system} isEditable={isEditable} onUpdate={onUpdate} />
      {sorted.map((w, i) => (
        <WeaponBlock
          key={`${w.id || w.name}-${i}`}
          n={i + 1}
          weapon={w}
          dodge={dodge}
          ammoItems={ammoItems}
          isEditable={isEditable}
          itemOps={itemOps}
        />
      ))}
    </div>
  );
}
