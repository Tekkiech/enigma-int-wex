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

A [Vue 3](https://vuejs.org/) + [Pinia](https://pinia.vuejs.org/) storefront, "Tekkiech.Market", built against the full public [DummyJSON](https://dummyjson.com/) products catalogue (194 products across all 24 categories, fetched once). Vue single-file components are compiled directly by Parcel's built-in Vue transformer, same dev/build scripts as the rest of the repo. The visual design (near-white/black chrome, a single burnt-orange accent, Work Sans + IBM Plex Mono, product cards with a wishlist star and discount badge) matches a supplied reference mockup pixel-for-pixel in its colour tokens (copied verbatim as CSS `oklch()` values), typography and layout.

- `src/api/dummyjson.js` is the only file that knows the DummyJSON endpoint shape: one call to `/products?limit=0`, everything else talks to the store, not to `fetch` directly. Category display names are just Title Case of the slug for all 24 DummyJSON categories, so there's no separate `/products/categories` call either. `src/stores/catalog.js` derives names and per-category counts straight from the product list.
- `src/stores/catalog.js` (Pinia) holds the full product list plus UI state (search query, category chip, sort, a session-only cart and wishlist; nothing persists past a reload, and there's no real checkout) and derives, as getters: the visible list for whatever category is open, a product-by-id lookup, "related products" (same category), the deals list (≥15% off), the saved (wishlisted) list, global search results, and the cart's line items/count/subtotal
- `src/stores/account.js` is a deliberately fake "account": creating one just stores a name/email in memory for the session, no backend, no validation
- `src/data/categoryChips.js` derives a category's filter chips from its products' real DummyJSON `tags` rather than a hardcoded map, since the tag shape varies by category (groceries products are tagged just `["fruits"]`; a furniture product is tagged `["furniture", "beds"]`, repeating the category name as a generic first tag). It drops whatever tag covers most of the category (the generic one) and chips on what's left, so the same logic works unmodified for all 24 categories
- `src/components/product/` holds the presentational building blocks (`ProductCard`, also used in a `compact` mode for the related-products strip; `ProductImage` with a broken-image fallback; `ProductPrice`, `ProductGallery`, `QuantityStepper`, `DiscountBadge`, `WishlistButton`, `DeliveryInfo`, `ProductSpecs`, `ProductReviews`, `RelatedProducts`); `src/components/cart/CartItemRow.vue` is the one cart-specific row component
- `src/components/filters/` (`CategoryChips`, `SortSelect`) and `src/components/layout/` (`SiteHeader` with the global search box, saved/cart links, `SiteFooter`) are plain native `<button>`/`<select>`/`<input>` elements, not a component-kit dependency; see the note below on why
- `src/views/HomeView.vue` (`/`) is a searchable grid of all 24 category tiles. Each tile (`src/components/home/CategoryTile.vue`) crossfades slowly through up to four real product thumbnails from that category, using a `setInterval` on a per-tile random offset with stacked `<img>`s and an opacity transition; it's skipped entirely under `prefers-reduced-motion`. It links into `src/views/CategoryView.vue` (`/category/:slug`): the product grid, filterable by chip and search and sortable by name/price/rating, generalized to work for any category rather than just groceries
- `src/views/ProductDetailView.vue` shows the full record for one product (gallery, price, rating, stock, a wishlist star, a quantity stepper, buy-now/add-to-cart, delivery info, a specs table, reviews, related products in the same category), resolved from the `:id` route param, with distinct loading/error/not-found states; "Buy now" adds the chosen quantity to the cart and jumps straight to it
- `src/views/SearchView.vue` (`/search?q=`) is the header search box's destination: a global, debounced, catalogue-wide title search, separate from a category page's own local chip/search filtering
- `src/views/DealsView.vue` (`/deals`) has its own search box and the same sort control as a category page, over a `dealsProducts` getter that filters to ≥15%-off and sorts by biggest discount first by default; `src/views/SavedView.vue` (`/saved`) is a plain view over `savedProducts`. Both reuse the same `ProductCard` grid as everywhere else
- `src/views/AccountView.vue` (`/account`) shows a sign-up form (placeholder "John Doe" / "john.doe@example.com") when signed out, or a profile card with cart/saved stats and a sign-out button once "created"
- `src/views/CartView.vue` (`/cart`) lists every line in the cart with its own quantity stepper and a remove button, plus a subtotal and a free-delivery threshold note; edits there update the header's cart badge everywhere immediately since it's all the same Pinia store
- `src/views/SupportView.vue` (`/support`) covers FAQ, delivery info, returns, and contact details, all static placeholder content in `src/data/support.js`. There's no backend behind any of it, and it says so in place rather than pretending (the payment-methods FAQ answer, for instance, states plainly that nothing here is a real transaction). The footer's Delivery Info / Returns / Contact Us links jump to the matching section directly, via a route hash and an updated `scrollBehavior` that scrolls to `to.hash` when present
- `src/router.js` uses hash-based history so deep links work unchanged on a plain static file host, with no server-side rewrite rules required

**On Akaza UI:** an earlier pass built the category/sort dropdowns on [Akaza UI](https://akaza-ui.com/), a headless Vue 3 primitives library. That turned out to be the cause of a reported "category click is buggy" issue: Akaza's `Select` renders its own real `<button role="combobox">` wrapping whatever the trigger slot returns, and the slot template also rendered a `<button>` with its own click handler, so a click could double-toggle the dropdown. Since the reference mockup itself uses plain native `<button>` chips and a native `<select>` for these controls anyway, they were rebuilt as plain elements instead of fixed in place; simpler, matches the mockup exactly, and removes a dependency. While tracking down the same class of bug on the wishlist/add-to-cart buttons (nested inside the card's `<router-link>`), the fix needed `@click.stop.prevent`, not just `.stop`: `stopPropagation()` alone blocks Vue Router's own click handler, but the anchor's real `href` still gets followed natively unless the event's default action is also prevented.

```bash
cd task4-vuejs
npm install
npm run dev   # Parcel dev server
npm run build # production build
```

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