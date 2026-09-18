<script setup>
import { ref } from 'vue';

defineProps({
  title: { type: String, required: true },
  caption: { type: String, default: '' },
});

// Lets you flip between the chart and a plain table of the same data.
const showTable = ref(false);
</script>

<template>
  <section class="chart-card">
    <div class="chart-card__head">
      <div>
        <h3>{{ title }}</h3>
        <p v-if="caption" class="chart-card__caption">{{ caption }}</p>
      </div>
      <button type="button" class="chart-card__toggle" @click="showTable = !showTable">
        {{ showTable ? 'View chart' : 'View table' }}
      </button>
    </div>

    <div v-show="!showTable" class="chart-card__body">
      <slot name="chart" />
    </div>
    <div v-show="showTable" class="chart-card__table">
      <slot name="table" />
    </div>
  </section>
</template>
