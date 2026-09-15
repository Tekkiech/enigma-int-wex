import Chart from 'chart.js/auto';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import $ from 'jquery';
import 'datatables.net-dt';
import 'datatables.net-dt/css/dataTables.dataTables.css';
import 'datatables.net-responsive-dt';
import 'datatables.net-responsive-dt/css/responsive.dataTables.css';

import { months, series } from './data/trend.js';
import worldOsShare from './data/world-os-share.json';
import { OS_COLORS, NO_DATA_COLOR, colorFor } from './data/os-colors.js';

const MUTED = '#57544e';
const BORDER = '#ddd9d6';

// ---- Chart: worldwide monthly trend ----

new Chart(document.getElementById('trend-chart'), {
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
    interaction: { mode: 'index', intersect: false },
    scales: {
      x: {
        ticks: { color: MUTED, maxRotation: 0, autoSkip: true, maxTicksLimit: 9 },
        grid: { color: BORDER },
      },
      y: {
        ticks: { color: MUTED, callback: (v) => `${v}%` },
        grid: { color: BORDER },
        beginAtZero: true,
      },
    },
    plugins: {
      legend: {
        position: 'top',
        align: 'start',
        labels: { color: '#1a1a1a', usePointStyle: true, pointStyle: 'circle', boxWidth: 8, padding: 16 },
      },
      tooltip: {
        callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw}%` },
      },
    },
  },
});

// ---- Map: leading OS by country ----

const map = L.map('map', {
  center: [20, 8],
  zoom: 1,
  zoomControl: false,
  minZoom: 1,
  maxZoom: 8,
  worldCopyJump: true,
  scrollWheelZoom: false,
});

L.control.zoom({ position: 'bottomright' }).addTo(map);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  subdomains: 'abc',
  maxZoom: 19,
}).addTo(map);

function breakdownList(breakdown) {
  return breakdown
    .map(
      (b) => `<li><span class="dot" style="background:${colorFor(b.os)}"></span>${b.os}<span class="share">${b.share}%</span></li>`
    )
    .join('');
}

L.geoJSON(worldOsShare, {
  style: (feature) => ({
    fillColor: colorFor(feature.properties.topOs),
    fillOpacity: 0.85,
    color: '#ffffff',
    weight: 0.6,
  }),
  onEachFeature: (feature, layer) => {
    const p = feature.properties;
    layer.bindPopup(`
      <div class="os-popup">
        <h3>${p.name}</h3>
        <ul>${breakdownList(p.breakdown)}</ul>
      </div>
    `);
  },
}).addTo(map);

// Categorical legend: same colour key as the chart and the table.
const legendEl = document.getElementById('map-legend');
legendEl.innerHTML = `
  <h3>Leading OS</h3>
  ${Object.entries(OS_COLORS)
    .map(([os, color]) => `<div class="map-legend__row"><span class="map-legend__swatch" style="background:${color}"></span>${os}</div>`)
    .join('')}
  <div class="map-legend__row"><span class="map-legend__swatch" style="background:${NO_DATA_COLOR}"></span>No data</div>
`;

window.addEventListener('resize', () => map.invalidateSize());

// On touch devices, require a deliberate tap before the map captures
// drag gestures, so a single-finger swipe still scrolls the page until
// the visitor chooses to interact with the map.
if (window.matchMedia('(pointer: coarse)').matches) {
  map.dragging.disable();

  const hint = document.createElement('button');
  hint.type = 'button';
  hint.className = 'map-touch-hint';
  hint.textContent = 'Tap to explore the map';

  const activate = () => {
    map.dragging.enable();
    hint.remove();
  };

  hint.addEventListener('click', activate);
  map.once('dragstart zoomstart', activate);

  document.querySelector('.map-card').appendChild(hint);
}

// ---- Table: full country breakdown ----

function osCell(entry) {
  if (!entry) return '';
  return `<span class="os-cell"><span class="dot" style="background:${colorFor(entry.os)}"></span>${entry.os}</span>`;
}

const rows = [...worldOsShare.features]
  .sort((a, b) => a.properties.name.localeCompare(b.properties.name))
  .map((f) => {
    const [first, second, third] = f.properties.breakdown;
    return {
      name: f.properties.name,
      first,
      second,
      third,
    };
  });

$(document).ready(function () {
  $('#os-table').DataTable({
    data: rows,
    paging: true,
    searching: true,
    ordering: true,
    info: true,
    responsive: true,
    order: [[2, 'desc']],
    columns: [
      { data: 'name' },
      { data: 'first', render: (v) => osCell(v) },
      { data: 'first', render: (v) => (v ? `${v.share}%` : '') },
      { data: 'second', render: (v) => osCell(v) },
      { data: 'second', render: (v) => (v ? `${v.share}%` : '') },
      { data: 'third', render: (v) => osCell(v) },
      { data: 'third', render: (v) => (v ? `${v.share}%` : '') },
    ],
  });
});
