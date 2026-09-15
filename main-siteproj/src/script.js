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

    // The mount div was just injected via innerHTML above, so the browser
    // hasn't necessarily laid it out yet. Creating the Leaflet map before
    // that layout pass makes it measure the wrong container size (usually
    // 0 height, sometimes a stale value), and it renders tiles and the
    // country layer to that wrong size instead of the real one -
    // clipping or offsetting everything and leaving the rest of the
    // container blank. Two animation frames guarantees a layout pass has
    // happened first.
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

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

    const legendEl = document.getElementById('map-legend');
    legendEl.innerHTML = `
      <h3>Leading OS</h3>
      ${OS_NAMES.map((os) => `<div class="map-legend__row"><span class="map-legend__swatch" style="background:${colorFor(os)}"></span>${os}</div>`).join('')}
      <div class="map-legend__row"><span class="map-legend__swatch" style="background:${noDataColor()}"></span>No data</div>
    `;

    // Belt-and-braces alongside the layout wait above: re-measure whenever
    // the container's actual box size changes for any reason (window
    // resize, the reveal-block's own entrance transform settling, fonts
    // loading late and reflowing the page, etc.), not just on window
    // resize.
    const mapCard = document.getElementById('map');
    new ResizeObserver(() => map.invalidateSize()).observe(mapCard);

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

function osCell(os) {
  if (!os) return '';
  return `<span class="os-cell"><span class="dot" style="background:${colorFor(os)}"></span>${os}</span>`;
}

function shareCell(share) {
  return share == null ? '' : `${share}%`;
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

    // Every column below gets its own uniquely-named field - DataTables'
    // Responsive extension tracks columns by their `data` key, and two
    // columns sharing one key (as this used to do, reusing the same
    // breakdown entry for both its "OS" and "share" columns) made it
    // mix up which value belonged to which column once it started
    // collapsing/reordering them, corrupting cells including the name.
    const rows = [...worldOsShare.features]
      .sort((a, b) => a.properties.name.localeCompare(b.properties.name))
      .map((f) => {
        const [first, second, third] = f.properties.breakdown;
        return {
          name: f.properties.name,
          os1: first?.os ?? null,
          share1: first?.share ?? null,
          os2: second?.os ?? null,
          share2: second?.share ?? null,
          os3: third?.os ?? null,
          share3: third?.share ?? null,
        };
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
        { data: 'os1', render: (v) => osCell(v) },
        { data: 'share1', render: (v) => shareCell(v) },
        { data: 'os2', render: (v) => osCell(v) },
        { data: 'share2', render: (v) => shareCell(v) },
        { data: 'os3', render: (v) => osCell(v) },
        { data: 'share3', render: (v) => shareCell(v) },
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
