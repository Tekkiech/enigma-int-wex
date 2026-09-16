<script setup>
import { onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { useCatalogStore } from '../stores/catalog.js';
import LoadingState from '../components/common/LoadingState.vue';
import ErrorState from '../components/common/ErrorState.vue';

const catalog = useCatalogStore();
onMounted(() => catalog.fetchProducts());
</script>

<template>
  <div class="home-view">
    <section class="home-hero">
      <h1>Everything from Tekkiech.Market</h1>
      <p>{{ catalog.products.length }} products across {{ catalog.categories.length }} categories, all from the DummyJSON catalogue.</p>
    </section>

    <LoadingState v-if="catalog.loading" label="Loading categories…" />
    <ErrorState v-else-if="catalog.error" :message="catalog.error" @retry="catalog.fetchProducts" />

    <section v-else class="category-grid">
      <RouterLink
        v-for="category in catalog.categories"
        :key="category.slug"
        :to="{ name: 'category', params: { slug: category.slug } }"
        class="category-tile"
      >
        <span class="category-tile__name">{{ category.name }}</span>
        <span class="category-tile__count">{{ category.count }} items</span>
      </RouterLink>
    </section>
  </div>
</template>
