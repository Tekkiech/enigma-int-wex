<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCatalogStore } from '../../stores/catalog.js';

const catalog = useCatalogStore();
const route = useRoute();
const router = useRouter();

// The search box lives in the header so it's reachable from the product
// detail page too — typing there jumps back to the list so results show.
const searchValue = computed({
  get: () => catalog.query,
  set(value) {
    catalog.setQuery(value);
    if (route.name !== 'products') router.push('/');
  },
});
</script>

<template>
  <header class="site-header">
    <div class="site-header__row">
      <RouterLink to="/" class="site-header__logo">TEKKIECH.MARKET</RouterLink>

      <nav class="site-header__nav">
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/" class="is-active">Groceries</RouterLink>
        <a href="#" @click.prevent>Deals</a>
        <a href="#" @click.prevent>Account</a>
      </nav>

      <label class="site-header__search">
        <span>Search</span>
        <input v-model="searchValue" type="text" placeholder="find a product" />
      </label>

      <div class="site-header__actions">
        <span class="site-header__saved">Saved</span>
        <RouterLink to="/cart" class="site-header__cart">
          <span>Cart</span>
          <span class="site-header__cart-count">{{ catalog.cartCount }}</span>
        </RouterLink>
      </div>
    </div>
  </header>
</template>
