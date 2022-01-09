import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vitejs.dev/config/
export default defineConfig({
    build: {
        rollupOptions: {
            // https://rollupjs.org/guide/en/#big-list-of-options
            output: {
                manualChunks: undefined,
            },
        },
    },
    plugins: [tsconfigPaths()],
})
