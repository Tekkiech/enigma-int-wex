<script setup>
import { computed, ref, watch } from 'vue';
import ProductImage from './ProductImage.vue';

const props = defineProps({
  images: { type: Array, default: () => [] },
  title: { type: String, required: true },
});

const gallery = computed(() => (props.images.length ? props.images : []));
const activeIndex = ref(0);
watch(
  () => props.images,
  () => (activeIndex.value = 0)
);

const activeImage = computed(() => gallery.value[activeIndex.value]);
</script>

<template>
  <div class="product-gallery">
    <div class="product-gallery__main">
      <ProductImage v-if="activeImage" :src="activeImage" :alt="title" />
    </div>
    <div v-if="gallery.length > 0" class="product-gallery__thumbs">
      <button
        v-for="(image, index) in gallery"
        :key="image"
        type="button"
        class="product-gallery__thumb"
        :class="{ 'is-active': index === activeIndex }"
        :aria-label="`Show image ${index + 1} of ${gallery.length}`"
        :aria-pressed="index === activeIndex"
        @click="activeIndex = index"
      >
        <ProductImage :src="image" :alt="`${title} thumbnail ${index + 1}`" />
      </button>
    </div>
  </div>
</template>
