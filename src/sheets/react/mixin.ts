import React from "react";
import { createRoot, type Root } from "react-dom/client";

/**
 * Mixin that turns an ApplicationV2-based sheet into a React host, replacing
 * HandlebarsApplicationMixin entirely: `_renderHTML` provides a single mount
 * element (created once and kept across renders) and React reconciles inside
 * it, so component state and scroll positions survive Foundry re-renders.
 *
 * Subclasses implement `reactComponent` and `_prepareReactProps()`; anything
 * (e.g. a document update) that triggers a Foundry render flows into a React
 * re-render with fresh props. `rerender()` refreshes React directly without a
 * full Foundry render.
 */

// Minimal structural view of ApplicationV2 that the mixin relies on.
type ApplicationV2Like = abstract new (...args: any[]) => {
  close(options?: unknown): Promise<unknown>;
};

export function ReactApplicationMixin<TProps extends object, TBase extends ApplicationV2Like>(
  Base: TBase,
) {
  abstract class ReactApplication extends Base {
    #reactRoot: Root | null = null;
    #mount: HTMLElement | null = null;

    /** The root React component rendered into the sheet. */
    abstract get reactComponent(): React.ComponentType<TProps>;

    /** Fresh props for the component; called on every (re)render. */
    protected abstract _prepareReactProps(): TProps;

    /** Re-render React with fresh props without a full Foundry render. */
    protected rerender(): void {
      if (!this.#reactRoot) return;
      this.#reactRoot.render(React.createElement(this.reactComponent, this._prepareReactProps()));
    }

    /** ApplicationV2 rendering: hand Foundry our persistent mount element. */
    protected async _renderHTML(_context: unknown, _options: unknown): Promise<HTMLElement> {
      if (!this.#mount) {
        this.#mount = document.createElement("section");
        this.#mount.classList.add("react-mount");
      }
      return this.#mount;
    }

    protected _replaceHTML(result: HTMLElement, content: HTMLElement, _options: unknown): void {
      if (result.parentElement !== content) {
        content.replaceChildren(result);
      }
    }

    protected _onRender(_context: unknown, _options: unknown): void {
      if (!this.#reactRoot && this.#mount) {
        this.#reactRoot = createRoot(this.#mount);
      }
      this.rerender();
    }

    override async close(options?: unknown): Promise<unknown> {
      this.#reactRoot?.unmount();
      this.#reactRoot = null;
      this.#mount = null;
      return super.close(options);
    }
  }

  return ReactApplication;
}
