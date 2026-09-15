import Chart from 'chart.js/auto';
import { months, series } from './data/trend.js';
import { OS_NAMES, colorFor, noDataColor, cssVar } from './data/os-colors.js';

// Fetched lazily (not statically imported) so the ~200KB country
// dataset ships as its own cacheable network request instead of being
// inlined into a JS chunk; shared by the map and table so it's only
// fetched once regardless of which loads first.
let worldOsSharePromise = null;
function loadWorldOsShare() {
  if (!worldOsSharePromise) {
    // Parcel resolves a dynamic JSON import to the parsed data directly,
    // not ESM-wrapped with a `default` key (unlike a static import).
    worldOsSharePromise = import('./data/world-os-share.json').then((mod) => mod.default ?? mod);
  }
  return worldOsSharePromise;
}

// ---- Theme ----

const THEME_KEY = 'main-siteproj-theme';
const themeToggle = document.getElementById('theme-toggle');
const themeLabel = document.getElementById('theme-label');
const themeColorMeta = document.getElementById('theme-color-meta');

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
  if (themeLabel) themeLabel.textContent = theme;
  if (themeColorMeta) themeColorMeta.setAttribute('content', theme === 'light' ? '#f6f4ef' : '#0b0b0a');
  updateChartTheme();
}

if (themeLabel) {
  themeLabel.textContent = document.documentElement.getAttribute('data-theme') || 'dark';
}
themeToggle?.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

// ---- Chart: worldwide monthly trend (eager - above the fold) ----

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
          labels: { color: cssVar('--text', '#ece9e3'), usePointStyle: true, pointStyle: 'circle', boxWidth: 8, padding: 16, font: { family: 'JetBrains Mono' } },
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
}

buildChart();

// ---- Map: leading OS by country (lazy - built on scroll-near) ----

let mapInitPromise = null;

function initMap() {
  if (mapInitPromise) return mapInitPromise;

  mapInitPromise = (async () => {
    const mount = document.getElementById('map-mount');
    mount.innerHTML = `
      <div class="map-shell">
        <div class="map-legend" id="map-legend"></div>
        <div class="map-card"><div id="map"></div></div>
      </div>
    `;

    const [leafletModule, worldOsShare] = await Promise.all([
      import('leaflet'),
      loadWorldOsShare(),
      import('leaflet/dist/leaflet.css'),
    ]);
    // Same dynamic-import interop quirk as jQuery/JSON below: Leaflet's
    // UMD export resolves directly, not wrapped with `default`.
    const L = leafletModule.default ?? leafletModule;

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
        .map((b) => `<li><span class="dot" style="background:${colorFor(b.os)}"></span>${b.os}<span class="share">${b.share}%</span></li>`)
        .join('');
    }

    L.geoJSON(worldOsShare, {
      style: (feature) => ({
        fillColor: colorFor(feature.properties.topOs),
        fillOpacity: 0.85,
        color: cssVar('--bg', '#0b0b0a'),
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

    const legendEl = document.getElementById('map-legend');
    legendEl.innerHTML = `
      <h3>Leading OS</h3>
      ${OS_NAMES.map((os) => `<div class="map-legend__row"><span class="map-legend__swatch" style="background:${colorFor(os)}"></span>${os}</div>`).join('')}
      <div class="map-legend__row"><span class="map-legend__swatch" style="background:${noDataColor()}"></span>No data</div>
    `;

    window.addEventListener('resize', () => map.invalidateSize());

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
  })();

  return mapInitPromise;
}

// ---- Table: full country breakdown (lazy - built on scroll-near) ----

let tableInitPromise = null;

function osCell(entry) {
  if (!entry) return '';
  return `<span class="os-cell"><span class="dot" style="background:${colorFor(entry.os)}"></span>${entry.os}</span>`;
}

function initTable() {
  if (tableInitPromise) return tableInitPromise;

  tableInitPromise = (async () => {
    const mount = document.getElementById('table-mount');
    mount.innerHTML = `
      <div class="table-card">
        <table id="os-table" class="display styled-table" style="width:100%">
          <thead>
            <tr>
              <th data-priority="1">Country</th>
              <th data-priority="2">Leading OS</th>
              <th data-priority="3">Share</th>
              <th data-priority="4">2nd</th>
              <th data-priority="5">Share</th>
              <th data-priority="6">3rd</th>
              <th data-priority="6">Share</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
    `;

    const [jqueryModule, worldOsShare] = await Promise.all([
      import('jquery'),
      loadWorldOsShare(),
      import('datatables.net-dt'),
      import('datatables.net-dt/css/dataTables.dataTables.css'),
      import('datatables.net-responsive-dt'),
      import('datatables.net-responsive-dt/css/responsive.dataTables.css'),
    ]);
    // Same Parcel dynamic-import interop quirk as the JSON fetch above:
    // jQuery's UMD export resolves directly, not wrapped with `default`.
    const $ = jqueryModule.default ?? jqueryModule;

    const rows = [...worldOsShare.features]
      .sort((a, b) => a.properties.name.localeCompare(b.properties.name))
      .map((f) => {
        const [first, second, third] = f.properties.breakdown;
        return { name: f.properties.name, first, second, third };
      });

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
  })();

  return tableInitPromise;
}

// Both the map and table pull in a few hundred KB of library code
// (Leaflet, or jQuery + DataTables) plus the shared 200KB country
// dataset. Deferring that import until the section is actually about
// to scroll into view keeps the initial page load to just the chart.
const lazyObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      if (entry.target.id === 'map') initMap();
      if (entry.target.id === 'table') initTable();
    });
  },
  { rootMargin: '300px' }
);
lazyObserver.observe(document.getElementById('map'));
lazyObserver.observe(document.getElementById('table'));

// ---- Scroll animation: GSAP ScrollTrigger reveals on native scroll ----
// Ported from tekkiech.tech, minus its Lenis smooth-scroll layer: a
// dashboard that people scan and re-scroll through benefits more from
// scrolling behaving exactly like every other page (trackpad, wheel,
// keyboard, screen-reader navigation) than from inertia polish, and
// scroll-hijacking libraries are a common source of exactly that kind
// of breakage. Degrades silently to plain (unanimated, fully readable)
// content if a visitor prefers reduced motion or the CDN script fails
// to load.

function initScrollAnimations() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion || !window.gsap || !window.ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);

  gsap.fromTo(
    '.hero .prompt-line, .hero h1, .hero-tags, .hero-bio',
    { opacity: 0, y: 16 },
    { opacity: 1, y: 0, duration: 0.7, stagger: 0.08, ease: 'power3.out' }
  );

  document.querySelectorAll('.reveal-block, .page__outro').forEach((sec) => {
    gsap.fromTo(
      sec,
      { opacity: 0, y: 24 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        // 'play none none none': animate in once and stay, rather than
        // re-hiding content on every scroll back up past it - better for
        // a dashboard people scan back and forth through, not just a
        // one-way scroll.
        scrollTrigger: { trigger: sec, start: 'top 88%', toggleActions: 'play none none none' },
      }
    );
  });
}

if (document.readyState === 'complete') {
  initScrollAnimations();
} else {
  window.addEventListener('load', initScrollAnimations);
}
