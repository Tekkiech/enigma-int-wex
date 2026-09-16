<script setup>
import { RouterLink } from 'vue-router';
import ProductImage from '../product/ProductImage.vue';
import QuantityStepper from '../product/QuantityStepper.vue';

const props = defineProps({
  product: { type: Object, required: true },
  quantity: { type: Number, required: true },
});

const emit = defineEmits(['update:quantity', 'remove']);
</script>

<template>
  <li class="cart-item">
    <RouterLink :to="{ name: 'product', params: { id: product.id } }" class="cart-item__media">
      <ProductImage :src="product.thumbnail" :alt="product.title" />
    </RouterLink>

    <div class="cart-item__info">
      <RouterLink :to="{ name: 'product', params: { id: product.id } }" class="cart-item__name">
        {{ product.title }}
      </RouterLink>
      <span class="cart-item__unit-price">${{ product.price.toFixed(2) }} each</span>
    </div>

    <div class="cart-item__controls">
      <QuantityStepper :model-value="quantity" @update:model-value="$emit('update:quantity', $event)" />
      <span class="cart-item__line-total">${{ (product.price * quantity).toFixed(2) }}</span>
      <button type="button" class="cart-item__remove" aria-label="Remove from cart" @click="$emit('remove')">✕</button>
    </div>
  </li>
</template>
