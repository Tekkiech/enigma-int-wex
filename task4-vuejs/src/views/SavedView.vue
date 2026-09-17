<script setup>
import { onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import useCatalogStore from '../stores/catalog.vue';
import Breadcrumbs from '../components/common/Breadcrumbs.vue';
import ProductCard from '../components/product/ProductCard.vue';
import LoadingState from '../components/common/LoadingState.vue';
import ErrorState from '../components/common/ErrorState.vue';
import EmptyState from '../components/common/EmptyState.vue';

const catalog = useCatalogStore();
onMounted(() => catalog.fetchProducts());
</script>

<template>
  <div class="list-view">
    <Breadcrumbs :items="[{ label: 'Home', to: '/' }, { label: 'Saved' }]" />

    <div class="list-view__heading">
      <h1>Saved</h1>
      <span class="list-view__count">{{ catalog.savedProducts.length }} products</span>
    </div>

    <LoadingState v-if="catalog.loading" label="Loading saved items…" />
    <ErrorState v-else-if="catalog.error" :message="catalog.error" @retry="catalog.fetchProducts" />
    <template v-else>
      <section v-if="catalog.savedProducts.length" class="product-grid">
        <ProductCard v-for="product in catalog.savedProducts" :key="product.id" :product="product" />
      </section>
      <EmptyState v-else message="Nothing saved yet. Tap the star on a product to save it here.">
        <RouterLink to="/" class="button button--solid">Browse categories</RouterLink>
      </EmptyState>
    </template>
  </div>
</template>
