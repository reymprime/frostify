import { writable } from 'svelte/store'
import { YT_API_KEY } from '../config.js'

// ── Persistent search results ───────────────────────────────
// Naka-save ang huling results — buhay pa rin after app restart.
function persistedResults() {
  let value = []
  try {
    const raw = localStorage.getItem('frostify:lastSearch')
    if (raw) value = JSON.parse(raw)
  } catch {}
  const store = writable(value)
  store.subscribe((v) => {
    try {
      localStorage.setItem('frostify:lastSearch', JSON.stringify(v))
    } catch {}
  })
  return store
}

export const searchResults = persistedResults()
export const searching = writable(false)
export const searchError = writable('')

// ── API cache (quota saver) ─────────────────────────────────
// Bawat playlist/video/query ay naka-cache ng 24 oras —
// pag-paste mo ulit ng parehong link, ZERO API cost.
const CACHE_KEY = 'frostify:searchCache'
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24h
const CACHE_MAX = 20 // max entries — inaalis ang pinakaluma

function readCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY)) || {}
  } catch {
    return {}
  }
}

function cacheGet(key) {
  const entry = readCache()[key]
  if (!entry) return null
  if (Date.now() - entry.at > CACHE_TTL) return null
  return entry.tracks
}

function cacheSet(key, tracks) {
  try {
    const cache = readCache()
    cache[key] = { tracks, at: Date.now() }
    const keys = Object.keys(cache)
    if (keys.length > CACHE_MAX) {
      keys
        .sort((a, b) => cache[a].at - cache[b].at)
        .slice(0, keys.length - CACHE_MAX)
        .forEach((k) => delete cache[k])
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {}
}

// ── Link detection ──────────────────────────────────────────
export function extractVideoId(input) {
  const str = input.trim()
  const patterns = [
    /(?:youtube\.com|music\.youtube\.com)\/watch\?.*v=([\w-]{11})/,
    /youtu\.be\/([\w-]{11})/,
    /youtube\.com\/shorts\/([\w-]{11})/,
    /youtube\.com\/embed\/([\w-]{11})/,
  ]
  for (const p of patterns) {
    const m = str.match(p)
    if (m) return m[1]
  }
  return null
}

export function extractPlaylistId(input) {
  const m = input.trim().match(/[?&]list=([\w-]+)/)
  return m ? m[1] : null
}

// ── Main search ─────────────────────────────────────────────
export async function searchYouTube(query) {
  if (!query.trim()) return
  searchError.set('')

  // Cache check muna — libre ito, walang API cost
  const playlistId = extractPlaylistId(query)
  const videoId = playlistId ? null : extractVideoId(query)
  const cacheKey = playlistId
    ? `pl:${playlistId}`
    : videoId
      ? `v:${videoId}`
      : `q:${query.trim().toLowerCase()}`

  const cached = cacheGet(cacheKey)
  if (cached) {
    searchResults.set(cached)
    return
  }

  if (!YT_API_KEY) {
    searchError.set('Add your YouTube API key in src/lib/config.js to enable search.')
    return
  }

  searching.set(true)
  try {
    let tracks = []
    if (playlistId) {
      tracks = await fetchPlaylist(playlistId)
      if (!tracks.length) searchError.set('Empty o private ang playlist na yan.')
    } else if (videoId) {
      const track = await lookupVideo(videoId)
      tracks = track ? [track] : []
      if (!track) searchError.set('Video not found — baka private o deleted na.')
    } else {
      tracks = await textSearch(query)
    }
    searchResults.set(tracks)
    if (tracks.length) cacheSet(cacheKey, tracks)
  } catch (e) {
    searchError.set(e.message)
  } finally {
    searching.set(false)
  }
}

async function textSearch(query) {
  const url =
    'https://www.googleapis.com/youtube/v3/search' +
    `?part=snippet&type=video&videoCategoryId=10&maxResults=20` +
    `&q=${encodeURIComponent(query)}&key=${YT_API_KEY}`
  const res = await fetch(url)
  if (!res.ok) throw await apiError(res)
  const data = await res.json()
  return (data.items || [])
    .filter((it) => it.id?.videoId)
    .map((it) => ({
      videoId: it.id.videoId,
      title: decodeEntities(it.snippet.title),
      artist: it.snippet.channelTitle,
      art: it.snippet.thumbnails?.high?.url || it.snippet.thumbnails?.default?.url,
    }))
}

async function fetchPlaylist(playlistId) {
  const tracks = []
  let pageToken = ''
  for (let page = 0; page < 2; page++) {
    const url =
      'https://www.googleapis.com/youtube/v3/playlistItems' +
      `?part=snippet&maxResults=50&playlistId=${playlistId}` +
      (pageToken ? `&pageToken=${pageToken}` : '') +
      `&key=${YT_API_KEY}`
    const res = await fetch(url)
    if (!res.ok) throw await apiError(res)
    const data = await res.json()
    for (const it of data.items || []) {
      const vid = it.snippet?.resourceId?.videoId
      const title = it.snippet?.title
      if (!vid || title === 'Deleted video' || title === 'Private video') continue
      tracks.push({
        videoId: vid,
        title: decodeEntities(title),
        artist: it.snippet.videoOwnerChannelTitle || it.snippet.channelTitle || 'YouTube',
        art: it.snippet.thumbnails?.high?.url || it.snippet.thumbnails?.default?.url,
      })
    }
    pageToken = data.nextPageToken
    if (!pageToken) break
  }
  return tracks
}

async function lookupVideo(videoId) {
  const url =
    'https://www.googleapis.com/youtube/v3/videos' +
    `?part=snippet&id=${videoId}&key=${YT_API_KEY}`
  const res = await fetch(url)
  if (!res.ok) throw await apiError(res)
  const data = await res.json()
  const it = data.items?.[0]
  if (!it) return null
  return {
    videoId: it.id,
    title: decodeEntities(it.snippet.title),
    artist: it.snippet.channelTitle,
    art: it.snippet.thumbnails?.high?.url || it.snippet.thumbnails?.default?.url,
  }
}

async function apiError(res) {
  const body = await res.json().catch(() => null)
  return new Error(body?.error?.message || `Request failed (${res.status})`)
}

function decodeEntities(str) {
  const el = document.createElement('textarea')
  el.innerHTML = str
  return el.value
}
