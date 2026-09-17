"""Synthetic order-history generator for the metrics dashboard.

DB-only, start to finish: reads the real product catalogue out of
tekkiech.db and writes the generated shoppers/orders/order-lines straight
back into it, in three tables of their own (synthetic_shopper,
synthetic_order, synthetic_order_line) - deliberately separate from the
live app's user/order/order_item tables (see server/models.py), so a
synthetic shopper never mixes into the real account system. Nothing here
produces or reads a JSON file; the Flask API (GET /api/metrics/orders)
queries these tables directly for the dashboard.

Every synthetic shopper gets a real name (names.py), a persona
(personas.py) and a home city (locations.py). Persona.choose_category is
where the generating actually happens: it either draws from that
persona's category weights, or - with a small independent chance - from
every category uniformly, regardless of persona. That's the whole
mechanism behind a tech buyer occasionally buying a kiwi or a plant pot;
no special-cased "quirky" logic, just noise layered on top of signal.

Usage:
    python3 generate.py [--seed N] [--users N] [--months N] [--db PATH]
"""

import argparse
import os
import random
import sqlite3
from datetime import date, timedelta
from pathlib import Path

from locations import LOCATIONS
from names import NameGenerator
from personas import PERSONAS

DB_PATH = Path(os.environ.get("DB_PATH", str(Path(__file__).resolve().parent.parent / "server" / "tekkiech.db")))


class Product:
    def __init__(self, product_id: int, title: str, price: float, category: str):
        self.id = product_id
        self.title = title
        self.price = price
        self.category = category


class Catalogue:
    """The real product catalogue, grouped by category - loaded once from
    tekkiech.db. Only ever reads from it; the write side of this script
    lives entirely in SyntheticStore."""

    def __init__(self, products_by_category: dict):
        self._products_by_category = products_by_category

    @classmethod
    def from_db(cls, db_path: Path) -> "Catalogue":
        connection = sqlite3.connect(db_path)
        try:
            cursor = connection.execute(
                """
                SELECT p.id, p.title, p.price, c.slug
                FROM product p JOIN category c ON p.category_id = c.id
                WHERE p.is_active = 1
                """
            )
            products_by_category = {}
            for product_id, title, price, slug in cursor.fetchall():
                products_by_category.setdefault(slug, []).append(Product(product_id, title, price, slug))
        finally:
            connection.close()
        return cls(products_by_category)

    @property
    def categories(self) -> list:
        return list(self._products_by_category.keys())

    def products_in(self, category: str) -> list:
        return self._products_by_category[category]

    def random_product(self, category: str, rng: random.Random) -> Product:
        return rng.choice(self._products_by_category[category])


class OrderLine:
    def __init__(self, product: Product, quantity: int, is_outlier: bool):
        self.product = product
        self.quantity = quantity
        self.is_outlier = is_outlier

    @property
    def line_total(self) -> float:
        return round(self.product.price * self.quantity, 2)


class Order:
    def __init__(self, order_id: str, shopper_id: int, order_date: date):
        self.id = order_id
        self.shopper_id = shopper_id
        self.order_date = order_date
        self.lines = []

    def add_line(self, line: OrderLine) -> None:
        self.lines.append(line)

    @property
    def total(self) -> float:
        return round(sum(line.line_total for line in self.lines), 2)


class SeasonalCalendar:
    """Relative order volume by calendar month - a holiday-season bump
    (Nov/Dec) and a mild post-holiday dip (Jan/Feb), flat-ish otherwise.
    This is what gives the eventual line chart actual shape instead of
    flat noise."""

    MONTH_WEIGHTS = {
        1: 0.8, 2: 0.8, 3: 0.9, 4: 0.95, 5: 1.0, 6: 1.0,
        7: 0.95, 8: 1.0, 9: 1.05, 10: 1.1, 11: 1.6, 12: 1.8,
    }  # fmt: skip

    def __init__(self, start: date, end: date):
        self.start = start
        self.end = end
        self._span_days = (end - start).days
        self._peak_weight = max(self.MONTH_WEIGHTS.values())

    def random_date(self, rng: random.Random) -> date:
        for _ in range(20):  # rejection-sample against the month weights
            candidate = self.start + timedelta(days=rng.randint(0, self._span_days))
            if rng.random() < self.MONTH_WEIGHTS[candidate.month] / self._peak_weight:
                return candidate
        return self.start + timedelta(days=rng.randint(0, self._span_days))


class Shopper:
    """One synthetic user: a real name, a persona, and a home location.
    place_orders is where a shopper actually goes shopping - it owns
    deciding how many orders to place and what goes in each one, using
    its own persona to steer (and occasionally ignore) what it buys."""

    def __init__(self, shopper_id: int, name: str, persona, location):
        self.id = shopper_id
        self.name = name
        self.persona = persona
        self.location = location
        self.orders = []

    def order_count(self, months: int, rng: random.Random) -> int:
        mean = self.persona.avg_orders_per_year * (months / 12)
        return max(1, OrderGenerator.poisson_sample(mean, rng))

    def place_orders(
        self,
        catalogue: Catalogue,
        calendar: SeasonalCalendar,
        rng: random.Random,
        months: int,
        outlier_probability: float,
        items_per_order_weights: dict,
        quantity_weights: dict,
        next_order_seq: int,
    ) -> int:
        for _ in range(self.order_count(months, rng)):
            order = Order(f"so-{next_order_seq}", self.id, calendar.random_date(rng))
            next_order_seq += 1

            num_items = OrderGenerator.weighted_choice(rng, items_per_order_weights)
            for _ in range(num_items):
                category, is_outlier = self.persona.choose_category(rng, catalogue.categories, outlier_probability)
                product = catalogue.random_product(category, rng)
                quantity = OrderGenerator.weighted_choice(rng, quantity_weights)
                order.add_line(OrderLine(product, quantity, is_outlier))

            self.orders.append(order)
        return next_order_seq


