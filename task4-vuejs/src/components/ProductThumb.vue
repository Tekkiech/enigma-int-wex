<script setup>
// Stand-in product imagery: a gradient tile per product with a flat
// line-art icon on top, keyed off `product.icon`. Keeps the catalogue
// self-contained without shipping/licensing real product photography.
defineProps({
  product: { type: Object, required: true },
});
</script>

<template>
  <svg
    class="product-thumb"
    viewBox="0 0 200 200"
    role="img"
    :aria-label="`${product.colorway} ${product.name}`"
    preserveAspectRatio="xMidYMid slice"
  >
    <defs>
      <linearGradient :id="`grad-${product.id}`" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" :stop-color="product.accentFrom" />
        <stop offset="100%" :stop-color="product.accentTo" />
      </linearGradient>
    </defs>

    <rect width="200" height="200" :fill="`url(#grad-${product.id})`" />
    <rect width="200" height="200" fill="black" opacity="0.08" />

    <g stroke="rgba(15,15,20,0.85)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <template v-if="product.icon === 'headphones'">
        <path d="M40 108v-8a60 60 0 0 1 120 0v8" />
        <rect x="30" y="100" width="26" height="46" rx="10" fill="rgba(15,15,20,0.85)" stroke="none" />
        <rect x="144" y="100" width="26" height="46" rx="10" fill="rgba(15,15,20,0.85)" stroke="none" />
      </template>

      <template v-else-if="product.icon === 'earbuds'">
        <circle cx="76" cy="90" r="18" fill="rgba(15,15,20,0.85)" stroke="none" />
        <path d="M84 100c6 14 4 30-2 40" />
        <circle cx="132" cy="90" r="18" fill="rgba(15,15,20,0.85)" stroke="none" />
        <path d="M124 100c-6 14-4 30 2 40" />
      </template>

      <template v-else-if="product.icon === 'speaker'">
        <rect x="66" y="36" width="68" height="128" rx="14" fill="rgba(15,15,20,0.85)" stroke="none" />
        <circle cx="100" cy="72" r="14" :fill="product.accentFrom" stroke="rgba(15,15,20,0.85)" stroke-width="3" />
        <circle cx="100" cy="122" r="24" :fill="product.accentTo" stroke="rgba(15,15,20,0.85)" stroke-width="3" />
      </template>

      <template v-else-if="product.icon === 'turntable'">
        <rect x="30" y="120" width="140" height="16" rx="4" fill="rgba(15,15,20,0.85)" stroke="none" />
        <circle cx="90" cy="90" r="54" fill="rgba(15,15,20,0.85)" stroke="none" />
        <circle cx="90" cy="90" r="34" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="2" />
        <circle cx="90" cy="90" r="6" :fill="product.accentFrom" stroke="none" />
        <path d="M140 60 L168 40" stroke="rgba(15,15,20,0.85)" />
        <circle cx="168" cy="40" r="6" fill="rgba(15,15,20,0.85)" stroke="none" />
      </template>

      <template v-else>
        <rect x="50" y="60" width="100" height="80" rx="12" fill="rgba(15,15,20,0.85)" stroke="none" />
        <path d="M70 60v-8a10 10 0 0 1 10-10h40a10 10 0 0 1 10 10v8" />
      </template>
    </g>
  </svg>
</template>

<style scoped>
.product-thumb {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
