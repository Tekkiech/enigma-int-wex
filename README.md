# enigma-int-wex

Front-end tasks from a work experience placement at Enigma Interactive: three standalone projects, each using [Parcel](https://parceljs.org/) as the dev server and bundler, plus a fourth project combining all three chart/table/map libraries around one shared dataset.

## task1-chartjs

A [Chart.js](https://www.chartjs.org/) line chart comparing search interest in "Chart.js" against the general term "Chart" over time, styled as a dark, glassmorphic card with gradient-filled lines.

- `src/` is the current version, built with npm + Parcel, chart data pulled into `acquisitions.js`
- `pre-npm/` contains the earlier vanilla-JS attempt: a plain HTML page loading Chart.js from a CDN, rendering a bar chart of North East population figures by year

```bash
cd task1-chartjs
npm install
npm run dev    # Parcel dev server
npm run build  # production build
```

## task2-datatables

A [DataTables](https://datatables.net/) table showing Employment Location Quotient figures across North East local authorities, broken down by sector. Cells with a value of 1.0 or higher are highlighted so above-average concentrations stand out at a glance. Styled to sit alongside the [North East Evidence Hub](https://evidencehub.northeast-ca.gov.uk/) (black chrome, teal accent, Poppins/Inter), and responsive down to mobile via the DataTables Responsive extension — narrow screens collapse lower-priority columns behind an expandable row.

- `src/index.html` / `src/script.js` contains the table markup and the DataTables init (jQuery, DataTables and the Responsive extension bundled through npm/Parcel)
- `src/styles.css` contains the black/teal theme, footer accent, and the mobile breakpoint

```bash
cd task2-datatables
npm install
npm run dev    # Parcel dev server
npm run build  # production build
```

## task3-leafletjs

A [Leaflet](https://leafletjs.com/) map of registered heat networks across the North East, rebuilding the WIP `/heat-networks` map from the Evidence Hub's pre-prod site in the style of the live [North East Evidence Hub](https://evidencehub.northeast-ca.gov.uk/) (black chrome, Hanken Grotesk, and the site's own theme-accent colours). Circle markers are sized by the number of registered networks per local authority and coloured by network type (communal/district heating), with a filter panel to toggle each type and an overlay for DESNZ's Newcastle–Gateshead Heat Network Zoning Pilot area. The map is responsive down to mobile: the filter panel collapses behind a `<details>` toggle, and single-finger map dragging is gated behind a tap so it doesn't trap page scrolling on touch devices (mouse-wheel zoom is disabled for the same reason).

- `src/data.js` holds the map data as GeoJSON. Network counts and customer figures are real: DESNZ's "Heat Networks registered under the Heat Network (Metering and Billing) Regulations", December 2022 release, filtered to the seven North East local authorities. That register only publishes local-authority-level counts, not individual scheme names or addresses, which is why each marker represents a whole local authority rather than a single site. Swapping in a different release, or scheme-level data if that ever becomes available, only means editing this file.
- `src/script.js` sets up the Leaflet map, the count-scaled marker icons, popups and the filter/legend wiring
- `src/styles.css` contains the theme, the responsive legend/map layout, and the mobile breakpoints

```bash
cd task3-leafletjs
npm install
npm run dev   # Parcel dev server
npm run build # production build
```

## task4-vuejs



```bash
cd task4-vuejs
npm install
npm run dev   # Parcel dev server
npm run build # production build
```

## main-siteproj

A small multi-page site combining all three libraries around a single real dataset: worldwide operating system market share from [StatCounter Global Stats](https://gs.statcounter.com/os-market-share). A landing page links out to three dedicated pages, each its own Parcel entry point: `/trend` (a [Chart.js](https://www.chartjs.org/) line chart of the 36-month worldwide trend, with a clickable legend that drills into a "top 10 countries for this OS" bar chart), `/map` (a [Leaflet](https://leafletjs.com/) choropleth of the leading OS per country, full breakdown in each popup), and `/table` (a [DataTables](https://datatables.net/) listing of all 175 tracked countries and territories, sortable, searchable, responsive down to mobile), plus `/about` for where the numbers come from. The same seven-colour OS key is used everywhere, so a colour means the same thing on every page.

Unlike tasks 1-3, this one isn't an Evidence Hub deliverable, so it wears its own brand instead of the client's: the terminal chrome-bar, JetBrains Mono, palette and GSAP/ScrollTrigger scroll-reveal are ported from [tekkiech.tech](https://tekkiech.tech) ([source](https://github.com/Tekkiech/Tekkiech-Space)). Splitting each view onto its own page means each one only ships the library it actually needs (Chart.js on `/trend`, Leaflet on `/map`, jQuery/DataTables on `/table`) instead of all three landing on whichever page the visitor happens to open first; the shared 200KB country dataset is still fetched lazily (only once someone opens `/map`, `/table`, or clicks a legend key on `/trend`) via dynamic `import()`.

- `src/data/trend.js` and `src/data/world-os-share.json` are the data. StatCounter Global Stats doesn't publish a public API, so these are a snapshot pulled from the same JSON endpoint its own site chart uses (`chart.php`, `forceJson=true`), fetched 2026-09-15; `world-os-share.json` also joins that per-country breakdown to boundaries from [Natural Earth](https://github.com/nvkelso/natural-earth-vector)'s public-domain 110m admin-0 set. Swapping in a fresher pull, or a different StatCounter metric (browser, screen resolution, search engine), only means replacing these two files.
- `src/data/os-colors.js` is the shared colour key used by the chart, the map and the table, read from the `--os-*` CSS custom properties in `styles.css` so it follows the light/dark theme toggle automatically
- `src/theme.js` is shared by every page: the light/dark toggle, active-nav-link highlighting, and the GSAP scroll-reveal setup
- `src/trend/`, `src/map/`, `src/table/` and `src/about/` each hold that page's `index.html` (and `script.js`, where there's page-specific behaviour); `src/index.html` is the landing page; `src/styles.css` is the shared tekkiech.tech-derived theme

```bash
cd main-siteproj
npm install
npm run dev   # Parcel dev server
npm run build # production build
```
