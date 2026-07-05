<script>
  import { fly, fade } from 'svelte/transition'
  import Icon from './Icon.svelte'
  import {
    confirmDialog,
    promptDialog,
    trackSheet,
    playlistPicker,
    askPrompt,
  } from '../stores/ui.js'
  import {
    playlists,
    createPlaylist,
    addToPlaylist,
    renameTrackEverywhere,
    trackId,
  } from '../stores/library.js'
  import { renameVaultTrack } from '../stores/vault.js'
  import { addToQueue, currentTrack, updateCurrentTitle } from '../stores/player.js'

  let promptValue = $state('')

  $effect(() => {
    if ($promptDialog) promptValue = $promptDialog.value || ''
  })

  function confirmYes() {
    $confirmDialog?.onconfirm?.()
    confirmDialog.set(null)
  }

  function promptSubmit() {
    if (promptValue.trim()) $promptDialog?.onsubmit?.(promptValue.trim())
    promptDialog.set(null)
  }

  // ── Track sheet actions ─────────────────────────────────
  function sheetQueue() {
    addToQueue($trackSheet.track)
    trackSheet.set(null)
  }

  function sheetPlaylist() {
    playlistPicker.set($trackSheet.track)
    trackSheet.set(null)
  }

  function sheetRename() {
    const t = $trackSheet.track
    trackSheet.set(null)
    askPrompt({
      title: 'Rename track',
      placeholder: 'New title…',
      value: t.title,
      onsubmit: (title) => {
        renameTrackEverywhere(t, title)
        if (t.vaultId) renameVaultTrack(t.vaultId, title)
        if ($currentTrack && trackId($currentTrack) === trackId(t)) updateCurrentTitle(title)
      },
    })
  }

  async function sheetCopyLink() {
    const t = $trackSheet.track
    try {
      await navigator.clipboard.writeText(`https://youtu.be/${t.videoId}`)
    } catch {}
    trackSheet.set(null)
  }

  function sheetOpenYT() {
    const t = $trackSheet.track
    window.open(`https://youtu.be/${t.videoId}`, '_blank')
    trackSheet.set(null)
  }

  function sheetDelete() {
    const s = $trackSheet
    trackSheet.set(null)
    confirmDialog.set({
      title: 'Delete track?',
      message: `Remove "${s.track.title}" from this list?`,
      confirmLabel: 'Delete',
      onconfirm: s.ondelete,
    })
  }

  // ── Playlist picker ─────────────────────────────────────
  function pick(pl) {
    addToPlaylist(pl.id, $playlistPicker)
    playlistPicker.set(null)
  }

  function pickNew() {
    const t = $playlistPicker
    playlistPicker.set(null)
    askPrompt({
      title: 'New playlist',
      placeholder: 'Playlist name…',
      onsubmit: (name) => {
        const pl = createPlaylist(name)
        addToPlaylist(pl.id, t)
      },
    })
  }
</script>

<!-- Confirm dialog -->
{#if $confirmDialog}
  <div class="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 px-8" transition:fade={{ duration: 150 }}>
    <div class="glass w-full max-w-xs rounded-3xl p-5" transition:fly={{ y: 20, duration: 200 }}>
      <h3 class="font-display mb-1 text-lg font-bold">{$confirmDialog.title}</h3>
      <p class="text-mist mb-5 text-sm">{$confirmDialog.message}</p>
      <div class="flex gap-2">
        <button class="glass flex-1 rounded-full py-2.5 text-sm font-semibold" onclick={() => confirmDialog.set(null)}>
          Cancel
        </button>
        <button class="flex-1 rounded-full bg-red-400/90 py-2.5 text-sm font-bold text-black" onclick={confirmYes}>
          {$confirmDialog.confirmLabel || 'Confirm'}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Prompt dialog -->
{#if $promptDialog}
  <div class="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 px-8" transition:fade={{ duration: 150 }}>
    <div class="glass w-full max-w-xs rounded-3xl p-5" transition:fly={{ y: 20, duration: 200 }}>
      <h3 class="font-display mb-3 text-lg font-bold">{$promptDialog.title}</h3>
      <input
        type="text"
        placeholder={$promptDialog.placeholder}
        bind:value={promptValue}
        onkeydown={(e) => e.key === 'Enter' && promptSubmit()}
        class="glass text-ice placeholder:text-mist mb-4 w-full rounded-full px-4 py-2.5 text-sm outline-none"
      />
      <div class="flex gap-2">
        <button class="glass flex-1 rounded-full py-2.5 text-sm font-semibold" onclick={() => promptDialog.set(null)}>
          Cancel
        </button>
        <button class="bg-frost text-ink flex-1 rounded-full py-2.5 text-sm font-bold" onclick={promptSubmit}>
          Save
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Track action sheet -->
{#if $trackSheet}
  <div class="fixed inset-0 z-[75] bg-black/50" transition:fade={{ duration: 150 }} onclick={() => trackSheet.set(null)}></div>
  <div
    class="glass fixed right-3 bottom-3 left-3 z-[76] rounded-3xl p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]"
    transition:fly={{ y: 200, duration: 250 }}
  >
    <p class="font-display text-mist truncate px-3 pt-1 pb-2 text-xs font-semibold tracking-wide uppercase">
      {$trackSheet.track.title}
    </p>
    <button class="text-ice flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm" onclick={sheetQueue}>
      <Icon name="queue" size={18} /> Add to queue
    </button>
    <button class="text-ice flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm" onclick={sheetPlaylist}>
      <Icon name="plus" size={18} /> Add to playlist
    </button>
    <button class="text-ice flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm" onclick={sheetRename}>
      <Icon name="pencil" size={18} /> Rename
    </button>
    {#if $trackSheet.track.videoId}
      <button class="text-ice flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm" onclick={sheetCopyLink}>
        <Icon name="link" size={18} /> Copy YouTube link
      </button>
      <button class="text-ice flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm" onclick={sheetOpenYT}>
        <Icon name="external" size={18} /> Open on YouTube
      </button>
    {/if}
    {#if $trackSheet.ondelete}
      <button class="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-red-400" onclick={sheetDelete}>
        <Icon name="trash" size={18} /> Delete
      </button>
    {/if}
  </div>
{/if}

<!-- Playlist picker -->
{#if $playlistPicker}
  <div class="fixed inset-0 z-[75] bg-black/50" transition:fade={{ duration: 150 }} onclick={() => playlistPicker.set(null)}></div>
  <div
    class="glass fixed right-3 bottom-3 left-3 z-[76] max-h-[60vh] overflow-y-auto rounded-3xl p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]"
    transition:fly={{ y: 200, duration: 250 }}
  >
    <p class="font-display text-mist px-3 pt-1 pb-2 text-xs font-semibold tracking-wide uppercase">
      Add to playlist
    </p>
    <button class="text-frost flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold" onclick={pickNew}>
      <Icon name="plus" size={18} /> New playlist…
    </button>
    {#each $playlists as pl (pl.id)}
      <button class="text-ice flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm" onclick={() => pick(pl)}>
        <Icon name="music" size={18} />
        <span class="min-w-0 flex-1 truncate text-left">{pl.name}</span>
        <span class="text-mist text-xs">{pl.tracks.length}</span>
      </button>
    {/each}
  </div>
{/if}
