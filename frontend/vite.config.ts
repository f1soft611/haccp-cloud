import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined;
          }

          if (id.includes('@tiptap')) {
            return 'tiptap-vendor';
          }

          if (id.includes('prosemirror')) {
            return 'prosemirror-vendor';
          }

          if (id.includes('katex') || id.includes('markdown-it')) {
            return 'richtext-utils';
          }

          return undefined;
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
});
