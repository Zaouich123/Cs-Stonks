import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    coverage: {
      include: ["src/modules/**/*.ts"],
      provider: "v8",
      reporter: ["text", "html"],
    },
    environment: "node",
  },
});

