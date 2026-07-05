<script>
  import TrackRow from './TrackRow.svelte'
  import { searchYouTube, searchResults, searching, searchError } from '../stores/search.js'
  import { playTrack } from '../stores/player.js'

  let query = $state('')

  function submit() {
    searchYouTube(query)
  }
</script>

<div class="px-5">
  <h1 class="font-display mb-1 text-2xl font-bold tracking-tight">Search</h1>
  <p class="text-mist mb-4 text-xs">Type a song name — or paste a YouTube link 🔗</p>

  <div class="glass mb-4 flex items-center gap-2 rounded-full p-1.5 pl-4">
    <input
      type="search"
      placeholder="Songs, artists, or YouTube link…"
      bind:value={query}
      onkeydown={(e) => e.key === 'Enter' && submit()}
      class="text-ice placeholder:text-mist min-w-0 flex-1 bg-transparent text-sm outline-none"
    />
    <button
      class="bg-frost text-ink shrink-0 rounded-full px-4 py-2 text-sm font-bold active:scale-95 transition-transform"
      onclick={submit}
    >
      {$searching ? '…' : 'Search'}
    </button>
  </div>

  {#if $searchError}
    <div class="glass rounded-2xl p-4 text-sm">
      <p class="text-frost mb-1 font-semibold">Search unavailable</p>
      <p class="text-mist">{$searchError}</p>
    </div>
  {/if}

  <div class="space-y-2 pb-4">
    {#each $searchResults as t, i (t.videoId)}
      <TrackRow track={t} onplay={() => playTrack(t, $searchResults, i)} />
    {/each}
  </div>
</div>
