import { writable } from 'svelte/store'
import { YT_API_KEY } from '../config.js'

export const searchResults = writable([])
export const searching = writable(false)
export const searchError = writable('')

// ── YouTube link detection ──────────────────────────────────
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

// Playlist IDs: nasa "list=" param (playlist page, o watch link na may list)
export function extractPlaylistId(input) {
  const m = input.trim().match(/[?&]list=([\w-]+)/)
  return m ? m[1] : null
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
    // 1) Playlist link → i-load ang buong playlist
    const playlistId = extractPlaylistId(query)
    if (playlistId) {
      const tracks = await fetchPlaylist(playlistId)
      searchResults.set(tracks)
      if (!tracks.length) searchError.set('Empty o private ang playlist na yan.')
      return
    }

    // 2) Video link → direct lookup
    const videoId = extractVideoId(query)
    if (videoId) {
      const track = await lookupVideo(videoId)
      searchResults.set(track ? [track] : [])
      if (!track) searchError.set('Video not found — baka private o deleted na.')
      return
    }

    // 3) Normal text search
    const url =
      'https://www.googleapis.com/youtube/v3/search' +
      `?part=snippet&type=video&videoCategoryId=10&maxResults=20` +
      `&q=${encodeURIComponent(query)}&key=${YT_API_KEY}`
    const res = await fetch(url)
    if (!res.ok) throw await apiError(res)
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

// Hanggang 100 tracks (2 pages) — sapat sa karamihan ng playlists
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
      // Laktawan ang deleted/private entries
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
