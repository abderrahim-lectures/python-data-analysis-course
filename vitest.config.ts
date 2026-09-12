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