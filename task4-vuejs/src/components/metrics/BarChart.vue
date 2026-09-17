<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { Chart, BarController, BarElement, LinearScale, CategoryScale, Tooltip } from 'chart.js';
import { CHROME } from '../../data/chartTokens.js';

Chart.register(BarController, BarElement, LinearScale, CategoryScale, Tooltip);

const props = defineProps({
  labels: { type: Array, required: true },
  values: { type: Array, required: true },
  // A single hex = sequential magnitude, same hue for every bar (a
  // leaderboard - order carries the meaning, not color). An array of hex,
  // one per bar = nominal categorical identity (each bar is a distinct
  // named entity - a persona, not a rank).
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

// Value at the bar's tip, in a text token color (never the bar's own hue)
// - see marks-and-anatomy.md: "text never wears the data color."
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

// Chart.js's own auto-width for the category (y) axis under-measures here
// - reproducibly clips the longest label regardless of font-load timing
// (confirmed: "Budget Generalist" -> "udget Generalist" persists even
// after document.fonts is fully loaded). Measuring every label ourselves
// with the exact tick font and forcing that width via afterFit sidesteps
// whatever Chart.js's internal calculation is getting wrong, rather than
// guessing at the cause.
function measureMaxLabelWidth(ctx, labels) {
  ctx.save();
  ctx.font = Y_TICK_FONT;
  const max = Math.max(0, ...labels.map((label) => ctx.measureText(label).width));
  ctx.restore();
  return max;
}

// Same fix, other end: the tip-label plugin draws past the bar's end, so
// the widest formatted value (not just the longest bar) needs a right
// margin reserved for it too, or the top bar's own label runs off the
// canvas - see marks-and-anatomy.md, "a label that won't fit doesn't get
// clipped." A fixed guess (the previous 56px) broke as soon as a value
// crossed seven digits.
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
  // Canvas text is painted once, not repainted on font load like DOM text
  // is - if Work Sans/IBM Plex Mono are still downloading when this first
  // draws, Chart.js measures and paints with the fallback font forever.
  // That under-reserves space for the widest y-axis label, clipping it
  // (the exact bug this fixes: "Budget Generalist" -> "udget Generalist").
  // One forced update once the real fonts are confirmed loaded corrects
  // both the measurement and the glyphs.
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
