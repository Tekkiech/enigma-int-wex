<script setup>
defineProps({
  message: { type: String, required: true },
});

defineEmits(['retry']);
</script>

<template>
  <div class="status-block status-block--error" role="alert">
    <p>Something went wrong: {{ message }}</p>
    <button type="button" class="button button--ghost" @click="$emit('retry')">Try again</button>
  </div>
</template>
