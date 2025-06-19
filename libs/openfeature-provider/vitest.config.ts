import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        environment: 'happy-dom',
        globals: true,
        setupFiles: ['./src/tests/setup.ts']
    },
    resolve: {
        alias: {
            '@featureboard/contracts': resolve(__dirname, '../contracts/src'),
            '@featureboard/js-sdk': resolve(__dirname, '../js-sdk/src')
        }
    }
}) 