<script>
  import { onMount } from 'svelte'
  import HomeView from './lib/components/HomeView.svelte'
  import SearchView from './lib/components/SearchView.svelte'
  import LibraryView from './lib/components/LibraryView.svelte'
  import VaultView from './lib/components/VaultView.svelte'
  import NowPlayingBar from './lib/components/NowPlayingBar.svelte'
  import NowPlaying from './lib/components/NowPlaying.svelte'
  import BottomNav from './lib/components/BottomNav.svelte'
  import Overlays from './lib/components/Overlays.svelte'
  import SettingsSheet from './lib/components/SettingsSheet.svelte'
  import { initPlayer, showVideo } from './lib/stores/player.js'

  let activeTab = $state('home')
  let showNowPlaying = $state(false)

  onMount(() => {
    initPlayer()
  })
</script>

<div class="aurora"></div>

<!-- YouTube engine — hidden by default, lumalabas sa "watch mode" (eye) -->
<div
  class={$showVideo
     ?'glass fixed top-20 left-1/2 z-[60] aspect-video w-[92%] max-w-sm -translate-x-1/2 overflow-hidden rounded-2xl shadow-2xl'
    : 'pointer-events-none fixed right-0 bottom-0 h-px w-px opacity-0'}
  aria-hidden={!$showVideo}
>
  <div id="yt-player"></div>
</div>

<div class="mx-auto flex h-dvh max-w-md flex-col">
  <main class="flex-1 overflow-y-auto pt-6 pb-4">
    {#if activeTab === 'home'}
      <HomeView gotosearch={() => (activeTab = 'search')} />
    {:else if activeTab === 'search'}
      <SearchView />
    {:else if activeTab === 'library'}
      <LibraryView />
    {:else if activeTab === 'vault'}
      <VaultView />
    {/if}
  </main>

  <footer class="shrink-0 space-y-2 pb-[env(safe-area-inset-bottom)]">
    <NowPlayingBar onexpand={() => (showNowPlaying = true)} />
    <BottomNav active={activeTab} onnavigate={(t) => (activeTab = t)} />
  </footer>
</div>

{#if showNowPlaying}
  <NowPlaying onclose={() => (showNowPlaying = false)} />
{/if}

<Overlays />
<SettingsSheet />
