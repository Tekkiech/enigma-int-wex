<script setup>
const props = defineProps({
  modelValue: { type: Number, required: true },
  min: { type: Number, default: 1 },
  max: { type: Number, default: 20 },
});
const emit = defineEmits(['update:modelValue']);

function step(delta) {
  const next = Math.min(props.max, Math.max(props.min, props.modelValue + delta));
  emit('update:modelValue', next);
}
</script>

<template>
  <div class="qty-stepper">
    <button type="button" :disabled="modelValue <= min" @click="step(-1)" aria-label="Decrease quantity">−</button>
    <span>{{ modelValue }}</span>
    <button type="button" :disabled="modelValue >= max" @click="step(1)" aria-label="Increase quantity">+</button>
  </div>
</template>
