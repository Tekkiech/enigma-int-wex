# enigma-int-wex

Front-end tasks from a work experience placement at Enigma Interactive: three standalone projects, each using [Parcel](https://parceljs.org/) as the dev server and bundler.

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