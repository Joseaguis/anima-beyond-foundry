import type { ReactNode } from "react";

/**
 * Excel-style box with a vertical rotated title on the left gutter
 * (Características, Resistencias, Habilidades Secundarias...). Compose inside
 * an `.a-card` or standalone; the content flows to the right of the label.
 */
export function SideLabelTable({
  label,
  muted = false,
  children,
  className,
  style,
}: {
  label: string;
  muted?: boolean;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={`a-card ${className ?? ""}`} style={style}>
      <div className="flex flex-1 min-h-0">
        <div className={`a-vlabel ${muted ? "a-vlabel--muted" : ""}`}>{label}</div>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
