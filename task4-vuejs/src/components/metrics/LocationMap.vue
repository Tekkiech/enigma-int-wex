<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CHROME, SEQUENTIAL_BLUE } from '../../data/chartTokens.js';

const props = defineProps({
  rows: { type: Array, required: true }, // [{ city, region, lat, lng, revenue, orderCount, topPersona }]
});

const container = ref(null);
let map;
let markerLayer;

const MIN_RADIUS = 6;
const MAX_RADIUS = 28;

// We use sqrt here instead of just scaling the radius directly, because a
// circle's size looks bigger than its radius - a straight scale would make
// the biggest city look way more dominant than it should.
function radiusFor(revenue, maxRevenue) {
  if (maxRevenue <= 0) return MIN_RADIUS;
  const t = Math.sqrt(revenue / maxRevenue);
  return MIN_RADIUS + t * (MAX_RADIUS - MIN_RADIUS);
}

function formatCurrency(value) {
  return `$${Math.round(value).toLocaleString()}`;
}

function humanize(slug) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// Builds the popup that shows up when you hover a dot on the map.
function buildTooltip(row) {
  const wrap = document.createElement('div');
  wrap.className = 'location-map__tooltip';

  const title = document.createElement('strong');
  title.textContent = `${row.city}, ${row.region}`;
  wrap.appendChild(title);

  const lines = [
    `${formatCurrency(row.revenue)} revenue`,
    `${row.orderCount.toLocaleString()} orders`,
    `Mostly ${humanize(row.topPersona)}`,
  ];
  for (const line of lines) {
    const p = document.createElement('div');
    p.textContent = line;
    wrap.appendChild(p);
  }
  return wrap;
}

function renderMarkers() {
  markerLayer.clearLayers();
  const maxRevenue = Math.max(0, ...props.rows.map((r) => r.revenue));

  for (const row of props.rows) {
    const marker = L.circleMarker([row.lat, row.lng], {
      radius: radiusFor(row.revenue, maxRevenue),
      color: CHROME.surface, // white ring so overlapping circles are easier to tell apart
      weight: 2,
      fillColor: SEQUENTIAL_BLUE[500],
      fillOpacity: 0.72,
    });
    marker.bindTooltip(buildTooltip(row), {
      sticky: true,
      direction: 'top',
      offset: [0, -4],
      className: 'location-map__tooltip-wrap',
    });
    markerLayer.addLayer(marker);
  }
}

onMounted(() => {
  map = L.map(container.value, {
    center: [39.5, -98.35],
    zoom: 4,
    zoomControl: true,
    // Off, so scrolling the mouse wheel over the map scrolls the page
    // instead of zooming the map. You can still zoom with the buttons.
    scrollWheelZoom: false,
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: 'abc',
    maxZoom: 19,
  }).addTo(map);

  markerLayer = L.layerGroup().addTo(map);
  renderMarkers();
});

watch(() => props.rows, renderMarkers);

onUnmounted(() => map?.remove());
</script>

<template>
  <div class="location-map">
    <div ref="container" class="location-map__canvas"></div>
    <div class="location-map__legend">
      <p class="location-map__legend-label">Revenue</p>
      <div class="location-map__legend-row">
        <span class="location-map__legend-dot" style="width: 12px; height: 12px"></span>
        <span>Lower</span>
      </div>
      <div class="location-map__legend-row">
        <span class="location-map__legend-dot" style="width: 24px; height: 24px"></span>
        <span>Higher</span>
      </div>
    </div>
  </div>
</template>
