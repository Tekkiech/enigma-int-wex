<script setup>
import { computed } from 'vue';

const props = defineProps({
  product: { type: Object, required: true },
});

const rows = computed(() => {
  const p = props.product;
  const dims = p.dimensions;
  return [
    ['Brand', p.brand],
    ['Category', p.category],
    ['SKU', p.sku],
    ['Weight', p.weight ? `${p.weight}g` : null],
    ['Dimensions', dims ? `${dims.width} × ${dims.height} × ${dims.depth} cm` : null],
    ['Warranty', p.warrantyInformation],
    ['Shipping', p.shippingInformation],
    ['Return policy', p.returnPolicy],
    ['Minimum order quantity', p.minimumOrderQuantity],
  ].filter(([, value]) => value !== null && value !== undefined && value !== '');
});
</script>

<template>
  <dl class="spec-list">
    <template v-for="[label, value] in rows" :key="label">
      <dt>{{ label }}</dt>
      <dd>{{ value }}</dd>
    </template>
  </dl>
</template>
