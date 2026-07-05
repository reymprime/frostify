<script>
  import { fly } from 'svelte/transition'
  import {
    currentTrack,
    isPlaying,
    progress,
    duration,
    queue,
    queueIndex,
    shuffle,
    repeat,
    togglePlay,
    seekTo,
    next,
    prev,
    toggleShuffle,
    cycleRepeat,
    playTrack,
    fmt,
  } from '../stores/player.js'
  import { favorites, isFav, toggleFav } from '../stores/library.js'

  let { onclose } = $props()
  let showQueue = $state(false)

  let fav = $derived($currentTrack ? isFav($favorites, $currentTrack) : false)
</script>

<div
  class="bg-ink/70 fixed inset-0 z-50 flex flex-col overflow-y-auto backdrop-blur-2xl"
  transition:fly={{ y: 600, duration: 350 }}
>
  <div class="aurora"></div>

  <!-- Header -->
  <div class="flex shrink-0 items-center justify-between px-6 pt-6">
    <button class="glass grid h-10 w-10 place-items-center rounded-full" onclick={onclose} aria-label="Close">
      ⌄
    </button>
    <p class="text-mist text-xs font-medium tracking-widest uppercase">Now playing</p>
    <button
      class="glass grid h-10 w-10 place-items-center rounded-full {showQueue ? 'text-frost' : ''}"
      onclick={() => (showQueue = !showQueue)}
      aria-label="Queue"
    >
      ☰
    </button>
  </div>

  {#if $currentTrack}
    {#if !showQueue}
      <!-- Art -->
      <div class="flex min-h-72 flex-1 items-center justify-center px-8 py-6">
        {#if $currentTrack.art}
          <img
            src={$currentTrack.art}
            alt={$currentTrack.title}
            class="aspect-square w-full max-w-sm rounded-3xl object-cover shadow-2xl
                   {$isPlaying ? 'scale-100' : 'scale-95'} transition-transform duration-500"
          />
        {:else}
          <div class="bg-glacier text-frost grid aspect-square w-full max-w-sm place-items-center rounded-3xl text-7xl">
            ❄
          </div>
        {/if}
      </div>
    {:else}
      <!-- Queue -->
      <div class="flex-1 space-y-2 px-6 py-4">
        <p class="font-display text-mist text-sm font-semibold tracking-wide uppercase">
          Queue • {$queue.length} tracks
        </p>
        {#each $queue as t, i (i)}
          <button
            class="glass flex w-full items-center gap-3 rounded-xl p-2.5 text-left
                   {i === $queueIndex ? 'border-frost/40' : ''}"
            onclick={() => playTrack(t, $queue, i)}
          >
            <span class="text-mist w-5 text-xs tabular-nums">{i + 1}</span>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold {i === $queueIndex ? 'text-frost' : ''}">{t.title}</p>
              <p class="text-mist truncate text-xs">{t.artist}</p>
            </div>
            {#if i === $queueIndex && $isPlaying}<span class="text-frost">♫</span>{/if}
          </button>
        {/each}
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
          class="shrink-0 text-2xl {fav ? 'text-frost' : 'text-mist'}"
          onclick={() => toggleFav($currentTrack)}
          aria-label="Favorite"
        >
          {fav ? '♥' : '♡'}
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
          class="accent-frost h-1 w-full"
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
          class="text-xl {$shuffle ? 'text-frost' : 'text-mist'}"
          onclick={toggleShuffle}
          aria-label="Shuffle"
        >
          ⤨
        </button>
        <button class="text-ice text-3xl active:scale-90 transition-transform" onclick={prev} aria-label="Previous">
          ⏮
        </button>
        <button
          class="bg-frost text-ink shadow-frost/30 grid h-16 w-16 place-items-center rounded-full text-2xl shadow-lg active:scale-95 transition-transform"
          onclick={togglePlay}
          aria-label={$isPlaying ? 'Pause' : 'Play'}
        >
          {$isPlaying ? '⏸' : '▶'}
        </button>
        <button class="text-ice text-3xl active:scale-90 transition-transform" onclick={next} aria-label="Next">
          ⏭
        </button>
        <button
          class="relative text-xl {$repeat !== 'off' ? 'text-frost' : 'text-mist'}"
          onclick={cycleRepeat}
          aria-label="Repeat"
        >
          ↻{#if $repeat === 'one'}<span class="absolute -top-1 -right-2 text-[10px] font-bold">1</span>{/if}
        </button>
      </div>
    </div>
  {/if}
</div>
