<script setup>
import { ref, watch } from 'vue';
import { refDebounced } from '@vueuse/core';
import { Input } from 'akaza-ui';

const props = defineProps({
  modelValue: { type: String, default: '' },
});
const emit = defineEmits(['update:modelValue']);

// Type freely; only push the debounced value up to the store so every
// keystroke doesn't trigger a network request.
const draft = ref(props.modelValue);
const debounced = refDebounced(draft, 350);

watch(debounced, (value) => emit('update:modelValue', value));
watch(
  () => props.modelValue,
  (value) => {
    if (value !== draft.value) draft.value = value;
  }
);
</script>

<template>
  <label class="field field--search">
    <span class="field__label">Search</span>
    <Input
      v-model="draft"
      type="search"
      placeholder="Search products…"
      aria-label="Search products"
      :ui="{ root: 'text-input' }"
    />
  </label>
</template>
