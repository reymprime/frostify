<script>
  let { active = 'home', onnavigate } = $props()

  const tabs = [
    { id: 'home', label: 'Home', icon: '⌂' },
    { id: 'search', label: 'Search', icon: '⌕' },
    { id: 'library', label: 'Library', icon: '♫' },
    { id: 'vault', label: 'Vault', icon: '❄' },
  ]
</script>

<nav class="glass mx-3 mb-3 flex justify-around rounded-2xl py-2">
  {#each tabs as tab}
    <button
      class="flex flex-col items-center gap-0.5 px-4 py-1 text-lg transition-colors
             {active === tab.id ? 'text-frost' : 'text-mist'}"
      onclick={() => onnavigate?.(tab.id)}
      aria-label={tab.label}
      aria-current={active === tab.id ? 'page' : undefined}
    >
      <span>{tab.icon}</span>
      <span class="text-[10px] font-medium">{tab.label}</span>
    </button>
  {/each}
</nav>
