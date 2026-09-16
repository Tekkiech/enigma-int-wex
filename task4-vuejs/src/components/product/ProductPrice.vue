<script setup>
import { computed } from 'vue';

const props = defineProps({
  price: { type: Number, required: true },
  discountPercentage: { type: Number, default: 0 },
});

const hasDiscount = computed(() => props.discountPercentage > 0);
const originalPrice = computed(() => props.price / (1 - props.discountPercentage / 100));
</script>

<template>
  <span class="product-price">
    <span class="product-price__current">${{ price.toFixed(2) }}</span>
    <span v-if="hasDiscount" class="product-price__original">${{ originalPrice.toFixed(2) }}</span>
  </span>
</template>
