import Chart from 'chart.js/auto';
import { bootPage } from '../theme.js';
import { months, series } from '../data/trend.js';
import { colorFor, cssVar } from '../data/os-colors.js';
import { loadWorldOsShare } from '../data/load-world-os-share.js';

bootPage();

// ---- Main chart: worldwide monthly trend ----

let chart;

function buildChart() {
  chart = new Chart(document.getElementById('trend-chart'), {
    type: 'line',
    data: {
      labels: months,
      datasets: series.map(({ os, values }) => ({
        label: os,
        data: values,
        borderColor: colorFor(os),
        backgroundColor: colorFor(os),
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.25,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 4, bottom: 8 } },
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: {
          ticks: { color: cssVar('--muted', '#8f8b82'), maxRotation: 0, autoSkip: true, maxTicksLimit: 9 },
          grid: { color: cssVar('--border', '#2b2925') },
        },
        y: {
          ticks: { color: cssVar('--muted', '#8f8b82'), callback: (v) => `${v}%` },
          grid: { color: cssVar('--border', '#2b2925') },
          beginAtZero: true,
        },
      },
      plugins: {
        legend: {
          position: 'top',
          align: 'start',
          labels: {
            color: cssVar('--text', '#ece9e3'),
            usePointStyle: true,
            pointStyle: 'circle',
            boxWidth: 8,
            boxHeight: 8,
            padding: 24,
            font: { family: 'JetBrains Mono', size: 12 },
          },
          // Keep the default toggle-series-visibility behaviour, and
          // additionally drive the drill-down chart below.
          onClick: (event, legendItem, legend) => {
            Chart.defaults.plugins.legend.onClick(event, legendItem, legend);
            showDrillDown(legendItem.text);
          },
        },
        tooltip: {
          callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw}%` },
        },
      },
    },
  });
}

function updateChartTheme() {
  if (!chart) return;
  chart.data.datasets.forEach((ds) => {
    ds.borderColor = colorFor(ds.label);
    ds.backgroundColor = colorFor(ds.label);
  });
  chart.options.scales.x.ticks.color = cssVar('--muted', '#8f8b82');
  chart.options.scales.x.grid.color = cssVar('--border', '#2b2925');
  chart.options.scales.y.ticks.color = cssVar('--muted', '#8f8b82');
  chart.options.scales.y.grid.color = cssVar('--border', '#2b2925');
  chart.options.plugins.legend.labels.color = cssVar('--text', '#ece9e3');
  chart.update();
  if (drillDownChart) updateDrillDownTheme();
}

buildChart();

// ---- Drill-down: top 10 countries for whichever OS was clicked ----
// Built from the same per-country dataset the map and table pages use,
// fetched only once someone actually clicks a legend key rather than on
// page load, so the trend page's own load stays light.

let drillDownChart;
let drillDownDataPromise;
let activeOs;

function loadCountryTotals() {
  if (!drillDownDataPromise) {
    drillDownDataPromise = loadWorldOsShare();
  }
  return drillDownDataPromise;
}

async function showDrillDown(os) {
  activeOs = os;
  document.getElementById('drilldown-os').textContent = ` — ${os}`;
  document.getElementById('drilldown-command').textContent = `grep ${os.replace(/\s+/g, '')} --top 10`;
  document.getElementById('drilldown-hint').textContent = `Share of visits from ${os}, highest first, August 2026.`;

  const worldOsShare = await loadCountryTotals();
  if (activeOs !== os) return; // a later click won while this fetch was in flight

  const top = worldOsShare.features
    .map((f) => ({ name: f.properties.name, share: f.properties.breakdown.find((b) => b.os === os)?.share }))
    .filter((row) => row.share != null)
    .sort((a, b) => b.share - a.share)
    .slice(0, 10);

  const wrap = document.getElementById('drilldown-chart-wrap');
  wrap.hidden = false;

  const chartData = {
    labels: top.map((row) => row.name),
    datasets: [
      {
        label: `${os} share`,
        data: top.map((row) => row.share),
        backgroundColor: colorFor(os),
        borderRadius: 4,
        maxBarThickness: 28,
      },
    ],
  };

  if (drillDownChart) {
    drillDownChart.data = chartData;
    drillDownChart.update();
    return;
  }

  drillDownChart = new Chart(document.getElementById('drilldown-chart'), {
    type: 'bar',
    data: chartData,
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 4, bottom: 4 } },
      scales: {
        x: {
          ticks: { color: cssVar('--muted', '#8f8b82'), callback: (v) => `${v}%` },
          grid: { color: cssVar('--border', '#2b2925') },
          beginAtZero: true,
        },
        y: {
          ticks: { color: cssVar('--text', '#ece9e3') },
          grid: { display: false },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => ` ${ctx.raw}%` } },
      },
    },
  });
}

function updateDrillDownTheme() {
  if (!drillDownChart || !activeOs) return;
  drillDownChart.data.datasets[0].backgroundColor = colorFor(activeOs);
  drillDownChart.options.scales.x.ticks.color = cssVar('--muted', '#8f8b82');
  drillDownChart.options.scales.x.grid.color = cssVar('--border', '#2b2925');
  drillDownChart.options.scales.y.ticks.color = cssVar('--text', '#ece9e3');
  drillDownChart.update();
}

document.addEventListener('themechange', updateChartTheme);
