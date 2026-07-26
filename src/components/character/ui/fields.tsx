import { useEffect, useState, type ReactNode } from "react";
import { CalcTooltip, type CalcTip } from "./CalcTooltip";

export type OnUpdate = (path: string, value: unknown) => Promise<void>;

interface BaseFieldProps {
  system: Record<string, any>;
  path: string; // path relative to `system`, e.g. "agi.base"
  isEditable: boolean;
  onUpdate: OnUpdate;
  className?: string;
}

/** Read a dotted path out of an object. */
function readPath(obj: Record<string, any>, path: string): any {
  return path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
}

const SAFE_MATH = /^[\d\s+\-*/().]+$/;

function evalMath(raw: string): number {
  const trimmed = raw.trim();
  if (!trimmed) return 0;
  if (SAFE_MATH.test(trimmed)) {
    try {
      const result = new Function(`return (${trimmed})`)() as number;
      if (typeof result === "number" && isFinite(result)) return Math.round(result);
    } catch { /* fall through */ }
  }
  return parseInt(trimmed, 10) || 0;
}

/** Editable numeric input that commits to `system.<path>` on blur. */
export function NumberField({
  system,
  path,
  isEditable,
  onUpdate,
  className,
  placeholder,
  min,
}: BaseFieldProps & { placeholder?: string; min?: number }) {
  const stored = Number(readPath(system, path) ?? 0);
  const [local, setLocal] = useState<string>(String(stored));

  useEffect(() => {
    setLocal(String(stored));
  }, [stored]);

  const commit = () => {
    let value = evalMath(local);
    if (min != null && value < min) value = min;
    if (value !== stored) onUpdate(`system.${path}`, value);
    setLocal(String(value));
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      className={`a-input ${className ?? ""}`}
      value={local}
      placeholder={placeholder}
      disabled={!isEditable}
      onChange={(e) => setLocal(e.target.value)}
      onFocus={(e) => e.target.select()}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
    />
  );
}

/** Editable text input that commits to `system.<path>` on blur. */
export function TextField({
  system,
  path,
  isEditable,
  onUpdate,
  className,
  placeholder,
}: BaseFieldProps & { placeholder?: string }) {
  const stored = String(readPath(system, path) ?? "");
  const [local, setLocal] = useState(stored);

  useEffect(() => {
    setLocal(stored);
  }, [stored]);

  const commit = () => {
    if (local !== stored) onUpdate(`system.${path}`, local);
  };

  return (
    <input
      type="text"
      className={`a-input a-input--left ${className ?? ""}`}
      value={local}
      placeholder={placeholder}
      disabled={!isEditable}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
    />
  );
}

/** Editable multi-line text that commits to `system.<path>` on blur. */
export function TextArea({
  system,
  path,
  isEditable,
  onUpdate,
  className,
  style,
}: BaseFieldProps & { style?: React.CSSProperties }) {
  const stored = String(readPath(system, path) ?? "");
  const [local, setLocal] = useState(stored);

  useEffect(() => {
    setLocal(stored);
  }, [stored]);

  const commit = () => {
    if (local !== stored) onUpdate(`system.${path}`, local);
  };

  return (
    <textarea
      className={`a-textarea ${className ?? ""}`}
      style={style}
      value={local}
      disabled={!isEditable}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={commit}
    />
  );
}

/** Editable checkbox that commits to `system.<path>` immediately on change. */
export function CheckboxField({
  system,
  path,
  isEditable,
  onUpdate,
  className,
}: BaseFieldProps) {
  const stored = Boolean(readPath(system, path));
  return (
    <input
      type="checkbox"
      className={`a-checkbox ${className ?? ""}`}
      checked={stored}
      disabled={!isEditable}
      onChange={(e) => onUpdate(`system.${path}`, e.target.checked)}
    />
  );
}

/** Read-only derived value; if `tip` is provided it shows a calc tooltip. */
export function DerivedValue({
  value,
  tip,
  className,
}: {
  value: ReactNode;
  tip?: CalcTip | string;
  className?: string;
}) {
  const content = <span className={`a-derived ${className ?? ""}`}>{value}</span>;
  return tip ? <CalcTooltip tip={tip}>{content}</CalcTooltip> : content;
}

/** Labelled field column: <label> over an input/value. */
export function Field({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 min-w-0">
      <span className="a-flabel">{label}</span>
      {children}
    </label>
  );
}

/** Rounded tag/pill. */
export function Pill({ children }: { children: ReactNode }) {
  return <span className="a-pill">{children}</span>;
}

/** Headline stat card (label + big value), optionally with a calc tooltip. */
export function StatCard({
  label,
  value,
  sub,
  color,
  tip,
}: {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  color?: "acc" | "blue" | "red";
  tip?: CalcTip | string;
}) {
  const colorClass = color ? `a-${color}` : "";
  const inner = (
    <>
      <div className="a-flabel">{label}</div>
      <div className="flex items-baseline gap-1.5 mt-0.5">
        <span className={`a-stat-value ${colorClass}`}>{value}</span>
        {sub && <span className="text-[11px] a-muted">{sub}</span>}
      </div>
    </>
  );
  return tip ? (
    <CalcTooltip tip={tip} inline={false} className="a-card a-stat">
      {inner}
    </CalcTooltip>
  ) : (
    <div className="a-card a-stat">{inner}</div>
  );
}
