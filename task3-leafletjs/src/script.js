import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { networks, zones } from './data.js';

const NETWORK_TYPE = {
  communal: { label: 'Communal heating', color: '#33a38c' },
  district: { label: 'District heating', color: '#00478a' },
};

// shifts the district marker a bit so it doesn't sit right on top of
// the communal marker at the same spot
const DISTRICT_OFFSET = [0.014, -0.009];

const FLAME_PATH =
  'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z';

// counts in the data range from 2 to 231 - scale those onto a 9-20px
// radius (square root, so it's the marker's AREA that's proportional,
// not just its width) so one huge number doesn't dwarf all the others
const COUNT_DOMAIN = [2, 231];
const RADIUS_RANGE = [9, 20];

function radiusForCount(count) {
  const [minC, maxC] = COUNT_DOMAIN;
  const [minR, maxR] = RADIUS_RANGE;
  const t = (Math.sqrt(count) - Math.sqrt(minC)) / (Math.sqrt(maxC) - Math.sqrt(minC));
  return minR + Math.max(0, Math.min(1, t)) * (maxR - minR);
}

function buildIcon(type, count) {
  const color = NETWORK_TYPE[type].color;
  const r = radiusForCount(count);
  const size = r * 2;
  const iconPx = Math.round(size * 0.5);

  return L.divIcon({
    className: 'heat-marker',
    html: `
      <span class="heat-marker__dot" style="background:${color}; width:${size}px; height:${size}px;">
        <svg viewBox="0 0 24 24" width="${iconPx}" height="${iconPx}" fill="#fff">
          <path d="${FLAME_PATH}" />
        </svg>
      </span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

const map = L.map('map', {
  center: [54.95, -1.55],
  zoom: 9,
  zoomControl: false,
  minZoom: 8,
  maxZoom: 16,
  // without this, scrolling the page over the map zooms it instead -
  // the zoom buttons and pinch-to-zoom still work fine
  scrollWheelZoom: false,
});

L.control.zoom({ position: 'bottomright' }).addTo(map);
L.control.scale({ position: 'bottomleft', imperial: false }).addTo(map);

// using plain OSM map tiles, toned down a bit in styles.css so the
// markers stand out more
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  subdomains: 'abc',
  maxZoom: 19,
}).addTo(map);

const zoneLayer = L.geoJSON(zones, {
  style: {
    color: '#ed1163',
    weight: 1.5,
    dashArray: '6 4',
    fillColor: '#ed1163',
    fillOpacity: 0.1,
  },
  onEachFeature: (feature, layer) => {
    layer.bindTooltip(feature.properties.name, { sticky: true, className: 'heat-tooltip' });
  },
}).addTo(map);

const networkLayers = {
  communal: L.layerGroup(),
  district: L.layerGroup(),
};

function customerLine(customers) {
  const parts = [];
  if (customers.residential) parts.push(`${customers.residential.toLocaleString()} residential`);
  if (customers.commercial) parts.push(`${customers.commercial.toLocaleString()} commercial`);
  if (customers.industrial) parts.push(`${customers.industrial.toLocaleString()} industrial`);
  if (customers.public) parts.push(`${customers.public.toLocaleString()} public sector`);
  if (customers.other) parts.push(`${customers.other.toLocaleString()} other`);
  return parts.join(', ');
}

networks.features.forEach((feature) => {
  const [lng, lat] = feature.geometry.coordinates;
  const p = feature.properties;
  const total = p.communal + p.district;

  ['communal', 'district'].forEach((type) => {
    const count = p[type];
    if (!count) return;

    const otherType = type === 'communal' ? 'district' : 'communal';
    const [dLng, dLat] = type === 'district' ? DISTRICT_OFFSET : [0, 0];
    const marker = L.marker([lat + dLat, lng + dLng], { icon: buildIcon(type, count) });

    marker.bindPopup(`
      <div class="heat-popup">
        <span class="heat-popup__badge" style="background:${NETWORK_TYPE[type].color}">${NETWORK_TYPE[type].label}</span>
        <h3>${p.localAuthority}</h3>
        <p class="heat-popup__meta">${count} registered ${NETWORK_TYPE[type].label.toLowerCase()} network${count === 1 ? '' : 's'} &middot; December 2022</p>
        <p class="heat-popup__meta">${p[otherType]} ${NETWORK_TYPE[otherType].label.toLowerCase()} &middot; ${total} registered networks in total</p>
        <p>${p.customers.total.toLocaleString()} customers served: ${customerLine(p.customers)}.</p>
      </div>
    `);

    networkLayers[type].addLayer(marker);
  });
});

Object.values(networkLayers).forEach((layer) => layer.addTo(map));

document.querySelectorAll('[data-network-filter]').forEach((checkbox) => {
  checkbox.addEventListener('change', () => {
    const layer = networkLayers[checkbox.dataset.networkFilter];
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

// start the legend closed on small screens (map first), open on bigger
// screens where it sits next to the map instead of above it
const legend = document.getElementById('legend');
legend.open = window.matchMedia('(min-width: 900px)').matches;
legend.addEventListener('toggle', () => map.invalidateSize());
window.addEventListener('resize', () => map.invalidateSize());

// on touch screens, don't let the map grab swipes until you tap it
// first - otherwise you can't scroll the page past the map
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
