<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { Chart, BarController, BarElement, LinearScale, CategoryScale, Tooltip } from 'chart.js';
import { CHROME } from '../../data/chartTokens.js';

Chart.register(BarController, BarElement, LinearScale, CategoryScale, Tooltip);

const props = defineProps({
  labels: { type: Array, required: true },
  values: { type: Array, required: true },
  // One color for every bar (like a leaderboard), or a list with one
  // color per bar (like when each bar is a different person or category).
  colors: { type: [String, Array], required: true },
  valuePrefix: { type: String, default: '' },
  barThickness: { type: Number, default: 20 },
});

const canvas = ref(null);
let chart;

const VALUE_TIP_FONT = "12px 'IBM Plex Mono', monospace";

function formatValue(value) {
  return `${props.valuePrefix}${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

// Draws the number at the end of each bar.
const valueLabelPlugin = {
  id: 'valueLabels',
  afterDatasetsDraw(c) {
    const meta = c.getDatasetMeta(0);
    const { ctx } = c;
    ctx.save();
    ctx.font = VALUE_TIP_FONT;
    ctx.fillStyle = CHROME.textDim;
    ctx.textBaseline = 'middle';
    meta.data.forEach((bar, index) => {
      ctx.fillText(formatValue(c.data.datasets[0].data[index]), bar.x + 8, bar.y);
    });
    ctx.restore();
  },
};

function barColor(index) {
  return Array.isArray(props.colors) ? props.colors[index % props.colors.length] : props.colors;
}

const Y_TICK_FONT = "12px 'Work Sans', sans-serif";

// Chart.js sometimes doesn't leave enough room for long labels like
// "Budget Generalist", so it gets cut off. This measures the real width
// ourselves and tells Chart.js to use that instead.
function measureMaxLabelWidth(ctx, labels) {
  ctx.save();
  ctx.font = Y_TICK_FONT;
  const max = Math.max(0, ...labels.map((label) => ctx.measureText(label).width));
  ctx.restore();
  return max;
}

// Same idea, but for the numbers at the end of each bar - a big number
// needs more room than a small one.
function measureMaxValueWidth(ctx, values) {
  ctx.save();
  ctx.font = VALUE_TIP_FONT;
  const max = Math.max(0, ...values.map((value) => ctx.measureText(formatValue(value)).width));
  ctx.restore();
  return max;
}

function buildConfig() {
  return {
    type: 'bar',
    data: {
      labels: props.labels,
      datasets: [
        {
          data: props.values,
          backgroundColor: props.values.map((_, i) => barColor(i)),
          borderRadius: { topRight: 4, bottomRight: 4, topLeft: 0, bottomLeft: 0 },
          borderSkipped: false,
          barThickness: props.barThickness,
        },
      ],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { right: measureMaxValueWidth(canvas.value.getContext('2d'), props.values) + 16 } },
      interaction: { mode: 'nearest', intersect: true },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: CHROME.ink,
          titleColor: CHROME.surface,
          bodyColor: CHROME.surface,
          padding: 10,
          cornerRadius: 4,
          displayColors: false,
          callbacks: {
            label: (ctx) => `${props.valuePrefix}${Number(ctx.parsed.x).toLocaleString()}`,
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: CHROME.lineSoft, drawTicks: false },
          border: { display: false },
          ticks: {
            color: CHROME.textDim,
            font: { family: "'IBM Plex Mono', monospace", size: 11 },
            callback: (value) => `${props.valuePrefix}${Number(value).toLocaleString()}`,
          },
        },
        y: {
          grid: { display: false },
          border: { display: false },
          ticks: { color: CHROME.ink, font: { family: "'Work Sans', sans-serif", size: 12 } },
          afterFit: (scale) => {
            scale.width = measureMaxLabelWidth(scale.ctx, props.labels) + 12;
          },
        },
      },
    },
    plugins: [valueLabelPlugin],
  };
}

onMounted(() => {
  chart = new Chart(canvas.value, buildConfig());
  // If our fonts are still loading when the chart first draws, redraw
  // once they're ready so the text doesn't look wrong/measure wrong.
  document.fonts?.ready.then(() => chart?.update());
});

watch(
  () => [props.labels, props.values, props.colors],
  () => {
    if (!chart) return;
    chart.data.labels = props.labels;
    chart.data.datasets[0].data = props.values;
    chart.data.datasets[0].backgroundColor = props.values.map((_, i) => barColor(i));
    chart.options.layout.padding.right = measureMaxValueWidth(canvas.value.getContext('2d'), props.values) + 16;
    chart.update();
  }
);

onUnmounted(() => chart?.destroy());
</script>

<template>
  <div :style="{ height: `${Math.max(labels.length * 34 + 24, 120)}px` }">
    <canvas ref="canvas"></canvas>
  </div>
</template>
