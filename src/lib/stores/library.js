import { writable } from 'svelte/store'

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

export function removeFromRecents(track) {
  recents.update((list) => list.filter((t) => trackId(t) !== trackId(track)))
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

export function removeFromPlaylist(playlistId, track) {
  playlists.update((list) =>
    list.map((pl) =>
      pl.id === playlistId
        ? { ...pl, tracks: pl.tracks.filter((t) => trackId(t) !== trackId(track)) }
        : pl
    )
  )
}

export function deletePlaylist(playlistId) {
  playlists.update((list) => list.filter((pl) => pl.id !== playlistId))
}

export function renamePlaylist(playlistId, name) {
  playlists.update((list) =>
    list.map((pl) => (pl.id === playlistId ? { ...pl, name } : pl))
  )
}

// ── Reorder (hand gestures) ─────────────────────────────────
function move(arr, from, to) {
  const n = [...arr]
  const clamped = Math.max(0, Math.min(n.length - 1, to))
  const [item] = n.splice(from, 1)
  n.splice(clamped, 0, item)
  return n
}

export function reorderFavorites(from, to) {
  favorites.update((l) => move(l, from, to))
}

export function reorderPlaylist(playlistId, from, to) {
  playlists.update((list) =>
    list.map((pl) => (pl.id === playlistId ? { ...pl, tracks: move(pl.tracks, from, to) } : pl))
  )
}

// ── Rename track sa lahat ng listahan ──────────────────────
export function renameTrackEverywhere(track, title) {
  const id = trackId(track)
  const up = (l) => l.map((t) => (trackId(t) === id ? { ...t, title } : t))
  favorites.update(up)
  recents.update(up)
  playlists.update((list) => list.map((pl) => ({ ...pl, tracks: up(pl.tracks) })))
}
