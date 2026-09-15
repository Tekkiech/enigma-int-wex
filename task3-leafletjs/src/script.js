import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { schemes, zones } from './data.js';

const STATUS = {
  operational: { label: 'Operational', color: '#33a38c' },
  planned: { label: 'Planned', color: '#ed1163' },
  feasibility: { label: 'Feasibility study', color: '#00478a' },
};

const FLAME_PATH =
  'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z';

function buildIcon(status) {
  const color = STATUS[status].color;
  return L.divIcon({
    className: 'heat-marker',
    html: `
      <span class="heat-marker__dot" style="background:${color}">
        <svg viewBox="0 0 24 24" width="13" height="13" fill="#fff">
          <path d="${FLAME_PATH}" />
        </svg>
      </span>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -12],
  });
}

const map = L.map('map', {
  center: [54.95, -1.55],
  zoom: 9,
  zoomControl: false,
  minZoom: 8,
  maxZoom: 16,
  // A page-scroll mouse wheel over the map would otherwise zoom the map
  // instead of scrolling the page; zoom buttons, double-click and touch
  // pinch remain available.
  scrollWheelZoom: false,
});

L.control.zoom({ position: 'bottomright' }).addTo(map);
L.control.scale({ position: 'bottomleft', imperial: false }).addTo(map);

// CARTO's free raster basemaps now need an API key, so we use standard OSM
// tiles instead and mute them with a CSS filter (see styles.css) so the
// markers stay the highest-contrast thing on screen.
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  subdomains: 'abc',
  maxZoom: 19,
}).addTo(map);

const zoneLayer = L.geoJSON(zones, {
  style: {
    color: '#33a38c',
    weight: 1.5,
    dashArray: '6 4',
    fillColor: '#33a38c',
    fillOpacity: 0.12,
  },
  onEachFeature: (feature, layer) => {
    layer.bindTooltip(feature.properties.name, { sticky: true, className: 'heat-tooltip' });
  },
}).addTo(map);

const statusLayers = {
  operational: L.layerGroup(),
  planned: L.layerGroup(),
  feasibility: L.layerGroup(),
};

schemes.features.forEach((feature) => {
  const [lng, lat] = feature.geometry.coordinates;
  const p = feature.properties;
  const marker = L.marker([lat, lng], { icon: buildIcon(p.status) });

  marker.bindPopup(`
    <div class="heat-popup">
      <span class="heat-popup__badge" style="background:${STATUS[p.status].color}">${STATUS[p.status].label}</span>
      <h3>${p.name}</h3>
      <p class="heat-popup__meta">${p.localAuthority} &middot; ${p.capacity}</p>
      <p>${p.description}</p>
      ${p.connectedBuildings ? `<p class="heat-popup__meta">${p.connectedBuildings} connected buildings</p>` : ''}
    </div>
  `);

  statusLayers[p.status].addLayer(marker);
});

Object.values(statusLayers).forEach((layer) => layer.addTo(map));

document.querySelectorAll('[data-status-filter]').forEach((checkbox) => {
  checkbox.addEventListener('change', () => {
    const layer = statusLayers[checkbox.dataset.statusFilter];
    if (checkbox.checked) {
      layer.addTo(map);
    } else {
      map.removeLayer(layer);
    }
  });
});

const zoneToggle = document.querySelector('[data-zone-toggle]');
zoneToggle.addEventListener('change', () => {
  if (zoneToggle.checked) {
    zoneLayer.addTo(map);
  } else {
    map.removeLayer(zoneLayer);
  }
});

// Collapse the filter/key panel by default on narrow screens so the map
// is the first thing visible, but leave it open on wider layouts where
// it sits alongside the map rather than above it.
const legend = document.getElementById('legend');
legend.open = window.matchMedia('(min-width: 900px)').matches;
legend.addEventListener('toggle', () => map.invalidateSize());
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
