import { writable } from 'svelte/store'

// ── Global UI overlays ──────────────────────────────────────
export const confirmDialog = writable(null) // { title, message, confirmLabel, onconfirm }
export const promptDialog = writable(null) // { title, placeholder, value, onsubmit }
export const trackSheet = writable(null) // { track, ondelete }
export const playlistPicker = writable(null) // track
export const settingsOpen = writable(false)

export function askConfirm(opts) {
  confirmDialog.set(opts)
}

export function askPrompt(opts) {
  promptDialog.set(opts)
}

export function openTrackSheet(track, ondelete = null) {
  trackSheet.set({ track, ondelete })
}
