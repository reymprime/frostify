<script>
  import { fly } from 'svelte/transition'
  import Icon from './Icon.svelte'
  import Visualizer from './Visualizer.svelte'
  import {
    currentTrack,
    isPlaying,
    progress,
    duration,
    queue,
    queueIndex,
    shuffle,
    repeat,
    activeEngine,
    sleepRemaining,
    showVideo,
    autoCloseOnSleep,
    keepAwake,
    togglePlay,
    seekTo,
    next,
    prev,
    toggleShuffle,
    cycleRepeat,
    toggleVideo,
    playTrack,
    startSleepTimer,
    cancelSleepTimer,
    fmt,
  } from '../stores/player.js'
  import { eqGains, eqEnabled, setBand, applyPreset, toggleEq, presets, BAND_LABELS } from '../stores/audiofx.js'
  import { favorites, isFav, toggleFav } from '../stores/library.js'
  import { showToast } from '../stores/toast.js'

  let { onclose } = $props()
  let panel = $state('art')
  let customMins = $state('')

  let fav = $derived($currentTrack ? isFav($favorites, $currentTrack) : false)

  function toggle(p) {
    panel = panel === p ? 'art' : p
  }

  // ── Toggle handlers w/ toast + tap-for-info ───────────────
  const INFO = {
    autoclose: {
      title: 'Auto-close after timer',
      body: 'This feature is fully functional on the installed PWA. On regular browser tabs, browser security policies may occasionally block the auto-close action; in such cases, the app will pause the playback instead.',
    },
    wake: {
      title: 'Keep screen awake (YouTube)',
      body: 'Screen Wake Lock prevents the screen from turning off while streaming YouTube tracks to ensure uninterrupted playback. Please note that keeping the screen active will increase battery consumption. This feature is automatically disabled for Vault tracks, which support background playback even when the device is locked.',
    },
    eq: {
      title: 'Equalizer',
      body: 'Technical Note: The Equalizer (EQ) applies exclusively to Vault tracks. Due to browser security and cross-origin restrictions, YouTube audio streams cannot be routed through the Web Audio API chain.',
    },
  }

  function onAutoClose(e) {
    autoCloseOnSleep.set(e.target.checked)
    if (e.target.checked) showToast('Auto-close app after timer is Turned On', INFO.autoclose)
  }

  function onWake(e) {
    keepAwake.set(e.target.checked)
    if (e.target.checked) showToast('Keep screen awake is Turned On', INFO.wake)
  }

  function onEqToggle() {
    toggleEq()
    showToast(`Equalizer Turned ${$eqEnabled ? 'On' : 'Off'}`, INFO.eq)
  }
</script>

<div
  class="bg-ink/80 fixed inset-0 z-50 flex flex-col overflow-y-auto backdrop-blur-2xl"
  transition:fly={{ y: 600, duration: 350 }}
