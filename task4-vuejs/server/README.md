# Tekkiech.Market API

Flask + SQLAlchemy REST API for task4-vuejs: account, cart, wishlist,
orders, and product/category browsing. The frontend calls this for
everything now (`src/api/backend.js`) - DummyJSON is only ever touched
by `seed.py`, once, to populate the local database; the running app
never calls it directly.

This has to be running for the frontend to work at all - `npm run dev`
alone gets you a blank catalogue and a site that can't sign anyone in.

## Setup

```bash
cd task4-vuejs/server
python3 -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt

alembic upgrade head            # creates tekkiech.db and all tables
python seed.py                  # pulls the 194 DummyJSON products into it

python app.py                   # runs on http://localhost:5000
```

`tekkiech.db` and `venv/` are gitignored - both are meant to be generated
locally (or on whatever machine ends up running this), not committed.

## Where the database lives

`DB_PATH` (env var, defaults to `tekkiech.db` next to this file) is the
only thing that needs to change to move this - e.g. once this runs
somewhere persistent instead of a laptop, point it at wherever that disk
actually is. SQLAlchemy and Alembic both read it from `database.py`, so
there's one place to change, not several.

## Auth

Session-cookie based, not tokens - `POST /api/auth/signup` or
`/api/auth/login` sets a signed cookie via Flask's built-in session, and
every `/api/cart`, `/api/wishlist`, `/api/orders`, `/api/products/:id/reviews`
route requires it (`@login_required` in `auth.py`). Passwords are hashed
with bcrypt (`auth.py`) before they ever reach the database - see the
schema notes on `user.password_hash` for why that's the only column
needed (bcrypt embeds its own salt in the stored string).

Signup and login enforce different things, on purpose. Signup checks
password quality - at least 8 characters, a letter and a number
(`password_requirement_errors` in `auth.py`) - since there's nothing to
validate the shape of a login attempt against. Login instead tracks
failed attempts per account and locks it for 15 minutes after 5 in a
row (`user.failed_login_attempts`/`locked_until`), checked with a
constant-time dummy-hash comparison so a nonexistent email doesn't
respond any faster than a wrong password.

`SECRET_KEY` (env var) signs the session cookie - the `dev-only-change-me`
default is fine for local work, not for anything that leaves your machine.

## Routes

| Method | Path | Auth | |
|---|---|---|---|
| POST | `/api/auth/signup` | - | `{name, email, password}` |
| POST | `/api/auth/login` | - | `{email, password}` |
| POST | `/api/auth/logout` | - | |
| GET | `/api/auth/me` | required | |
| GET | `/api/categories` | - | |
| GET | `/api/products?category=&q=` | - | includes `tags` and `reviews` per product |
| GET | `/api/products/:id` | - | |
| POST | `/api/products/:id/reviews` | required | `{rating, comment}`, recomputes the product's `rating` as the average of its reviews |
| GET | `/api/cart` | required | |
| PUT | `/api/cart/:productId` | required | `{quantity}` |
| DELETE | `/api/cart/:productId` | required | |
| GET | `/api/wishlist` | required | |
| PUT | `/api/wishlist/:productId` | required | |
| DELETE | `/api/wishlist/:productId` | required | |
| POST | `/api/orders` | required | snapshots the cart into a new order, clears it |
| GET | `/api/orders` | required | |
| GET | `/api/metrics/orders` | - | backs `/metrics`; reads `synthetic_*` tables that only `analytics/generate.py` writes - `[]` if it hasn't been run |

## Migrations

```bash
alembic revision --autogenerate -m "describe the change"
alembic upgrade head
```

`schema.dbml` is the diagram-friendly source of truth for the shape of
this - `models.py` is its executable form. Nothing keeps them in sync
automatically; if you change one, update the other by hand.

The `synthetic_*` tables (see `analytics/README.md`) live in this same
file but aren't part of this - they're created and cleared by
`analytics/generate.py` directly, not Alembic, on purpose: they're demo
data for `/metrics`, not part of the real app's schema.
