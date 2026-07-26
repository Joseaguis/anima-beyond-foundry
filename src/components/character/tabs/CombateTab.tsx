import { useState } from "react";
import { SectionCard } from "../ui/SectionCard";
import { TextArea } from "../ui/fields";
import { ItemList } from "../ui/ItemList";
import { WeaponBlocks } from "./combate/WeaponBlocks";
import type { TabProps } from "./types";

const AT_TYPES: { key: string; label: string }[] = [
  { key: "fil", label: "FIL" },
  { key: "con", label: "CON" },
  { key: "pen", label: "PEN" },
  { key: "cal", label: "CAL" },
  { key: "ele", label: "ELE" },
  { key: "fri", label: "FRI" },
  { key: "ene", label: "ENE" },
];

// Armadura | Localización | Calidad | 7×TA | Ent. | Pres. | R.Mov. | Pen.Nat.
const ARMOR_GRID = "1.4fr 92px 56px repeat(7, 40px) 44px 46px 52px 56px";

const LOCALIZATION_LABELS: Record<string, string> = {
  complete: "Completa",
  breastplate: "Peto",
  shirt: "Camisola",
  head: "Cabeza",
  other: "Otra",
};

const WEAPON_TYPE_LABELS: Record<string, string> = {
  melee: "C. a C.",
  ranged: "Distancia",
  thrown: "Arrojad.",
  ammo: "Munición",
  shield: "Escudo",
};

const ARMOR_TYPE_LABELS: Record<string, string> = {
  soft: "Blanda",
  hard: "Dura",
  natural: "Natural",
};

export function CombateTab({ system, items, isEditable, onUpdate, itemOps }: TabProps) {
  const combat = system.combat ?? {};
  const equipment = system.equipment ?? {};
  const armors: any[] = system.equippedArmors ?? [];
  const weapons: any[] = equipment.weapons ?? [];
  const unarmed = equipment.unarmed ?? {};
  // El desglose lo publica prepareCombat (incluye efectos y modificadores
  // manuales); la armadura penaliza aparte solo las acciones físicas.
  const amb = combat.actionModBreakdown ?? {};
  const allActionsMod = (amb.allActions ?? 0) + (amb.fatigue ?? system.state?.fatiguePenalty ?? 0);
  const physicalMod = (amb.physicalActions ?? 0) + (equipment.physicalActionPenalty ?? 0);

  return (
    <div className="a-screen a-grid12">
      {/* Armadura por localización (Excel Equipo de Combate) */}
      <SectionCard title="Armadura" padded={false} style={{ gridColumn: "span 12" }}>
        <div className="scl overflow-x-auto">
          <div style={{ minWidth: 920 }}>
            <div className="a-thead" style={{ gridTemplateColumns: ARMOR_GRID }}>
              <div>Armadura</div>
              <div className="text-center">Localización</div>
              <div className="text-center">Calidad</div>
              {AT_TYPES.map((t) => (
                <div key={t.key} className="text-center">
                  {t.label}
                </div>
              ))}
              <div className="text-center">Ent.</div>
              <div className="text-center">Pres.</div>
              <div className="text-center">R. Mov.</div>
              <div className="text-center">Pen. Nat.</div>
            </div>
            {armors.length === 0 && (
              <div className="px-2.5 py-2 text-[11.5px] a-muted">
                Sin armaduras equipadas. Marca "Equipado" en el inventario.
              </div>
            )}
            {armors.map((a, i) => (
              <div key={`${a.name}-${i}`} className="a-trow" style={{ gridTemplateColumns: ARMOR_GRID }}>
                <div className="px-2 py-0.5 text-xs truncate" title={a.name}>
                  {a.name}
                </div>
                <div className="text-center text-[11px]">
                  {LOCALIZATION_LABELS[a.localization] ?? a.localization ?? "—"}
                </div>
                <div className="text-center text-[11.5px]">{a.quality ?? 0}</div>
                {AT_TYPES.map((t) => (
                  <div key={t.key} className="text-center text-[11.5px]">
                    {a.at?.[t.key] ?? 0}
                  </div>
                ))}
                <div className="text-center text-[11.5px]">{a.fortitude ?? 0}</div>
                <div className="text-center text-[11.5px]">{a.presence ?? 0}</div>
                <div className="text-center text-[11.5px]">{a.movementPenalty ?? 0}</div>
                <div className="text-center text-[11.5px]">{a.naturalPenalty ?? 0}</div>
              </div>
            ))}
            {/* TA combinada de todas las capas */}
            <div className="a-tfoot text-[11.5px]" style={{ gridTemplateColumns: ARMOR_GRID }}>
              <div className="px-2 py-1 font-bold" style={{ gridColumn: "span 3" }}>
                TA combinada
              </div>
              {AT_TYPES.map((t) => (
                <div key={t.key} className="text-center py-1 font-bold italic">
                  {equipment.at?.[t.key] ?? 0}
                </div>
              ))}
              <div style={{ gridColumn: "span 4" }} />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 px-2.5 py-1.5 text-[11.5px]" style={{ borderTop: "1px solid var(--bd)" }}>
          <span>
            Restricción movimiento: <b>{equipment.movementPenalty ?? 0}</b>
          </span>
          <span>
            Requisito: <b>{equipment.requirement ?? 0}</b>
          </span>
          <span>
            Pen. a acción física: <b className={physicalMod < 0 ? "a-red" : ""}>{physicalMod}</b>
          </span>
          <span>
            Pen. Natural Final: <b className={(equipment.naturalPenalty ?? 0) < 0 ? "a-red" : ""}>{equipment.naturalPenalty ?? 0}</b>
          </span>
          <span>
            Pen. percepción: <b>{equipment.perceptionPenalty ?? 0}</b>
          </span>
        </div>
      </SectionCard>

      {/* Armas: bloques estilo Excel (Desarmado + un bloque por arma, 2 col) */}
      <WeaponBlocks
        system={system}
        items={items}
        isEditable={isEditable}
        onUpdate={onUpdate}
        itemOps={itemOps}
      />

      {/* Modificadores / Calculadora / Notas */}
      <SectionCard title="Modificadores" padded={false} style={{ gridColumn: "span 4" }}>
        <div className="a-thead" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div className="text-center">A toda acción</div>
          <div className="text-center">A acciones físicas</div>
        </div>
        <div className="a-trow" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div className="text-center py-1 text-[11px] a-muted">Cansancio, dolor…</div>
          <div className="text-center py-1 text-[11px] a-muted">Pen. armadura, presa…</div>
        </div>
        <div className="a-tfoot" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div className={`text-center py-1.5 font-bold ${allActionsMod < 0 ? "a-red" : ""}`}>
            {allActionsMod}
          </div>
          <div className={`text-center py-1.5 font-bold ${physicalMod < 0 ? "a-red" : ""}`}>
            {physicalMod}
          </div>
        </div>
      </SectionCard>

      <div style={{ gridColumn: "span 4" }}>
        <DamageCalculator weaponDamage={weapons[0]?.finalDamage ?? unarmed.finalDamage ?? 0} />
      </div>

      <SectionCard title="Notas Equipo de Combate" padded={false} style={{ gridColumn: "span 4" }}>
        <TextArea
          system={system}
          path="combatNotes"
          isEditable={isEditable}
          onUpdate={onUpdate}
          style={{ minHeight: 96 }}
        />
      </SectionCard>

      {/* Inventarios */}
      <div style={{ gridColumn: "span 6" }}>
        <ItemList
          title="Inventario de Armas"
          items={items}
          type="weapon"
          isEditable={isEditable}
          itemOps={itemOps}
          emptyLabel="Sin armas. Añade una para empezar."
          columns={[
            { label: "Tipo", width: "72px", render: (i) => WEAPON_TYPE_LABELS[i.system?.weaponType] ?? i.system?.weaponType ?? "—" },
            { label: "Daño", width: "52px", render: (i) => i.system?.damage ?? 0 },
            { label: "Turno", width: "52px", render: (i) => i.system?.speed ?? 0 },
          ]}
        />
      </div>

      <div style={{ gridColumn: "span 6" }}>
        <ItemList
          title="Inventario de Armaduras"
          items={items}
          type="armor"
          isEditable={isEditable}
          itemOps={itemOps}
          emptyLabel="Sin armaduras."
          columns={[
            { label: "Tipo", width: "72px", render: (i) => ARMOR_TYPE_LABELS[i.system?.armorType] ?? i.system?.armorType ?? "—" },
            { label: "Localiz.", width: "76px", render: (i) => LOCALIZATION_LABELS[i.system?.localization] ?? i.system?.localization ?? "—" },
            { label: "Penal.", width: "52px", render: (i) => i.system?.movementPenalty ?? 0 },
          ]}
        />
      </div>

      {/* Las tablas de armas/estilos/artes/ars magnus viven en la pestaña PDs
          (hoja PDs del Excel), donde su coste cuenta como PD/CM gastado. */}
    </div>
  );
}

