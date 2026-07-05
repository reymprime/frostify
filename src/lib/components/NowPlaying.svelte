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
    togglePlay,
    seekTo,
    next,
    prev,
    toggleShuffle,
    cycleRepeat,
    playTrack,
    startSleepTimer,
    cancelSleepTimer,
    fmt,
  } from '../stores/player.js'
  import { eqGains, setBand, applyPreset, presets, BAND_LABELS } from '../stores/audiofx.js'
  import { favorites, isFav, toggleFav } from '../stores/library.js'

  let { onclose } = $props()
  let panel = $state('art') // 'art' | 'queue' | 'eq' | 'sleep'
  let customMins = $state('')

  let fav = $derived($currentTrack ? isFav($favorites, $currentTrack) : false)

  function toggle(p) {
    panel = panel === p ? 'art' : p
  }
</script>

<div
  class="bg-ink/80 fixed inset-0 z-50 flex flex-col overflow-y-auto backdrop-blur-2xl"
  transition:fly={{ y: 600, duration: 350 }}
>
  <div class="aurora"></div>

  <!-- Header -->
  <div class="flex shrink-0 items-center justify-between px-6 pt-6">
    <button class="glass grid h-10 w-10 place-items-center rounded-full" onclick={onclose} aria-label="Close">
      <Icon name="chevron-down" />
    </button>
    <p class="text-mist text-xs font-medium tracking-widest uppercase">Now playing</p>
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
      <!-- Art + visualizer -->
      <div class="flex min-h-64 flex-1 flex-col items-center justify-center gap-4 px-8 py-6">
        {#if $currentTrack.art}
          <img
            src={$currentTrack.art}
            alt={$currentTrack.title}
            class="aspect-square w-full max-w-sm rounded-3xl object-cover shadow-2xl
                   {$isPlaying ? 'scale-100' : 'scale-95'} transition-transform duration-500"
          />
        {:else}
          <div class="bg-glacier text-frost grid aspect-square w-full max-w-sm place-items-center rounded-3xl">
            <Icon name="music" size={72} />
          </div>
        {/if}
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
            class="glass flex w-full items-center gap-3 rounded-xl p-2.5 text-left"
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
      <!-- Equalizer -->
      <div class="flex-1 space-y-4 px-6 py-4">
        <p class="font-display text-mist text-sm font-semibold tracking-wide uppercase">Equalizer</p>
        <div class="flex flex-wrap gap-2">
          {#each Object.keys(presets) as name}
            <button
              class="glass text-frost rounded-full px-4 py-1.5 text-xs font-semibold active:scale-95 transition-transform"
              onclick={() => applyPreset(name)}
            >
              {name}
            </button>
          {/each}
        </div>
        <div class="glass space-y-3 rounded-2xl p-4">
          {#each $eqGains as gain, i}
            <div class="flex items-center gap-3">
              <span class="text-mist w-8 text-right text-xs tabular-nums">{BAND_LABELS[i]}</span>
              <input
                type="range"
                min="-12"
                max="12"
                step="1"
                value={gain}
                oninput={(e) => setBand(i, Number(e.target.value))}
                class="h-1 flex-1"
                aria-label={`${BAND_LABELS[i]} Hz`}
              />
              <span class="text-frost w-9 text-xs tabular-nums">{gain > 0 ? '+' : ''}{gain}dB</span>
            </div>
          {/each}
        </div>
        {#if $activeEngine !== 'local'}
          <p class="text-mist text-xs">
            Note: EQ shapes Vault tracks only — YouTube audio can't pass through the Web Audio chain.
          </p>
        {/if}
      </div>
    {:else if panel === 'sleep'}
      <!-- Sleep timer -->
      <div class="flex-1 space-y-4 px-6 py-4">
        <p class="font-display text-mist text-sm font-semibold tracking-wide uppercase">Sleep timer</p>
        {#if $sleepRemaining > 0}
          <div class="glass rounded-2xl p-6 text-center">
            <p class="font-display text-frost text-4xl font-bold tabular-nums">{fmt($sleepRemaining)}</p>
            <p class="text-mist mt-1 text-xs">Music pauses when this hits zero</p>
            <button
              class="glass text-frost mt-4 rounded-full px-6 py-2 text-sm font-semibold"
              onclick={cancelSleepTimer}
            >
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

      <!-- Seek -->
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

      <!-- Transport -->
      <div class="flex items-center justify-between">
        <button
          class={$shuffle ? 'text-frost' : 'text-mist'}
          onclick={toggleShuffle}
          aria-label="Shuffle"
        >
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

      <!-- Extras: EQ + Sleep -->
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
