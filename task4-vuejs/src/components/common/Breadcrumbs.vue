<script setup>
defineProps({
  // list of { label, to? } - last one has no "to", so it just shows as plain text
  items: { type: Array, required: true },
});
</script>

<template>
  <nav class="breadcrumbs" aria-label="Breadcrumb">
    <template v-for="(item, index) in items" :key="index">
      <RouterLink v-if="item.to" :to="item.to" class="breadcrumbs__link">{{ item.label }}</RouterLink>
      <span v-else class="breadcrumbs__current">{{ item.label }}</span>
      <span v-if="index < items.length - 1" class="breadcrumbs__separator" aria-hidden="true">/</span>
    </template>
  </nav>
</template>
