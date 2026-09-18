<script setup>
import { onMounted } from 'vue';
import SiteHeader from './components/layout/SiteHeader.vue';
import SiteFooter from './components/layout/SiteFooter.vue';
import useAccountStore from './stores/account.vue';

// The login cookie survives a page refresh even though our store's
// state doesn't, so check once on load if we're actually still logged in.
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
