import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  resolve: {
    dedupe: ['react', 'react-dom'],
  },

  test: {
    environment: 'jsdom',
    passWithNoTests: true,

    coverage: {
      provider: 'v8',

      include: [
        'src/utils/validation.ts',
        'src/api/appointmentApi.ts',
        'src/api/authApi.ts',
        'src/api/reportsApi.ts',
        'src/api/tokenApi.ts',
        'src/api/userApi.ts',
      ],

      reporter: ['text', 'lcov', 'html', 'cobertura'],
      reportsDirectory: 'coverage',

      thresholds: {
        lines: 70,
        functions: 70,
        branches: 69,
        statements: 70,
      },
    },
  },
})
