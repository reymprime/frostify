<script>
  import Icon from './Icon.svelte'
  import TrackRow from './TrackRow.svelte'
  import { recents, favorites, removeFromRecents, toggleFav } from '../stores/library.js'
  import { playTrack } from '../stores/player.js'
  import { settingsOpen } from '../stores/ui.js'

  let { gotosearch } = $props()

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
</script>

<div class="px-5">
  <div class="flex items-start justify-between">
    <div>
      <p class="text-mist text-xs font-medium tracking-widest uppercase">{greeting}</p>
      <h1 class="font-display mb-5 text-2xl font-bold tracking-tight">
        Frost<span class="text-frost">ify</span>
      </h1>
    </div>
    <button
      class="glass text-mist grid h-10 w-10 place-items-center rounded-full"
      onclick={() => settingsOpen.set(true)}
      aria-label="Settings"
    >
      <Icon name="settings" size={18} />
    </button>
  </div>

  {#if !$recents.length && !$favorites.length}
    <div class="glass mt-10 rounded-3xl p-8 text-center">
      <div class="text-frost mb-3 flex justify-center"><Icon name="snowflake" size={40} /></div>
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
        <TrackRow
          track={t}
          index={i}
          onplay={() => playTrack(t, $recents, i)}
          ondelete={() => removeFromRecents(t)}
          deletelabel="Remove from recents"
        />
      {/each}
    </div>
  {/if}

  {#if $favorites.length}
    <h2 class="font-display text-mist mb-3 text-sm font-semibold tracking-wide uppercase">
      Your favorites
    </h2>
    <div class="space-y-2 pb-4">
      {#each $favorites as t, i (t.videoId || t.vaultId || i)}
        <TrackRow
          track={t}
          index={i}
          onplay={() => playTrack(t, $favorites, i)}
          ondelete={() => toggleFav(t)}
          deletelabel="Remove from favorites"
        />
      {/each}
    </div>
  {/if}
</div>
