import type { ReactNode } from "react";
import { SectionCard } from "../ui/SectionCard";
import { NumberField, TextField, TextArea, DerivedValue } from "../ui/fields";
import { ItemList } from "../ui/ItemList";
import { InnatosList, type Innato } from "../ui/InnatosList";
import { DifficultyTable } from "../ui/DifficultyTable";
import { CONCENTRATION_BONUSES, CV_FREE_USES } from "../../../domains/psychic/tables";
import type { TabProps } from "./types";

const ACTION_LABELS: Record<string, string> = {
  active: "Activa",
  passive: "Pasiva",
};

/** Read-only derived stat: label on the left, value (with optional tooltip) on the right. */
function DerivedLine({
  label,
  value,
  tip,
  muted = false,
}: {
  label: ReactNode;
  value: number;
  tip?: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1" style={{ borderBottom: "1px dashed #d5d9df" }}>
      <span className={`text-[11.5px] ${muted ? "a-muted" : ""}`} style={muted ? undefined : { color: "#454c56" }}>
        {label}
      </span>
      <DerivedValue value={value} tip={tip} />
    </div>
  );
}

/** Editable reserve field: label on the left, NumberField on the right. */
function InputLine({
  label,
  system,
  path,
  isEditable,
  onUpdate,
  min,
}: {
  label: ReactNode;
  system: Record<string, any>;
  path: string;
  isEditable: boolean;
  onUpdate: TabProps["onUpdate"];
  min?: number;
}) {
  return (
    <div className="flex items-center justify-between py-1" style={{ borderBottom: "1px dashed #d5d9df" }}>
      <span className="text-[11.5px]" style={{ color: "#454c56" }}>{label}</span>
      <NumberField system={system} path={path} isEditable={isEditable} onUpdate={onUpdate} min={min} className="w-16!" />
    </div>
  );
}

