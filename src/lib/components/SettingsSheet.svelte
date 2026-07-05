<script>
  import { fly, fade } from 'svelte/transition'
  import Icon from './Icon.svelte'
  import { settingsOpen } from '../stores/ui.js'
  import { favorites, recents, playlists } from '../stores/library.js'
  import { eqGains, setBand } from '../stores/audiofx.js'

  let fileInput = $state(null)
  let status = $state('')

  function exportBackup() {
    const data = {
      app: 'Frostify',
      version: 1,
      exportedAt: new Date().toISOString(),
      favorites: $favorites,
      recents: $recents,
      playlists: $playlists,
      eq: $eqGains,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `frostify-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    status = 'Backup exported ✓'
  }

  async function importBackup(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const data = JSON.parse(await file.text())
      if (data.app !== 'Frostify') throw new Error('Not a Frostify backup file')
      if (Array.isArray(data.favorites)) favorites.set(data.favorites)
      if (Array.isArray(data.recents)) recents.set(data.recents)
      if (Array.isArray(data.playlists)) playlists.set(data.playlists)
      if (Array.isArray(data.eq)) data.eq.forEach((db, i) => setBand(i, db))
      status = 'Backup restored ✓'
    } catch (err) {
      status = `Import failed: ${err.message}`
    }
    e.target.value = ''
  }
</script>

{#if $settingsOpen}
  <div class="fixed inset-0 z-[75] bg-black/50" transition:fade={{ duration: 150 }} onclick={() => settingsOpen.set(false)}></div>
  <div
    class="glass-strong fixed right-3 bottom-3 left-3 z-[76] max-h-[80vh] overflow-y-auto rounded-3xl p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]"
    transition:fly={{ y: 300, duration: 280 }}
  >
    <div class="mb-3 flex items-center justify-between px-1">
      <h2 class="font-display flex items-center gap-2 text-lg font-bold">
        <Icon name="settings" size={18} /> Settings
      </h2>
      <button class="text-mist grid h-9 w-9 place-items-center" onclick={() => settingsOpen.set(false)} aria-label="Close">
        <Icon name="x" size={18} />
      </button>
    </div>

    <!-- Backup -->
    <p class="font-display text-mist mb-2 px-1 text-xs font-semibold tracking-wide uppercase">
      Support & Backup
    </p>
    <div class="mb-2 space-y-2">
      <button class="glass text-frost flex w-full items-center gap-3 rounded-2xl p-4 text-sm font-semibold" onclick={exportBackup}>
        <Icon name="download" size={18} /> Export backup (JSON)
      </button>
      <input type="file" accept="application/json" class="hidden" bind:this={fileInput} onchange={importBackup} />
      <button class="glass text-frost flex w-full items-center gap-3 rounded-2xl p-4 text-sm font-semibold" onclick={() => fileInput.click()}>
        <Icon name="upload" size={18} /> Import backup
      </button>
    </div>
    <p class="text-mist mb-4 px-1 text-xs">
      Kasama: favorites, recents, playlists, EQ settings. Ang Vault audio files ay naka-device lang — hindi kasama sa JSON backup.
    </p>
    {#if status}
      <p class="text-frost mb-4 px-1 text-xs font-semibold">{status}</p>
    {/if}

    <!-- Info -->
    <p class="font-display text-mist mb-2 px-1 text-xs font-semibold tracking-wide uppercase">
      About Frostify
    </p>
    <div class="glass rounded-2xl p-4 text-sm">
      <div class="mb-2 flex items-center gap-2">
        <span class="text-frost"><Icon name="snowflake" size={18} /></span>
        <span class="font-display font-bold">Frostify</span>
        <span class="text-mist text-xs">v4.0 Obsidian</span>
      </div>
      <p class="text-mist text-xs leading-relaxed">
        Music, frozen in time. A dual-engine music PWA — YouTube streaming +
        offline Vault — with EQ, visualizer, sleep timer, and gesture controls.
        <br /><br />
        Built by <span class="text-ice font-semibold">Reymark Delagao (Gnokz)</span> —
        crafted entirely on mobile with Svelte, Vite & Tailwind, deployed via
        GitHub Actions.
      </p>
    </div>
  </div>
{/if}
