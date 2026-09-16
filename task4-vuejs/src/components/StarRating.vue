<script setup>
import { computed } from 'vue';

const props = defineProps({
  rating: { type: Number, required: true },
  reviewCount: { type: Number, default: null },
});

const stars = computed(() =>
  Array.from({ length: 5 }, (_, i) => {
    const fill = Math.max(0, Math.min(1, props.rating - i));
    return fill;
  })
);
</script>

<template>
  <span class="star-rating" :aria-label="`Rated ${rating} out of 5`">
    <span class="star-rating__stars">
      <span v-for="(fill, i) in stars" :key="i" class="star-rating__star">
        <span class="star-rating__star-fill" :style="{ width: `${fill * 100}%` }">★</span>
        <span class="star-rating__star-outline">★</span>
      </span>
    </span>
    <span class="star-rating__value">{{ rating.toFixed(1) }}</span>
    <span v-if="reviewCount !== null" class="star-rating__count">({{ reviewCount }})</span>
  </span>
</template>

<style scoped>
.star-rating {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
}

.star-rating__stars {
  display: inline-flex;
  gap: 1px;
}

.star-rating__star {
  position: relative;
  display: inline-block;
  line-height: 1;
}

.star-rating__star-fill,
.star-rating__star-outline {
  display: block;
  font-size: 0.95rem;
}

.star-rating__star-outline {
  color: var(--line);
}

.star-rating__star-fill {
  position: absolute;
  top: 0;
  left: 0;
  overflow: hidden;
  white-space: nowrap;
  color: var(--accent);
}

.star-rating__value {
  font-weight: 600;
  color: var(--text);
}

.star-rating__count {
  color: var(--text-dim);
}
</style>
