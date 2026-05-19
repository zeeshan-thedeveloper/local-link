import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules", "dist", ".next"],
    coverage: {
      provider: "v8",
      include: ["src/routes/health.ts"],
      reporter: ["text", "json", "html"],
      reportsDirectory: "./coverage",
      exclude: [
        "node_modules/**",
        "dist/**",
        ".next/**",
        "**/*.test.ts",
        "**/*.config.*",
        "**/*.d.ts",
        "app/**",
        "components/**",
        "lib/**",
        "middleware.ts",
        "src/cli.ts",
        "src/config.ts",
        "src/daemon.ts",
        "src/proxy.ts",
        "src/index.ts",
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70,
      },
    },
  },
});
