import { CalcTooltip } from "./ui/CalcTooltip";

interface VitalsStripProps {
  actor: FoundryActor;
  system: Record<string, any>;
}

interface Vital {
  label: string;
  value: string | number;
  color: string;
  tip: string;
}

export function VitalsStrip({ actor, system }: VitalsStripProps) {
  const lp = system.lifePoints ?? {};
  const ki = system.ki ?? {};
  const magic = system.magic ?? {};
  const initiative = system.initiative ?? {};

  const raceLine = [
    system.race ? game.i18n.localize(`ANIMA.Race${capitalize(system.race)}`) || system.race : "",
    `Nivel ${system.level ?? 0}`,
  ]
    .filter(Boolean)
    .join(" · ");

  const vitals: Vital[] = [
    {
      label: "Vida",
      value: `${lp.current ?? 0}/${lp.max ?? 0}`,
      color: "#e0732a",
      tip: `Puntos de Vida|Actual=${lp.current ?? 0}|Máximo=${lp.max ?? 0}|=${lp.current ?? 0} / ${lp.max ?? 0}`,
    },
    {
      label: magic.zeonMax ? "Zeón" : "Ki",
      value: magic.zeonMax ? magic.zeonMax : (ki.totalPoints ?? 0),
      color: "#2f6fd0",
      tip: magic.zeonMax
        ? `Zeón máximo|Acumulado=${magic.zeonMax}|=${magic.zeonMax}`
        : `Puntos de Ki|Total por característica=${ki.totalPoints ?? 0}|=${ki.totalPoints ?? 0}`,
    },
    {
      label: "Turno",
      value: initiative.final ?? 0,
      color: "#eef0f2",
      tip: `Turno (Iniciativa)|Base=${initiative.base ?? 0}|Penal. armadura=${-(initiative.armorPenalty ?? 0)}|Bono arma=${initiative.weaponBonus ?? 0}|=${initiative.final ?? 0}`,
    },
    {
      label: "Nivel",
      value: system.level ?? 0,
      color: "#eef0f2",
      tip: `Nivel|PD totales=${system.developmentPoints ?? 0}|=${system.level ?? 0}`,
    },
  ];

  return (
    <div className="a-vitals">
      <div className="flex flex-col leading-none">
        <span className="a-vitals-tagline">ANIMA · BEYOND FANTASY</span>
        <span className="a-vitals-name">{actor.name}</span>
      </div>
      <div className="a-vitals-sep" />
      <span className="a-vitals-sub">{raceLine}</span>
      <div className="flex-1" />
      {vitals.map((v) => (
        <CalcTooltip key={v.label} tip={v.tip} inline={false} className="a-vital">
          <span className="a-vital-label">{v.label}</span>
          <span className="a-vital-value" style={{ color: v.color }}>
            {v.value}
          </span>
        </CalcTooltip>
      ))}
    </div>
  );
}

function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
