import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Production build output — copy-build.js moves this to server/public
  build: {
    outDir:      "dist",
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      // In dev: forward all /api calls to Express
      "/api": {
        target:       "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
