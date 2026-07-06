<script>
  import Icon from './Icon.svelte'
  import TrackRow from './TrackRow.svelte'
  import { searchYouTube, searchResults, searching, searchError } from '../stores/search.js'
  import { playTrack } from '../stores/player.js'
  import { createPlaylist, addToPlaylist } from '../stores/library.js'
  import { askPrompt, playlistPicker } from '../stores/ui.js'

  let query = $state('')

  function submit() {
    searchYouTube(query)
  }

  // I-save ang buong results bilang permanenteng Frostify playlist
  function saveAsPlaylist() {
    askPrompt({
      title: 'Save as playlist',
      placeholder: 'Playlist name…',
      onsubmit: (name) => {
        const pl = createPlaylist(name)
        for (const t of $searchResults) addToPlaylist(pl.id, t)
      },
    })
  }
</script>

<div class="px-5">
  <h1 class="font-display mb-1 text-2xl font-bold tracking-tight">Search</h1>
  <p class="text-mist mb-4 text-xs">Type a song name — or paste a YouTube video/playlist link</p>

  <div class="glass mb-4 flex items-center gap-2 rounded-full p-1.5 pl-4">
    <span class="text-mist"><Icon name="search" size={16} /></span>
    <input
      type="search"
      placeholder="Songs, artists, or links…"
      bind:value={query}
      onkeydown={(e) => e.key === 'Enter' && submit()}
      class="text-ice placeholder:text-mist min-w-0 flex-1 bg-transparent text-sm outline-none"
    />
    <button
      class="bg-frost text-ink shrink-0 rounded-full px-4 py-2 text-sm font-bold active:scale-95 transition-transform"
      onclick={submit}
    >
      {$searching ? '…' : 'Go'}
    </button>
  </div>

  {#if $searchError}
    <div class="glass-strong rounded-2xl p-4 text-sm">
      <p class="text-frost mb-1 font-semibold">Search unavailable</p>
      <p class="text-mist">{$searchError}</p>
    </div>
  {/if}

  {#if $searchResults.length > 1}
    <button
      class="glass text-frost mb-3 flex w-full items-center justify-center gap-2 rounded-2xl p-3 text-sm font-semibold active:scale-[0.98] transition-transform"
      onclick={saveAsPlaylist}
    >
      <Icon name="plus" size={16} /> Save all {$searchResults.length} tracks as playlist
    </button>
  {/if}

  <div class="space-y-2 pb-4">
    {#each $searchResults as t, i (t.videoId)}
      <TrackRow track={t} onplay={() => playTrack(t, $searchResults, i)} onswiperight={() => playlistPicker.set(t)} />
    {/each}
  </div>
</div>
