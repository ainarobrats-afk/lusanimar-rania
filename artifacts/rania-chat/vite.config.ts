import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const rawPort = process.env.PORT || "3000";
const port    = Number(rawPort);
if (Number.isNaN(port) || port <= 0) throw new Error(`Invalid PORT: "${rawPort}"`);

const basePath = process.env.BASE_PATH || "/";

// Cloudflare Worker URLs (dev proxy only — production uses vercel.json rewrites)
const PARSER_URL    = "https://rania-parser.lusanimar.workers.dev";
const HUNTER_URL    = "https://rania-hunter.lusanimar.workers.dev";
const VALIDATOR_URL = "https://rania-validator.lusanimar.workers.dev";
const CASHIER_URL   = "https://rania-cashier.lusanimar.workers.dev";
const WEBHOOK_URL   = "https://rania-webhook.lusanimar.workers.dev";
const ADMIN_URL     = "https://rania-admin.lusanimar.workers.dev";
const PILOT_URL     = "https://rania-pilot.lusanimar.workers.dev";

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "public"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    // Use terser for minification — much more memory efficient than esbuild for large bundles
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: false,  // keep console.log for now (enable in final prod)
        passes: 1,            // single pass to reduce memory usage
      },
    },
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React core
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) {
            return "vendor-react";
          }
          // Routing
          if (id.includes("node_modules/wouter")) {
            return "vendor-routing";
          }
          // Charts
          if (id.includes("node_modules/recharts") || id.includes("node_modules/d3-")) {
            return "vendor-charts";
          }
          // Animation + icons
          if (id.includes("node_modules/framer-motion") || id.includes("node_modules/lucide-react")) {
            return "vendor-ui";
          }
          // Map
          if (id.includes("node_modules/leaflet")) {
            return "vendor-maps";
          }
          // PDF
          if (id.includes("node_modules/jspdf") || id.includes("node_modules/html2canvas")) {
            return "vendor-pdf";
          }
          // Radix UI components
          if (id.includes("node_modules/@radix-ui")) {
            return "vendor-radix";
          }
          // TanStack Query
          if (id.includes("node_modules/@tanstack")) {
            return "vendor-query";
          }
          // Home page — largest single chunk, gets its own file
          if (id.includes("/src/pages/Home.")) {
            return "page-home";
          }
          // Admin pages — rarely visited, keep separate
          if (
            id.includes("/src/pages/Admin") ||
            id.includes("/src/pages/Staff") ||
            id.includes("/src/pages/Live") ||
            id.includes("/src/pages/TestHistory") ||
            id.includes("/src/pages/TestLab") ||
            id.includes("/src/pages/TestDashboard") ||
            id.includes("/src/pages/FlightQA")
          ) {
            return "page-admin";
          }
          // Market pages
          if (id.includes("/src/pages/Sanimar") || id.includes("/src/pages/Ads")) {
            return "page-market";
          }
          // Other pages
          if (id.includes("/src/pages/")) {
            return "page-misc";
          }
        },
      },
    },
  },
  server: {
    port,
    strictPort: false,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: { strict: false },
    proxy: {
      "/chat":          { target: PARSER_URL,    changeOrigin: true, rewrite: (p) => p.replace("/chat", "/api/chat") },
      "/api/chat":      { target: PARSER_URL,    changeOrigin: true },
      "/api/health":    { target: PARSER_URL,    changeOrigin: true },
      "/api/ads":       { target: PARSER_URL,    changeOrigin: true },
      "/api/search":    { target: HUNTER_URL,    changeOrigin: true },
      "/rania/flights": { target: HUNTER_URL,    changeOrigin: true, rewrite: (p) => "/api/search" + p.replace("/rania/flights", "") },
      "/rania/chat":    { target: PARSER_URL,    changeOrigin: true, rewrite: () => "/api/chat" },
      "/rania":         { target: PARSER_URL,    changeOrigin: true },
      "/api/validate":  { target: VALIDATOR_URL, changeOrigin: true },
      "/api/checkout":  { target: CASHIER_URL,   changeOrigin: true },
      "/api/webhook":   { target: WEBHOOK_URL,   changeOrigin: true },
      // Dev mode: proxy admin + rania API to local backend (port 5000)
      // Production: vercel.json rewrites handle routing
      "/api/admin":     { target: "http://localhost:5000", changeOrigin: true },
      "/api/rania":     { target: "http://localhost:5000", changeOrigin: true },
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
