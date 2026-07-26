import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export interface TipRow {
  label: string;
  value: string | number;
}

export interface CalcTip {
  title: string;
  rows: TipRow[];
  result?: string | number;
}

/**
 * Parse the mockup's `data-tip` shorthand: "Title|label=val|label=val|=Result".
 * A segment starting with "=" is the result line.
 */
export function parseTip(raw: string): CalcTip {
  const parts = raw.split("|");
  const title = parts[0] ?? "";
  const rows: TipRow[] = [];
  let result: string | undefined;
  for (let i = 1; i < parts.length; i++) {
    const p = parts[i];
    if (p.startsWith("=")) {
      result = p.slice(1);
      continue;
    }
    const eq = p.lastIndexOf("=");
    if (eq === -1) continue;
    rows.push({ label: p.slice(0, eq), value: p.slice(eq + 1) });
  }
  return { title, rows, result };
}

interface CalcTooltipProps {
  /** Either a structured tip or the `Title|label=val|=Result` shorthand. */
  tip: CalcTip | string;
  /** The value the tooltip is anchored to. */
  children: ReactNode;
  /**
   * When true (default) the wrapper is an inline <span> with a dashed underline,
   * for anchoring on derived text. When false the wrapper is a <div> with no
   * underline, so it can be a layout box (a card, a vital cell) itself.
   */
  inline?: boolean;
  className?: string;
}

/**
 * Wraps a derived value and shows a positioned calculation popover on hover.
 * The popover is portaled to document.body so it is not clipped by the sheet's
 * scroll container. React port of the inline JS tooltip in Ficha Anima.dc.html.
 */
export function CalcTooltip({ tip, children, inline = true, className }: CalcTooltipProps) {
  const data = typeof tip === "string" ? parseTip(tip) : tip;
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const move = (e: React.MouseEvent) => {
    const pad = 14;
    let x = e.clientX + pad;
    let y = e.clientY + pad;
    // Best-effort flip near the right/bottom edges (popover ~ 280x140).
    if (x + 280 > window.innerWidth - 8) x = e.clientX - 280 - pad;
    if (y + 150 > window.innerHeight - 8) y = e.clientY - 150 - pad;
    setPos({ x, y });
  };

  const Wrapper = inline ? "span" : "div";

  return (
    <Wrapper
      className={`${inline ? "a-tipv" : "cursor-help"} ${className ?? ""}`}
      onMouseEnter={move}
      onMouseMove={move}
      onMouseLeave={() => setPos(null)}
    >
      {children}
      {pos &&
        createPortal(
          <div className="a-tip" style={{ left: pos.x, top: pos.y }}>
            <div className="a-tip-title">{data.title}</div>
            <div className="a-tip-body">
              {data.rows.map((r, i) => (
                <div className="a-tip-row" key={i}>
                  <span>{r.label}</span>
                  <span>{r.value}</span>
                </div>
              ))}
              {data.result !== undefined && (
                <div className="a-tip-total">
                  <span>Resultado</span>
                  <span>{data.result}</span>
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </Wrapper>
  );
}
