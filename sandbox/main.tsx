// The shim MUST be first: the models read foundry.data.fields when imported.
import "./foundry-shim";
import "../src/styles/main.css";
import "./sandbox.css";
import { createRoot } from "react-dom/client";
import { App } from "./App";

// Foundry-hosted icons (icons/...) don't exist here; swap broken images for a
// neutral placeholder instead of the browser's broken-image glyph.
const PLACEHOLDER =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">' +
      '<rect width="32" height="32" rx="6" fill="#c2c8d0"/>' +
      '<text x="16" y="21" font-size="14" text-anchor="middle" fill="#737a85">?</text>' +
      "</svg>",
  );

document.addEventListener(
  "error",
  (event) => {
    const target = event.target as HTMLElement;
    if (target instanceof HTMLImageElement && target.src !== PLACEHOLDER) {
      target.src = PLACEHOLDER;
    }
  },
  true,
);

createRoot(document.getElementById("root")!).render(<App />);
