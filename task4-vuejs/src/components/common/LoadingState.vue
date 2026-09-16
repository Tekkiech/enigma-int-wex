<script setup>
defineProps({
  label: { type: String, default: 'Loading…' },
});
</script>

<template>
  <div class="status-block status-block--loading" role="status">
    <span class="status-block__spinner" aria-hidden="true"></span>
    <p>{{ label }}</p>
  </div>
</template>
