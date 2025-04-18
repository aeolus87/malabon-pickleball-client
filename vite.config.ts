import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load environment variables based on mode (development, production)
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: env.VITE_API_URL || "http://localhost:5000",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
    build: {
      outDir: "dist",
      sourcemap: mode === "development",
      // Minify production builds only
      minify: mode === "production" ? "esbuild" : false,
      // Add cache busting for production
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom", "react-router-dom"],
          },
          entryFileNames:
            mode === "production"
              ? "assets/[name].[hash].js"
              : "assets/[name].js",
          chunkFileNames:
            mode === "production"
              ? "assets/[name].[hash].js"
              : "assets/[name].js",
          assetFileNames:
            mode === "production"
              ? "assets/[name].[hash].[ext]"
              : "assets/[name].[ext]",
        },
      },
    },
    // Add support for Vercel deployment
    // This will generate a vercel.json file during build
    optimizeDeps: {
      include: ["react", "react-dom", "react-router-dom"],
    },
  };
});
