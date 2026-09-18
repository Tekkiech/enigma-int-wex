<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import ProductImage from '../product/ProductImage.vue';

const props = defineProps({
  category: { type: Object, required: true }, // { slug, name, count, images }
});

const activeIndex = ref(0);
let timer = null;

onMounted(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion || props.category.images.length < 2) return;

  // random delay so all the tiles don't fade at the exact same time
  const interval = 4000 + Math.random() * 1500;
  timer = setInterval(() => {
    activeIndex.value = (activeIndex.value + 1) % props.category.images.length;
  }, interval);
});

onBeforeUnmount(() => clearInterval(timer));
</script>

<template>
  <RouterLink :to="{ name: 'category', params: { slug: category.slug } }" class="category-tile">
    <div class="category-tile__media">
      <ProductImage
        v-for="(image, index) in category.images"
        :key="image"
        :src="image"
        :alt="category.name"
        class="category-tile__frame"
        :class="{ 'is-active': index === activeIndex }"
      />
    </div>
    <div class="category-tile__body">
      <span class="category-tile__name">{{ category.name }}</span>
      <span class="category-tile__count">{{ category.count }} items</span>
    </div>
  </RouterLink>
</template>
