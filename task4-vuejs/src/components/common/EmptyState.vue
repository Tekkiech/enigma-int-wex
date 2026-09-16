<script setup>
defineProps({
  message: { type: String, default: 'Nothing to show here.' },
});
</script>

<template>
  <div class="status-block status-block--empty">
    <p>{{ message }}</p>
    <slot />
  </div>
</template>
