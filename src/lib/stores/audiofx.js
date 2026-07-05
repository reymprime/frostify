import { writable, get } from 'svelte/store'

// ── Frostify Audio FX (Sonata logic) ────────────────────────
// 5-band EQ + analyser via Web Audio API.
// Gumagana sa Vault/local tracks (yung HTML5 Audio engine).
// Hindi ma-route ang YouTube iframe audio sa Web Audio — browser limit.

const FREQS = [60, 250, 1000, 4000, 12000]
export const BAND_LABELS = ['60', '250', '1k', '4k', '12k']

export const presets = {
  Flat: [0, 0, 0, 0, 0],
  Bass: [6, 4, 0, -1, 1],
  Vocal: [-2, 1, 4, 3, 0],
  Treble: [-1, 0, 1, 4, 6],
  'Lo-fi': [4, 2, -3, -4, -6],
}

function load() {
  try {
    const raw = localStorage.getItem('frostify:eq')
    if (raw) return JSON.parse(raw)
  } catch {}
  return [0, 0, 0, 0, 0]
}

export const eqGains = writable(load())

let ctx = null
let filters = []
let analyser = null
let attached = false

// Tawagin bago mag-play ng local track — isang beses lang aatake
export function attachFx(audioEl) {
  if (attached) {
    ctx?.resume()
    return
  }
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)()
    const source = ctx.createMediaElementSource(audioEl)
    const gains = get(eqGains)
    filters = FREQS.map((freq, i) => {
      const f = ctx.createBiquadFilter()
      f.type = i === 0 ? 'lowshelf' : i === FREQS.length - 1 ? 'highshelf' : 'peaking'
      f.frequency.value = freq
      f.Q.value = 1
      f.gain.value = gains[i]
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

export function setBand(i, db) {
  eqGains.update((g) => {
    const n = [...g]
    n[i] = db
    return n
  })
  if (filters[i]) filters[i].gain.value = db
  try {
    localStorage.setItem('frostify:eq', JSON.stringify(get(eqGains)))
  } catch {}
}

export function applyPreset(name) {
  ;(presets[name] || presets.Flat).forEach((db, i) => setBand(i, db))
}

export function getAnalyser() {
  return analyser
}
