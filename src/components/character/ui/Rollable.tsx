import React from "react";

/**
 * Makes an existing cell roll something, without adding a column: the Excel
 * layouts these sheets mirror have no room for buttons, so the label itself
 * becomes the trigger.
 *
 * Shift-click skips the modifiers dialog, the same convention PF2e uses.
 */
export function Rollable({
  slug,
  onRoll,
  rollable,
  title,
  className = "",
  children,
}: {
  slug: string;
  onRoll?: (slug: string, options?: { skipDialog?: boolean }) => Promise<void>;
  /** Slugs the actor actually has; when given, unknown slugs render inert. */
  rollable?: Set<string>;
  title?: string;
  className?: string;
  children: React.ReactNode;
}): React.ReactElement {
  const enabled = Boolean(onRoll) && (rollable ? rollable.has(slug) : true);

  if (!enabled) return <span className={className}>{children}</span>;

  return (
    <button
      type="button"
      className={`a-rollable ${className}`}
      title={title ?? "Tirar (Mayús para saltar el diálogo)"}
      onClick={(event) => {
        event.stopPropagation();
        void onRoll?.(slug, { skipDialog: event.shiftKey });
      }}
    >
      {children}
    </button>
  );
}
