import { SectionCard } from "./SectionCard";
import { DIFFICULTY_LEVELS } from "../../../actors/creature/tables";

/** Read-only reference table shared by Místicos and Psíquicos (Excel "Dificultades" box). */
export function DifficultyTable({ style }: { style?: React.CSSProperties }) {
  return (
    <SectionCard title="Dificultades" dot="acc" padded={false} style={style}>
      <div className="a-thead" style={{ gridTemplateColumns: "56px 1fr 1.4fr" }}>
        <div className="text-center">Dif.</div>
        <div>Nombre</div>
        <div>Proyección</div>
      </div>
      {DIFFICULTY_LEVELS.map((r) => (
        <div key={r.key} className="a-trow" style={{ gridTemplateColumns: "56px 1fr 1.4fr" }}>
          <div className="text-center text-[11.5px] font-bold">{r.threshold}</div>
          <div className="px-2 py-1 text-xs">{r.label}</div>
          <div className="px-2 py-1 text-[11px] a-muted italic">{r.range}</div>
        </div>
      ))}
    </SectionCard>
  );
}