>
  <div class="aurora"></div>

  <div class="flex shrink-0 items-center justify-between px-6 pt-6">
    <button class="glass grid h-10 w-10 place-items-center rounded-full" onclick={onclose} aria-label="Close">
      <Icon name="chevron-down" />
    </button>
    <p class="text-xs font-medium tracking-widest uppercase {$isPlaying ? 'text-frost' : 'text-mist'}">
      {$isPlaying ? 'Now Playing' : 'Not Playing'}
    </p>
    <button
      class="glass grid h-10 w-10 place-items-center rounded-full {panel === 'queue' ? 'text-frost' : ''}"
      onclick={() => toggle('queue')}
      aria-label="Queue"
    >
      <Icon name="queue" />
    </button>
  </div>

  {#if $currentTrack}
    {#if panel === 'art'}
      <div class="flex min-h-64 flex-1 flex-col items-center justify-center gap-4 px-8 py-6">
        <div class="relative w-full max-w-sm">
          {#if $currentTrack.art}
            <img
              src={$currentTrack.art}
              alt={$currentTrack.title}
              class="aspect-square w-full rounded-3xl object-cover shadow-2xl
                     {$isPlaying ? 'scale-100' : 'scale-95'} transition-transform duration-500"
            />
          {:else}
            <div class="bg-glacier text-frost grid aspect-square w-full place-items-center rounded-3xl">
              <Icon name="music" size={72} />
            </div>
          {/if}

          {#if $activeEngine === 'yt'}
            <button
              class="glass text-frost absolute right-3 bottom-3 grid h-11 w-11 place-items-center rounded-full active:scale-95 transition-transform"
              onclick={toggleVideo}
              aria-label={$showVideo ? 'Hide video' : 'Watch video'}
            >
              <Icon name={$showVideo ? 'eye-off' : 'eye'} size={20} />
            </button>
          {/if}
        </div>
        {#if $activeEngine === 'local'}
          <Visualizer />
        {/if}
      </div>
    {:else if panel === 'queue'}
      <div class="flex-1 space-y-2 px-6 py-4">
        <p class="font-display text-mist text-sm font-semibold tracking-wide uppercase">
          Queue • {$queue.length} tracks
        </p>
        {#each $queue as t, i (i)}
          <button
            class="glass flex w-full items-center gap-3 rounded-xl p-2.5 text-left {i === $queueIndex ? 'border-frost/50' : ''}"
            onclick={() => playTrack(t, $queue, i)}
          >
            <span class="text-mist w-5 text-xs tabular-nums">{i + 1}</span>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold {i === $queueIndex ? 'text-frost' : ''}">{t.title}</p>
              <p class="text-mist truncate text-xs">{t.artist}</p>
            </div>
            {#if i === $queueIndex && $isPlaying}
              <span class="text-frost"><Icon name="music" size={16} /></span>
            {/if}
          </button>
        {/each}
      </div>
    {:else if panel === 'eq'}
      <!-- Vertical 12-band EQ -->
      <div class="flex-1 space-y-4 px-5 py-4">
        <div class="flex items-center justify-between">
          <p class="font-display text-mist text-sm font-semibold tracking-wide uppercase">Equalizer</p>
          <button
            class="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold
                   {$eqEnabled ? 'bg-frost text-ink' : 'glass text-mist'}"
            onclick={onEqToggle}
          >
            <Icon name="power" size={13} /> {$eqEnabled ? 'On' : 'Off'}
          </button>
        </div>

        <div class="flex flex-wrap gap-2">
          {#each Object.keys(presets) as name}
            <button
              class="glass text-frost rounded-full px-3 py-1.5 text-xs font-semibold active:scale-95 transition-transform"
              onclick={() => applyPreset(name)}
            >
              {name}
            </button>
          {/each}
        </div>

        <!-- Vertical sliders -->
        <div class="glass rounded-2xl p-4 {$eqEnabled ? '' : 'opacity-40'}">
          <div class="flex items-end justify-between gap-1">
            {#each $eqGains as gain, i}
              <div class="flex flex-1 flex-col items-center gap-2">
                <span class="text-frost text-[9px] tabular-nums">{gain > 0 ? '+' : ''}{gain}</span>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="1"
                  value={gain}
                  disabled={!$eqEnabled}
                  oninput={(e) => setBand(i, Number(e.target.value))}
                  class="eq-vert"
                  aria-label={`${BAND_LABELS[i]} Hz`}
                />
                <span class="text-mist text-[9px]">{BAND_LABELS[i]}</span>
              </div>
            {/each}
          </div>
        </div>
      </div>
    {:else if panel === 'sleep'}
      <div class="flex-1 space-y-4 px-6 py-4">
        <p class="font-display text-mist text-sm font-semibold tracking-wide uppercase">Sleep timer</p>
        {#if $sleepRemaining > 0}
          <div class="glass rounded-2xl p-6 text-center">
            <p class="font-display text-frost text-4xl font-bold tabular-nums">{fmt($sleepRemaining)}</p>
            <p class="text-mist mt-1 text-xs">
              {$autoCloseOnSleep ? 'App closes when this hits zero' : 'Music pauses when this hits zero'}
            </p>
            <button class="glass text-frost mt-4 rounded-full px-6 py-2 text-sm font-semibold" onclick={cancelSleepTimer}>
              Cancel timer
            </button>
          </div>
        {:else}
          <div class="grid grid-cols-4 gap-2">
            {#each [15, 30, 45, 60] as m}
              <button
                class="glass text-frost rounded-2xl py-3 text-sm font-bold active:scale-95 transition-transform"
                onclick={() => startSleepTimer(m * 60)}
              >
                {m}m
              </button>
            {/each}
          </div>
          <div class="glass flex items-center gap-2 rounded-full p-1.5 pl-4">
            <input
              type="number"
              inputmode="numeric"
              min="1"
              max="480"
              placeholder="Custom minutes…"
              bind:value={customMins}
              class="text-ice placeholder:text-mist min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
            <button
              class="bg-frost text-ink shrink-0 rounded-full px-4 py-2 text-sm font-bold"
              onclick={() => customMins > 0 && startSleepTimer(customMins * 60)}
            >
              Start
            </button>
          </div>
        {/if}

        <!-- Toggles: toast + tap-for-info, walang inline text -->
        <label class="glass flex items-center justify-between gap-3 rounded-2xl p-4">
          <span class="text-ice flex items-center gap-2 text-sm">
            <Icon name="power" size={16} /> Auto-close app after timer
          </span>
          <input
            type="checkbox"
            checked={$autoCloseOnSleep}
            onchange={onAutoClose}
            class="eq-switch"
          />
        </label>

        <label class="glass flex items-center justify-between gap-3 rounded-2xl p-4">
          <span class="text-ice flex items-center gap-2 text-sm">
            <Icon name="sun" size={16} /> Keep screen awake (YouTube)
          </span>
          <input
            type="checkbox"
            checked={$keepAwake}
            onchange={onWake}
            class="eq-switch"
          />
        </label>
      </div>
    {/if}

    <!-- Info + controls -->
    <div class="shrink-0 space-y-4 px-8 pb-[calc(env(safe-area-inset-bottom)+2rem)]">
      <div class="flex items-center justify-between gap-3">
        <div class="min-w-0">
          <h2 class="font-display truncate text-xl font-bold">{$currentTrack.title}</h2>
          <p class="text-mist truncate text-sm">{$currentTrack.artist}</p>
        </div>
        <button
          class="shrink-0 {fav ? 'text-frost' : 'text-mist'}"
          onclick={() => toggleFav($currentTrack)}
          aria-label="Favorite"
        >
          <Icon name="heart" size={24} filled={fav} />
        </button>
      </div>

      <div>
        <input
          type="range"
          min="0"
          max={$duration || 1}
          value={$progress}
          oninput={(e) => seekTo(Number(e.target.value))}
          class="h-1 w-full"
          aria-label="Seek"
        />
        <div class="text-mist mt-1 flex justify-between text-xs tabular-nums">
          <span>{fmt($progress)}</span>
          <span>{fmt($duration)}</span>
        </div>
      </div>

      <div class="flex items-center justify-between">
        <button class={$shuffle ? 'text-frost' : 'text-mist'} onclick={toggleShuffle} aria-label="Shuffle">
          <Icon name="shuffle" size={20} />
        </button>
        <button class="text-ice active:scale-90 transition-transform" onclick={prev} aria-label="Previous">
          <Icon name="skip-back" size={30} />
        </button>
        <button
          class="bg-frost text-ink shadow-frost/30 grid h-16 w-16 place-items-center rounded-full shadow-lg active:scale-95 transition-transform"
          onclick={togglePlay}
          aria-label={$isPlaying ? 'Pause' : 'Play'}
        >
          <Icon name={$isPlaying ? 'pause' : 'play'} size={28} />
        </button>
        <button class="text-ice active:scale-90 transition-transform" onclick={next} aria-label="Next">
          <Icon name="skip-forward" size={30} />
        </button>
        <button
          class="relative {$repeat !== 'off' ? 'text-frost' : 'text-mist'}"
          onclick={cycleRepeat}
          aria-label="Repeat"
        >
          <Icon name="repeat" size={20} />
          {#if $repeat === 'one'}
            <span class="absolute -top-1.5 -right-2 text-[10px] font-bold">1</span>
          {/if}
        </button>
      </div>

      <div class="flex items-center justify-center gap-3">
        <button
          class="glass flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold
                 {panel === 'eq' ? 'text-frost' : 'text-mist'}"
          onclick={() => toggle('eq')}
        >
          <Icon name="sliders" size={14} /> EQ
        </button>
        <button
          class="glass flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold
                 {panel === 'sleep' || $sleepRemaining > 0 ? 'text-frost' : 'text-mist'}"
          onclick={() => toggle('sleep')}
        >
          <Icon name="moon" size={14} />
          {$sleepRemaining > 0 ? fmt($sleepRemaining) : 'Sleep'}
        </button>
      </div>
    </div>
  {/if}
</div>
