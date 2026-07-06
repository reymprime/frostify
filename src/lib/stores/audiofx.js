import { writable, get } from 'svelte/store'

// ── Frostify Audio FX — 12-band EQ ──────────────────────────
const FREQS = [31, 62, 125, 250, 500, 1000, 2000, 4000, 6000, 8000, 12000, 16000]
export const BAND_LABELS = ['31', '62', '125', '250', '500', '1k', '2k', '4k', '6k', '8k', '12k', '16k']

export const presets = {
  Flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  Bass: [7, 6, 5, 3, 1, 0, -1, -1, 0, 0, 1, 1],
  Vocal: [-3, -2, -1, 1, 3, 4, 4, 3, 2, 1, 0, -1],
  Treble: [-2, -2, -1, 0, 0, 1, 2, 3, 4, 5, 6, 6],
  'Lo-fi': [5, 4, 3, 1, -1, -3, -4, -5, -6, -6, -7, -8],
  Podcast: [-4, -3, -1, 2, 4, 4, 3, 2, 0, -1, -2, -3],
}

function loadGains() {
  try {
    const raw = localStorage.getItem('frostify:eq12')
    if (raw) {
      const arr = JSON.parse(raw)
      if (Array.isArray(arr) && arr.length === 12) return arr
    }
  } catch {}
  return new Array(12).fill(0)
}

export const eqGains = writable(loadGains())
export const eqEnabled = writable(localStorage.getItem('frostify:eqOn') === '1')

// IMPORTANTE: nakadeclare BAGO ang subscribe sa baba —
// tumatakbo agad ang subscribe callback sa startup at
// ginagamit nito ang filters (TDZ crash kung nasa baba ito).
let ctx = null
let filters = []
let analyser = null
let attached = false

eqEnabled.subscribe((v) => {
  try {
    localStorage.setItem('frostify:eqOn', v ? '1' : '0')
  } catch {}
  applyBypass()
})

export function attachFx(audioEl) {
  if (attached) {
    ctx?.resume()
    return
  }
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)()
    const source = ctx.createMediaElementSource(audioEl)
    const gains = get(eqGains)
    const on = get(eqEnabled)
    filters = FREQS.map((freq, i) => {
      const f = ctx.createBiquadFilter()
      f.type = i === 0 ? 'lowshelf' : i === FREQS.length - 1 ? 'highshelf' : 'peaking'
      f.frequency.value = freq
      f.Q.value = 1
      f.gain.value = on ? gains[i] : 0
      return f
    })
    analyser = ctx.createAnalyser()
    analyser.fftSize = 128
    let node = source
    for (const f of filters) {
      node.connect(f)
      node = f
    }
    node.connect(analyser)
    analyser.connect(ctx.destination)
    attached = true
    ctx.resume()
  } catch (e) {
    console.error('FX attach failed:', e)
  }
}

function applyBypass() {
  const on = get(eqEnabled)
  const gains = get(eqGains)
  filters.forEach((f, i) => {
    if (f) f.gain.value = on ? gains[i] : 0
  })
}

export function setBand(i, db) {
  eqGains.update((g) => {
    const n = [...g]
    n[i] = db
    return n
  })
  if (filters[i] && get(eqEnabled)) filters[i].gain.value = db
  try {
    localStorage.setItem('frostify:eq12', JSON.stringify(get(eqGains)))
  } catch {}
}

export function applyPreset(name) {
  ;(presets[name] || presets.Flat).forEach((db, i) => setBand(i, db))
}

export function toggleEq() {
  eqEnabled.update((v) => !v)
}

export function getAnalyser() {
  return analyser
}
