/**
 * Unit-test config (no DB / no network). Logic is tested in isolation with
 * mocks per the project's testing standards. Coverage is enforced at 90% line +
 * branch over the competitor-prices module and its workflows/jobs/routes.
 *
 * Excluded from coverage (not arbitrary — these carry no unit-testable logic):
 *   - migrations/** : DDL strings, executed by Medusa's migration runner
 *   - index.ts      : barrel re-exports
 *   - admin/**.tsx  : React dashboard view (belongs to e2e, not unit)
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
    "src/modules/competitor-prices/**/*.ts",
    "src/workflows/competitor-prices/**/*.ts",
    "src/jobs/scrape-competitor-prices.ts",
    "src/jobs/discover-competitor-catalog.ts",
    "src/jobs/discover-product-competitors.ts",
    "src/api/admin/competitors/**/*.ts",
    "src/api/admin/competitor-products/**/*.ts",
    "src/api/admin/competitor-prices/**/*.ts",
    "src/api/admin/product-watches/**/*.ts",
    "!**/migrations/**",
    "!**/__tests__/**",
    "!src/modules/competitor-prices/index.ts",
    "!**/*.d.ts",
  ],
  coverageThreshold: {
    global: { lines: 90, branches: 90, functions: 90, statements: 90 },
  },
  coveragePathIgnorePatterns: ["/node_modules/"],
}
