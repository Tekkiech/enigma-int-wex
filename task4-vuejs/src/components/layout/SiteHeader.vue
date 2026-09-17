<script setup>
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import useCatalogStore from '../../stores/catalog.vue';

const catalog = useCatalogStore();
const route = useRoute();
const router = useRouter();

// The search box lives in the header so it's reachable from any page —
// typing here always searches the whole catalogue, not just whatever
// category is currently open.
const searchValue = ref(route.name === 'search' ? String(route.query.q || '') : '');
let debounceTimer;

watch(searchValue, (value) => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    if (value.trim()) router.push({ name: 'search', query: { q: value } });
  }, 300);
});

// Keep the box in sync if the search query changes some other way, e.g.
// the browser's back/forward buttons, and clear it when the user leaves
// the search page some other way (a nav link, the logo, a product card).
watch(
  () => route.name,
  (name) => {
    if (name === 'search') searchValue.value = String(route.query.q || '');
    else searchValue.value = '';
  }
);
</script>

<template>
  <header class="site-header">
    <div class="site-header__row">
      <RouterLink to="/" class="site-header__logo">TEKKIECH.MARKET</RouterLink>

      <nav class="site-header__nav">
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/deals">Deals</RouterLink>
        <RouterLink to="/metrics">Metrics</RouterLink>
        <RouterLink to="/support">Support</RouterLink>
        <RouterLink to="/account">Account</RouterLink>
      </nav>

      <label class="site-header__search">
        <span>Search</span>
        <input v-model="searchValue" type="text" placeholder="find a product" />
      </label>

      <div class="site-header__actions">
        <RouterLink to="/saved" class="site-header__saved">
          <span>Saved</span>
          <span class="site-header__saved-count">{{ catalog.savedProducts.length }}</span>
        </RouterLink>
        <RouterLink to="/cart" class="site-header__cart">
          <span>Cart</span>
          <span class="site-header__cart-count">{{ catalog.cartCount }}</span>
        </RouterLink>
      </div>
    </div>
  </header>
</template>
