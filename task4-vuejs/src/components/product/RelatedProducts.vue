<script setup>
import ProductCard from './ProductCard.vue';

defineProps({
  products: { type: Array, required: true },
});
</script>

<template>
  <section v-if="products.length" class="related-products">
    <h2>You might also like</h2>
    <div class="product-grid">
      <ProductCard v-for="product in products" :key="product.id" :product="product" compact />
    </div>
  </section>
</template>
