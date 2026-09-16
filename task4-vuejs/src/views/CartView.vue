<script setup>
import { onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { useCatalogStore } from '../stores/catalog.js';
import Breadcrumbs from '../components/common/Breadcrumbs.vue';
import EmptyState from '../components/common/EmptyState.vue';
import CartItemRow from '../components/cart/CartItemRow.vue';

const catalog = useCatalogStore();
onMounted(() => catalog.fetchProducts());
</script>

<template>
  <div class="cart-view">
    <Breadcrumbs :items="[{ label: 'Home', to: '/' }, { label: 'Cart' }]" />

    <div class="list-view__heading">
      <h1>Your Cart</h1>
      <span class="list-view__count">{{ catalog.cartCount }} items</span>
    </div>

    <template v-if="catalog.cartItems.length">
      <div class="cart-view__layout">
        <ul class="cart-list">
          <CartItemRow
            v-for="line in catalog.cartItems"
            :key="line.product.id"
            :product="line.product"
            :quantity="line.quantity"
            @update:quantity="catalog.setCartQuantity(line.product.id, $event)"
            @remove="catalog.removeFromCart(line.product.id)"
          />
        </ul>

        <aside class="cart-summary">
          <h2>Summary</h2>
          <div class="cart-summary__row">
            <span>Subtotal</span>
            <span>${{ catalog.cartTotal.toFixed(2) }}</span>
          </div>
          <p class="cart-summary__note">
            {{ catalog.cartTotal >= 50 ? 'You qualify for free delivery.' : `Add $${(50 - catalog.cartTotal).toFixed(2)} more for free delivery.` }}
          </p>
          <RouterLink to="/" class="button button--outline cart-summary__continue">Continue shopping</RouterLink>
        </aside>
      </div>
    </template>

    <EmptyState v-else message="Your cart is empty.">
      <RouterLink to="/" class="button button--solid">Browse groceries</RouterLink>
    </EmptyState>
  </div>
</template>
