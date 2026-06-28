/**
 * Unit-test config (no DB / no network). Coverage is collected across the whole
 * backend `src` so the project-wide **patch coverage** gate (diff-cover in CI)
 * can measure any changed file.
 *
 * Excluded from coverage (not unit-testable logic / covered elsewhere):
 *   - migrations  : DDL strings, run by Medusa's migration runner
 *   - src/scripts : one-off operational scripts
 *   - src/admin   : React dashboard views (e2e, not unit)
 *   - test files and .d.ts
 */
module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.[jt]sx?$": [
      "@swc/jest",
      {
        jsc: {
          target: "es2022",
          parser: { syntax: "typescript", tsx: true, decorators: true },
          transform: { decoratorMetadata: true },
        },
      },
    ],
  },
  moduleFileExtensions: ["ts", "tsx", "js", "json"],
  testMatch: ["**/__tests__/**/*.spec.ts"],
  modulePathIgnorePatterns: ["<rootDir>/.medusa/"],
  clearMocks: true,
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/__tests__/**",
    "!src/**/*.d.ts",
    "!src/scripts/**",
    "!src/admin/**",
    "!**/migrations/**",
  ],
  coverageReporters: ["text-summary", "lcov"],
  coveragePathIgnorePatterns: ["/node_modules/"],
}
