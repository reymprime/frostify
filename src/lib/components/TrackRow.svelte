<script>
  import { favorites, isFav, toggleFav } from '../stores/library.js'
  import { addToQueue } from '../stores/player.js'

  let { track, onplay, showqueue = true } = $props()

  let fav = $derived(isFav($favorites, track))
</script>

<div class="glass flex items-center gap-3 rounded-xl p-2">
  <button class="flex min-w-0 flex-1 items-center gap-3 text-left" onclick={onplay}>
    {#if track.art}
      <img src={track.art} alt="" class="h-12 w-12 shrink-0 rounded-lg object-cover" loading="lazy" />
    {:else}
      <div class="bg-glacier text-frost grid h-12 w-12 shrink-0 place-items-center rounded-lg text-lg">❄</div>
    {/if}
    <div class="min-w-0 flex-1">
      <p class="font-display truncate text-sm font-semibold">{track.title}</p>
      <p class="text-mist truncate text-xs">{track.artist}</p>
    </div>
  </button>

  <button
    class="grid h-9 w-9 shrink-0 place-items-center text-lg {fav ? 'text-frost' : 'text-mist'}"
    onclick={() => toggleFav(track)}
    aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
  >
    {fav ? '♥' : '♡'}
  </button>

  {#if showqueue}
    <button
      class="text-mist grid h-9 w-9 shrink-0 place-items-center text-lg"
      onclick={() => addToQueue(track)}
      aria-label="Add to queue"
    >
      ＋
    </button>
  {/if}
</div>
