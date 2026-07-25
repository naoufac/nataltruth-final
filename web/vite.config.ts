import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// API base: in dev, proxy /v1 + /health to the local engine server (port 3100).
// In prod, same-origin is assumed (Caddy serves SPA + /api or the engine directly).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/v1": "http://localhost:3100",
      "/health": "http://localhost:3100",
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
