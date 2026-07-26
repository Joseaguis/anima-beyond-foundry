import { SectionCard } from "../ui/SectionCard";
import { NumberField, TextField, TextArea, Field, DerivedValue } from "../ui/fields";
import type { TabProps } from "./types";

const BIO_FIELDS: { label: string; path: string }[] = [
  { label: "Sexo", path: "details.sex" },
  { label: "Nephilim", path: "details.nephilim" },
  { label: "Altura", path: "details.height" },
  { label: "Peso", path: "details.weight" },
  { label: "Tez", path: "details.complexion" },
  { label: "Ojos", path: "details.eyes" },
  { label: "Cabello", path: "details.hair" },
  { label: "Edad", path: "details.age" },
  { label: "Región", path: "details.region" },
  { label: "Clase social", path: "details.socialClass" },
];

const TEXT_BLOCKS: { label: string; path: string; span: string; h: number }[] = [
  { label: "Particularidades", path: "biography.particularities", span: "span 6", h: 70 },
  { label: "Personalidad y motivación", path: "biography.personality", span: "span 6", h: 70 },
  { label: "Sueños y objetivos", path: "biography.dreams", span: "span 4", h: 64 },
  { label: "Resumen de historia", path: "biography.history", span: "span 8", h: 64 },
  { label: "Vestimenta", path: "biography.clothing", span: "span 4", h: 58 },
  { label: "Títulos y posesiones", path: "biography.titles", span: "span 4", h: 58 },
  { label: "Contactos", path: "biography.contacts", span: "span 4", h: 58 },
];

const MONEY: { label: string; path: string }[] = [
  { label: "Oro", path: "money.gold" },
  { label: "Plata", path: "money.silver" },
  { label: "Cobre", path: "money.copper" },
];

const FAME: { label: string; path: string }[] = [
  { label: "Audacia", path: "fame.audacity" },
  { label: "Cobardía", path: "fame.cowardice" },
  { label: "Honorabilidad", path: "fame.honor" },
  { label: "Infamia", path: "fame.infamy" },
];

export function GeneralTab({ actor, system, isEditable, onUpdate }: TabProps) {
  return (
    <div className="a-screen a-grid12">
      {/* Retrato + dinero */}
      <div className="flex flex-col gap-3" style={{ gridColumn: "span 3" }}>
        <div className="a-card">
          <img
            src={actor.img}
            alt={actor.name}
            className="w-full object-cover"
            style={{ aspectRatio: "3 / 4" }}
          />
        </div>
        <SectionCard title="Dinero" dot="acc">
          <div className="flex flex-col gap-1.5">
            {MONEY.map((m) => (
              <div key={m.path} className="flex items-center justify-between">
                <span className="text-xs" style={{ color: "#454c56" }}>
                  {m.label}
                </span>
                <NumberField
                  system={system}
                  path={m.path}
                  isEditable={isEditable}
                  onUpdate={onUpdate}
                  className="w-20! text-right!"
                  min={0}
                />
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Datos personales */}
      <SectionCard title="Descripción del personaje" style={{ gridColumn: "span 9" }}>
        <div className="grid grid-cols-4 gap-x-3 gap-y-2.5">
          <Field label="Raza">
            <TextField system={system} path="race" isEditable={isEditable} onUpdate={onUpdate} />
          </Field>
          <Field label="Apariencia (1–9)">
            <NumberField
              system={system}
              path="details.appearance"
              isEditable={isEditable}
              onUpdate={onUpdate}
              min={1}
            />
          </Field>
          {BIO_FIELDS.map((f) => (
            <Field key={f.path} label={f.label}>
              <TextField
                system={system}
                path={f.path}
                isEditable={isEditable}
                onUpdate={onUpdate}
              />
            </Field>
          ))}
        </div>
      </SectionCard>

      {/* Bloques de texto */}
      {TEXT_BLOCKS.map((b) => (
        <SectionCard
          key={b.path}
          title={b.label}
          padded={false}
          style={{ gridColumn: b.span }}
        >
          <TextArea
            system={system}
            path={b.path}
            isEditable={isEditable}
            onUpdate={onUpdate}
            style={{ minHeight: b.h }}
          />
        </SectionCard>
      ))}

      {/* Fama */}
      <SectionCard title="Fama y reconocimiento" dot="blue" style={{ gridColumn: "span 6" }}>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {FAME.map((f) => (
            <div key={f.path} className="flex items-center justify-between">
              <span className="text-xs" style={{ color: "#454c56" }}>
                {f.label}
              </span>
              <NumberField
                system={system}
                path={f.path}
                isEditable={isEditable}
                onUpdate={onUpdate}
                className="w-14!"
              />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Salud mental */}
      <SectionCard title="Salud mental" dot="red" style={{ gridColumn: "span 6" }}>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: "#454c56" }}>
            Umbral de locura
          </span>
          <NumberField
            system={system}
            path="mentalHealth.insanityThreshold"
            isEditable={isEditable}
            onUpdate={onUpdate}
            className="w-16! text-base! font-bold"
          />
          <DerivedValue
            className="text-[11px] a-muted font-normal"
            value="¿cómo se calcula?"
            tip={`Umbral de locura|Base VOL=${system.wp?.final ?? 0}|=${system.mentalHealth?.insanityThreshold ?? 0}`}
          />
        </div>
      </SectionCard>

      {/* Lenguas */}
      <SectionCard title="Lenguas" padded={false} style={{ gridColumn: "span 12" }}>
        <TextArea
          system={system}
          path="languages"
          isEditable={isEditable}
          onUpdate={onUpdate}
          style={{ minHeight: 80 }}
        />
      </SectionCard>
    </div>
  );
}
