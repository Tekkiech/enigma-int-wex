<script setup>
import { RouterLink } from 'vue-router';
import { useCatalogStore } from '../../stores/catalog.js';
import ProductImage from './ProductImage.vue';
import ProductPrice from './ProductPrice.vue';
import DiscountBadge from './DiscountBadge.vue';
import WishlistButton from './WishlistButton.vue';

const props = defineProps({
  product: { type: Object, required: true },
  // Related-products strip uses a simpler card: image, title, price only.
  compact: { type: Boolean, default: false },
});

const catalog = useCatalogStore();
</script>

<template>
  <RouterLink :to="{ name: 'product', params: { id: product.id } }" class="product-card" :class="{ 'is-compact': compact }">
    <div class="product-card__media">
      <ProductImage :src="product.thumbnail" :alt="product.title" />
      <template v-if="!compact">
        <DiscountBadge class="product-card__discount" :discount-percentage="product.discountPercentage" />
        <WishlistButton
          class="product-card__wishlist"
          :active="catalog.isWishlisted(product.id)"
          @toggle="catalog.toggleWishlist(product.id)"
        />
      </template>
    </div>
    <div class="product-card__body">
      <p v-if="!compact" class="product-card__category">{{ product.brand || catalog.categoryName(product.category) }}</p>
      <h3 class="product-card__name">{{ product.title }}</h3>
      <p v-if="!compact" class="product-card__rating">{{ product.rating.toFixed(1) }} ★ Rating</p>
      <ProductPrice :price="product.price" :discount-percentage="compact ? 0 : product.discountPercentage" />
      <button
        v-if="!compact"
        type="button"
        class="product-card__add"
        @click.stop.prevent="catalog.addToCart(product.id, 1)"
      >
        Add to cart
      </button>
    </div>
  </RouterLink>
</template>
