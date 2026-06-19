import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const rawPort = process.env.PORT || "3000";
const port    = Number(rawPort);
if (Number.isNaN(port) || port <= 0) throw new Error(`Invalid PORT: "${rawPort}"`);

const basePath = process.env.BASE_PATH || "/";

// Cloudflare Worker URLs (used in Vite dev proxy only — production uses vercel.json rewrites)
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
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react":   ["react", "react-dom"],
          "vendor-ui":      ["framer-motion", "lucide-react"],
          "vendor-charts":  ["recharts"],
          "vendor-routing": ["wouter"],
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
      // Dev proxy → Cloudflare Workers (mirrors vercel.json rewrites)
      "/chat":         { target: PARSER_URL,    changeOrigin: true, rewrite: (p) => p.replace("/chat", "/api/chat") },
      "/api/chat":     { target: PARSER_URL,    changeOrigin: true },
      "/api/health":   { target: PARSER_URL,    changeOrigin: true },
      "/api/ads":      { target: PARSER_URL,    changeOrigin: true },
      "/api/search":   { target: HUNTER_URL,    changeOrigin: true },
      "/rania/flights":{ target: HUNTER_URL,    changeOrigin: true, rewrite: (p) => "/api/search" + p.replace("/rania/flights", "") },
      "/rania/chat":   { target: PARSER_URL,    changeOrigin: true, rewrite: () => "/api/chat" },
      "/rania":        { target: PARSER_URL,    changeOrigin: true },
      "/api/validate": { target: VALIDATOR_URL, changeOrigin: true },
      "/api/checkout": { target: CASHIER_URL,   changeOrigin: true },
      "/api/webhook":  { target: WEBHOOK_URL,   changeOrigin: true },
      "/api/admin":    { target: ADMIN_URL,      changeOrigin: true },
      "/admin":        { target: ADMIN_URL,      changeOrigin: true },
      "/api/book":     { target: PILOT_URL,      changeOrigin: true },
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
