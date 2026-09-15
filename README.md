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

## main-siteproj

A one-page dashboard combining all three libraries around a single real dataset: worldwide operating system market share from [StatCounter Global Stats](https://gs.statcounter.com/os-market-share). A [Chart.js](https://www.chartjs.org/) line chart shows the 36-month worldwide trend, a [Leaflet](https://leafletjs.com/) choropleth shows the leading OS per country with a full breakdown in each popup, and a [DataTables](https://datatables.net/) table lists every one of the 175 tracked countries and territories, sortable, searchable, and responsive down to mobile. The same seven-colour OS key (sampled from the Evidence Hub's own theme-accent palette) is used across all three, so a colour means the same thing everywhere on the page.

- `src/data/trend.js` and `src/data/world-os-share.json` are the data. StatCounter Global Stats doesn't publish a public API, so these are a snapshot pulled from the same JSON endpoint its own site chart uses (`chart.php`, `forceJson=true`), fetched 2026-09-15; `world-os-share.json` also joins that per-country breakdown to boundaries from [Natural Earth](https://github.com/nvkelso/natural-earth-vector)'s public-domain 110m admin-0 set. Swapping in a fresher pull, or a different StatCounter metric (browser, screen resolution, search engine), only means replacing these two files.
- `src/data/os-colors.js` is the shared colour key used by the chart, the map and the table
- `src/script.js` sets up all three libraries; `src/styles.css` is the shared Evidence Hub theme

```bash
cd main-siteproj
npm install
npm run dev   # Parcel dev server
npm run build # production build
```
