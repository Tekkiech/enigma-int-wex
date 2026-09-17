<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import useCatalogStore from '../stores/catalog.vue';
import Breadcrumbs from '../components/common/Breadcrumbs.vue';
import LoadingState from '../components/common/LoadingState.vue';
import ErrorState from '../components/common/ErrorState.vue';
import EmptyState from '../components/common/EmptyState.vue';
import ProductGallery from '../components/product/ProductGallery.vue';
import ProductPrice from '../components/product/ProductPrice.vue';
import QuantityStepper from '../components/product/QuantityStepper.vue';
import DeliveryInfo from '../components/product/DeliveryInfo.vue';
import WishlistButton from '../components/product/WishlistButton.vue';
import ProductSpecs from '../components/product/ProductSpecs.vue';
import ProductReviews from '../components/product/ProductReviews.vue';
import ProductReviewForm from '../components/product/ProductReviewForm.vue';
import RelatedProducts from '../components/product/RelatedProducts.vue';

const props = defineProps({
  id: { type: [String, Number], required: true },
});

const catalog = useCatalogStore();
const router = useRouter();
onMounted(() => catalog.fetchProducts());

const product = computed(() => catalog.productById(props.id));
const related = computed(() => (product.value ? catalog.relatedTo(product.value) : []));

const quantity = ref(1);
watch(() => props.id, () => (quantity.value = 1));

function buyNow() {
  catalog.addToCart(product.value.id, quantity.value);
  router.push('/cart');
}

const breadcrumbItems = computed(() => {
  if (!product.value) return [{ label: 'Home', to: '/' }];
  return [
    { label: 'Home', to: '/' },
    { label: catalog.categoryName(product.value.category), to: { name: 'category', params: { slug: product.value.category } } },
    { label: product.value.title },
  ];
});
</script>

<template>
  <div class="detail-view">
    <Breadcrumbs :items="breadcrumbItems" />

    <LoadingState v-if="catalog.loading" label="Loading product…" />
    <ErrorState v-else-if="catalog.error" :message="catalog.error" @retry="catalog.fetchProducts" />
    <EmptyState v-else-if="!product" :message="`No product found with id ${props.id}.`" />

    <template v-else>
      <div class="detail-view__layout">
        <ProductGallery :images="product.images" :title="product.title" />

        <div class="detail-view__info">
          <div class="detail-view__title-row">
            <div>
              <p class="detail-view__brand">{{ product.brand || 'TEKKIECH.MARKET' }}</p>
              <h1>{{ product.title }}</h1>
            </div>
            <WishlistButton :active="catalog.isWishlisted(product.id)" @toggle="catalog.toggleWishlist(product.id)" />
          </div>
          <p class="detail-view__meta">
            {{ product.rating.toFixed(1) }} ★ · {{ product.availabilityStatus || (product.stock > 0 ? 'In stock' : 'Out of stock') }}
          </p>

          <ProductPrice class="detail-view__price" :price="product.price" :discount-percentage="product.discountPercentage" />

          <p class="detail-view__description">{{ product.description }}</p>

          <div class="detail-view__purchase">
            <QuantityStepper v-model="quantity" />
            <p v-if="product.stock > 0 && product.stock <= 10" class="detail-view__urgency">Only {{ product.stock }} left</p>
          </div>

          <div class="detail-view__buttons">
            <button type="button" class="button button--solid" @click="buyNow">Buy now</button>
            <button type="button" class="button button--outline" @click="catalog.addToCart(product.id, quantity)">
              Add to cart
            </button>
          </div>

          <DeliveryInfo />
        </div>
      </div>

      <section class="detail-view__specs">
        <h2>Specifications</h2>
        <ProductSpecs :product="product" />
      </section>

      <section class="detail-view__reviews">
        <h2>Reviews</h2>
        <ProductReviewForm :product-id="product.id" />
        <ProductReviews :reviews="product.reviews" />
      </section>

      <RelatedProducts :products="related" />
    </template>
  </div>
</template>
