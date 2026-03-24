import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/static/**/*.spec.ts'],
    environment: 'node',
  },
});
