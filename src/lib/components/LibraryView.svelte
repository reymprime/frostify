<script>
  import Icon from './Icon.svelte'
  import TrackRow from './TrackRow.svelte'
  import {
    playlists,
    favorites,
    createPlaylist,
    addToPlaylist,
    deletePlaylist,
    renamePlaylist,
    removeFromPlaylist,
    reorderPlaylist,
    reorderFavorites,
    toggleFav,
  } from '../stores/library.js'
  import { playTrack, currentTrack } from '../stores/player.js'
  import { askConfirm, askPrompt } from '../stores/ui.js'

  let newName = $state('')
  let openId = $state(null)
  let reorderList = $state(null)

  // Arrow-based reorder helpers (swap by one)
  function favUp(i) { if (i > 0) reorderFavorites(i, i - 1) }
  function favDown(i, len) { if (i < len - 1) reorderFavorites(i, i + 1) }
  function plUp(id, i) { if (i > 0) reorderPlaylist(id, i, i - 1) }
  function plDown(id, i, len) { if (i < len - 1) reorderPlaylist(id, i, i + 1) } // 'favs' | playlist id

  function create() {
    if (!newName.trim()) return
    createPlaylist(newName.trim())
    newName = ''
  }

  function requestDeletePlaylist(pl) {
    askConfirm({
      title: 'Delete playlist?',
      message: `"${pl.name}" (${pl.tracks.length} tracks) will be removed.`,
      confirmLabel: 'Delete',
      onconfirm: () => deletePlaylist(pl.id),
    })
  }

  function requestRenamePlaylist(pl) {
    askPrompt({
      title: 'Rename playlist',
      placeholder: 'Playlist name…',
      value: pl.name,
      onsubmit: (name) => renamePlaylist(pl.id, name),
    })
  }
</script>

<div class="px-5">
  <h1 class="font-display mb-4 text-2xl font-bold tracking-tight">Library</h1>

  <div class="glass mb-5 flex items-center gap-2 rounded-full p-1.5 pl-4">
    <input
      type="text"
      placeholder="New playlist name…"
      bind:value={newName}
      onkeydown={(e) => e.key === 'Enter' && create()}
      class="text-ice placeholder:text-mist min-w-0 flex-1 bg-transparent text-sm outline-none"
    />
    <button
      class="bg-frost text-ink shrink-0 rounded-full px-4 py-2 text-sm font-bold active:scale-95 transition-transform"
      onclick={create}
    >
      Create
    </button>
  </div>

  {#if $playlists.length}
    <h2 class="font-display text-mist mb-3 text-sm font-semibold tracking-wide uppercase">Playlists</h2>
    <div class="mb-6 space-y-2">
      {#each $playlists as pl (pl.id)}
        <div class="glass rounded-2xl p-3">
          <div class="flex items-center gap-2">
            <button
              class="flex min-w-0 flex-1 items-center gap-3 text-left"
              onclick={() => (openId = openId === pl.id ? null : pl.id)}
            >
              <div class="bg-glacier text-frost grid h-11 w-11 shrink-0 place-items-center rounded-xl">
                <Icon name="music" size={18} />
              </div>
              <div class="min-w-0">
                <p class="font-display truncate text-sm font-semibold">{pl.name}</p>
                <p class="text-mist text-xs">{pl.tracks.length} tracks</p>
              </div>
            </button>
            {#if pl.tracks.length}
              <button
                class="bg-frost text-ink grid h-9 w-9 shrink-0 place-items-center rounded-full"
                onclick={() => playTrack(pl.tracks[0], pl.tracks, 0)}
                aria-label="Play playlist"
              >
                <Icon name="play" size={14} />
              </button>
            {/if}
            <button
              class="text-mist grid h-9 w-9 shrink-0 place-items-center"
              onclick={() => requestRenamePlaylist(pl)}
              aria-label="Rename playlist"
            >
              <Icon name="pencil" size={16} />
            </button>
            <button
              class="text-mist grid h-9 w-9 shrink-0 place-items-center"
              onclick={() => requestDeletePlaylist(pl)}
              aria-label="Delete playlist"
            >
              <Icon name="trash" size={16} />
            </button>
          </div>

          {#if openId === pl.id}
            <div class="mt-3 space-y-2">
              {#if $currentTrack}
                <button
                  class="glass text-frost flex w-full items-center justify-center gap-2 rounded-xl p-2.5 text-sm font-semibold"
                  onclick={() => addToPlaylist(pl.id, $currentTrack)}
                >
                  <Icon name="plus" size={14} /> Add current track ({$currentTrack.title})
                </button>
              {/if}
              {#if pl.tracks.length > 1}
                <button
                  class="glass flex w-full items-center justify-center gap-2 rounded-xl p-2.5 text-xs font-semibold {reorderList === pl.id ? 'text-frost' : 'text-mist'}"
                  onclick={() => (reorderList = reorderList === pl.id ? null : pl.id)}
                >
                  <Icon name="grip" size={14} />
                  {reorderList === pl.id ? 'Done reordering' : 'Reorder tracks'}
                </button>
              {/if}
              {#each pl.tracks as t, i (t.videoId || t.vaultId || i)}
                <TrackRow
                  track={t}
                  index={i}
                  total={pl.tracks.length}
                  onplay={() => playTrack(t, pl.tracks, i)}
                  ondelete={() => removeFromPlaylist(pl.id, t)}
                  deletelabel="Remove from playlist"
                  reorder={reorderList === pl.id}
                  onmoveup={(idx) => plUp(pl.id, idx)}
                  onmovedown={(idx) => plDown(pl.id, idx, pl.tracks.length)}
                />
              {/each}
              {#if !pl.tracks.length && !$currentTrack}
                <p class="text-mist p-2 text-xs">Play a song, then add it here.</p>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}

  <div class="mb-3 flex items-center justify-between">
    <h2 class="font-display text-mist flex items-center gap-2 text-sm font-semibold tracking-wide uppercase">
      Favorites <Icon name="heart" size={14} filled={true} />
    </h2>
    {#if $favorites.length > 1}
      <button
        class="glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold {reorderList === 'favs' ? 'text-frost' : 'text-mist'}"
        onclick={() => (reorderList = reorderList === 'favs' ? null : 'favs')}
      >
        <Icon name="grip" size={13} />
        {reorderList === 'favs' ? 'Done' : 'Reorder'}
      </button>
    {/if}
  </div>
  {#if $favorites.length}
    <div class="space-y-2 pb-4">
      {#each $favorites as t, i (t.videoId || t.vaultId || i)}
        <TrackRow
          track={t}
          index={i}
          total={$favorites.length}
          onplay={() => playTrack(t, $favorites, i)}
          ondelete={() => toggleFav(t)}
          deletelabel="Remove from favorites"
          reorder={reorderList === 'favs'}
          onmoveup={(idx) => favUp(idx)}
          onmovedown={(idx) => favDown(idx, $favorites.length)}
        />
      {/each}
    </div>
  {:else}
    <p class="text-mist pb-4 text-sm">Tap the heart on any track — or swipe left — to save it here.</p>
  {/if}
</div>
