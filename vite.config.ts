import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'
import { PAGE_META, withPageMeta } from './src/lib/pageMeta.ts'

/** Writes year/index.html and so on, each with that page's title and description. */
function pageMetaFiles(): Plugin {
  return {
    name: 'page-meta-files',
    apply: 'build',
    async writeBundle({ dir = 'dist' }) {
      const home = await readFile(path.join(dir, 'index.html'), 'utf8')
      for (const [route, meta] of Object.entries(PAGE_META)) {
        if (route === '/') continue
        const folder = path.join(dir, route)
        await mkdir(folder, { recursive: true })
        await writeFile(path.join(folder, 'index.html'), withPageMeta(home, meta))
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), pageMetaFiles()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    // A local .env file must not change what the tests see.
    env: { VITE_GTM_ID: '' },
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
