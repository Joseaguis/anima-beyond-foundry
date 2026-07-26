/**
 * Dev-server config for the standalone UI sandbox (`npm run sandbox`).
 * Serves sandbox/ with real HMR; the Foundry build keeps using vite.config.ts.
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  root: "sandbox",
  plugins: [react(), tailwindcss()],
  server: {
    open: true,
    fs: {
      // The sandbox imports source and pack JSON from ../src.
      allow: [".."],
    },
  },
});
