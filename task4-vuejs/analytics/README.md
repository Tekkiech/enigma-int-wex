# Synthetic shopping data

`generate.py` fabricates 18 months of order history for a batch of
synthetic shoppers, feeding the Chart.js + Leaflet dashboard at
`/metrics`. DB-only, start to finish: it reads the real product catalogue
out of `../server/tekkiech.db` and writes the generated shoppers straight
back into that same file, in three tables of their own -
`synthetic_shopper`, `synthetic_order`, `synthetic_order_line` -
deliberately separate from the live app's `user`/`order`/`order_item`
tables (`server/models.py`), so a synthetic shopper never mixes into the
real account system. Nothing in this pipeline reads or writes a JSON
file; `GET /api/metrics/orders` (`server/app.py`) queries these tables
directly and the frontend fetches from there.

Real classes, not dataclasses, and the generating happens as methods on
the objects it's about, not a pile of free functions: `Catalogue` loads
and groups the product data; `Persona` (`personas.py`) holds a shopper
archetype's category weights as a plain attribute and its
`choose_category` method *is* the generating step; `Shopper`
(a real name from `names.py`, a `Persona`, a `Location`) has a
`place_orders` method that builds its own `Order`/`OrderLine` objects;
`SeasonalCalendar` draws Nov/Dec-weighted dates; `SyntheticStore` owns
the three tables and the SQL that writes to them; `OrderGenerator` ties
the rest together.

Stdlib only, no venv needed - writes to `../server/tekkiech.db` by
default (or `$DB_PATH`, same env var `server/database.py` uses):

```bash
cd task4-vuejs/analytics
python3 generate.py                       # writes to tekkiech.db
python3 generate.py --seed 7 --users 100 --months 24
```

Re-running clears the three tables and replaces them - it doesn't append
run after run.

## How it generates a "shopper"

Each synthetic user gets a real name (`names.py`, a first/last pool, no
external dependency) and a persona from `personas.py` - a category-weight
map (`tech-enthusiast`, `home-cook`, `fashion-forward`, etc.) plus an
average order count for the year. `Persona.choose_category` is called
once per line item: with an 8% independent chance it ignores the
persona's weights entirely and draws from a uniformly random category
instead - that's the whole mechanism behind a tech buyer occasionally
buying a kiwi or a plant pot. No special-cased "quirky" logic, just noise
on top of signal.

Order volume is also weighted by calendar month - a Nov/Dec holiday bump,
a mild Jan/Feb dip - so a line chart of orders over time has actual shape
instead of flat noise.

Each shopper also gets a home city from `locations.py` - 18 real US
cities with real coordinates, picked independently of persona (no
invented correlation between what someone buys and where they live).
It's assigned once per shopper, not per order, the same way a persona is.

## Tables

```
synthetic_shopper   id, name, persona, city, region, lat, lng
synthetic_order     id, shopper_id -> synthetic_shopper, order_date
synthetic_order_line  id, order_id -> synthetic_order,
                       product_id (-> the app's own product table,
                       no FK - this script doesn't own that schema),
                       quantity, is_outlier
```

`GET /api/metrics/orders` joins all three plus `product`/`category` and
returns the same flat shape the dashboard always consumed - one record
per order line, `orderId` included for anything that needs order-level
aggregation (average order value, items per order) rather than
line-item-level. If the tables don't exist yet (generator never run),
the endpoint returns `[]` instead of a 500.
