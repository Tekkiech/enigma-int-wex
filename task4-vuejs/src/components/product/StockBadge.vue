<script setup>
import { computed } from 'vue';

const props = defineProps({
  stock: { type: Number, required: true },
  availabilityStatus: { type: String, default: null },
});

const inStock = computed(() => (props.availabilityStatus ? props.availabilityStatus !== 'Out of Stock' : props.stock > 0));
const label = computed(() => props.availabilityStatus || (inStock.value ? 'In stock' : 'Out of stock'));
</script>

<template>
  <span class="stock-badge" :class="inStock ? 'is-in-stock' : 'is-out-of-stock'">
    {{ label }}
  </span>
</template>
