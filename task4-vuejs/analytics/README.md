# Synthetic shopping data

`generate.py` fabricates 18 months of order history for a batch of
synthetic shoppers, feeding the Chart.js dashboard at `/metrics`
(`src/views/MetricsView.vue`). It reads the real product catalogue out of
`../server/tekkiech.db` (read-only) but never writes back to it - the
output is a standalone file, `synthetic-orders.json`, kept separate from
the live app's data on purpose.

Organized around a few small classes rather than one long script:
`Catalogue` (loads and groups the product data), `Persona` (a shopper
archetype's category weights, in `personas.py`), `Shopper` (one synthetic
user), `SeasonalCalendar` (the Nov/Dec-weighted date draw), and
`OrderGenerator`, which owns the random-number generator and ties the
rest together into `OrderLine` records.

Stdlib only, no venv needed:

```bash
cd task4-vuejs/analytics
python3 generate.py                 # writes synthetic-orders.json
python3 generate.py --seed 7 --users 100 --months 24 --out out.json
```

## How it generates a "shopper"

Each synthetic user is assigned a persona from `personas.py` - a
category-weight map (`tech-enthusiast`, `home-cook`, `fashion-forward`,
etc.) plus an average order count for the year. Every line item on every
order has an 8% independent chance of ignoring the persona's weights
entirely and drawing from a uniformly random category instead - that's
the whole mechanism behind a tech buyer occasionally buying a kiwi or a
plant pot. No special-cased "quirky" logic, just noise on top of signal.

Order volume is also weighted by calendar month - a Nov/Dec holiday bump,
a mild Jan/Feb dip - so a line chart of orders over time has actual shape
instead of flat noise.

## Output shape

One JSON record per order line item, not nested by order:

```json
{
  "orderId": "so-661",
  "date": "2025-03-26",
  "userId": "synthetic-35",
  "persona": "tech-enthusiast",
  "productId": 103,
  "title": "Apple HomePod Mini Cosmic Grey",
  "category": "mobile-accessories",
  "price": 99.99,
  "quantity": 1,
  "lineTotal": 99.99,
  "isOutlier": false
}
```

Flat and un-nested so grouping by month, category, or persona for a
Chart.js dataset is a single pass with no parsing step - `orderId` is
still there for anything that needs order-level aggregation (average
order value, items per order) rather than line-item-level.
