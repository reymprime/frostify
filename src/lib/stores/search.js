import { writable } from 'svelte/store'
import { YT_API_KEY } from '../config.js'

export const searchResults = writable([])
export const searching = writable(false)
export const searchError = writable('')

export async function searchYouTube(query) {
  if (!query.trim()) return
  if (!YT_API_KEY) {
    searchError.set('Add your YouTube API key in src/lib/config.js to enable search.')
    return
  }
  searching.set(true)
  searchError.set('')
  try {
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

function decodeEntities(str) {
  const el = document.createElement('textarea')
  el.innerHTML = str
  return el.value
}
