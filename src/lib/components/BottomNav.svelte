<script>
  import Icon from './Icon.svelte'

  let { active = 'home', onnavigate } = $props()

  const tabs = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'search', label: 'Search', icon: 'search' },
    { id: 'library', label: 'Library', icon: 'library' },
    { id: 'vault', label: 'Vault', icon: 'snowflake' },
  ]
</script>

<nav class="glass mx-3 mb-3 flex justify-around rounded-2xl py-2">
  {#each tabs as tab}
    <button
      class="flex flex-col items-center gap-1 px-4 py-1 transition-colors
             {active === tab.id ? 'text-frost' : 'text-mist'}"
      onclick={() => onnavigate?.(tab.id)}
      aria-label={tab.label}
      aria-current={active === tab.id ? 'page' : undefined}
    >
      <Icon name={tab.icon} size={20} />
      <span class="text-[10px] font-medium">{tab.label}</span>
    </button>
  {/each}
</nav>
