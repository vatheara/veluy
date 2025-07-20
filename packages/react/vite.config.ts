import { defineConfig } from "vite";
import { resolve } from "path";
import dts from "vite-plugin-dts";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ["src/**/*.ts", "src/**/*.tsx"],
      exclude: ["src/**/*.stories.tsx"],
      outDir: "dist",
      insertTypesEntry: true, // This ensures proper index.d.ts generation
      rollupTypes: true, // This flattens the type declarations
    }),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  css: {
    postcss: "./postcss.config.js",
  },
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.tsx"),
      name: "VeluyReact",
      formats: ["es", "cjs"],
      fileName: (format) => `index.${format === "es" ? "js" : "cjs"}`,
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        // Externalize all peerDependencies to avoid bundling them
        "@tanstack/react-query",
        "lucide-react",
        "react-icons",
        "react-icons/fi",
        "zustand",
        "qrcode.react",
        "ts-khqr",
        // Externalize workspace dependencies
        "@repo/ui",
        /^@repo\/ui\/.*/,
        // Externalize other common dependencies
        "clsx",
        "tailwind-merge",
        "class-variance-authority",
      ],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "qrcode.react": "QRCodeReact",
          "ts-khqr": "TSKHQR",
          "react-icons/fi": "ReactIconsFi",
          "@repo/ui": "RepoUI",
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.names?.[0] === "style.css") return "index.css";
          return assetInfo.names?.[0] || "assets/[name].[ext]";
        },
      },
    },
    sourcemap: true,
    outDir: "dist",
    cssCodeSplit: false,
  },
});
