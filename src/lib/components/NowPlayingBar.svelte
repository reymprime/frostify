<script>
  import {
    currentTrack,
    isPlaying,
    progress,
    duration,
    togglePlay,
  } from '../stores/player.js'

  let { onexpand } = $props()

  let pct = $derived($duration ? ($progress / $duration) * 100 : 0)
</script>

{#if $currentTrack}
  <div class="glass relative mx-3 overflow-hidden rounded-2xl">
    <!-- Live progress line -->
    <div
      class="bg-frost absolute top-0 left-0 h-0.5 transition-[width] duration-500 ease-linear"
      style="width: {pct}%"
    ></div>

    <div class="flex items-center gap-3 p-2.5">
      <button class="flex min-w-0 flex-1 items-center gap-3 text-left" onclick={onexpand}>
        <img
          src={$currentTrack.art}
          alt={$currentTrack.title}
          class="h-11 w-11 rounded-xl object-cover {$isPlaying ? 'animate-pulse-slow' : ''}"
        />
        <div class="min-w-0 flex-1">
          <p class="font-display truncate text-sm font-semibold">{$currentTrack.title}</p>
          <p class="text-mist truncate text-xs">{$currentTrack.artist}</p>
        </div>
      </button>
      <button
        class="bg-frost text-ink grid h-10 w-10 shrink-0 place-items-center rounded-full text-base font-bold active:scale-95 transition-transform"
        onclick={togglePlay}
        aria-label={$isPlaying ? 'Pause' : 'Play'}
      >
        {$isPlaying ? '⏸' : '▶'}
      </button>
    </div>
  </div>
{/if}
