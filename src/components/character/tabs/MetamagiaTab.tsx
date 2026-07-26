import { SectionCard } from "../ui/SectionCard";
import { StatCard } from "../ui/fields";
import { MetamagiaGraph } from "../ui/MetamagiaGraph";
import type { TabProps } from "./types";

export function MetamagiaTab({ system, isEditable, onUpdate }: TabProps) {
  const mg = system.magic ?? {};
  const acquiredIds: string[] = mg.metamagias ?? [];

  return (
    <div className="a-screen a-grid12">
      {/* Referencia de Nivel de Magia */}
      <div className="grid grid-cols-3 gap-3" style={{ gridColumn: "span 12" }}>
        <StatCard label="Nivel de Magia Máximo" value={mg.magicLevelMax ?? 0} color="blue" />
        <StatCard label="Usado" value={mg.magicLevelUsed ?? 0} />
        <StatCard label="Metamagia" value={mg.metamagiaMagicLevel ?? 0} color="acc" />
      </div>

      {/* Árbol de habilidades metamágicas */}
      <SectionCard
        title="Habilidades Metamágicas"
        dot="acc"
        padded={false}
        style={{ gridColumn: "span 12" }}
      >
        <MetamagiaGraph
          acquiredIds={acquiredIds}
          magicLevelMax={mg.magicLevelMax ?? 0}
          isEditable={isEditable}
          onToggle={(next) => onUpdate("system.magic.metamagias", next)}
        />
      </SectionCard>
    </div>
  );
}
