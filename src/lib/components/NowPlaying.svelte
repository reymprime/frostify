<script>
  import { fly } from 'svelte/transition'
  import {
    currentTrack,
    isPlaying,
    progress,
    duration,
    togglePlay,
    seekTo,
    fmt,
  } from '../stores/player.js'

  let { onclose } = $props()

  function onSeek(e) {
    seekTo(Number(e.target.value))
  }
</script>

<div
  class="bg-ink/70 fixed inset-0 z-50 flex flex-col backdrop-blur-2xl"
  transition:fly={{ y: 600, duration: 350 }}
>
  <div class="aurora"></div>

  <!-- Header -->
  <div class="flex items-center justify-between px-6 pt-6">
    <button class="glass grid h-10 w-10 place-items-center rounded-full" onclick={onclose} aria-label="Close">
      ⌄
    </button>
    <p class="text-mist text-xs font-medium tracking-widest uppercase">Now playing</p>
    <div class="w-10"></div>
  </div>

  {#if $currentTrack}
    <!-- Art -->
    <div class="flex flex-1 items-center justify-center px-8">
      <img
        src={$currentTrack.art}
        alt={$currentTrack.title}
        class="aspect-square w-full max-w-sm rounded-3xl object-cover shadow-2xl
               {$isPlaying ? 'scale-100' : 'scale-95'} transition-transform duration-500"
      />
    </div>

    <!-- Info + controls -->
    <div class="space-y-5 px-8 pb-[calc(env(safe-area-inset-bottom)+2.5rem)]">
      <div>
        <h2 class="font-display truncate text-2xl font-bold">{$currentTrack.title}</h2>
        <p class="text-mist truncate">{$currentTrack.artist}</p>
      </div>

      <!-- Seek bar -->
      <div>
        <input
          type="range"
          min="0"
          max={$duration || 1}
          value={$progress}
          oninput={onSeek}
          class="accent-frost h-1 w-full"
          aria-label="Seek"
        />
        <div class="text-mist mt-1 flex justify-between text-xs tabular-nums">
          <span>{fmt($progress)}</span>
          <span>{fmt($duration)}</span>
        </div>
      </div>

      <!-- Play / pause -->
      <div class="flex items-center justify-center">
        <button
          class="bg-frost text-ink grid h-16 w-16 place-items-center rounded-full text-2xl shadow-lg shadow-frost/30 active:scale-95 transition-transform"
          onclick={togglePlay}
          aria-label={$isPlaying ? 'Pause' : 'Play'}
        >
          {$isPlaying ? '⏸' : '▶'}
        </button>
      </div>
    </div>
  {/if}
</div>
