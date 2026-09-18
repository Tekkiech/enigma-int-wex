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

`python seed.py` (or `run.py`, which calls it) also creates an admin
account if one doesn't exist yet: `admin@gmail.com` / `admin1234`. Admin
is just a regular account with `is_admin` set - it's the only one that
can see `/metrics` and its own shopper profile.

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
| GET | `/api/products/:id/frequently-bought-together` | no |
| POST | `/api/products/:id/reviews` | yes |
| GET | `/api/cart` | yes |
| PUT | `/api/cart/:productId` | yes |
| DELETE | `/api/cart/:productId` | yes |
| GET | `/api/wishlist` | yes |
| PUT | `/api/wishlist/:productId` | yes |
| DELETE | `/api/wishlist/:productId` | yes |
| POST | `/api/orders` | yes |
| GET | `/api/orders` | yes |
| GET | `/api/metrics/orders` | admin |

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

Every account gets a random home city at signup (`shopper_profile.py`),
but no persona yet - that starts out `None` until their first order.
After every order, the persona gets (re)computed from that account's
full purchase history - whichever persona's usual categories cover the
most of what they've actually bought wins (`predict_persona`). A
purchase outside the current persona's usual categories gets flagged
as an "unexpected purchase," same as the fake shoppers.

`GET /api/metrics/orders` blends real orders in with the fake shopper
data, and signed-in admins can pick "Just me" in the persona filter to
see only their own orders.

Only admin accounts can reach `/metrics` or see their own persona/city
on the Account page - see "Auth" above for the admin login.

## Frequently bought together

Each product page shows a few products that tend to get bought
alongside it, worked out from actual co-occurring orders - real orders
and the fake shoppers' orders both count, added together. That means
it has something to show even on a fresh database before anyone's
placed a real order.
