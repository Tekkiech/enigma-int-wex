<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import Breadcrumbs from '../components/common/Breadcrumbs.vue';
import LoadingState from '../components/common/LoadingState.vue';
import ErrorState from '../components/common/ErrorState.vue';
import StatTile from '../components/metrics/StatTile.vue';
import ChartCard from '../components/metrics/ChartCard.vue';
import DataTable from '../components/metrics/DataTable.vue';
import LineChart from '../components/metrics/LineChart.vue';
import BarChart from '../components/metrics/BarChart.vue';
import LocationMap from '../components/metrics/LocationMap.vue';
import useAccountStore from '../stores/account.vue';
import * as backend from '../api/backend.js';
import {
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

const records = ref([]);
const loading = ref(true);
const error = ref(null);

async function load() {
  loading.value = true;
  error.value = null;
  try {
    records.value = await backend.fetchMetricsOrders();
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

onMounted(load);

const account = useAccountStore();
const myUserId = computed(() => (account.user ? `real-${account.user.id}` : null));

const personaFilter = ref('all');
const personas = computed(() => personaList(records.value));

// Give each persona its own fixed color, so a persona's bar is always
// the same color no matter how the bars get sorted.
const personaColor = computed(() => Object.fromEntries(personas.value.map((name, i) => [name, CATEGORICAL[i]])));

// If you sign out while "Just me" is selected, there's nothing left to
// show - fall back to "All personas" instead of an empty dashboard.
watch(
  () => account.user,
  (user) => {
    if (!user && personaFilter.value === 'me') personaFilter.value = 'all';
  }
);

const filtered = computed(() => filterByPersona(records.value, personaFilter.value, myUserId.value));
const kpis = computed(() => computeKpis(filtered.value));
const months = computed(() => monthlySeries(filtered.value, records.value));
const categories = computed(() => categoryBreakdown(filtered.value));
const personaRevenue = computed(() => personaBreakdown(records.value)); // always uses everyone, not just the filtered persona
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

    <LoadingState v-if="loading" label="Loading shopper data…" />
    <ErrorState v-else-if="error" :message="error" @retry="load" />

    <template v-else>
      <div class="metrics-filter">
        <label class="metrics-filter__label">
          <span>Filter</span>
          <select v-model="personaFilter">
            <option value="all">All personas</option>
            <option v-if="account.user" value="me">Just me</option>
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
        <ChartCard title="Revenue over time">
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

        <ChartCard title="Orders over time">
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
      </div>

      <!-- Show persona breakdown normally, but switch to category
           breakdown once a single persona is picked - a persona chart
           with only one persona in it isn't very useful. -->
      <ChartCard v-if="personaFilter === 'all'" title="Revenue by persona" class="metrics-full-card">
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

      <ChartCard v-else title="Revenue by category" caption="Top 8 - the rest are folded into Other" class="metrics-full-card">
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

      <ChartCard title="Revenue by location" caption="Circle size = revenue" class="metrics-full-card">
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
          chance of buying something completely different.
        </p>
        <DataTable
          v-if="outliers.length"
          :columns="[
            { key: 'date', label: 'Date' },
            { key: 'shopper', label: 'Shopper' },
            { key: 'title', label: 'Bought' },
            { key: 'category', label: 'Category' },
          ]"
          :rows="outliers.map((o) => ({ date: formatDate(o.date), shopper: `${o.shopperName} (${humanize(o.persona)})`, title: o.title, category: humanize(o.category) }))"
        />
        <p v-else class="metrics-outliers__empty">No unexpected purchases in this slice.</p>
      </section>
    </template>
  </div>
</template>
