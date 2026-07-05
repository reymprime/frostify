import { writable } from 'svelte/store'

// Central playback state. Dito papasok ang YouTube IFrame API
// / Web Audio engine sa susunod na phase.
export const currentTrack = writable({
  title: 'Northern Lights',
  artist: 'Gnokz',
  art: 'https://picsum.photos/seed/frost1/400',
})

export const isPlaying = writable(false)

export function togglePlay() {
  isPlaying.update((v) => !v)
}
