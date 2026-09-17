<script setup>
import { computed, onMounted, watch } from 'vue';
import useCatalogStore from '../stores/catalog.vue';
import Breadcrumbs from '../components/common/Breadcrumbs.vue';
import CategoryChips from '../components/filters/CategoryChips.vue';
import SearchField from '../components/filters/SearchField.vue';
import SortSelect from '../components/filters/SortSelect.vue';
import ProductCard from '../components/product/ProductCard.vue';
import LoadingState from '../components/common/LoadingState.vue';
import ErrorState from '../components/common/ErrorState.vue';
import EmptyState from '../components/common/EmptyState.vue';

const props = defineProps({
  slug: { type: String, required: true },
});

const catalog = useCatalogStore();
onMounted(() => catalog.fetchProducts());

// Filters are shared UI state (so the header search box can reach them),
// so switching categories should start from a clean slate rather than
// carrying over a chip or sort pick that may not even exist here.
watch(() => props.slug, () => catalog.resetFilters(), { immediate: true });

const categoryName = computed(() => catalog.categoryName(props.slug));
const chips = computed(() => catalog.chipsForCategory(props.slug).chips);
const products = computed(() => catalog.visibleProducts(props.slug));
</script>

<template>
  <div class="list-view">
    <Breadcrumbs :items="[{ label: 'Home', to: '/' }, { label: categoryName }]" />

    <div class="list-view__heading">
      <h1>{{ categoryName }}</h1>
      <span class="list-view__count">{{ products.length }} products</span>
    </div>

    <div class="list-view__controls">
      <CategoryChips :model-value="catalog.chip" :chips="chips" @update:model-value="catalog.setChip" />
      <div class="list-view__controls-secondary">
        <SearchField :model-value="catalog.query" label="Search" placeholder="Search this category…" @update:model-value="catalog.setQuery" />
        <SortSelect :model-value="catalog.sortBy" @update:model-value="catalog.setSortBy" />
      </div>
    </div>

    <LoadingState v-if="catalog.loading" label="Loading products…" />
    <ErrorState v-else-if="catalog.error" :message="catalog.error" @retry="catalog.fetchProducts" />
    <template v-else>
      <section v-if="products.length" class="product-grid">
        <ProductCard v-for="product in products" :key="product.id" :product="product" />
      </section>
      <EmptyState v-else message="No products match your search or filters." />
    </template>
  </div>
</template>
