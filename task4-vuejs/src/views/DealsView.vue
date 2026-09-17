<script setup>
import { onMounted } from 'vue';
import useCatalogStore from '../stores/catalog.vue';
import Breadcrumbs from '../components/common/Breadcrumbs.vue';
import SearchField from '../components/filters/SearchField.vue';
import SortSelect from '../components/filters/SortSelect.vue';
import ProductCard from '../components/product/ProductCard.vue';
import LoadingState from '../components/common/LoadingState.vue';
import ErrorState from '../components/common/ErrorState.vue';
import EmptyState from '../components/common/EmptyState.vue';

const catalog = useCatalogStore();
onMounted(() => {
  catalog.fetchProducts();
  catalog.resetFilters();
});
</script>

<template>
  <div class="list-view">
    <Breadcrumbs :items="[{ label: 'Home', to: '/' }, { label: 'Deals' }]" />

    <div class="list-view__heading">
      <h1>Deals</h1>
      <span class="list-view__count">{{ catalog.dealsProducts.length }} products</span>
    </div>

    <div class="list-view__controls">
      <div class="list-view__controls-secondary">
        <SearchField :model-value="catalog.query" label="Search deals" placeholder="Find a deal…" @update:model-value="catalog.setQuery" />
        <SortSelect :model-value="catalog.sortBy" @update:model-value="catalog.setSortBy" />
      </div>
    </div>

    <LoadingState v-if="catalog.loading" label="Loading deals…" />
    <ErrorState v-else-if="catalog.error" :message="catalog.error" @retry="catalog.fetchProducts" />
    <template v-else>
      <section v-if="catalog.dealsProducts.length" class="product-grid">
        <ProductCard v-for="product in catalog.dealsProducts" :key="product.id" :product="product" />
      </section>
      <EmptyState v-else message="No deals match your search." />
    </template>
  </div>
</template>
