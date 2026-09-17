<script setup>
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import useCatalogStore from '../stores/catalog.vue';
import Breadcrumbs from '../components/common/Breadcrumbs.vue';
import ProductCard from '../components/product/ProductCard.vue';
import LoadingState from '../components/common/LoadingState.vue';
import ErrorState from '../components/common/ErrorState.vue';
import EmptyState from '../components/common/EmptyState.vue';

const catalog = useCatalogStore();
const route = useRoute();
onMounted(() => catalog.fetchProducts());

const query = computed(() => String(route.query.q || ''));
const results = computed(() => catalog.searchResults(query.value));
</script>

<template>
  <div class="list-view">
    <Breadcrumbs :items="[{ label: 'Home', to: '/' }, { label: 'Search' }]" />

    <div class="list-view__heading">
      <h1>Search results for "{{ query }}"</h1>
      <span class="list-view__count">{{ results.length }} products</span>
    </div>

    <LoadingState v-if="catalog.loading" label="Searching…" />
    <ErrorState v-else-if="catalog.error" :message="catalog.error" @retry="catalog.fetchProducts" />
    <template v-else>
      <section v-if="results.length" class="product-grid">
        <ProductCard v-for="product in results" :key="product.id" :product="product" />
      </section>
      <EmptyState v-else :message="`No products match “${query}”.`" />
    </template>
  </div>
</template>
