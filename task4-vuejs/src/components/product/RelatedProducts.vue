<script setup>
import ProductCard from './ProductCard.vue';

defineProps({
  products: { type: Array, required: true },
  title: { type: String, default: 'You might also like' },
});
</script>

<template>
  <section v-if="products.length" class="related-products">
    <h2>{{ title }}</h2>
    <div class="product-grid">
      <ProductCard v-for="product in products" :key="product.id" :product="product" compact />
    </div>
  </section>
</template>
