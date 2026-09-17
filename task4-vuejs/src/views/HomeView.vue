<script setup>
import { computed, onMounted, ref } from 'vue';
import useCatalogStore from '../stores/catalog.vue';
import CategoryTile from '../components/home/CategoryTile.vue';
import LoadingState from '../components/common/LoadingState.vue';
import ErrorState from '../components/common/ErrorState.vue';
import EmptyState from '../components/common/EmptyState.vue';

const catalog = useCatalogStore();
onMounted(() => catalog.fetchProducts());

const tileQuery = ref('');
const filteredCategories = computed(() => {
  const query = tileQuery.value.trim().toLowerCase();
  if (!query) return catalog.categories;
  return catalog.categories.filter((category) => category.name.toLowerCase().includes(query));
});
</script>

<template>
  <div class="home-view">
    <section class="home-hero">
      <h1>Everything from Tekkiech.Market</h1>
      <label class="home-hero__search field">
        <span class="field__label">Search categories</span>
        <input v-model="tileQuery" type="text" placeholder="e.g. smartphones, furniture" />
      </label>
    </section>

    <LoadingState v-if="catalog.loading" label="Loading categories…" />
    <ErrorState v-else-if="catalog.error" :message="catalog.error" @retry="catalog.fetchProducts" />

    <template v-else>
      <section v-if="filteredCategories.length" class="category-grid">
        <CategoryTile v-for="category in filteredCategories" :key="category.slug" :category="category" />
      </section>
      <EmptyState v-else message="No categories match your search." />
    </template>
  </div>
</template>