function DamageCalculator({ weaponDamage }: { weaponDamage: number }) {
  const [atkResult, setAtkResult] = useState(0);
  const [defResult, setDefResult] = useState(0);
  const [enemyTA, setEnemyTA] = useState(0);

  // Simplified Anima damage: difference → absorption table (~%), minus enemy TA.
  const diff = atkResult - defResult;
  let pct = 0;
  if (diff >= 150) pct = 140;
  else if (diff >= 100) pct = 120;
  else if (diff >= 50) pct = 100;
  else if (diff >= 0) pct = 70;
  const raw = Math.round((weaponDamage * pct) / 100);
  const final = Math.max(0, raw - enemyTA * 10);

  const num = (v: number, set: (n: number) => void, label: string) => (
    <div className="flex items-center justify-between">
      <span className="text-[11.5px]" style={{ color: "#454c56" }}>
        {label}
      </span>
      <input
        type="text"
        inputMode="numeric"
        className="a-input w-16!"
        value={v}
        onFocus={(e) => e.target.select()}
        onChange={(e) => set(parseInt(e.target.value, 10) || 0)}
      />
    </div>
  );

  return (
    <SectionCard title="Calculadora de daño">
      <div className="flex flex-col gap-2">
        {num(atkResult, setAtkResult, "Resultado ataque")}
        {num(defResult, setDefResult, "Resultado defensa")}
        {num(enemyTA, setEnemyTA, "TA enemigo")}
        <div
          className="mt-1 rounded-[3px] px-3 py-2 flex items-center justify-between"
          style={{ background: "#eef1f5", border: "1px solid var(--bd)" }}
        >
          <span className="text-[11px] font-semibold uppercase" style={{ letterSpacing: ".06em" }}>
            Daño final
          </span>
          <span className="text-[24px] font-bold">{final}</span>
        </div>
      </div>
    </SectionCard>
  );
}
