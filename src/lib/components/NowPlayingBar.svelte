<script>
  import { currentTrack, isPlaying, togglePlay } from '../stores/player.js'
</script>

<div class="glass mx-3 flex items-center gap-3 rounded-2xl p-2.5">
  <img
    src={$currentTrack.art}
    alt={$currentTrack.title}
    class="h-11 w-11 rounded-xl object-cover"
  />
  <div class="min-w-0 flex-1">
    <p class="font-display truncate text-sm font-semibold">{$currentTrack.title}</p>
    <p class="text-mist truncate text-xs">{$currentTrack.artist}</p>
  </div>
  <button
    class="bg-frost text-ink grid h-10 w-10 place-items-center rounded-full text-base font-bold"
    onclick={togglePlay}
    aria-label={$isPlaying ? 'Pause' : 'Play'}
  >
    {$isPlaying ? '⏸' : '▶'}
  </button>
</div>
