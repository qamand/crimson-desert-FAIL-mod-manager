import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: rootDir,
  plugins: [react()],
  resolve: {
    alias: {
      "@modmanager/ui": path.resolve(rootDir, "../ui/src/index.ts"),
      "@modmanager/types": path.resolve(rootDir, "../types/src/index.ts")
    }
  },
  build: {
    outDir: path.resolve(rootDir, "dist/renderer"),
    emptyOutDir: false,
    sourcemap: true,
    rollupOptions: {
      input: path.resolve(rootDir, "index.html")
    }
  },
  server: {
    host: "127.0.0.1",
    port: 5178,
    strictPort: true
  }
});
