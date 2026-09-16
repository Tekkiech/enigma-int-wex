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

A [Vue 3](https://vuejs.org/) + [Pinia](https://pinia.vuejs.org/) grocery storefront, "Tekkiech.Market", built against the `groceries` category of the public [DummyJSON](https://dummyjson.com/) products API (~27 real products, fetched once). Vue single-file components are compiled directly by Parcel's built-in Vue transformer, same dev/build scripts as the rest of the repo. The visual design (near-white/black chrome, a single burnt-orange accent, Work Sans + IBM Plex Mono, product cards with a wishlist star and discount badge) matches a supplied reference mockup pixel-for-pixel in its colour tokens (copied verbatim as CSS `oklch()` values), typography and layout.

- `src/api/dummyjson.js` is the only file that knows the DummyJSON endpoint shape — one call to `/products/category/groceries?limit=0`, everything else talks to the store, not to `fetch` directly
- `src/stores/catalog.js` (Pinia) holds the full product list plus UI state (search query, category chip, sort, a session-only cart and wishlist set — nothing persists past a reload, and there's no real checkout) and derives the visible list, a product-by-id lookup, "related products" (same aisle first), and the cart's line items/count/subtotal as getters — filtering/sorting is done client-side since the whole category is small enough to fetch once
- `src/data/categoryChips.js` maps DummyJSON's free-text product `tags` onto a small fixed set of aisle chips (Fruits, Vegetables, Dairy, Meat & Seafood, Beverages, Pantry), since the groceries category has no sub-categories of its own
- `src/components/product/` holds the presentational building blocks (`ProductCard` — also used in a `compact` mode for the related-products strip — `ProductImage` with a broken-image fallback, `ProductPrice`, `ProductGallery`, `QuantityStepper`, `DiscountBadge`, `WishlistButton`, `DeliveryInfo`, `ProductSpecs`, `ProductReviews`, `RelatedProducts`); `src/components/cart/CartItemRow.vue` is the one cart-specific row component
- `src/components/filters/` (`CategoryChips`, `SortSelect`) and `src/components/layout/` (`SiteHeader` with the global search box and cart link, `SiteFooter`) are plain native `<button>`/`<select>`/`<input>` elements, not a component-kit dependency — see the note below on why
- `src/views/ProductListView.vue` shows the catalogue as a grid, filterable by aisle chip and free-text search, sortable by name/price/rating; each card links through to its details page and has its own "Add to cart" button
- `src/views/ProductDetailView.vue` shows the full record for one product (gallery, price, rating, stock, a quantity stepper, buy-now/add-to-cart, delivery info, a specs table, reviews, related products in the same aisle), resolved from the `:id` route param, with distinct loading/error/not-found states; "Buy now" adds the chosen quantity to the cart and jumps straight to it
- `src/views/CartView.vue` (`/cart`) lists every line in the cart with its own quantity stepper and a remove button, plus a subtotal and a free-delivery threshold note; edits there update the header's cart badge everywhere immediately since it's all the same Pinia store
- `src/router.js` uses hash-based history so deep links work unchanged on a plain static file host, with no server-side rewrite rules required

**On Akaza UI:** an earlier pass built the category/sort dropdowns on [Akaza UI](https://akaza-ui.com/), a headless Vue 3 primitives library. That turned out to be the cause of a reported "category click is buggy" issue — Akaza's `Select` renders its own real `<button role="combobox">` wrapping whatever the trigger slot returns, and the slot template also rendered a `<button>` with its own click handler, so a click could double-toggle the dropdown. Since the reference mockup itself uses plain native `<button>` chips and a native `<select>` for these controls anyway, they were rebuilt as plain elements instead of fixed in place — simpler, matches the mockup exactly, and removes a dependency. While tracking down the same class of bug on the wishlist/add-to-cart buttons (nested inside the card's `<router-link>`), the fix needed `@click.stop.prevent`, not just `.stop` — `stopPropagation()` alone blocks Vue Router's own click handler, but the anchor's real `href` still gets followed natively unless the event's default action is also prevented.

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
