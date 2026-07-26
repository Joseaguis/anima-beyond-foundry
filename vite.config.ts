import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";
import { copyFileSync, mkdirSync } from "fs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "copy-static-assets",
      closeBundle() {
        mkdirSync("dist/lang", { recursive: true });
        copyFileSync("src/system.json", "dist/system.json");
        copyFileSync("src/lang/en.json", "dist/lang/en.json");
        copyFileSync("src/lang/es.json", "dist/lang/es.json");
      },
    },
  ],
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    outDir: "dist",
    emptyOutDir: false,
    sourcemap: true,
    rollupOptions: {
      input: "src/main.ts",
      output: {
        entryFileNames: "main.js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith(".css")) {
            return "style.css";
          }
          return "assets/[name][extname]";
        },
        format: "es",
      },
    },
    lib: {
      entry: path.resolve(__dirname, "src/main.ts"),
      name: "animabfv2",
      fileName: "main",
      formats: ["es"],
    },
  },
  base: "./",
});
