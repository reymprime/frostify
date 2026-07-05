import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'

// IMPORTANT: base = '/<repo-name>/' para gumana sa GitHub Pages.
// Kung ang repo mo ay github.com/<user>/frostify → base: '/frostify/'
export default defineConfig({
  base: '/frostify/',
  plugins: [svelte(), tailwindcss()],
})
