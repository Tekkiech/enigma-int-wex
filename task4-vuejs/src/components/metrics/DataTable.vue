<script setup>
// A plain table - used as the "view table" option next to each chart.
defineProps({
  columns: { type: Array, required: true }, // [{ key, label, align? }]
  rows: { type: Array, required: true },
});
</script>

<template>
  <table class="data-table">
    <thead>
      <tr>
        <th v-for="col in columns" :key="col.key" :class="{ 'data-table__cell--num': col.align === 'num' }">
          {{ col.label }}
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(row, index) in rows" :key="index">
        <td v-for="col in columns" :key="col.key" :class="{ 'data-table__cell--num': col.align === 'num' }">
          {{ row[col.key] }}
        </td>
      </tr>
    </tbody>
  </table>
</template>
