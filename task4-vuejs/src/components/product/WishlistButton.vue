<script setup>
defineProps({
  active: { type: Boolean, default: false },
});
defineEmits(['toggle']);
</script>

<template>
  <button
    type="button"
    class="wishlist-button"
    :class="{ 'is-active': active }"
    :aria-pressed="active"
    aria-label="Toggle wishlist"
    @click.stop.prevent="$emit('toggle')"
  >
    ★
  </button>
</template>
