import { writable } from 'svelte/store'

// ── Frostify Toast ──────────────────────────────────────────
// Lumalabas sa taas. Kung may `info`, pindutin para lumabas
// ang info dialog para sa feature na yun.
export const toast = writable(null) // { message, info }

let timer = null

export function showToast(message, info = null) {
  clearTimeout(timer)
  toast.set({ message, info })
  timer = setTimeout(() => toast.set(null), 4000)
}

export function hideToast() {
  clearTimeout(timer)
  toast.set(null)
}