class SyntheticStore:
    """Owns the three synthetic_* tables inside tekkiech.db - kept
    separate from the live app's user/order/order_item tables on purpose,
    so a synthetic shopper never mixes into the real account system.
    Re-running the generator clears and replaces everything here rather
    than appending forever."""

    SCHEMA = """
        CREATE TABLE IF NOT EXISTS synthetic_shopper (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            persona TEXT NOT NULL,
            city TEXT NOT NULL,
            region TEXT NOT NULL,
            lat REAL NOT NULL,
            lng REAL NOT NULL
        );
        CREATE TABLE IF NOT EXISTS synthetic_order (
            id TEXT PRIMARY KEY,
            shopper_id INTEGER NOT NULL REFERENCES synthetic_shopper(id),
            order_date TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS synthetic_order_line (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id TEXT NOT NULL REFERENCES synthetic_order(id),
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            is_outlier INTEGER NOT NULL
        );
    """
    # product_id deliberately has no FOREIGN KEY clause - it points at
    # product(id) from the live app's own Alembic-managed schema, which
    # this script doesn't own and shouldn't couple itself to.

    def __init__(self, db_path: Path):
        self.connection = sqlite3.connect(db_path)

    def ensure_schema(self) -> None:
        self.connection.executescript(self.SCHEMA)

    def clear(self) -> None:
        self.connection.executescript(
            "DELETE FROM synthetic_order_line; DELETE FROM synthetic_order; DELETE FROM synthetic_shopper;"
        )

    def save_shopper(self, shopper: Shopper) -> None:
        self.connection.execute(
            "INSERT INTO synthetic_shopper (id, name, persona, city, region, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (
                shopper.id,
                shopper.name,
                shopper.persona.name,
                shopper.location.city,
                shopper.location.region,
                shopper.location.lat,
                shopper.location.lng,
            ),
        )
        for order in shopper.orders:
            self.save_order(order)

    def save_order(self, order: Order) -> None:
        self.connection.execute(
            "INSERT INTO synthetic_order (id, shopper_id, order_date) VALUES (?, ?, ?)",
            (order.id, order.shopper_id, order.order_date.isoformat()),
        )
        self.connection.executemany(
            "INSERT INTO synthetic_order_line (order_id, product_id, quantity, is_outlier) VALUES (?, ?, ?, ?)",
            [(order.id, line.product.id, line.quantity, int(line.is_outlier)) for line in order.lines],
        )

    def commit(self) -> None:
        self.connection.commit()

    def close(self) -> None:
        self.connection.close()


class OrderGenerator:
    """Orchestrates the whole synthetic dataset: builds each shopper (a
    real name, a persona, a home city) and has it place its own orders."""

    OUTLIER_PROBABILITY = 0.08  # chance any single line item ignores the persona's weights
    ITEMS_PER_ORDER_WEIGHTS = {1: 5, 2: 4, 3: 2, 4: 1}  # most orders are small
    QUANTITY_WEIGHTS = {1: 6, 2: 2, 3: 1}

    def __init__(self, catalogue: Catalogue, personas: list, locations: list, seed: int = 42):
        self.catalogue = catalogue
        self.personas = personas
        self.locations = locations
        self.name_generator = NameGenerator()
        self.rng = random.Random(seed)

    @staticmethod
    def poisson_sample(mean: float, rng: random.Random) -> int:
        """Knuth's algorithm - stdlib-only Poisson sampling, no numpy
        dependency needed for what's a small, one-off generation script."""
        if mean <= 0:
            return 0
        l = 2.718281828459045 ** -mean
        k, p = 0, 1.0
        while True:
            k += 1
            p *= rng.random()
            if p <= l:
                return k - 1

    @staticmethod
    def weighted_choice(rng: random.Random, weight_map: dict):
        return rng.choices(list(weight_map.keys()), weights=list(weight_map.values()), k=1)[0]

    def generate(self, num_users: int, months: int) -> list:
        end = date.today()
        calendar = SeasonalCalendar(end - timedelta(days=months * 30), end)

        shoppers = []
        next_order_seq = 1
        for shopper_id in range(1, num_users + 1):
            shopper = Shopper(
                shopper_id,
                self.name_generator.generate(self.rng),
                self.rng.choice(self.personas),
                self.rng.choice(self.locations),
            )
            next_order_seq = shopper.place_orders(
                self.catalogue,
                calendar,
                self.rng,
                months,
                self.OUTLIER_PROBABILITY,
                self.ITEMS_PER_ORDER_WEIGHTS,
                self.QUANTITY_WEIGHTS,
                next_order_seq,
            )
            shoppers.append(shopper)
        return shoppers


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--users", type=int, default=60)
    parser.add_argument("--months", type=int, default=18)
    parser.add_argument("--db", type=Path, default=DB_PATH)
    args = parser.parse_args()

    catalogue = Catalogue.from_db(args.db)
    generator = OrderGenerator(catalogue, PERSONAS, LOCATIONS, seed=args.seed)
    shoppers = generator.generate(args.users, args.months)

    store = SyntheticStore(args.db)
    store.ensure_schema()
    store.clear()
    for shopper in shoppers:
        store.save_shopper(shopper)
    store.commit()
    store.close()

    order_count = sum(len(shopper.orders) for shopper in shoppers)
    line_count = sum(len(order.lines) for shopper in shoppers for order in shopper.orders)
    print(f"Wrote {len(shoppers)} shoppers, {order_count} orders, {line_count} line items to {args.db}")


if __name__ == "__main__":
    main()
