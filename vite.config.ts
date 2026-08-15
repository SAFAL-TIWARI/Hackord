import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tanstackStart({
      server: { entry: "src/server.ts" },
    }),
    tailwindcss(),
    tsconfigPaths(),
    viteReact(),
  ],
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: true,
  },
});