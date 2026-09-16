<script setup>
import { RouterLink } from 'vue-router';
import ProductThumb from './ProductThumb.vue';
import StarRating from './StarRating.vue';

defineProps({
  product: { type: Object, required: true },
});
</script>

<template>
  <RouterLink :to="{ name: 'product', params: { slug: product.slug } }" class="product-card">
    <div class="product-card__thumb">
      <ProductThumb :product="product" />
      <span v-if="!product.inStock" class="product-card__badge">Out of stock</span>
      <span class="product-card__category">{{ product.category }}</span>
    </div>
    <div class="product-card__body">
      <h3 class="product-card__name">{{ product.name }}</h3>
      <p class="product-card__tagline">{{ product.tagline }}</p>
      <StarRating :rating="product.rating" :review-count="product.reviewCount" />
      <p class="product-card__price">£{{ product.price.toFixed(2) }}</p>
    </div>
  </RouterLink>
</template>
