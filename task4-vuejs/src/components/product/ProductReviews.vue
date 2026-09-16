<script setup>
import ProductRating from './ProductRating.vue';

defineProps({
  reviews: { type: Array, default: () => [] },
});

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
</script>

<template>
  <ul v-if="reviews.length" class="review-list">
    <li v-for="review in reviews" :key="`${review.reviewerEmail}-${review.date}`" class="review-list__item">
      <div class="review-list__meta">
        <span class="review-list__author">{{ review.reviewerName }}</span>
        <time class="review-list__date" :datetime="review.date">{{ formatDate(review.date) }}</time>
      </div>
      <ProductRating :rating="review.rating" />
      <p class="review-list__comment">{{ review.comment }}</p>
    </li>
  </ul>
  <p v-else class="review-list__empty">No reviews yet.</p>
</template>
