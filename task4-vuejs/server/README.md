# Tekkiech.Market API

Flask + SQLAlchemy API for task4-vuejs. Handles accounts, cart, wishlist,
orders, and the product catalogue. The frontend needs this running or
you just get a blank site.

## Setup

```bash
cd task4-vuejs/server
python3 -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt

python run.py     # sets up the database, adds fake /metrics data, then starts the server
```

That runs `seed.py`, `../analytics/generate.py`, and `app.py` in order. You
can still run any of those three on their own too - useful if you just
want to reset the database (`seed.py`) or restart the server without
regenerating the fake data (`app.py`).

`tekkiech.db` and `venv/` are gitignored - they get created locally, not committed.

Want to run it somewhere else? Set the `DB_PATH` env var to point at a
different file.

## Auth

Login uses a signed session cookie, not tokens. Passwords are hashed
with bcrypt before they touch the database. Signup requires at least 8
characters with a letter and a number. Login locks an account for 15
minutes after 5 wrong attempts in a row.

Set `SECRET_KEY` (env var) to something real before deploying anywhere -
the default is only fine for messing around locally.

## Routes

| Method | Path | Needs login? |
|---|---|---|
| POST | `/api/auth/signup` | no |
| POST | `/api/auth/login` | no |
| POST | `/api/auth/logout` | no |
| GET | `/api/auth/me` | yes |
| GET | `/api/categories` | no |
| GET | `/api/products?category=&q=` | no |
| GET | `/api/products/:id` | no |
| POST | `/api/products/:id/reviews` | yes |
| GET | `/api/cart` | yes |
| PUT | `/api/cart/:productId` | yes |
| DELETE | `/api/cart/:productId` | yes |
| GET | `/api/wishlist` | yes |
| PUT | `/api/wishlist/:productId` | yes |
| DELETE | `/api/wishlist/:productId` | yes |
| POST | `/api/orders` | yes |
| GET | `/api/orders` | yes |
| GET | `/api/metrics/orders` | no |

## Changing the schema

There's no migration tool here. Edit `models.py`, delete your local
`tekkiech.db`, then run `python seed.py` again to rebuild it. That's
fine since this is all throwaway dev data.

`schema.dbml` is just a diagram of the tables for reference - it doesn't
update itself, so change it by hand too if you touch `models.py`.

The `synthetic_*` tables you'll see in `tekkiech.db` aren't part of
`models.py` - they're the fake `/metrics` data, created separately by
`analytics/generate.py`. See `analytics/README.md`.

## Real accounts on /metrics

Every account gets a random persona and home city the moment it signs up
(`shopper_profile.py`) - it's not shown anywhere on the site, it just
means a real account's real orders show up on the `/metrics` dashboard
alongside the fake shoppers, instead of only fake data ever appearing
there. `GET /api/metrics/orders` blends both together.

Signed-in users can also pick "Just me" in the persona filter to see
only their own orders. Real orders are never marked as outliers, so
they won't show up in the "Unexpected purchases" table.
