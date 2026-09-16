Here is the refined, clear, and professionally structured `README.md` file for the repository:

# enigma-int-wex

Front-end development deliverables from a technical placement at Enigma Interactive. The repository contains four standalone task modules alongside an integrated multi-page analytics platform that combines all three visualization libraries around a single global dataset. Each module uses [Parcel](https://parceljs.org/) as its build tool and development server.

---

## task1-chartjs

An interactive [Chart.js](https://www.chartjs.org/) line chart analyzing relative search interest between "Chart.js" and the broader term "Chart" over time. The UI is styled as a dark glassmorphic card featuring custom gradient fills beneath each trend line.

* `src/`: Core application source compiled via npm and Parcel, utilizing `acquisitions.js` for data loading and chart initialization.


* `pre-npm/`: A standalone vanilla JavaScript prototype loading Chart.js via CDN to render regional North East population metrics as a bar chart.



```bash
cd task1-chartjs
npm install
npm run dev    # Parcel dev server
npm run build  # production build

```

---

## task2-datatables

An interactive [DataTables](https://datatables.net/) grid displaying Employment Location Quotient figures across North East local authorities by sector. Values of 1.0 or higher are dynamically highlighted to indicate regional industry specialization above national baselines. The UI strictly follows the [North East Evidence Hub](https://evidencehub.northeast-ca.gov.uk/) visual identity (black chrome theme, teal accents, Poppins and Inter typography) and uses the DataTables Responsive extension to collapse lower-priority columns into expandable child rows on smaller viewports.

* `src/index.html` & `src/script.js`: Tabular layout and DataTables initialization using jQuery and DataTables Responsive bundled via Parcel.


* `src/styles.css`: Visual styling, black chrome theme, teal highlights, and responsive viewport rules.



```bash
cd task2-datatables
npm install
npm run dev    # Parcel dev server
npm run build  # production build

```

---

## task3-leafletjs

An interactive [Leaflet](https://leafletjs.com/) map displaying registered heat networks across the North East, styled after the [North East Evidence Hub](https://evidencehub.northeast-ca.gov.uk/) (black chrome layout, Hanken Grotesk typography, themed accent markers). Proportional circle markers are scaled by total registered networks per local authority and color-coded by infrastructure type (communal vs. district heating). Includes filter controls to toggle network types and a vector boundary overlay representing the DESNZ Newcastle–Gateshead Heat Network Zoning Pilot. The map is optimized for mobile viewports: filter controls collapse inside a `<details>` element, single-finger panning requires an explicit tap to prevent page-scroll lock, and scroll-wheel zoom is disabled.

* `src/data.js`: Spatial features formatted as GeoJSON derived from the DESNZ December 2022 Heat Network Register for seven North East local authorities. Because official dataset releases publish aggregated figures per authority rather than discrete scheme coordinates, markers represent authority centroids.


* `src/script.js`: Map initialization, dynamic marker scaling, popup template rendering, and filter legend bindings.


* `src/styles.css`: Theme definitions, map container dimensions, and responsive breakpoint rules.



```bash
cd task3-leafletjs
npm install
npm run dev   # Parcel dev server
npm run build # production build

```

---

## task4-vuejs

A single-page e-commerce storefront ("Tekkiech.Market") built with [Vue 3](https://vuejs.org/) and [Pinia](https://pinia.vuejs.org/), consuming the public [DummyJSON](https://dummyjson.com/) catalog (194 products across 24 categories). Vue Single-File Components (SFCs) are compiled directly through Parcel's built-in Vue transformer. The visual design strictly adheres to design specifications with exact `oklch()` color tokens, Work Sans and IBM Plex Mono typography, discount badges, and wishlist indicators.

* `src/api/dummyjson.js`: Handles API integration by making a single fetch request (`/products?limit=0`) to load the catalog into memory.


* `src/stores/catalog.js`: Central Pinia store managing catalog state, search input, active category filters, sorting preferences, wishlist items, and session cart calculations.


* `src/stores/account.js`: In-memory mock account manager supporting session profile state.


* `src/data/categoryChips.js`: Parses product tags dynamically to extract meaningful sub-category filter chips across all 24 product categories while filtering out redundant category-level tags.


* `src/components/product/`: Modular presentational components (`ProductCard`, `ProductImage` with fallback handling, `ProductPrice`, `ProductGallery`, `QuantityStepper`, `DiscountBadge`, `WishlistButton`, `DeliveryInfo`, `ProductSpecs`, `ProductReviews`, `RelatedProducts`).


* `src/components/cart/CartItemRow.vue`: Line item row component for cart management.


* `src/components/filters/` & `src/components/layout/`: Form controls (`CategoryChips`, `SortSelect`) and layout elements (`SiteHeader` with search and navigation counters, `SiteFooter`) built using native HTML form elements.


* `src/views/`: Route-level views including `HomeView.vue` (category tile grid), `CategoryView.vue` (filtered product grid), `ProductDetailView.vue` (product specifications, gallery, and ordering), `SearchView.vue` (debounced global search), `DealsView.vue` (discounted products $\ge 15\%$), `SavedView.vue` (wishlist items), `AccountView.vue` (mock user profile management), and `CartView.vue` (cart line item editor and subtotal calculations).


* `src/router.js`: Hash-based application routing for deep-linking across static host environments.



### Component Optimization & Event Propagation

Dropdown controls were initially implemented using Akaza UI headless primitives. Quality testing identified click toggling bugs where Akaza's `<button role="combobox">` wrapped nested `<button>` elements, causing duplicate event firing and immediate dropdown closure. Rebuilding controls with native `<button>`, `<input>`, and `<select>` elements eliminated third-party package overhead and resolved the interaction bugs.

Additionally, nested wishlist and cart buttons embedded within card anchor wrappers (`<router-link>`) required Vue's `@click.stop.prevent` modifier. While `.stop` (`stopPropagation()`) halted router navigation, `.prevent` (`preventDefault()`) was necessary to prevent default browser link navigation.

```bash
cd task4-vuejs
npm install
npm run dev   # Parcel dev server
npm run build # production build

```

---

## main-siteproj

A multi-page analytics site combining Chart.js, Leaflet, and DataTables to track worldwide operating system market share using [StatCounter Global Stats](https://gs.statcounter.com/os-market-share) data. Each section operates as an independent Parcel entry point:

* `/trend`: A [Chart.js](https://www.chartjs.org/) time-series line chart tracking 36-month global market share, with interactive legend drill-down into top-10 country distributions per OS.


* `/map`: A [Leaflet](https://leafletjs.com/) choropleth map showing leading operating systems by country, with detailed regional popups.


* `/table`: A [DataTables](https://datatables.net/) data grid indexing 175 tracked countries with searching, sorting, and responsive column collapsing.


* `/about`: Project documentation on data sources and methodology.



The application features a developer theme adapted from [tekkiech.tech](https://tekkiech.tech) (terminal header, JetBrains Mono typography, dark/light theme switching, and GSAP ScrollTrigger animations). Splitting entry points ensures each view only loads its required visualization libraries. The primary 200KB dataset is fetched on demand via dynamic `import()` statements when loading `/map`, `/table`, or legend drill-downs on `/trend`.

* `src/data/trend.js` & `src/data/world-os-share.json`: StatCounter Global Stats 36-month tracking snapshot joined with [Natural Earth](https://github.com/nvkelso/natural-earth-vector) 110m admin-0 country boundaries.


* `src/data/os-colors.js`: Dynamic color key reader parsing `--os-*` CSS custom properties from `styles.css` to maintain unified branding across theme toggles.


* `src/theme.js`: Shared script handling light/dark theme persistence, navigation highlights, and GSAP scroll animations.


* `src/trend/`, `src/map/`, `src/table/`, `src/about/`: Individual page markup and execution scripts.


* `src/index.html` & `src/styles.css`: Central portal page and core design system styles.



```bash
cd main-siteproj
npm install
npm run dev   # Parcel dev server
npm run build # production build

```