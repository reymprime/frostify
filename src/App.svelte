<script>
  import TopBar from './lib/components/TopBar.svelte'
  import AlbumCard from './lib/components/AlbumCard.svelte'
  import NowPlayingBar from './lib/components/NowPlayingBar.svelte'
  import BottomNav from './lib/components/BottomNav.svelte'
  import { currentTrack, isPlaying } from './lib/stores/player.js'

  let activeTab = $state('home')

  // Mock data muna — papalitan ito ng YouTube search / Firestore later
  const playlists = [
    { title: 'Ice Drive', artist: 'Late night synths', art: 'https://picsum.photos/seed/frost2/400' },
    { title: 'Glacier Lo-fi', artist: 'Focus beats', art: 'https://picsum.photos/seed/frost3/400' },
    { title: 'OPM Chill', artist: 'Hugot classics', art: 'https://picsum.photos/seed/frost4/400' },
    { title: 'Aurora Nights', artist: 'Ambient sleep', art: 'https://picsum.photos/seed/frost5/400' },
  ]

  function playTrack(p) {
    currentTrack.set({ title: p.title, artist: p.artist, art: p.art })
    isPlaying.set(true)
  }
</script>

<div class="aurora"></div>

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
    <NowPlayingBar />
    <BottomNav active={activeTab} onnavigate={(t) => (activeTab = t)} />
  </footer>
</div>
