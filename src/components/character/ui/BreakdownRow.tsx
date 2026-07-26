/** Excel-style breakdown row: label left, value right, dashed separator. */
export function BreakdownRow({
  label,
  value,
  red = false,
}: {
  label: string;
  value: React.ReactNode;
  red?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between px-2.5 py-1 text-xs"
      style={{ borderBottom: "1px dashed #d5d9df" }}
    >
      <span style={{ color: "#454c56" }}>{label}</span>
      <span className={`font-semibold ${red ? "a-red" : ""}`}>{value}</span>
    </div>
  );
}
