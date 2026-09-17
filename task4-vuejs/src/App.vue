<script setup>
import { onMounted } from 'vue';
import SiteHeader from './components/layout/SiteHeader.vue';
import SiteFooter from './components/layout/SiteFooter.vue';
import { useAccountStore } from './stores/account.js';

// The Flask session cookie can outlive a page refresh even though this
// store's state can't - check once, up front, whether we're already
// signed in rather than defaulting every reload back to guest state.
onMounted(() => useAccountStore().restoreSession());
</script>

<template>
  <div class="app-shell">
    <SiteHeader />
    <main class="app-main">
      <router-view />
    </main>
    <SiteFooter />
  </div>
</template>
