<script setup>
import { computed, ref } from 'vue';
import Breadcrumbs from '../components/common/Breadcrumbs.vue';
import StatTile from '../components/metrics/StatTile.vue';
import ChartCard from '../components/metrics/ChartCard.vue';
import DataTable from '../components/metrics/DataTable.vue';
import LineChart from '../components/metrics/LineChart.vue';
import BarChart from '../components/metrics/BarChart.vue';
import LocationMap from '../components/metrics/LocationMap.vue';
import {
  allRecords,
  personaList,
  filterByPersona,
  computeKpis,
  monthlySeries,
  categoryBreakdown,
  personaBreakdown,
  outlierSample,
  locationBreakdown,
} from '../data/metrics.js';
import { CATEGORICAL, SEQUENTIAL_BLUE } from '../data/chartTokens.js';

const personaFilter = ref('all');
const personas = personaList();

// Color assigned by persona identity (alphabetical order, fixed for the
// page's lifetime), never by revenue rank - see dataviz skill's
// anti-patterns.md: "color follows the entity, never its rank." The bars
// below are sorted by revenue for readability, but a persona keeps the
// same color regardless of where it lands in that sort.
const personaColor = Object.fromEntries(personas.map((name, i) => [name, CATEGORICAL[i]]));

const filtered = computed(() => filterByPersona(allRecords(), personaFilter.value));
const kpis = computed(() => computeKpis(filtered.value));
const months = computed(() => monthlySeries(filtered.value));
const categories = computed(() => categoryBreakdown(filtered.value));
const personaRevenue = personaBreakdown(); // always the full dataset - see metrics.js
const outliers = computed(() => outlierSample(filtered.value));
const locations = computed(() => locationBreakdown(filtered.value));

function compactCurrency(value) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function humanize(slug) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
</script>

<template>
  <div class="metrics-view">
    <Breadcrumbs :items="[{ label: 'Home', to: '/' }, { label: 'Metrics' }]" />
    <h1>Shopper metrics</h1>
    <p class="metrics-view__intro">
      Revenue and order patterns from a synthetic shopper dataset - see
      <code>task4-vuejs/analytics/</code> for how it's generated. Not live sales data.
    </p>

    <div class="metrics-filter">
      <label class="metrics-filter__label">
        <span>Shopper persona</span>
        <select v-model="personaFilter">
          <option value="all">All personas</option>
          <option v-for="p in personas" :key="p" :value="p">{{ humanize(p) }}</option>
        </select>
      </label>
    </div>

    <div class="metrics-kpis">
      <StatTile label="Revenue" :value="compactCurrency(kpis.revenue)" />
      <StatTile label="Orders" :value="kpis.orderCount.toLocaleString()" />
      <StatTile label="Avg order value" :value="compactCurrency(kpis.avgOrderValue)" />
      <StatTile
        label="Unexpected purchases"
        :value="`${(kpis.outlierRate * 100).toFixed(1)}%`"
        hint="line items outside the shopper's usual categories"
      />
    </div>

    <div class="metrics-grid">
      <ChartCard title="Revenue over time" caption="Monthly, current filter">
        <template #chart>
          <LineChart
            :labels="months.map((m) => m.label)"
            :values="months.map((m) => m.revenue)"
            :color="SEQUENTIAL_BLUE[500]"
            value-prefix="$"
          />
        </template>
        <template #table>
          <DataTable
            :columns="[
              { key: 'label', label: 'Month' },
              { key: 'revenue', label: 'Revenue', align: 'num' },
            ]"
            :rows="months.map((m) => ({ label: m.label, revenue: compactCurrency(m.revenue) }))"
          />
        </template>
      </ChartCard>

      <ChartCard title="Orders over time" caption="Monthly, current filter">
        <template #chart>
          <LineChart
            :labels="months.map((m) => m.label)"
            :values="months.map((m) => m.orderCount)"
            :color="SEQUENTIAL_BLUE[500]"
          />
        </template>
        <template #table>
          <DataTable
            :columns="[
              { key: 'label', label: 'Month' },
              { key: 'orderCount', label: 'Orders', align: 'num' },
            ]"
            :rows="months.map((m) => ({ label: m.label, orderCount: m.orderCount }))"
          />
        </template>
      </ChartCard>

      <ChartCard title="Revenue by category" caption="Top 8, current filter - rest folded into Other">
        <template #chart>
          <BarChart
            :labels="categories.map((c) => (c.category === 'Other' ? 'Other' : humanize(c.category)))"
            :values="categories.map((c) => c.revenue)"
            :colors="SEQUENTIAL_BLUE[500]"
            value-prefix="$"
          />
        </template>
        <template #table>
          <DataTable
            :columns="[
              { key: 'category', label: 'Category' },
              { key: 'revenue', label: 'Revenue', align: 'num' },
            ]"
            :rows="categories.map((c) => ({ category: c.category === 'Other' ? 'Other' : humanize(c.category), revenue: compactCurrency(c.revenue) }))"
          />
        </template>
      </ChartCard>

      <ChartCard title="Revenue by persona" caption="All personas, unaffected by the filter above">
        <template #chart>
          <BarChart
            :labels="personaRevenue.map((p) => humanize(p.persona))"
            :values="personaRevenue.map((p) => p.revenue)"
            :colors="personaRevenue.map((p) => personaColor[p.persona])"
            value-prefix="$"
          />
        </template>
        <template #table>
          <DataTable
            :columns="[
              { key: 'persona', label: 'Persona' },
              { key: 'revenue', label: 'Revenue', align: 'num' },
            ]"
            :rows="personaRevenue.map((p) => ({ persona: humanize(p.persona), revenue: compactCurrency(p.revenue) }))"
          />
        </template>
      </ChartCard>
    </div>

    <ChartCard title="Revenue by location" caption="Circle size is revenue per city, current filter" class="metrics-map-card">
      <template #chart>
        <LocationMap :rows="locations" />
      </template>
      <template #table>
        <DataTable
          :columns="[
            { key: 'city', label: 'City' },
            { key: 'revenue', label: 'Revenue', align: 'num' },
            { key: 'orderCount', label: 'Orders', align: 'num' },
            { key: 'topPersona', label: 'Mostly' },
          ]"
          :rows="locations.map((l) => ({ city: `${l.city}, ${l.region}`, revenue: compactCurrency(l.revenue), orderCount: l.orderCount, topPersona: humanize(l.topPersona) }))"
        />
      </template>
    </ChartCard>

    <section class="metrics-outliers">
      <h2>Unexpected purchases</h2>
      <p class="metrics-outliers__caption">
        A shopper's persona sets what they usually buy, not what they're allowed to - every persona has a small
        chance of a line item completely outside its normal categories. Most recent, current filter.
      </p>
      <DataTable
        v-if="outliers.length"
        :columns="[
          { key: 'date', label: 'Date' },
          { key: 'persona', label: 'Persona' },
          { key: 'title', label: 'Bought' },
          { key: 'category', label: 'Category' },
        ]"
        :rows="outliers.map((o) => ({ date: formatDate(o.date), persona: humanize(o.persona), title: o.title, category: humanize(o.category) }))"
      />
      <p v-else class="metrics-outliers__empty">No unexpected purchases in this slice.</p>
    </section>
  </div>
</template>
