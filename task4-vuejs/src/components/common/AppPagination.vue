<script setup>
import { Pagination } from 'akaza-ui';

defineProps({
  modelValue: { type: Number, required: true },
  total: { type: Number, required: true },
  pageSize: { type: Number, required: true },
});
defineEmits(['update:modelValue']);
</script>

<template>
  <Pagination
    :model-value="modelValue"
    :total="total"
    :items-per-page="pageSize"
    :sibling-count="1"
    show-edges
    aria-label="Product pages"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #state="{ items, goToPage, page, pageCount }">
      <nav v-if="pageCount > 1" class="pagination" aria-label="Product pages">
        <button type="button" class="pagination__nav" :disabled="page <= 1" @click="goToPage(page - 1)">
          ‹ Prev
        </button>

        <ul class="pagination__list">
          <li v-for="item in items" :key="item.key">
            <span v-if="item.type === 'ellipsis'" class="pagination__ellipsis" aria-hidden="true">…</span>
            <button
              v-else
              type="button"
              class="pagination__page"
              :class="{ 'is-active': item.value === page }"
              :aria-current="item.value === page ? 'page' : undefined"
              @click="goToPage(item.value)"
            >
              {{ item.value }}
            </button>
          </li>
        </ul>

        <button type="button" class="pagination__nav" :disabled="page >= pageCount" @click="goToPage(page + 1)">
          Next ›
        </button>
      </nav>
    </template>
  </Pagination>
</template>
