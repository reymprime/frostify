<script>
  import TrackRow from './TrackRow.svelte'
  import { recents, favorites } from '../stores/library.js'
  import { playTrack } from '../stores/player.js'

  let { gotosearch } = $props()

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
</script>

<div class="px-5">
  <p class="text-mist text-xs font-medium tracking-widest uppercase">{greeting}</p>
  <h1 class="font-display mb-5 text-2xl font-bold tracking-tight">
    Frost<span class="text-frost">ify</span>
  </h1>

  {#if !$recents.length && !$favorites.length}
    <!-- Empty state -->
    <div class="glass mt-10 rounded-3xl p-8 text-center">
      <p class="mb-2 text-4xl">❄</p>
      <h2 class="font-display mb-1 text-lg font-semibold">Malamig pa dito</h2>
      <p class="text-mist mb-5 text-sm">Search for a song to start the frost.</p>
      <button
        class="bg-frost text-ink rounded-full px-6 py-2.5 text-sm font-bold active:scale-95 transition-transform"
        onclick={gotosearch}
      >
        Search music
      </button>
    </div>
  {/if}

  {#if $recents.length}
    <h2 class="font-display text-mist mb-3 text-sm font-semibold tracking-wide uppercase">
      Recently played
    </h2>
    <div class="mb-6 space-y-2">
      {#each $recents.slice(0, 8) as t, i (t.videoId || t.vaultId || i)}
        <TrackRow track={t} onplay={() => playTrack(t, $recents, i)} />
      {/each}
    </div>
  {/if}

  {#if $favorites.length}
    <h2 class="font-display text-mist mb-3 text-sm font-semibold tracking-wide uppercase">
      Your favorites
    </h2>
    <div class="space-y-2 pb-4">
      {#each $favorites as t, i (t.videoId || t.vaultId || i)}
        <TrackRow track={t} onplay={() => playTrack(t, $favorites, i)} />
      {/each}
    </div>
  {/if}
</div>
