/** @type {import('jest').Config} */
export default {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src", "<rootDir>/tests"],
  testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts", "!src/index.ts"],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  moduleNameMapper: {
    // Map @services/*.js -> src/services/*.ts
    "^@services/(.*)\\.js$": "<rootDir>/src/services/$1.ts",
    // Map @db/db.js -> src/db/db.ts
    "^@db/(.*)\\.js$": "<rootDir>/src/db/$1.ts",
    "^@shared/(.*)$": "<rootDir>/../shared/$1",
  },
};
