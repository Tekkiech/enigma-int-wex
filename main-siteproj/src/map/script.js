import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { bootPage } from '../theme.js';
import { OS_NAMES, colorFor, noDataColor, cssVar } from '../data/os-colors.js';
import { loadWorldOsShare } from '../data/load-world-os-share.js';

bootPage();

function breakdownList(breakdown) {
  return breakdown
    .map((b) => `<li><span class="dot" style="background:${colorFor(b.os)}"></span>${b.os}<span class="share">${b.share}%</span></li>`)
    .join('');
}

async function initMap() {
  const worldOsShare = await loadWorldOsShare();

  // The page has just finished its initial layout, but wait a frame
  // anyway before measuring the container: Leaflet reads its container's
  // box size at construction time, and creating it too early (before a
  // layout pass) makes it render tiles and the country layer at the
  // wrong size - clipping content and leaving the rest of the container
  // blank.
  await new Promise((resolve) => requestAnimationFrame(resolve));

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

  const countryLayer = L.geoJSON(worldOsShare, {
    style: (feature) => ({
      fillColor: colorFor(feature.properties.topOs),
      fillOpacity: 0.92,
      color: cssVar('--surface', '#141312'),
      weight: 0.75,
      lineJoin: 'round',
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

  function renderLegend() {
    document.getElementById('map-legend').innerHTML = `
      <h3>Leading OS</h3>
      ${OS_NAMES.map((os) => `<div class="map-legend__row"><span class="map-legend__swatch" style="background:${colorFor(os)}"></span>${os}</div>`).join('')}
      <div class="map-legend__row"><span class="map-legend__swatch" style="background:${noDataColor()}"></span>No data</div>
    `;
  }
  renderLegend();

  // Fill colours are resolved from CSS custom properties at draw time
  // (see os-colors.js), so re-styling on theme change keeps the map and
  // its legend in sync with the toggle instead of freezing at whichever
  // theme was active when the map first drew.
  document.addEventListener('themechange', () => {
    countryLayer.setStyle((feature) => ({
      fillColor: colorFor(feature.properties.topOs),
      color: cssVar('--surface', '#141312'),
    }));
    renderLegend();
  });

  // Belt-and-braces alongside the layout wait above: re-measure whenever
  // the container's actual box size changes for any reason (window
  // resize, the reveal-block's own entrance transform settling, fonts
  // loading late and reflowing the page, etc.).
  new ResizeObserver(() => map.invalidateSize()).observe(document.getElementById('map'));

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

  map.invalidateSize();
}

initMap();
