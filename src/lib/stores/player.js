import { writable, get } from 'svelte/store'
import { addRecent } from './library.js'
import { getVaultBlob } from './vault.js'
import { attachFx } from './audiofx.js'

// ── Frostify Dual Playback Engine v3 ────────────────────────
export const currentTrack = writable(null)
export const isPlaying = writable(false)
export const progress = writable(0)
export const duration = writable(0)
export const queue = writable([])
export const queueIndex = writable(-1)
export const shuffle = writable(false)
export const repeat = writable('off') // 'off' | 'all' | 'one'
export const activeEngine = writable(null) // 'yt' | 'local'
export const sleepRemaining = writable(0) // seconds; 0 = off

let yt = null
let ytReady = false
let pendingTrack = null
let tick = null
let audio = null
let engine = null
let objectUrl = null
let sleepInt = null

export function initPlayer() {
  audio = new Audio()
  audio.addEventListener('timeupdate', () => {
    if (engine === 'local') progress.set(audio.currentTime)
  })
  audio.addEventListener('loadedmetadata', () => {
    if (engine === 'local') duration.set(audio.duration || 0)
  })
  audio.addEventListener('play', () => engine === 'local' && isPlaying.set(true))
  audio.addEventListener('pause', () => engine === 'local' && isPlaying.set(false))
  audio.addEventListener('ended', handleEnded)

  if (window.YT?.Player) {
    createYT()
  } else {
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(tag)
    window.onYouTubeIframeAPIReady = createYT
  }

  setupMediaSession()
}

function createYT() {
  yt = new window.YT.Player('yt-player', {
    height: '1',
    width: '1',
    playerVars: { playsinline: 1, controls: 0, disablekb: 1, origin: window.location.origin },
    events: {
      onReady: () => {
        ytReady = true
        if (pendingTrack) {
          const t = pendingTrack
          pendingTrack = null
          startTrack(t)
        }
      },
      onStateChange: (e) => {
        if (engine !== 'yt') return
        const S = window.YT.PlayerState
        if (e.data === S.PLAYING) {
          isPlaying.set(true)
          duration.set(yt.getDuration() || 0)
          startTick()
        } else if (e.data === S.PAUSED) {
          isPlaying.set(false)
          stopTick()
        } else if (e.data === S.ENDED) {
          stopTick()
          handleEnded()
        }
      },
    },
  })
}

// ── Playback ────────────────────────────────────────────────
export function playTrack(track, list = null, index = -1) {
  if (list) {
    queue.set(list)
    queueIndex.set(index >= 0 ? index : list.indexOf(track))
  } else {
    queue.set([track])
    queueIndex.set(0)
  }
  startTrack(track)
}

async function startTrack(track) {
  currentTrack.set(track)
  progress.set(0)
  duration.set(0)
  addRecent(track)
  updateMediaMetadata(track)

  if (track.videoId) {
    stopLocal()
    engine = 'yt'
    activeEngine.set('yt')
    if (!ytReady) {
      pendingTrack = track
      return
    }
    yt.loadVideoById(track.videoId)
  } else if (track.vaultId) {
    stopYT()
    engine = 'local'
    activeEngine.set('local')
    const blob = await getVaultBlob(track.vaultId)
    if (!blob) return
    if (objectUrl) URL.revokeObjectURL(objectUrl)
    objectUrl = URL.createObjectURL(blob)
    attachFx(audio) // EQ + visualizer chain (Sonata logic)
    audio.src = objectUrl
    audio.play()
  }
}

export function togglePlay() {
  if (!get(currentTrack)) return
  if (engine === 'yt' && ytReady) {
    get(isPlaying) ? yt.pauseVideo() : yt.playVideo()
  } else if (engine === 'local') {
    get(isPlaying) ? audio.pause() : audio.play()
  }
}

export function seekTo(seconds) {
  if (engine === 'yt' && ytReady) {
    yt.seekTo(seconds, true)
  } else if (engine === 'local') {
    audio.currentTime = seconds
  }
  progress.set(seconds)
}

export function next() {
  const q = get(queue)
  if (!q.length) return
  let i = get(queueIndex)
  if (get(shuffle) && q.length > 1) {
    let r
    do {
      r = Math.floor(Math.random() * q.length)
    } while (r === i)
    i = r
  } else {
    i = i + 1
    if (i >= q.length) {
      if (get(repeat) === 'all') i = 0
      else return
    }
  }
  queueIndex.set(i)
  startTrack(q[i])
}

export function prev() {
  const q = get(queue)
  if (!q.length) return
  if (get(progress) > 3) {
    seekTo(0)
    return
  }
  let i = get(queueIndex) - 1
  if (i < 0) i = get(repeat) === 'all' ? q.length - 1 : 0
  queueIndex.set(i)
  startTrack(q[i])
}

export function addToQueue(track) {
  queue.update((q) => [...q, track])
}

export function toggleShuffle() {
  shuffle.update((v) => !v)
}

export function cycleRepeat() {
  repeat.update((r) => (r === 'off' ? 'all' : r === 'all' ? 'one' : 'off'))
}

function handleEnded() {
  if (get(repeat) === 'one') {
    seekTo(0)
    if (engine === 'yt') yt.playVideo()
    else audio.play()
    return
  }
  isPlaying.set(false)
  next()
}

// ── Sleep Timer (Sonata logic) ──────────────────────────────
export function startSleepTimer(seconds) {
  cancelSleepTimer()
  if (!seconds || seconds <= 0) return
  sleepRemaining.set(seconds)
  sleepInt = setInterval(() => {
    sleepRemaining.update((s) => {
      if (s <= 1) {
        clearInterval(sleepInt)
        sleepInt = null
        pauseAll()
        return 0
      }
      return s - 1
    })
  }, 1000)
}

export function cancelSleepTimer() {
  if (sleepInt) clearInterval(sleepInt)
  sleepInt = null
  sleepRemaining.set(0)
}

function pauseAll() {
  if (engine === 'yt' && ytReady) yt.pauseVideo()
  if (audio) audio.pause()
}

// ── Internals ───────────────────────────────────────────────
function stopYT() {
  stopTick()
  if (yt && ytReady) yt.stopVideo()
}

function stopLocal() {
  if (audio) {
    audio.pause()
    audio.removeAttribute('src')
  }
}

function startTick() {
  stopTick()
  tick = setInterval(() => {
    if (engine === 'yt' && yt?.getCurrentTime) progress.set(yt.getCurrentTime() || 0)
  }, 500)
}

function stopTick() {
  if (tick) clearInterval(tick)
  tick = null
}

function setupMediaSession() {
  if (!('mediaSession' in navigator)) return
  navigator.mediaSession.setActionHandler('play', togglePlay)
  navigator.mediaSession.setActionHandler('pause', togglePlay)
  navigator.mediaSession.setActionHandler('nexttrack', next)
  navigator.mediaSession.setActionHandler('previoustrack', prev)
}

function updateMediaMetadata(track) {
  if (!('mediaSession' in navigator)) return
  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.title,
    artist: track.artist || 'Frostify',
    artwork: track.art ? [{ src: track.art, sizes: '512x512', type: 'image/jpeg' }] : [],
  })
}

export function fmt(s) {
  s = Math.max(0, Math.floor(s || 0))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
