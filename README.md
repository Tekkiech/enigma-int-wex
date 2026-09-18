# enigma-int-wex

Front-end development deliverables from a technical placement at Enigma Interactive. The repository contains four standalone task modules alongside an integrated multi-page analytics platform that combines all three visualization libraries around a single global dataset. Each module uses [Parcel](https://parceljs.org/) as its build tool and development server.

---

## task1-chartjs

**Live:** [enigmatask1-chartjs.vercel.app](https://enigmatask1-chartjs.vercel.app/)

An interactive [Chart.js](https://www.chartjs.org/) line chart comparing relative search interest between "Chart.js" and the broader term "Chart" over time. Styled as a dark glassmorphic card with gradient fills under each trend line.

* `src/`: the main app, compiled via npm and Parcel; `acquisitions.js` handles data loading and chart setup.
* `pre-npm/`: a standalone vanilla JS prototype that loads Chart.js from a CDN to chart regional North East population figures as a bar chart.

```bash
cd task1-chartjs
npm install
npm run dev    # Parcel dev server
npm run build  # production build
```

---

## task2-datatables

**Live:** [enigmatask2-datatables.vercel.app](https://enigmatask2-datatables.vercel.app/)

An interactive [DataTables](https://datatables.net/) grid showing Employment Location Quotient figures across North East local authorities by sector, with values of 1.0 or higher highlighted to flag industry specialization above the national baseline. Follows the [North East Evidence Hub](https://evidencehub.northeast-ca.gov.uk/) visual identity (black chrome theme, teal accents, Poppins and Inter typography), and uses the DataTables Responsive extension to collapse lower-priority columns into expandable child rows on smaller viewports.

* `src/index.html` & `src/script.js`: tabular layout and DataTables initialization using jQuery and DataTables Responsive, bundled via Parcel.
* `src/styles.css`: black chrome theme, teal highlights, and responsive viewport rules.

```bash
cd task2-datatables
npm install
npm run dev    # Parcel dev server
npm run build  # production build
```

---

## task3-leafletjs

**Live:** [enigmatask3-leafletjs.vercel.app](https://enigmatask3-leafletjs.vercel.app/)

An interactive [Leaflet](https://leafletjs.com/) map displaying registered heat networks across the North East, styled after the [North East Evidence Hub](https://evidencehub.northeast-ca.gov.uk/) (black chrome layout, Hanken Grotesk typography, themed accent markers). Proportional circle markers are scaled by total registered networks per local authority and color-coded by infrastructure type (communal vs. district heating). Includes filter controls to toggle network types and a vector boundary overlay representing the DESNZ Newcastle–Gateshead Heat Network Zoning Pilot. The map is optimized for mobile viewports: filter controls collapse inside a `<details>` element, single-finger panning requires an explicit tap to prevent page-scroll lock, and scroll-wheel zoom is disabled.

* `src/data.js`: spatial features formatted as GeoJSON, derived from the DESNZ December 2022 Heat Network Register for seven North East local authorities. Official dataset releases publish aggregated figures per authority rather than discrete scheme coordinates, so markers represent authority centroids.
* `src/script.js`: map initialization, dynamic marker scaling, popup template rendering, and filter legend bindings.
* `src/styles.css`: theme definitions, map container dimensions, and responsive breakpoint rules.

```bash
cd task3-leafletjs
npm install
npm run dev   # Parcel dev server
npm run build # production build
```

---

## task4-vuejs

**Live:** [enigmatask4-vuejs.vercel.app](https://enigmatask4-vuejs.vercel.app/)

A [Vue 3](https://vuejs.org/) + [Pinia](https://pinia.vuejs.org/) storefront called "Tekkiech.Market". Products, accounts, cart, and orders are all real, served by a [Flask](https://flask.palletsprojects.com/) API (`server/`) backed by SQLite, seeded once from [DummyJSON](https://dummyjson.com/). There's also a `/metrics` page with a Chart.js + Leaflet dashboard built from fake shopper data (`analytics/`).

This one needs the API and the frontend running at once.

```bash
cd task4-vuejs/server
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python run.py     # sets up the database, adds fake /metrics data, then runs on http://localhost:5000
```

```bash
cd task4-vuejs
npm install
npm run dev   # Parcel dev server, http://localhost:1350
npm run build # production build
```

More detail on the API and database: `task4-vuejs/server/README.md`.

---

## main-siteproj

**Live:** [enigmamain-siteproj.vercel.app](https://enigmamain-siteproj.vercel.app/)

A multi-page analytics site combining Chart.js, Leaflet, and DataTables to track worldwide operating system market share using [StatCounter Global Stats](https://gs.statcounter.com/os-market-share) data. Each section operates as an independent Parcel entry point:

* `/trend`: A [Chart.js](https://www.chartjs.org/) time-series line chart tracking 36-month global market share, with interactive legend drill-down into top-10 country distributions per OS.
* `/map`: A [Leaflet](https://leafletjs.com/) choropleth map showing leading operating systems by country, with detailed regional popups.
* `/table`: A [DataTables](https://datatables.net/) data grid indexing 175 tracked countries with searching, sorting, and responsive column collapsing.
* `/about`: Project documentation on data sources and methodology.

It uses a developer theme adapted from [tekkiech.tech](https://tekkiech.tech) (terminal header, JetBrains Mono typography, dark/light theme switching, and GSAP ScrollTrigger animations). Splitting entry points means each view only loads the visualization library it actually needs. The primary 200KB dataset is fetched on demand via dynamic `import()` statements when loading `/map`, `/table`, or legend drill-downs on `/trend`.

* `src/data/trend.js` & `src/data/world-os-share.json`: StatCounter Global Stats 36-month tracking snapshot joined with [Natural Earth](https://github.com/nvkelso/natural-earth-vector) 110m admin-0 country boundaries.
* `src/data/os-colors.js`: reads `--os-*` CSS custom properties from `styles.css` at runtime, so branding stays in sync across theme toggles.
* `src/theme.js`: shared script handling light/dark theme persistence, navigation highlights, and GSAP scroll animations.
* `src/trend/`, `src/map/`, `src/table/`, `src/about/`: individual page markup and execution scripts.
* `src/index.html` & `src/styles.css`: central portal page and core design system styles.

```bash
cd main-siteproj
npm install
npm run dev   # Parcel dev server
npm run build # production build
```