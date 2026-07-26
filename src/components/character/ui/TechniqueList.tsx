import { SectionCard } from "./SectionCard";
import { ItemList } from "./ItemList";
import { formatKiCost, meetsTreeRequirement } from "../../../domains/ki/technique-build";
import type { AnimaItem, ItemOps } from "../../../sheets/ReactSheet";

/**
 * Ki techniques grouped by their Árbol de Técnicas, with the CM and the
 * per-characteristic Ki cost derived by the builder.
 *
 * Also warns when the tree requirement is unmet: two Básicas are needed before a
 * Mayor and two Mayores before an Arcana (Dominus p. 044). The requirement is
 * reported, not enforced — the GM decides.
 */

const DURATION_LABELS: Record<string, string> = {
  none: "—",
  maintained: "Mantenida",
  sustainedMinor: "Sost. 5 as.",
  sustainedMajor: "Sost. 20 as.",
};

interface TechniqueListProps {
  items: AnimaItem[];
  isEditable: boolean;
  itemOps: ItemOps;
}

export function TechniqueList({ items, isEditable, itemOps }: TechniqueListProps) {
  const techniques = items.filter((i) => i.type === "kiTechnique");

  // Group by tree, preserving first-seen order; untreed techniques go last.
  const trees: { tree: string; items: AnimaItem[] }[] = [];
  for (const item of techniques) {
    const tree = ((item.system as any)?.tree ?? "").trim() || "Sin árbol";
    const group = trees.find((g) => g.tree === tree);
    if (group) group.items.push(item);
    else trees.push({ tree, items: [item] });
  }

  const owned = techniques.map((i) => ({ level: (i.system as any)?.level ?? 1 }));
  const unmet = [2, 3].filter(
    (level) =>
      techniques.some((i) => ((i.system as any)?.level ?? 1) === level) &&
      !meetsTreeRequirement(level, owned),
  );

  const columns = [
    { label: "Nivel", width: "52px", render: (i: AnimaItem) => (i.system as any)?.level ?? 1 },
    { label: "CM", width: "48px", render: (i: AnimaItem) => (i.system as any)?.mkCost ?? 0 },
    {
      label: "Coste en Ki",
      width: "1.4fr",
      render: (i: AnimaItem) => {
        const build = (i.system as any)?.build;
        if (!build) return "—";
        return formatKiCost(build.kiCost, build.kiUpkeep) || "—";
      },
    },
    {
      label: "Mant.",
      width: "56px",
      render: (i: AnimaItem) => (i.system as any)?.build?.kiUpkeepTotal || "—",
    },
    {
      label: "Duración",
      width: "84px",
      render: (i: AnimaItem) =>
        DURATION_LABELS[(i.system as any)?.profile?.duration?.mode ?? "none"] ?? "—",
    },
    {
      label: "",
      width: "24px",
      render: (i: AnimaItem) =>
        (i.system as any)?.build?.errors?.length ? (
          <span className="a-red" title="La composición no valida; ábrela para ver los errores.">
            !
          </span>
        ) : null,
    },
  ];

  return (
    <>
      {unmet.length > 0 && (
        <SectionCard
          title="Árbol de Técnicas"
          dot="red"
          light
          style={{ gridColumn: "span 12" }}
        >
          <p className="a-red text-[11px]">
            {unmet
              .map((level) =>
                level === 2
                  ? "Una Técnica Mayor exige conocer antes dos Básicas."
                  : "Una Técnica Arcana exige conocer antes dos Mayores.",
              )
              .join(" ")}
          </p>
        </SectionCard>
      )}

      {trees.length === 0 ? (
        <ItemList
          title="Técnicas de Ki"
          items={items}
          type="kiTechnique"
          isEditable={isEditable}
          itemOps={itemOps}
          addLabel="+ Técnica"
          emptyLabel="Sin técnicas. Crea una y compón sus Efectos en la pestaña Técnica."
          style={{ gridColumn: "span 12" }}
          columns={columns}
        />
      ) : (
        trees.map((group) => (
          <ItemList
            key={group.tree}
            title={`Técnicas de Ki — ${group.tree}`}
            items={group.items}
            type="kiTechnique"
            isEditable={isEditable}
            itemOps={itemOps}
            addLabel="+ Técnica"
            style={{ gridColumn: "span 12" }}
            columns={columns}
          />
        ))
      )}
    </>
  );
}
