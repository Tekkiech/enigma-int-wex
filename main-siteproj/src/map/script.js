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

  // wait a frame before building the map - Leaflet measures its
  // container as soon as it's created, and doing that too early gives
  // it the wrong size (tiles look clipped/blank). Falls back to a short
  // timeout too, since requestAnimationFrame won't fire while the tab
  // is in the background.
  await Promise.race([
    new Promise((resolve) => requestAnimationFrame(resolve)),
    new Promise((resolve) => setTimeout(resolve, 150)),
  ]);

  const map = L.map('map', {
    center: [20, 8],
    zoom: 1,
    zoomControl: false,
    minZoom: 1,
    maxZoom: 8,
    worldCopyJump: true,
    // turned off so a normal scroll over the map still scrolls the
    // page - scroll-to-zoom is added back further down, but gated
    // behind ctrl/cmd so both gestures work
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

  // colors come from CSS variables (os-colors.js), so redraw on theme
  // change or the map stays stuck on whichever theme it first loaded in
  document.addEventListener('themechange', () => {
    countryLayer.setStyle((feature) => ({
      fillColor: colorFor(feature.properties.topOs),
      color: cssVar('--surface', '#141312'),
    }));
    renderLegend();
  });

  // re-measure any time the map's box changes size for any reason
  // (window resize, late-loading fonts reflowing the page, etc.)
  new ResizeObserver(() => map.invalidateSize()).observe(document.getElementById('map'));

  // ---- Scroll to zoom, gated behind ctrl/cmd ----
  // holding ctrl (or cmd on Mac) while scrolling zooms the map, same as
  // Google Maps - a plain scroll still just scrolls the page
  const mapEl = document.getElementById('map');
  mapEl.addEventListener(
    'wheel',
    (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const point = map.mouseEventToContainerPoint(e);
      const nextZoom = map.getZoom() + (e.deltaY < 0 ? 0.5 : -0.5);
      map.setZoomAround(point, nextZoom, { animate: false });
    },
    { passive: false }
  );

  if (!window.matchMedia('(pointer: coarse)').matches) {
    const zoomHint = document.createElement('span');
    zoomHint.className = 'map-zoom-hint';
    zoomHint.textContent = navigator.platform.includes('Mac') ? '⌘ scroll to zoom' : 'ctrl + scroll to zoom';
    document.querySelector('.map-card').appendChild(zoomHint);
  }

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
