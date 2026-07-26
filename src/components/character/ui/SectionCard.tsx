import type { ReactNode } from "react";

type Dot = "acc" | "blue" | "red";

interface SectionCardProps {
  title: ReactNode;
  dot?: Dot;
  /** Optional content rendered at the right edge of the header. */
  right?: ReactNode;
  /** Use the light (grey) header variant for reference panels. */
  light?: boolean;
  /** Apply default padding to the body. Set false for edge-to-edge tables. */
  padded?: boolean;
  bodyClass?: string;
  className?: string;
  style?: React.CSSProperties;
  children: ReactNode;
}

/** White rounded section card with a dark header + accent dot. */
export function SectionCard({
  title,
  dot,
  right,
  light = false,
  padded = true,
  bodyClass,
  className,
  style,
  children,
}: SectionCardProps) {
  return (
    <div className={`a-card ${className ?? ""}`} style={style}>
      <div className={`a-card-head ${light ? "a-card-head--light" : ""}`}>
        <span className="a-card-head-title">
          {dot && <span className={`a-dot a-dot--${dot}`} />}
          {title}
        </span>
        {right && <span className="a-card-head-right">{right}</span>}
      </div>
      <div className={padded ? `a-card-body ${bodyClass ?? ""}` : bodyClass}>{children}</div>
    </div>
  );
}
