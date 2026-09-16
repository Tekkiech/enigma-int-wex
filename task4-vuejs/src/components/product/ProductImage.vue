<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  src: { type: String, required: true },
  alt: { type: String, required: true },
});

const failed = ref(false);
watch(() => props.src, () => (failed.value = false));
</script>

<template>
  <div class="product-image">
    <img v-if="!failed" :src="src" :alt="alt" loading="lazy" @error="failed = true" />
    <div v-else class="product-image__fallback" role="img" :aria-label="alt">
      <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.5" />
        <circle cx="8.5" cy="9.5" r="1.5" fill="currentColor" />
        <path d="M3 16l5-5 4 4 3-3 6 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
      </svg>
      <span>No image</span>
    </div>
  </div>
</template>
