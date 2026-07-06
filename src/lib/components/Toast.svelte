<script>
  import { fly } from 'svelte/transition'
  import Icon from './Icon.svelte'
  import { toast, hideToast } from '../stores/toast.js'
  import { confirmDialog } from '../stores/ui.js'

  function openInfo() {
    if (!$toast?.info) return
    const info = $toast.info
    hideToast()
    confirmDialog.set({
      title: info.title,
      message: info.body,
      confirmLabel: 'Got it',
      infoOnly: true,
      onconfirm: () => {},
    })
  }

  function dismiss(e) {
    e.stopPropagation()
    hideToast()
  }

  function onKey(e) {
    if (e.key === 'Enter' || e.key === ' ') openInfo()
  }
</script>

{#if $toast}
  <div
    class="fixed top-0 right-0 left-0 z-[90] flex justify-center px-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]"
    transition:fly={{ y: -80, duration: 300 }}
  >
    <div
      class="glass-strong flex w-full max-w-md items-center gap-3 rounded-2xl px-4 py-3 text-left active:scale-[0.99] transition-transform {$toast.info ? 'cursor-pointer' : ''}"
      role="button"
      tabindex="0"
      onclick={openInfo}
      onkeydown={onKey}
    >
      <span class="text-frost shrink-0"><Icon name="snowflake" size={18} /></span>
      <span class="text-ice min-w-0 flex-1 text-sm font-medium">{$toast.message}</span>
      {#if $toast.info}
        <span class="text-mist shrink-0"><Icon name="info" size={16} /></span>
      {:else}
        <span class="text-mist shrink-0" role="button" tabindex="0" onclick={dismiss} onkeydown={dismiss} aria-label="Dismiss">
          <Icon name="x" size={16} />
        </span>
      {/if}
    </div>
  </div>
{/if}
