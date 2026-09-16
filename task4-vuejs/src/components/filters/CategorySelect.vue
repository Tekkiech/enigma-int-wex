<script setup>
import { computed } from 'vue';
import AppSelect from '../common/AppSelect.vue';

const props = defineProps({
  modelValue: { type: String, required: true },
  categories: { type: Array, required: true }, // [{ slug, name }]
});
defineEmits(['update:modelValue']);

const options = computed(() => [
  { value: 'all', label: 'All categories' },
  ...props.categories.map((category) => ({ value: category.slug, label: category.name })),
]);
</script>

<template>
  <label class="field">
    <span class="field__label">Category</span>
    <AppSelect
      :model-value="modelValue"
      :options="options"
      aria-label="Filter by category"
      @update:model-value="$emit('update:modelValue', $event)"
    />
  </label>
</template>
