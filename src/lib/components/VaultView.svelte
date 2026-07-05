<script>
  import { onMount } from 'svelte'
  import TrackRow from './TrackRow.svelte'
  import { vaultTracks, refreshVault, addFilesToVault, deleteFromVault } from '../stores/vault.js'
  import { playTrack } from '../stores/player.js'

  let fileInput = $state(null)
  let importing = $state(false)

  onMount(refreshVault)

  async function onFiles(e) {
    const files = e.target.files
    if (!files?.length) return
    importing = true
    await addFilesToVault(files)
    importing = false
    e.target.value = ''
  }
</script>

<div class="px-5">
  <h1 class="font-display mb-1 text-2xl font-bold tracking-tight">Vault ❄</h1>
  <p class="text-mist mb-4 text-sm">
    Your own audio files, frozen safely on-device. Works fully offline.
  </p>

  <input
    type="file"
    accept="audio/*"
    multiple
    class="hidden"
    bind:this={fileInput}
    onchange={onFiles}
  />
  <button
    class="glass text-frost mb-5 w-full rounded-2xl p-4 text-sm font-semibold active:scale-[0.98] transition-transform"
    onclick={() => fileInput.click()}
  >
    {importing ? 'Freezing files…' : '＋ Add audio files to Vault'}
  </button>

  <div class="space-y-2 pb-4">
    {#each $vaultTracks as t (t.vaultId)}
      <div class="flex items-center gap-2">
        <div class="min-w-0 flex-1">
          <TrackRow track={t} onplay={() => playTrack(t, $vaultTracks, $vaultTracks.indexOf(t))} />
        </div>
        <button
          class="text-mist grid h-9 w-9 shrink-0 place-items-center"
          onclick={() => deleteFromVault(t.vaultId)}
          aria-label="Delete from vault"
        >
          ✕
        </button>
      </div>
    {/each}
  </div>

  {#if !$vaultTracks.length && !importing}
    <p class="text-mist text-sm">Empty pa ang vault. Add your mp3/m4a files above.</p>
  {/if}
</div>
