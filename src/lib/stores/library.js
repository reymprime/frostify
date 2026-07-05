import { writable, get } from 'svelte/store'

// ── Persisted store helper ──────────────────────────────────
function persisted(key, initial) {
  let value = initial
  try {
    const raw = localStorage.getItem(key)
    if (raw) value = JSON.parse(raw)
  } catch {}
  const store = writable(value)
  store.subscribe((v) => {
    try {
      localStorage.setItem(key, JSON.stringify(v))
    } catch {}
  })
  return store
}

export const favorites = persisted('frostify:favorites', [])
export const recents = persisted('frostify:recents', [])
export const playlists = persisted('frostify:playlists', [])

export function trackId(t) {
  return t.videoId || (t.vaultId ? `vault:${t.vaultId}` : t.title)
}

export function isFav(list, track) {
  return list.some((t) => trackId(t) === trackId(track))
}

export function toggleFav(track) {
  favorites.update((list) =>
    isFav(list, track)
      ? list.filter((t) => trackId(t) !== trackId(track))
      : [track, ...list]
  )
}

export function addRecent(track) {
  recents.update((list) => {
    const filtered = list.filter((t) => trackId(t) !== trackId(track))
    return [track, ...filtered].slice(0, 20)
  })
}

export function createPlaylist(name) {
  const pl = { id: crypto.randomUUID(), name, tracks: [] }
  playlists.update((list) => [pl, ...list])
  return pl
}

export function addToPlaylist(playlistId, track) {
  playlists.update((list) =>
    list.map((pl) =>
      pl.id === playlistId && !isFav(pl.tracks, track)
        ? { ...pl, tracks: [...pl.tracks, track] }
        : pl
    )
  )
}

export function deletePlaylist(playlistId) {
  playlists.update((list) => list.filter((pl) => pl.id !== playlistId))
}
