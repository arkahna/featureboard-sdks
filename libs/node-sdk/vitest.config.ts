/// <reference types="vitest" />
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        tsconfigPaths({
            root: '../..',
        }),
    ],
    test: {
        include: ['src/**/*.{test,spec}.{ts,mts,cts,tsx}'],
        setupFiles: './vitest.setup.js'
    },
})
