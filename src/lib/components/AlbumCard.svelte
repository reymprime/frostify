<script>
  let { title, artist, art, onplay } = $props()
</script>

<button class="glass group w-40 shrink-0 rounded-2xl p-3 text-left" onclick={onplay}>
  <img
    src={art}
    alt={title}
    class="mb-3 aspect-square w-full rounded-xl object-cover"
    loading="lazy"
  />
  <p class="font-display truncate text-sm font-semibold">{title}</p>
  <p class="text-mist truncate text-xs">{artist}</p>
</button>
