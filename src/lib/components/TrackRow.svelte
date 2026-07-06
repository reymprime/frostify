<script>
  import Icon from './Icon.svelte'
  import { favorites, isFav, toggleFav, trackId } from '../stores/library.js'
  import { currentTrack, isPlaying } from '../stores/player.js'
  import { askConfirm, openTrackSheet } from '../stores/ui.js'

  // Swipe LEFT = favorite • Swipe RIGHT = remove (w/ confirm)
  // Reorder = via up/down arrows sa reorder mode (reliable sa touch)
  const SWIPE_PX = 70

  let {
    track,
    onplay,
    index = -1,
    total = 0,
    ondelete = null,
    deletelabel = 'Delete',
    onswiperight = null,
    reorder = false,
    onmoveup = null,
    onmovedown = null,
  } = $props()

  let fav = $derived(isFav($favorites, track))
  let playing = $derived($currentTrack && trackId($currentTrack) === trackId(track))

  let dx = $state(0)
  let startX = 0
  let startY = 0
  let horiz = false
  let moved = false

  function requestRemove() {
    if (!ondelete) return
    askConfirm({
      title: `${deletelabel}?`,
      message: `"${track.title}" will be removed.`,
      confirmLabel: 'Remove',
      onconfirm: ondelete,
    })
  }

  function down(e) {
    if (reorder) return
    startX = e.clientX
    startY = e.clientY
    dx = 0
    horiz = false
    moved = false
  }

  function moveP(e) {
    if (reorder) return
    const ddx = e.clientX - startX
    const ddy = e.clientY - startY
    if (Math.abs(ddx) > 10 || Math.abs(ddy) > 10) moved = true
    if (!horiz && Math.abs(ddx) > 14 && Math.abs(ddx) > Math.abs(ddy) * 1.4) horiz = true
    if (horiz) dx = Math.max(-110, Math.min(110, ddx))
  }

  function up() {
    if (horiz) {
      if (dx <= -SWIPE_PX) {
        toggleFav(track)
        navigator.vibrate?.(20)
      } else if (dx >= SWIPE_PX) {
        if (onswiperight) {
          onswiperight()
          navigator.vibrate?.(20)
        } else if (ondelete) {
          requestRemove()
        }
      }
    }
    dx = 0
    horiz = false
  }

  function clickCap(e) {
    if (moved) {
      e.stopPropagation()
      e.preventDefault()
    }
  }
</script>

<div class="relative">
  {#if dx < -10}
    <div class="text-frost absolute inset-y-0 right-3 flex items-center" style="opacity: {Math.min(1, -dx / 70)}">
      <Icon name="heart" size={20} filled={true} />
    </div>
  {:else if dx > 10}
    <div class="absolute inset-y-0 left-3 flex items-center {onswiperight ? 'text-frost' : 'text-red-400'}" style="opacity: {Math.min(1, dx / 70)}">
      <Icon name={onswiperight ? 'plus' : 'trash'} size={20} />
    </div>
  {/if}

  <div
    class="glass no-select flex items-center gap-2 rounded-xl p-2 transition-transform
           {playing ? 'border-frost/50 shadow-frost/10 shadow-lg' : ''}
           {reorder ? 'border-frost/40' : ''}"
    style="transform: translateX({dx}px); touch-action: pan-y;"
    onpointerdown={down}
    onpointermove={moveP}
    onpointerup={up}
    onpointercancel={up}
    onclickcapture={clickCap}
  >
    <button class="flex min-w-0 flex-1 items-center gap-3 text-left" onclick={onplay}>
      {#if track.art}
        <img src={track.art} alt="" class="h-12 w-12 shrink-0 rounded-lg object-cover" loading="lazy" />
      {:else}
        <div class="bg-glacier text-frost grid h-12 w-12 shrink-0 place-items-center rounded-lg">
          <Icon name="music" size={20} />
        </div>
      {/if}
      <div class="min-w-0 flex-1">
        <p class="font-display flex items-center gap-1.5 truncate text-sm font-semibold {playing ? 'text-frost' : ''}">
          {#if fav}<span class="text-frost shrink-0"><Icon name="heart" size={11} filled={true} /></span>{/if}
          <span class="truncate">{track.title}</span>
        </p>
        <p class="text-mist truncate text-xs">
          {#if playing}
            <span class="text-frost">{$isPlaying ? 'Now Playing' : 'Not Playing'}</span> •
          {/if}
          {track.artist}
        </p>
      </div>
    </button>

    {#if reorder}
      <button
        class="text-frost disabled:text-mist/30 grid h-9 w-9 shrink-0 place-items-center"
        onclick={() => onmoveup?.(index)}
        disabled={index === 0}
        aria-label="Move up"
      >
        <Icon name="chevron-up" size={20} />
      </button>
      <button
        class="text-frost disabled:text-mist/30 grid h-9 w-9 shrink-0 place-items-center"
        onclick={() => onmovedown?.(index)}
        disabled={index === total - 1}
        aria-label="Move down"
      >
        <Icon name="chevron-down" size={20} />
      </button>
    {:else}
      <button
        class="text-mist grid h-10 w-10 shrink-0 place-items-center"
        onclick={() => openTrackSheet(track, ondelete, deletelabel)}
        aria-label="More actions"
      >
        <Icon name="more" size={19} />
      </button>
    {/if}
  </div>
</div>
