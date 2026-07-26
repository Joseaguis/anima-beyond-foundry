import React, { useEffect, useRef, useState } from "react";
import { TextArea } from "../character/ui/fields";
import type { OnUpdate } from "../character/ui/fields";

/**
 * ProseMirror editor for an item field, wrapping Foundry's
 * `<prose-mirror>` custom element inside React.
 *
 * Two constraints drive the design:
 *
 * 1. The React mixin re-renders the whole sheet on every document change
 *    (see src/sheets/react/mixin.ts). The editor must survive that: it is
 *    created from deps that do not include `value`, and an incoming external
 *    value only recreates it while it is closed and clean — never on top of an
 *    edit in progress.
 * 2. Outside Foundry (sandbox, vitest SSR) there is no `foundry.applications`.
 *    Support is decided in the render body, not in an effect, so the fallback
 *    `<textarea>` also works under `renderToString`.
 */

export interface RichTextEditorProps {
  /** Path relative to `system`, e.g. "description.value". */
  path: string;
  value: string;
  isEditable: boolean;
  onUpdate: OnUpdate;
  /** Stable key so the editor is not recreated between renders — the item id. */
  ownerKey: string;
  /** Show the enriched view until the edit button is pressed. */
  toggled?: boolean;
  height?: number;
  className?: string;
}

type ProseMirrorEl = HTMLElement & { open: boolean; value: string; isDirty(): boolean };

interface ProseMirrorApi {
  create(config: {
    name: string;
    value: string;
    enriched: string;
    toggled: boolean;
    height: number;
    disabled: boolean;
  }): ProseMirrorEl;
}

function proseMirrorApi(): ProseMirrorApi | null {
  const api = (globalThis as any).foundry?.applications?.elements?.HTMLProseMirrorElement;
  return typeof api?.create === "function" ? (api as ProseMirrorApi) : null;
}

/** `enrichHTML` when Foundry is around; the raw value otherwise. */
async function enrich(value: string): Promise<string> {
  const editor = (globalThis as any).foundry?.applications?.ux?.TextEditor?.implementation;
  if (typeof editor?.enrichHTML !== "function") return value;
  return (await editor.enrichHTML(value)) as string;
}

/** `{ description: { value } }` from ("description.value", value). */
function nest(path: string, value: string): Record<string, any> {
  const keys = path.split(".");
  const root: Record<string, any> = {};
  let node = root;
  for (const key of keys.slice(0, -1)) node = node[key] = {};
  node[keys[keys.length - 1]] = value;
  return root;
}

/** Plain textarea used wherever ProseMirror is unavailable. */
function FallbackEditor({ path, value, isEditable, onUpdate, height, className }: RichTextEditorProps) {
  return (
    <TextArea
      system={nest(path, value)}
      path={path}
      isEditable={isEditable}
      onUpdate={onUpdate}
      className={className}
      style={{ minHeight: height ?? 180 }}
    />
  );
}

function ProseMirrorEditor(props: RichTextEditorProps) {
  const { path, value, isEditable, onUpdate, ownerKey, toggled = true, height = 240, className } = props;

  const hostRef = useRef<HTMLDivElement | null>(null);
  const elRef = useRef<ProseMirrorEl | null>(null);

  // Read through a ref so the change listener never needs re-attaching when the
  // props closure changes.
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  // Enriched HTML + the raw value it belongs to. Replacing it recreates the
  // element; it is only replaced when doing so cannot destroy user input.
  const [snapshot, setSnapshot] = useState<{ value: string; enriched: string } | null>(null);

  useEffect(() => {
    const el = elRef.current;
    // Edit in progress: leave it strictly alone.
    if (el && (el.open || el.isDirty())) return;
    // Our own committed change already round-tripped: nothing to refresh.
    if (el && el.value === value) return;

    let cancelled = false;
    void enrich(value).then((html) => {
      if (!cancelled) setSnapshot({ value, enriched: html });
    });
    return () => {
      cancelled = true;
    };
  }, [value]);

  useEffect(() => {
    const host = hostRef.current;
    const api = proseMirrorApi();
    if (!host || !api || !snapshot) return;

    const el = api.create({
      name: `system.${path}`,
      value: snapshot.value,
      enriched: snapshot.enriched,
      toggled,
      height,
      disabled: !isEditable,
    });
    const onChange = () => {
      void onUpdateRef.current(`system.${path}`, el.value);
    };
    el.addEventListener("change", onChange);
    host.replaceChildren(el);
    elRef.current = el;

    return () => {
      el.removeEventListener("change", onChange);
      el.remove();
      if (elRef.current === el) elRef.current = null;
    };
    // `value` and `onUpdate` are deliberately absent: see the module comment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerKey, path, snapshot, toggled, height, isEditable]);

  return (
    <div
      ref={hostRef}
      className={`a-editor-container ${snapshot ? "" : "a-editor-loading"} ${className ?? ""}`}
    />
  );
}

/**
 * `onUpdate` is excluded from the comparison on purpose: the sheet builds a new
 * closure on every render and the editor reads it through a ref.
 */
function propsEqual(a: RichTextEditorProps, b: RichTextEditorProps): boolean {
  return (
    a.path === b.path &&
    a.value === b.value &&
    a.isEditable === b.isEditable &&
    a.ownerKey === b.ownerKey &&
    a.toggled === b.toggled &&
    a.height === b.height &&
    a.className === b.className
  );
}

export const RichTextEditor = React.memo(function RichTextEditor(props: RichTextEditorProps) {
  // Decided in the render body so SSR (sandbox smoke test) takes this branch.
  return proseMirrorApi() ? <ProseMirrorEditor {...props} /> : <FallbackEditor {...props} />;
}, propsEqual);
