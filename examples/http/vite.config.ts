import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 25543,
    strictPort: true,
    // Allow proxied requests that arrive with the public gateway Host header.
    allowedHosts: true,
  },
  preview: {
    port: 25543,
    strictPort: true,
  },
});
