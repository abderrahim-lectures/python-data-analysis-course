import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '.claude/worktrees/**',
      'tests/e2e/**',
    ],
    // The default 5s per-test budget is shorter than the first test in a file
    // can take on a loaded machine: transform alone runs ~45s for the whole
    // suite, and `pyodideWorkerClient.test.ts` / `gamestrip.client.test.ts`
    // pull in the worker client and the game-state module, so their first case
    // sometimes compiles past 5s and times out while the assertion itself is
    // fine. Three runs of the suite failed 3/1306 that way, and the same tests
    // pass serially or with a longer budget -- a flaky red suite trains people
    // to ignore it. 20s is still short enough that a genuine hang fails.
    testTimeout: 20000,
    hookTimeout: 20000,
    coverage: {
      provider: 'v8',
      include: ['src/lib/**/*.{ts,tsx}'],
      exclude: [
        'src/paraglide/**',
        '**/*.d.ts',
      ],
      reporter: ['text', 'json-summary'],
      reportsDirectory: 'coverage',
      thresholds: {
        lines: 80,
        functions: 70,
        branches: 70,
        statements: 80,
      },
    },
  },
});