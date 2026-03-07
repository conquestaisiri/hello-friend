import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  // Ensure the build output goes to a 'dist' folder inside 'client'
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
