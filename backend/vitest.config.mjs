import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['__tests__/**/*.test.js'],
    setupFiles: ['./vitest.setup.mjs'],
    testTimeout: 30_000,
    clearMocks: true,
    reporters: ['verbose', 'html'],
    outputFile: {
      html: './html/index.html',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.js'],
      exclude: ['src/utils/logger.js'],
    },
  },
});
