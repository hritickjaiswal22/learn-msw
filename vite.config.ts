import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Return 404 for unmatched /api/* routes instead of falling back to
    // index.html — this lets the MSW service worker intercept them cleanly
    proxy: {
      "/api": {
        target: "http://localhost:5173",
        bypass(req) {
          // Tell Vite to do nothing with /api requests — MSW handles them
          if (req.url?.startsWith("/api")) {
            return req.url;
          }
        },
      },
    },
  },
});
