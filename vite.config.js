import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { readFileSync } from 'node:fs'

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  define: {
    // Shown in the footer; bump "version" in package.json when releasing.
    __APP_VERSION__: JSON.stringify(version),
    __BUILD_DATE__: JSON.stringify(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })),
  },
  build: {
    // The bundled bibliography is one ~2.8 MB lazily loaded chunk by design.
    chunkSizeWarningLimit: 3000,
  },
})
