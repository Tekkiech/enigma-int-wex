<script setup>
defineProps({
  modelValue: { type: String, required: true },
  chips: { type: Array, required: true },
});
defineEmits(['update:modelValue']);
</script>

<template>
  <div class="chip-row">
    <button
      v-for="chip in chips"
      :key="chip"
      type="button"
      class="chip"
      :class="{ 'is-active': modelValue === chip }"
      @click="$emit('update:modelValue', chip)"
    >
      {{ chip }}
    </button>
  </div>
</template>
