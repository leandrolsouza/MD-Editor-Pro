import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./vitest.setup.js'],
        include: ['**/*.test.js', '**/*.spec.js'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
        },
        // Use node environment for main process tests
        environmentMatchGlobs: [
            ['src/main/**/*.test.js', 'node'],
            ['src/preload/**/*.test.js', 'node'],
            ['src/renderer/**/*.test.js', 'jsdom']
        ],
        // Run tests sequentially to avoid electron-store conflicts
        fileParallelism: false
    },
});
