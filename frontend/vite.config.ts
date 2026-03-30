import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  test: {
    environment: 'jsdom',
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      all: true,
      include: [
        'src/utils/validation.ts',
        'src/api/appointmentApi.ts',
        'src/api/authApi.ts',
        'src/api/reportsApi.ts',
        'src/api/tokenApi.ts',
        'src/api/userApi.ts',
      ],
      reporter: ['text', 'lcov'],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
})
