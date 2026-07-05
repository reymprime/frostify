<script>
  import { onMount } from 'svelte'
  import TopBar from './lib/components/TopBar.svelte'
  import AlbumCard from './lib/components/AlbumCard.svelte'
  import NowPlayingBar from './lib/components/NowPlayingBar.svelte'
  import NowPlaying from './lib/components/NowPlaying.svelte'
  import BottomNav from './lib/components/BottomNav.svelte'
  import { initPlayer, playTrack } from './lib/stores/player.js'

  let activeTab = $state('home')
  let showNowPlaying = $state(false)

  onMount(() => {
    initPlayer()
  })

  // PALITAN mo ang videoId ng sarili mong YouTube picks!
  // Kunin sa URL: youtube.com/watch?v=VIDEO_ID
  const playlists = [
    {
      title: 'Ice Drive',
      artist: 'Late night synths',
      art: 'https://picsum.photos/seed/frost2/400',
      videoId: 'jfKfPfyJRdk',
    },
    {
      title: 'Glacier Lo-fi',
      artist: 'Focus beats',
      art: 'https://picsum.photos/seed/frost3/400',
      videoId: 'M7lc1UVf-VE',
    },
    {
      title: 'OPM Chill',
      artist: 'Hugot classics',
      art: 'https://picsum.photos/seed/frost4/400',
      videoId: 'kJQP7kiw5Fk',
    },
    {
      title: 'Aurora Nights',
      artist: 'Ambient sleep',
      art: 'https://picsum.photos/seed/frost5/400',
      videoId: '9bZkp7q19f0',
    },
  ]
</script>

<div class="aurora"></div>

<!-- Hidden YouTube engine — huwag itong tanggalin! -->
<div class="pointer-events-none fixed right-0 bottom-0 h-px w-px opacity-0" aria-hidden="true">
  <div id="yt-player"></div>
</div>

<div class="mx-auto flex h-dvh max-w-md flex-col">
  <TopBar />

  <main class="flex-1 overflow-y-auto px-5 pb-4">
    <h2 class="font-display text-mist mb-3 text-sm font-semibold tracking-wide uppercase">
      Made for you
    </h2>
    <div class="-mx-5 flex gap-3 overflow-x-auto px-5 pb-2">
      {#each playlists as p}
        <AlbumCard {...p} onplay={() => playTrack(p)} />
      {/each}
    </div>

    <h2 class="font-display text-mist mt-6 mb-3 text-sm font-semibold tracking-wide uppercase">
      Recently played
    </h2>
    <div class="grid grid-cols-2 gap-3">
      {#each playlists.slice().reverse() as p}
        <AlbumCard {...p} onplay={() => playTrack(p)} />
      {/each}
    </div>
  </main>

  <footer class="shrink-0 space-y-2 pb-[env(safe-area-inset-bottom)]">
    <NowPlayingBar onexpand={() => (showNowPlaying = true)} />
    <BottomNav active={activeTab} onnavigate={(t) => (activeTab = t)} />
  </footer>
</div>

{#if showNowPlaying}
  <NowPlaying onclose={() => (showNowPlaying = false)} />
{/if}
