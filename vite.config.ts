import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "frontend",
  build: { outDir: "../dist/frontend", emptyOutDir: true },
  plugins: [react()],
});