# Fake shopper data

`generate.py` makes up 18 months of order history for a bunch of fake
shoppers, so the `/metrics` dashboard has something to chart. No JSON
files involved - it reads the real products straight out of
`../server/tekkiech.db` and writes the fake shoppers back into that same
file, in their own tables (`synthetic_shopper`, `synthetic_order`,
`synthetic_order_line`) so they never mix with real accounts.

```bash
cd task4-vuejs/analytics
python3 generate.py                       # writes to tekkiech.db
python3 generate.py --seed 7 --users 100 --months 24
```

No packages to install, just plain Python. Running it again wipes the
old fake data and makes fresh data - it doesn't pile up.

## How a shopper gets made

Each fake shopper gets a random name, a persona (`tech-enthusiast`,
`home-cook`, etc. - see `personas.py`) that decides what categories they
usually buy from, and a home city with real coordinates. Most purchases
match the persona, but there's a small random chance (8%) of buying
something totally unrelated, so the data doesn't look too clean.

Orders also lean toward November/December, so there's an actual holiday
bump in the charts instead of flat noise.

## Tables

```
synthetic_shopper     id, name, persona, city, region, lat, lng
synthetic_order       id, shopper_id, order_date
synthetic_order_line  id, order_id, product_id, quantity, is_outlier
```

`GET /api/metrics/orders` in the Flask app joins these with the real
product/category tables and hands the result to the dashboard. If you
haven't run the generator yet, it just returns an empty list.
