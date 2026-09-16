<script setup>
// Thin styled wrapper around Akaza UI's headless Select, so every dropdown
// in the app (category, sort, anything added later) shares one trigger/
// option template instead of re-implementing it per use site.
import { Select } from 'akaza-ui';

defineProps({
  modelValue: { type: String, required: true },
  options: { type: Array, required: true }, // [{ value, label }]
  placeholder: { type: String, default: 'Select…' },
  ariaLabel: { type: String, required: true },
});

defineEmits(['update:modelValue']);
</script>

<template>
  <Select
    :model-value="modelValue"
    :options="options"
    :placeholder="placeholder"
    :aria-label="ariaLabel"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #trigger="{ selectedLabel, placeholder: ph, isOpen, triggerProps, toggle }">
      <button type="button" class="app-select__trigger" v-bind="triggerProps" @click="toggle">
        <span class="app-select__value">{{ selectedLabel || ph }}</span>
        <span class="app-select__chevron" :class="{ 'is-open': isOpen }" aria-hidden="true">▾</span>
      </button>
    </template>

    <template #option="{ label, isSelected, isHighlighted, select }">
      <div
        class="app-select__option"
        :class="{ 'is-selected': isSelected, 'is-highlighted': isHighlighted }"
        @click="select"
      >
        {{ label }}
      </div>
    </template>

    <template #empty>
      <div class="app-select__option app-select__option--empty">No matches</div>
    </template>
  </Select>
</template>
