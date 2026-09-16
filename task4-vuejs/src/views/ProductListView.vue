<script setup>
import { onMounted } from 'vue';
import { useCatalogStore } from '../stores/catalog.js';
import Breadcrumbs from '../components/common/Breadcrumbs.vue';
import CategoryChips from '../components/filters/CategoryChips.vue';
import SortSelect from '../components/filters/SortSelect.vue';
import ProductCard from '../components/product/ProductCard.vue';
import LoadingState from '../components/common/LoadingState.vue';
import ErrorState from '../components/common/ErrorState.vue';
import EmptyState from '../components/common/EmptyState.vue';

const catalog = useCatalogStore();

onMounted(() => catalog.fetchProducts());
</script>

<template>
  <div class="list-view">
    <Breadcrumbs :items="[{ label: 'Home', to: '/' }, { label: 'Groceries' }]" />

    <div class="list-view__heading">
      <h1>Fresh Groceries</h1>
      <span class="list-view__count">{{ catalog.visibleProducts.length }} products</span>
    </div>

    <div class="list-view__controls">
      <CategoryChips :model-value="catalog.chip" @update:model-value="catalog.setChip" />
      <SortSelect :model-value="catalog.sortBy" @update:model-value="catalog.setSortBy" />
    </div>

    <LoadingState v-if="catalog.loading" label="Loading groceries…" />
    <ErrorState v-else-if="catalog.error" :message="catalog.error" @retry="catalog.fetchProducts" />
    <template v-else>
      <section v-if="catalog.visibleProducts.length" class="product-grid">
        <ProductCard v-for="product in catalog.visibleProducts" :key="product.id" :product="product" />
      </section>
      <EmptyState v-else message="No products match your search or filters." />
    </template>
  </div>
</template>
