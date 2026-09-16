<script setup>
defineProps({
  discountPercentage: { type: Number, required: true },
});
</script>

<template>
  <span v-if="discountPercentage > 1" class="discount-badge">-{{ Math.round(discountPercentage) }}%</span>
</template>
