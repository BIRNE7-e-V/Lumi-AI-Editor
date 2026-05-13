import { defineConfig } from 'vite';

import viteReact from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import { mockOpenAIPlugin } from './mock-openai-plugin';

const config = defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/Lumi-AI-Editor/' : '/',
  resolve: { tsconfigPaths: true },
  plugins: [
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    tailwindcss(),
    viteReact(),
    mockOpenAIPlugin(),
  ],
});

export default config;
