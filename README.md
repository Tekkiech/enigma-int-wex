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

A [Vue 3](https://vuejs.org/) + [Pinia](https://pinia.vuejs.org/) storefront, "Tekkiech.Market", backed by a real [Flask](https://flask.palletsprojects.com/) + [SQLAlchemy](https://www.sqlalchemy.org/) REST API (`server/`) rather than an in-memory mock. The product catalogue (194 products across 24 categories) is seeded once from the public [DummyJSON](https://dummyjson.com/) API into a local SQLite database; the running app never calls DummyJSON itself, only `server/seed.py` does. Vue single-file components are compiled directly by Parcel's built-in Vue transformer, same dev/build scripts as the rest of the repo. The visual design (near-white/black chrome, a single burnt-orange accent, Work Sans + IBM Plex Mono, product cards with a wishlist star and discount badge) matches a supplied reference mockup pixel-for-pixel in its colour tokens (copied verbatim as CSS `oklch()` values), typography and layout.

**Backend (`server/`):**

- `server/models.py` holds the SQLAlchemy 2.0 declarative models for all 10 tables (`category`, `product`, `product_image`, `product_tag`, `product_review`, `user`, `cart_item`, `wishlist_item`, `order`, `order_item`); `server/schema.dbml` is the diagram-friendly source of truth for the same shape (paste it into [dbdiagram.io](https://dbdiagram.io/)), kept in sync by hand since nothing generates one from the other
- `server/app.py` is the Flask API: session-cookie auth (`POST /api/auth/signup`/`/login`, bcrypt-hashed passwords, no separate salt column since bcrypt embeds its own in the stored hash string), public read-only `/api/categories` and `/api/products`, and `/api/cart`/`/api/wishlist`/`/api/orders` behind a `@login_required` guard
- `server/seed.py` is the only file that ever calls DummyJSON: it pulls the full catalogue, including each product's tags and reviews, into the local database once, and is safe to re-run (upserts by id rather than duplicating rows)
- Signing in isn't required to browse, add to cart, or wishlist something; it's only required to make any of that persist anywhere. `POST /api/orders` snapshots the current cart into a real order (price and quantity captured at that moment, not read live off the product later) and empties the cart; `GET /api/orders` returns the signed-in user's history

- `src/api/backend.js` is the frontend's one file that knows the Flask API's shape, same pattern the old (now deleted) `dummyjson.js` used for the public API
- `src/stores/catalog.js` (Pinia) holds the full product list plus UI state (search query, category chip, sort). Cart and wishlist writes are optimistic and local-first either way, and only reach the API when someone's actually signed in; signed out, it's local-only, exactly like before there was a backend at all. Getters: the visible list for whatever category is open, a product-by-id lookup, "related products" (same category), the deals list (≥15% off), the saved (wishlisted) list, global search results, and the cart's line items/count/subtotal
- `src/stores/account.js` does real signup/login/logout against the API. One form handles both: it tries creating an account first, and on a 409 (email taken) retries as a sign-in with the same credentials instead of making the user start over. A session-restore check runs once on app load, since the Flask cookie can outlive a page refresh even though this store's in-memory state can't
- `src/data/categoryChips.js` derives a category's filter chips from its products' `tags` rather than a hardcoded map, since the tag shape varies by category (groceries products are tagged just `["fruits"]`; a furniture product is tagged `["furniture", "beds"]`, repeating the category name as a generic first tag). It drops whatever tag covers most of the category (the generic one) and chips on what's left, so the same logic works unmodified for all 24 categories
- `src/components/product/` holds the presentational building blocks (`ProductCard`, also used in a `compact` mode for the related-products strip; `ProductImage` with a broken-image fallback; `ProductPrice`, `ProductGallery`, `QuantityStepper`, `DiscountBadge`, `WishlistButton`, `DeliveryInfo`, `ProductSpecs`, `ProductReviews`, `RelatedProducts`); `src/components/cart/CartItemRow.vue` is the one cart-specific row component
- `src/components/filters/` (`CategoryChips`, `SortSelect`, `SearchField`) and `src/components/layout/` (`SiteHeader` with the global search box, saved/cart links, `SiteFooter`) are plain native `<button>`/`<select>`/`<input>` elements, not a component-kit dependency; see the note below on why
- `src/views/HomeView.vue` (`/`) is a searchable grid of all 24 category tiles. Each tile (`src/components/home/CategoryTile.vue`) crossfades slowly through up to four real product thumbnails from that category, using a `setInterval` on a per-tile random offset with stacked `<img>`s and an opacity transition; it's skipped entirely under `prefers-reduced-motion`. It links into `src/views/CategoryView.vue` (`/category/:slug`): the product grid, filterable by chip and search and sortable by name/price/rating, generalized to work for any category rather than just groceries
- `src/views/ProductDetailView.vue` shows the full record for one product (gallery, price, rating, stock, a wishlist star, a quantity stepper, buy-now/add-to-cart, delivery info, a specs table, reviews, related products in the same category), resolved from the `:id` route param, with distinct loading/error/not-found states; "Buy now" adds the chosen quantity to the cart and jumps straight to it
- `src/views/SearchView.vue` (`/search?q=`) is the header search box's destination: a global, debounced, catalogue-wide title search, separate from a category page's own local chip/search filtering
- `src/views/DealsView.vue` (`/deals`) has its own search box and the same sort control as a category page, over a `dealsProducts` getter that filters to ≥15%-off and sorts by biggest discount first by default; `src/views/SavedView.vue` (`/saved`) is a plain view over `savedProducts`. Both reuse the same `ProductCard` grid as everywhere else
- `src/views/AccountView.vue` (`/account`) shows a sign-up/sign-in form (email, password, optional name) when signed out, or a profile card with cart/saved stats, a sign-out button, and an order history list once signed in
- `src/views/CartView.vue` (`/cart`) lists every line in the cart with its own quantity stepper and a remove button, plus a subtotal, a free-delivery threshold note, and a "Place order" button when signed in (a "Sign in to place an order" link otherwise, since checkout genuinely needs an account in this schema); edits there update the header's cart badge everywhere immediately since it's all the same Pinia store
- `src/views/SupportView.vue` (`/support`) covers FAQ, delivery info, returns, and contact details, all static placeholder content in `src/data/support.js`, unrelated to the backend above. There's no real system behind any of it, and it says so in place rather than pretending (the payment-methods FAQ answer, for instance, states plainly that nothing here is a real transaction). The footer's Delivery Info / Returns / Contact Us links jump to the matching section directly, via a route hash and an updated `scrollBehavior` that scrolls to `to.hash` when present
- `src/router.js` uses hash-based history so deep links work unchanged on a plain static file host, with no server-side rewrite rules required

**On Akaza UI:** an earlier pass built the category/sort dropdowns on [Akaza UI](https://akaza-ui.com/), a headless Vue 3 primitives library. That turned out to be the cause of a reported "category click is buggy" issue: Akaza's `Select` renders its own real `<button role="combobox">` wrapping whatever the trigger slot returns, and the slot template also rendered a `<button>` with its own click handler, so a click could double-toggle the dropdown. Since the reference mockup itself uses plain native `<button>` chips and a native `<select>` for these controls anyway, they were rebuilt as plain elements instead of fixed in place; simpler, matches the mockup exactly, and removes a dependency. While tracking down the same class of bug on the wishlist/add-to-cart buttons (nested inside the card's `<router-link>`), the fix needed `@click.stop.prevent`, not just `.stop`: `stopPropagation()` alone blocks Vue Router's own click handler, but the anchor's real `href` still gets followed natively unless the event's default action is also prevented.

The frontend alone (`npm run dev`) gets you a blank catalogue and a site nobody can sign into: the backend has to be running too.

```bash
cd task4-vuejs/server
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head  # creates the database and all tables
python seed.py         # pulls the catalogue in from DummyJSON, once
python app.py           # runs on http://localhost:5000
```

```bash
cd task4-vuejs
npm install
npm run dev   # Parcel dev server, http://localhost:1350
npm run build # production build
```

Full route table, schema notes, and migration workflow: `task4-vuejs/server/README.md`.

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