<script>
  import Icon from './Icon.svelte'
  import { favorites, isFav, toggleFav, trackId } from '../stores/library.js'
  import { currentTrack, isPlaying } from '../stores/player.js'
  import { askConfirm, openTrackSheet } from '../stores/ui.js'

  // Gestures: swipe LEFT = favorite • swipe RIGHT = delete (w/ confirm)
  // 3s HOLD = reorder mode (kung may onhold ang parent list)
  const HOLD_MS = 3000
  const SWIPE_PX = 70

  let {
    track,
    onplay,
    index = -1,
    ondelete = null,
    reorder = false,
    onhold = null,
    onreorder = null,
  } = $props()

  let fav = $derived(isFav($favorites, track))
  let playing = $derived($currentTrack && trackId($currentTrack) === trackId(track))

  let el = $state(null)
  let dx = $state(0)
  let dragY = $state(0)
  let dragging = $state(false)

  let startX = 0
  let startY = 0
  let holdTimer = null
  let horiz = false
  let moved = false

  function down(e) {
    if (reorder) return
    startX = e.clientX
    startY = e.clientY
    dx = 0
    horiz = false
    moved = false
    if (onhold) {
      holdTimer = setTimeout(() => {
        onhold()
        navigator.vibrate?.(40)
      }, HOLD_MS)
    }
  }

  function moveP(e) {
    if (reorder) return
    const ddx = e.clientX - startX
    const ddy = e.clientY - startY
    if (Math.abs(ddx) > 10 || Math.abs(ddy) > 10) {
      moved = true
      clearTimeout(holdTimer)
    }
    if (!horiz && Math.abs(ddx) > 14 && Math.abs(ddx) > Math.abs(ddy) * 1.4) horiz = true
    if (horiz) dx = Math.max(-110, Math.min(110, ddx))
  }

  function up() {
    clearTimeout(holdTimer)
    if (horiz) {
      if (dx <= -SWIPE_PX) {
        toggleFav(track)
        navigator.vibrate?.(20)
      } else if (dx >= SWIPE_PX && ondelete) {
        askConfirm({
          title: 'Delete track?',
          message: `Remove "${track.title}" from this list?`,
          confirmLabel: 'Delete',
          onconfirm: ondelete,
        })
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

  // ── Reorder drag (via grip, sa reorder mode) ──────────────
  let gStartY = 0
  function gdown(e) {
    dragging = true
    gStartY = e.clientY
    e.target.setPointerCapture?.(e.pointerId)
  }
  function gmove(e) {
    if (!dragging) return
    dragY = e.clientY - gStartY
  }
  function gup() {
    if (!dragging) return
    const rowH = (el?.offsetHeight || 60) + 8
    const slots = Math.round(dragY / rowH)
    if (slots !== 0 && onreorder) onreorder(index, index + slots)
    dragging = false
    dragY = 0
  }

  function requestDelete() {
    if (!ondelete) return
    askConfirm({
      title: 'Delete track?',
      message: `Remove "${track.title}" from this list?`,
      confirmLabel: 'Delete',
      onconfirm: ondelete,
    })
  }
</script>

<div class="relative" bind:this={el} style={dragging ? `transform: translateY(${dragY}px); z-index: 30; position: relative;` : ''}>
  <!-- Swipe hint backgrounds -->
  {#if dx < -10}
    <div class="text-frost absolute inset-y-0 right-3 flex items-center" style="opacity: {Math.min(1, -dx / 70)}">
      <Icon name="heart" size={20} filled={true} />
    </div>
  {:else if dx > 10}
    <div class="absolute inset-y-0 left-3 flex items-center text-red-400" style="opacity: {Math.min(1, dx / 70)}">
      <Icon name="trash" size={20} />
    </div>
  {/if}

  <div
    class="glass flex items-center gap-2 rounded-xl p-2 transition-transform
           {playing ? 'border-frost/50 shadow-frost/10 shadow-lg' : ''}
           {dragging ? 'border-frost/60' : ''}"
    style="transform: translateX({dx}px); touch-action: pan-y;"
    onpointerdown={down}
    onpointermove={moveP}
    onpointerup={up}
    onpointercancel={up}
    onclickcapture={clickCap}
  >
    {#if reorder}
      <button
        class="text-frost grid h-9 w-8 shrink-0 cursor-grab place-items-center active:cursor-grabbing"
        style="touch-action: none;"
        onpointerdown={gdown}
        onpointermove={gmove}
        onpointerup={gup}
        onpointercancel={gup}
        aria-label="Drag to reorder"
      >
        <Icon name="grip" size={18} />
      </button>
    {/if}

    <button class="flex min-w-0 flex-1 items-center gap-3 text-left" onclick={onplay}>
      {#if track.art}
        <img src={track.art} alt="" class="h-12 w-12 shrink-0 rounded-lg object-cover" loading="lazy" />
      {:else}
        <div class="bg-glacier text-frost grid h-12 w-12 shrink-0 place-items-center rounded-lg">
          <Icon name="music" size={20} />
        </div>
      {/if}
      <div class="min-w-0 flex-1">
        <p class="font-display truncate text-sm font-semibold {playing ? 'text-frost' : ''}">
          {track.title}
        </p>
        <p class="text-mist truncate text-xs">
          {#if playing}
            <span class="text-frost">{$isPlaying ? 'Now Playing' : 'Not Playing'}</span> •
          {/if}
          {track.artist}
        </p>
      </div>
    </button>

    {#if !reorder}
      <button
        class="grid h-9 w-9 shrink-0 place-items-center {fav ? 'text-frost' : 'text-mist'}"
        onclick={() => toggleFav(track)}
        aria-label="Favorite"
      >
        <Icon name="heart" size={18} filled={fav} />
      </button>

      {#if ondelete}
        <button
          class="text-mist grid h-9 w-9 shrink-0 place-items-center"
          onclick={requestDelete}
          aria-label="Delete"
        >
          <Icon name="trash" size={17} />
        </button>
      {/if}

      <button
        class="text-mist grid h-9 w-9 shrink-0 place-items-center"
        onclick={() => openTrackSheet(track, ondelete)}
        aria-label="More actions"
      >
        <Icon name="more" size={18} />
      </button>
    {/if}
  </div>
</div>
