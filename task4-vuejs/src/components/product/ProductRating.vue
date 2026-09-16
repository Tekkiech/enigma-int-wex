<script setup>
defineProps({
  rating: { type: Number, required: true },
});
</script>

<template>
  <span class="product-rating">{{ rating.toFixed(1) }} ★</span>
</template>
