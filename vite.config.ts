import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          charts: ["recharts"],
          markdown: ["react-markdown", "remark-gfm"],
          signalr: ["@microsoft/signalr"],
          icons: ["lucide-react", "@phosphor-icons/react", "@tabler/icons-react"],
          ui: [
            "@dnd-kit/core",
            "@dnd-kit/sortable",
            "@tanstack/react-table",
            "cmdk",
            "date-fns",
            "framer-motion",
            "sonner",
            "vaul",
            "zod",
          ],
        },
      },
    },
  },
  server: {
    open: "/dashboard", // Auto-open browser to dashboard page
    proxy: {
      "/api": {
        target: "https://salesapi.tecnoshop.com.bo",
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
