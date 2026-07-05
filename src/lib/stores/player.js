import { writable, get } from 'svelte/store'

// ── Frostify Playback Engine (YouTube IFrame API) ──────────
export const currentTrack = writable(null)
export const isPlaying = writable(false)
export const progress = writable(0) // seconds
export const duration = writable(0) // seconds

let player = null
let ready = false
let tick = null
let pendingTrack = null

// Tawagin ito minsan lang, sa onMount ng App.svelte
export function initPlayer() {
  if (window.YT?.Player) {
    create()
    return
  }
  const tag = document.createElement('script')
  tag.src = 'https://www.youtube.com/iframe_api'
  document.head.appendChild(tag)
  window.onYouTubeIframeAPIReady = create
}

function create() {
  player = new window.YT.Player('yt-player', {
    height: '1',
    width: '1',
    playerVars: {
      playsinline: 1,
      controls: 0,
      disablekb: 1,
      origin: window.location.origin,
    },
    events: {
      onReady: () => {
        ready = true
        if (pendingTrack) {
          const t = pendingTrack
          pendingTrack = null
          playTrack(t)
        }
      },
      onStateChange: (e) => {
        const S = window.YT.PlayerState
        if (e.data === S.PLAYING) {
          isPlaying.set(true)
          duration.set(player.getDuration() || 0)
          startTick()
        } else if (e.data === S.PAUSED || e.data === S.BUFFERING) {
          if (e.data === S.PAUSED) isPlaying.set(false)
          stopTick()
          if (e.data === S.BUFFERING) startTick()
        } else if (e.data === S.ENDED) {
          isPlaying.set(false)
          stopTick()
          progress.set(0)
        }
      },
    },
  })
}

export function playTrack(track) {
  currentTrack.set(track)
  progress.set(0)
  if (!ready) {
    pendingTrack = track
    return
  }
  player.loadVideoById(track.videoId)
}

export function togglePlay() {
  if (!player || !ready || !get(currentTrack)) return
  if (get(isPlaying)) {
    player.pauseVideo()
  } else {
    player.playVideo()
  }
}

export function seekTo(seconds) {
  if (!player || !ready) return
  player.seekTo(seconds, true)
  progress.set(seconds)
}

function startTick() {
  stopTick()
  tick = setInterval(() => {
    if (player?.getCurrentTime) progress.set(player.getCurrentTime() || 0)
  }, 500)
}

function stopTick() {
  if (tick) clearInterval(tick)
  tick = null
}

// "3:07" format para sa time displays
export function fmt(s) {
  s = Math.max(0, Math.floor(s || 0))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}