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

That runs `seed.py`, `generate_fake_shoppers.py`, and `app.py` in order.
You can still run any of those three on their own too - useful if you
just want to reset the database (`seed.py`) or restart the server
without regenerating the fake data (`app.py`).

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

## Fake shoppers (for /metrics)

`generate_fake_shoppers.py` makes up 18 months of order history for a
batch of fake shoppers, so the `/metrics` dashboard has something to
chart. It reads the real products already in the database (through the
same SQLAlchemy models as everything else - no separate script, no raw
SQL, no second copy of the persona/category logic) and writes the fake
shoppers into their own tables: `synthetic_shopper`, `synthetic_order`,
`synthetic_order_line` (see `models.py`). Kept apart from the real
`user`/`order`/`order_item` tables so a fake shopper never mixes in
with a real account.

```bash
python generate_fake_shoppers.py                       # writes 60 shoppers, 18 months
python generate_fake_shoppers.py --seed 7 --users 100 --months 24
```

Each fake shopper gets a random name (`names.py`), a persona
(`shopper_profile.py` - `tech-enthusiast`, `home-cook`, etc, each with
category weights and roughly how many orders a year), and a home city
with real coordinates (`locations.py`). Most purchases match the
persona, but there's an 8% chance of buying something totally
unrelated, so the data doesn't look too clean. Orders also lean toward
November/December, so there's an actual holiday bump in the charts
instead of flat noise. Re-running it replaces the old fake data rather
than piling up on top of it.

## Real accounts on /metrics

Every account gets a random home city at signup (`shopper_profile.py`),
but no persona yet - that starts out `None` until their first order.
After every order, the persona gets (re)computed from that account's
full purchase history - whichever persona's usual categories cover the
most of what they've actually bought wins (`predict_persona`, the same
`Persona` class the fake shoppers use). A purchase outside the current
persona's usual categories gets flagged as an "unexpected purchase,"
same as the fake shoppers.

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
