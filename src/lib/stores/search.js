import { writable } from 'svelte/store'
import { YT_API_KEY } from '../config.js'

export const searchResults = writable([])
export const searching = writable(false)
export const searchError = writable('')

// ── YouTube link detection ──────────────────────────────────
// Suportado: youtube.com/watch?v=ID, youtu.be/ID,
// youtube.com/shorts/ID, music.youtube.com/watch?v=ID
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

export async function searchYouTube(query) {
  if (!query.trim()) return
  if (!YT_API_KEY) {
    searchError.set('Add your YouTube API key in src/lib/config.js to enable search.')
    return
  }
  searching.set(true)
  searchError.set('')
  try {
    // Kung YouTube link ang input → direct video lookup
    const videoId = extractVideoId(query)
    if (videoId) {
      const track = await lookupVideo(videoId)
      searchResults.set(track ? [track] : [])
      if (!track) searchError.set('Video not found — baka private o deleted na.')
      return
    }

    // Normal text search
    const url =
      'https://www.googleapis.com/youtube/v3/search' +
      `?part=snippet&type=video&videoCategoryId=10&maxResults=20` +
      `&q=${encodeURIComponent(query)}&key=${YT_API_KEY}`
    const res = await fetch(url)
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      throw new Error(body?.error?.message || `Search failed (${res.status})`)
    }
    const data = await res.json()
    searchResults.set(
      (data.items || [])
        .filter((it) => it.id?.videoId)
        .map((it) => ({
          videoId: it.id.videoId,
          title: decodeEntities(it.snippet.title),
          artist: it.snippet.channelTitle,
          art: it.snippet.thumbnails?.high?.url || it.snippet.thumbnails?.default?.url,
        }))
    )
  } catch (e) {
    searchError.set(e.message)
  } finally {
    searching.set(false)
  }
}

async function lookupVideo(videoId) {
  const url =
    'https://www.googleapis.com/youtube/v3/videos' +
    `?part=snippet&id=${videoId}&key=${YT_API_KEY}`
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error?.message || `Lookup failed (${res.status})`)
  }
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

function decodeEntities(str) {
  const el = document.createElement('textarea')
  el.innerHTML = str
  return el.value
}