export function PsiquicosTab({ system, items, isEditable, onUpdate, itemOps, rollOps }: TabProps) {
  const psy = system.psychic ?? {};
  const innatos: Innato[] = psy.innatos ?? [];

  // Desglose de "Usos permanentes" (Excel): recalculado desde los items.
  const disciplineCvs = items
    .filter((i: any) => i.type === "psychicDiscipline")
    .reduce((sum: number, i: any) => sum + (i.system?.affinityCost ?? 1), 0);
  const powers = items.filter((i: any) => i.type === "psychicPower");
  const powerCvs = powers.reduce((sum: number, i: any) => sum + (i.system?.masteryCost ?? 1), 0);
  const fortifyCvs = powers.reduce((sum: number, i: any) => sum + (i.system?.fortifyCvs ?? 0), 0);
  const innatoCvs = innatos.length * 2;
  const potentialCvs = psy.potentialIncrementCvs ?? 0;

  // Cristal psíquico (Core p. 229). Un cristal atado a una disciplina no entra
  // en el potencial global, sólo bonifica los poderes de esa disciplina.
  const crystalBonus = psy.crystalBonus ?? 0;
  const crystalDiscipline: string = psy.crystalDiscipline ?? "";
  const crystalFatigue = psy.crystalFatiguePenalty ?? 0;
  const crystalInTotal = crystalBonus > 0 && !crystalDiscipline;
  const potentialTip =
    `Potencial Psíquico|Base + incremento + especial${crystalInTotal ? " + cristal" : ""}` +
    `=${psy.potentialFinal ?? 0}|=${psy.potentialFinal ?? 0}`;

  // Un innato sólo puede sostener un poder mantenible (Core p. 212).
  const maintainablePowers: string[] = powers
    .filter((i: any) => i.system?.maintainable)
    .map((i: any) => i.name);

  return (
    <div className="a-screen a-grid12">
      {/* Tabla general de CVs con usos permanentes */}
      <SectionCard title="Tabla general de CVs" padded={false} className="a-zebra" style={{ gridColumn: "span 4" }}>
        <div className="px-2.5 pt-1">
          <DerivedLine
            label="CVs Totales"
            value={psy.cvMax ?? 0}
            tip={`CV máximo|Innato + comprado + especial=${psy.cvMax ?? 0}|=${psy.cvMax ?? 0}`}
          />
          <DerivedLine label="CVs Usados" value={psy.cvUsed ?? 0} />
        </div>
        <div className="a-thead mt-1" style={{ gridTemplateColumns: "1fr 56px" }}>
          <div>Usos permanentes</div>
          <div className="text-center">CVs</div>
        </div>
        {(
          [
            ["Disciplinas Psíquicas", disciplineCvs],
            ["Poderes Psíquicos", powerCvs],
            ["Fortalecer Poder", fortifyCvs],
            ["Incrementar Potencial", potentialCvs],
            ["Adquirir Innatos", innatoCvs],
          ] as const
        ).map(([label, cvs]) => (
          <div key={label} className="a-trow" style={{ gridTemplateColumns: "1fr 56px" }}>
            <div className="px-2.5 py-0.5 text-xs">{label}</div>
            <div className="text-center text-[12px] font-semibold">{cvs}</div>
          </div>
        ))}
        <div className="a-tfoot" style={{ gridTemplateColumns: "1fr 56px" }}>
          <div className="px-2.5 py-1 text-[11px] font-bold uppercase">CVs Libres</div>
          <div className={`text-center py-1 font-bold italic ${(psy.cvFree ?? 0) < 0 ? "a-red" : ""}`}>
            {psy.cvFree ?? 0}
          </div>
        </div>
      </SectionCard>

      {/* Potencial Psíquico */}
      <SectionCard title="Potencial Psíquico" style={{ gridColumn: "span 4" }}>
        <DerivedLine
          label="Base (VOL)"
          value={psy.potentialBase ?? 0}
          tip={`Potencial base|Tabla por VOL=${psy.potentialBase ?? 0}|=${psy.potentialBase ?? 0}`}
        />
        <DerivedLine label="Incremento" value={psy.potentialIncrement ?? 0} />
        <DerivedLine label="Total" value={psy.potentialFinal ?? 0} tip={potentialTip} />
        <InputLine
          label="CV en Incrementar Potencial"
          system={system}
          path="psychic.potentialIncrementCvs"
          isEditable={isEditable}
          onUpdate={onUpdate}
          min={0}
        />
        <DerivedLine label="Nº de Innatos" value={psy.innatosCount ?? innatos.length} muted />
      </SectionCard>

      {/* Cristal Psíquico (Core p. 229) */}
      <SectionCard title="Cristal Psíquico" style={{ gridColumn: "span 4" }}>
        <InputLine
          label="Bono al Potencial"
          system={system}
          path="psychic.crystalBonus"
          isEditable={isEditable}
          onUpdate={onUpdate}
          min={0}
        />
        <div className="flex items-center justify-between py-1" style={{ borderBottom: "1px dashed #d5d9df" }}>
          <span className="text-[11.5px]" style={{ color: "#454c56" }}>Disciplina</span>
          <TextField
            system={system}
            path="psychic.crystalDiscipline"
            isEditable={isEditable}
            onUpdate={onUpdate}
            className="w-32!"
          />
        </div>
        {/* Cada +5 del cristal sube en 1 el nivel de la fatiga al fracasar. */}
        <div className="flex items-center justify-between py-1">
          <span className="text-[11.5px]" style={{ color: "#454c56" }}>Fatiga adicional</span>
          <span className={`text-[12px] font-semibold ${crystalFatigue > 0 ? "a-red" : "a-muted"}`}>
            {crystalFatigue > 0 ? `+${crystalFatigue}` : "—"}
          </span>
        </div>
        <p className="px-0.5 pt-1 text-[10.5px] a-muted italic">
          {crystalDiscipline
            ? `Sólo bonifica los poderes de ${crystalDiscipline}; no entra en el total.`
            : "Requiere contacto físico. Sólo puede sincronizarse un cristal."}
        </p>
      </SectionCard>

      {/* Proyección Psíquica */}
      <SectionCard title="Proyección Psíquica" style={{ gridColumn: "span 4" }}>
        <DerivedLine
          label="Turno / At. / Def."
          value={psy.projectionFinal ?? 0}
          tip={`Proyección Psíquica|Base + bono DES + especial=${psy.projectionFinal ?? 0}|=${psy.projectionFinal ?? 0}`}
        />
        <InputLine
          label="Especial"
          system={system}
          path="psychic.projectionSpecial"
          isEditable={isEditable}
          onUpdate={onUpdate}
        />
        <InputLine
          label="CV Actual"
          system={system}
          path="psychic.cvCurrent"
          isEditable={isEditable}
          onUpdate={onUpdate}
          min={0}
        />
      </SectionCard>

      {/* CVs Libres: costes de referencia */}
      <SectionCard title="CVs Libres · usos" padded={false} className="a-zebra" style={{ gridColumn: "span 4" }}>
        {CV_FREE_USES.map((r) => (
          <div key={r.use} className="a-trow" style={{ gridTemplateColumns: "1fr 1.1fr" }}>
            <div className="px-2.5 py-0.5 text-xs">{r.use}</div>
            <div className="px-2 py-0.5 text-[11px] a-muted italic">{r.cost}</div>
          </div>
        ))}
      </SectionCard>

      {/* Concentración */}
      <SectionCard title="Concentración" padded={false} className="a-zebra" style={{ gridColumn: "span 4" }}>
        <div className="a-thead" style={{ gridTemplateColumns: "1fr 72px" }}>
          <div>Preparación</div>
          <div className="text-center">Bono</div>
        </div>
        {CONCENTRATION_BONUSES.map((r) => (
          <div key={r.time} className="a-trow" style={{ gridTemplateColumns: "1fr 72px" }}>
            <div className="px-2.5 py-0.5 text-xs">{r.time}</div>
            <div className="text-center font-semibold text-[12px]">+{r.bonus}</div>
          </div>
        ))}
      </SectionCard>

      {/* Dificultades de referencia */}
      <DifficultyTable style={{ gridColumn: "span 4" }} />

      {/* Disciplinas afines */}
      <ItemList
        title="Disciplinas afines"
        items={items}
        type="psychicDiscipline"
        isEditable={isEditable}
        itemOps={itemOps}
        addLabel="+ Disciplina"
        emptyLabel="Sin disciplinas afines."
        style={{ gridColumn: "span 6" }}
        columns={[
          { label: "Modificador", width: "1.2fr", render: (i: any) => i.system?.situationalModifier || "—" },
          { label: "CV", width: "44px", render: (i: any) => i.system?.affinityCost ?? 1 },
        ]}
      />

      {/* Patrones Mentales */}
      <ItemList
        title="Patrones Mentales"
        items={items}
        type="mentalPattern"
        isEditable={isEditable}
        itemOps={itemOps}
        addLabel="+ Patrón"
        emptyLabel="Sin patrones mentales."
        style={{ gridColumn: "span 6" }}
        columns={[
          { label: "Modificador", width: "1.2fr", render: (i: any) => i.system?.modifier || "—" },
          { label: "PD", width: "44px", render: (i: any) => i.system?.dpCost ?? 0 },
        ]}
      />

      {/* Poderes psíquicos */}
      <ItemList
        title="Poderes"
        items={items}
        type="psychicPower"
        isEditable={isEditable}
        itemOps={itemOps}
        addLabel="+ Poder"
        emptyLabel="Sin poderes psíquicos."
        style={{ gridColumn: "span 8" }}
        // Pulsar el nombre lanza el control de potencial del poder.
        rollSlugFor={(i) => `power.${i.id}`}
        rollOps={rollOps}
        columns={[
          { label: "Disciplina", width: "1fr", render: (i: any) => i.system?.discipline || "Matricial" },
          { label: "Nivel", width: "48px", render: (i: any) => i.system?.powerLevel ?? 0 },
          { label: "Acción", width: "60px", render: (i: any) => ACTION_LABELS[i.system?.action] ?? "—" },
          { label: "CVs", width: "44px", render: (i: any) => i.system?.masteryCost ?? 1 },
          { label: "Bono", width: "52px", render: (i: any) => `+${(i.system?.fortifyCvs ?? 0) * 10}` },
        ]}
      />

      {/* Innatos activos */}
      <InnatosList
        innatos={innatos}
        maintainablePowers={maintainablePowers}
        cvFree={psy.cvFree ?? 0}
        isEditable={isEditable}
        onUpdate={onUpdate}
        style={{ gridColumn: "span 4" }}
      />

      {/* Notas Psíquicos */}
      <SectionCard title="Notas Psíquicos" padded={false} style={{ gridColumn: "span 12" }}>
        <TextArea
          system={system}
          path="psychicNotes"
          isEditable={isEditable}
          onUpdate={onUpdate}
          style={{ minHeight: 72 }}
        />
      </SectionCard>
    </div>
  );
}
