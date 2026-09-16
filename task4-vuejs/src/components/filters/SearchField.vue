<script setup>
defineProps({
  modelValue: { type: String, required: true },
  label: { type: String, default: 'Search' },
  placeholder: { type: String, default: 'Search…' },
});
defineEmits(['update:modelValue']);
</script>

<template>
  <label class="search-field">
    <span>{{ label }}</span>
    <input
      :value="modelValue"
      type="text"
      :placeholder="placeholder"
      @input="$emit('update:modelValue', $event.target.value)"
    />
  </label>
</template>
