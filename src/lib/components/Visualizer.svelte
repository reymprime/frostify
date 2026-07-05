<script>
  import { onMount } from 'svelte'
  import { getAnalyser } from '../stores/audiofx.js'
  import { isPlaying, activeEngine } from '../stores/player.js'

  let canvas = $state(null)
  let raf = null

  onMount(() => {
    const ctx = canvas.getContext('2d')

    function draw() {
      raf = requestAnimationFrame(draw)
      const analyser = getAnalyser()
      const w = canvas.width
      const h = canvas.height
      ctx.clearRect(0, 0, w, h)
      if (!analyser || $activeEngine !== 'local' || !$isPlaying) return

      const data = new Uint8Array(analyser.frequencyBinCount)
      analyser.getByteFrequencyData(data)

      // Symmetrical: low freqs sa gitna, mirrored palabas
      const half = 16
      const step = Math.floor(data.length / half)
      const bw = w / (half * 2)
      const cx = w / 2

      for (let i = 0; i < half; i++) {
        const v = data[i * step] / 255
        const bh = Math.max(2, v * h)
        const grad = ctx.createLinearGradient(0, h - bh, 0, h)
        grad.addColorStop(0, 'rgba(125, 211, 252, 0.9)')
        grad.addColorStop(1, 'rgba(139, 157, 255, 0.25)')
        ctx.fillStyle = grad
        // Kanan ng gitna
        ctx.beginPath()
        ctx.roundRect(cx + i * bw + 1.5, h - bh, bw - 3, bh, 2)
        ctx.fill()
        // Kaliwa ng gitna (mirror)
        ctx.beginPath()
        ctx.roundRect(cx - (i + 1) * bw + 1.5, h - bh, bw - 3, bh, 2)
        ctx.fill()
      }
    }
    draw()
    return () => cancelAnimationFrame(raf)
  })
</script>

<canvas bind:this={canvas} width="320" height="56" class="h-14 w-full"></canvas>
