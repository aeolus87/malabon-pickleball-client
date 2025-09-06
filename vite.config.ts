import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load environment variables based on mode (development, production)
  const env = loadEnv(mode, process.cwd(), "");
  
  // Environment configuration
  const isDevelopment = mode === "development";
  
  console.log(`🚀 Building in ${mode} mode`);
  console.log(`🔧 Development mode: ${isDevelopment}`);

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5173,
      host: true, // Allow external connections
      proxy: {
        "/api": {
          // Be tolerant if someone sets VITE_API_URL with /api by mistake
          target: (env.VITE_API_URL || "http://localhost:5000").replace(/\/?api\/?$/, ""),
          changeOrigin: true,
          ws: true,
        },
      },
    },
    build: {
      outDir: "dist",
      sourcemap: isDevelopment,
      // Minify production builds only
      minify: isDevelopment ? false : "esbuild",
      // Add cache busting for production
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom", "react-router-dom"],
          },
          entryFileNames: isDevelopment
            ? "assets/[name].js"
            : "assets/[name].[hash].js",
          chunkFileNames: isDevelopment
            ? "assets/[name].js"
            : "assets/[name].[hash].js",
          assetFileNames: isDevelopment
            ? "assets/[name].[ext]"
            : "assets/[name].[hash].[ext]",
        },
      },
    },
    // No extra global defines needed
    // Add support for Vercel deployment
    optimizeDeps: {
      include: ["react", "react-dom", "react-router-dom"],
    },
  };
});
