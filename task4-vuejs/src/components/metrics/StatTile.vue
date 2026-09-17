<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: String, required: true },
  hint: { type: String, default: '' },
});
</script>

<template>
  <div class="stat-tile">
    <p class="stat-tile__label">{{ label }}</p>
    <p class="stat-tile__value">{{ value }}</p>
    <p v-if="hint" class="stat-tile__hint">{{ hint }}</p>
  </div>
</template>
