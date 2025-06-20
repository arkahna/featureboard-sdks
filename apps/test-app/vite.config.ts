import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
    plugins: [react()],
    define: {
        'process.env': {},
        global: 'globalThis',
    },
    server: {
        port: 3000,
        host: true,
    },
    build: {
        outDir: 'dist',
        sourcemap: true,
    },
})
