import { SectionCard } from "../ui/SectionCard";

/** Themed placeholder for tabs not yet rebuilt from the mockup. */
export function StubPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="a-screen">
      <SectionCard title={title} dot="acc">
        <p className="text-[11.5px] a-muted leading-relaxed">{children}</p>
      </SectionCard>
    </div>
  );
}
