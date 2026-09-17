<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Filler,
} from 'chart.js';
import { CHROME } from '../../data/chartTokens.js';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler);

const props = defineProps({
  labels: { type: Array, required: true },
  values: { type: Array, required: true },
  color: { type: String, default: '#2a78d6' },
  valuePrefix: { type: String, default: '' },
  height: { type: Number, default: 220 },
});

const canvas = ref(null);
let chart;

// A vertical hairline at the hovered position, snapped to the nearest data
// point rather than requiring a pointer to land on the 2px line itself -
// see dataviz skill: interaction.md, "the crosshair finds the X".
const crosshairPlugin = {
  id: 'crosshair',
  afterDatasetsDraw(c) {
    const active = c.getActiveElements();
    if (!active.length) return;
    const { ctx, chartArea } = c;
    const x = active[0].element.x;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, chartArea.top);
    ctx.lineTo(x, chartArea.bottom);
    ctx.lineWidth = 1;
    ctx.strokeStyle = CHROME.lineSoft;
    ctx.stroke();
    ctx.restore();
  },
};

function hexToRgba(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

function buildConfig() {
  return {
    type: 'line',
    data: {
      labels: props.labels,
      datasets: [
        {
          data: props.values,
          borderColor: props.color,
          borderWidth: 2,
          backgroundColor: hexToRgba(props.color, 0.1),
          fill: true,
          tension: 0.25,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBorderWidth: 2,
          pointHoverBorderColor: CHROME.surface,
          pointHoverBackgroundColor: props.color,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false }, // single series - the card title already names it
        tooltip: {
          backgroundColor: CHROME.ink,
          titleColor: CHROME.surface,
          bodyColor: CHROME.surface,
          padding: 10,
          cornerRadius: 4,
          displayColors: false,
          callbacks: {
            label: (ctx) => `${props.valuePrefix}${Number(ctx.parsed.y).toLocaleString()}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: CHROME.textDim, font: { family: "'IBM Plex Mono', monospace", size: 11 } },
        },
        y: {
          beginAtZero: true,
          grid: { color: CHROME.lineSoft, drawTicks: false },
          border: { display: false },
          ticks: {
            color: CHROME.textDim,
            font: { family: "'IBM Plex Mono', monospace", size: 11 },
            callback: (value) => `${props.valuePrefix}${Number(value).toLocaleString()}`,
          },
        },
      },
    },
    plugins: [crosshairPlugin],
  };
}

onMounted(() => {
  chart = new Chart(canvas.value, buildConfig());
  // See BarChart.vue's onMounted - same fallback-font-forever risk applies
  // to axis tick text here, just with less visible consequence (numbers
  // don't clip the way a long category label does).
  document.fonts?.ready.then(() => chart?.update());
});

watch(
  () => [props.labels, props.values],
  () => {
    if (!chart) return;
    chart.data.labels = props.labels;
    chart.data.datasets[0].data = props.values;
    chart.update();
  }
);

onUnmounted(() => chart?.destroy());
</script>

<template>
  <div :style="{ height: `${height}px` }">
    <canvas ref="canvas"></canvas>
  </div>
</template>
