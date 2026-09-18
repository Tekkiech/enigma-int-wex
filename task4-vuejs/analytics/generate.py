# Makes up a bunch of fake orders for the /metrics dashboard to show.
#
# It reads the real products out of tekkiech.db, then writes fake
# shoppers and orders back into that same file, in their own tables
# (synthetic_shopper, synthetic_order, synthetic_order_line) so they
# never mix with real accounts. No JSON files involved - the Flask API
# (GET /api/metrics/orders) reads straight from these tables.
#
# Run it with:
#   python3 generate.py [--seed N] [--users N] [--months N] [--db PATH]

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
    def __init__(self, product_id, title, price, category):
        self.id = product_id
        self.title = title
        self.price = price
        self.category = category


class Catalogue:
    # Holds every product, grouped by category. Only ever reads from the
    # database - writing happens over in SyntheticStore.

    def __init__(self, products_by_category):
        self.products_by_category = products_by_category

    @classmethod
    def from_db(cls, db_path):
        connection = sqlite3.connect(db_path)
        rows = connection.execute(
            """
            SELECT p.id, p.title, p.price, c.slug
            FROM product p JOIN category c ON p.category_id = c.id
            WHERE p.is_active = 1
            """
        ).fetchall()
        connection.close()

        products_by_category = {}
        for product_id, title, price, category in rows:
            product = Product(product_id, title, price, category)
            products_by_category.setdefault(category, []).append(product)
        return cls(products_by_category)

    @property
    def categories(self):
        return list(self.products_by_category.keys())

    def random_product(self, category, rng):
        return rng.choice(self.products_by_category[category])


class OrderLine:
    def __init__(self, product, quantity, is_outlier):
        self.product = product
        self.quantity = quantity
        self.is_outlier = is_outlier

    @property
    def line_total(self):
        return round(self.product.price * self.quantity, 2)


class Order:
    def __init__(self, order_id, shopper_id, order_date):
        self.id = order_id
        self.shopper_id = shopper_id
        self.order_date = order_date
        self.lines = []

    def add_line(self, line):
        self.lines.append(line)


class SeasonalCalendar:
    # Some months get more orders than others - busier around the
    # holidays (Nov/Dec), quieter right after (Jan/Feb).
    MONTH_WEIGHTS = {
        1: 0.8, 2: 0.8, 3: 0.9, 4: 0.95, 5: 1.0, 6: 1.0,
        7: 0.95, 8: 1.0, 9: 1.05, 10: 1.1, 11: 1.6, 12: 1.8,
    }  # fmt: skip

    def __init__(self, start, end):
        self.start = start
        self.end = end
        self.days_in_range = (end - start).days
        self.busiest_month_weight = max(self.MONTH_WEIGHTS.values())

    def random_date(self, rng):
        # Pick a random day, then re-roll it sometimes based on how busy
        # that month is, so busier months end up with more orders.
        for _ in range(20):
            day = self.start + timedelta(days=rng.randint(0, self.days_in_range))
            chance = self.MONTH_WEIGHTS[day.month] / self.busiest_month_weight
            if rng.random() < chance:
                return day
        return self.start + timedelta(days=rng.randint(0, self.days_in_range))


class Shopper:
    def __init__(self, shopper_id, name, persona, location):
        self.id = shopper_id
        self.name = name
        self.persona = persona
        self.location = location
        self.orders = []

    def how_many_orders(self, months, rng):
        average = self.persona.avg_orders_per_year * (months / 12)
        return max(1, OrderGenerator.random_poisson(average, rng))

    def place_orders(self, catalogue, calendar, rng, months, rules, next_order_id):
        for _ in range(self.how_many_orders(months, rng)):
            order = Order(f"so-{next_order_id}", self.id, calendar.random_date(rng))
            next_order_id += 1

            item_count = OrderGenerator.pick_weighted(rng, rules.items_per_order)
            for _ in range(item_count):
                category, is_outlier = self.persona.choose_category(rng, catalogue.categories, rules.outlier_chance)
                product = catalogue.random_product(category, rng)
                quantity = OrderGenerator.pick_weighted(rng, rules.quantities)
                order.add_line(OrderLine(product, quantity, is_outlier))

            self.orders.append(order)
        return next_order_id


class SyntheticStore:
    # Creates and fills the synthetic_* tables in tekkiech.db. Kept apart
    # from the real user/order/order_item tables so fake shoppers never
    # end up mixed in with real accounts.

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
    # product_id isn't a real FOREIGN KEY here - it points at the app's
    # own product table, which this script doesn't own.

    def __init__(self, db_path):
        self.connection = sqlite3.connect(db_path)

    def ensure_schema(self):
        self.connection.executescript(self.SCHEMA)

    def clear(self):
        self.connection.executescript(
            "DELETE FROM synthetic_order_line; DELETE FROM synthetic_order; DELETE FROM synthetic_shopper;"
        )

    def save_shopper(self, shopper):
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

    def save_order(self, order):
        self.connection.execute(
            "INSERT INTO synthetic_order (id, shopper_id, order_date) VALUES (?, ?, ?)",
            (order.id, order.shopper_id, order.order_date.isoformat()),
        )
        self.connection.executemany(
            "INSERT INTO synthetic_order_line (order_id, product_id, quantity, is_outlier) VALUES (?, ?, ?, ?)",
            [(order.id, line.product.id, line.quantity, int(line.is_outlier)) for line in order.lines],
        )

    def commit(self):
        self.connection.commit()

    def close(self):
        self.connection.close()


class GenerationRules:
    # Just a small bundle of settings, so we're not passing five separate
    # arguments around everywhere.
    def __init__(self):
        self.outlier_chance = 0.08  # chance a line item ignores the persona and buys something random
        self.items_per_order = {1: 5, 2: 4, 3: 2, 4: 1}  # most orders only have 1-2 items
        self.quantities = {1: 6, 2: 2, 3: 1}


class OrderGenerator:
    def __init__(self, catalogue, personas, locations, seed=42):
        self.catalogue = catalogue
        self.personas = personas
        self.locations = locations
        self.name_generator = NameGenerator()
        self.rules = GenerationRules()
        self.rng = random.Random(seed)

    @staticmethod
    def random_poisson(average, rng):
        # Knuth's method for picking a random count around an average,
        # e.g. "usually 14 orders a year, but sometimes 11, sometimes 17".
        if average <= 0:
            return 0
        limit = 2.718281828459045**-average
        count, product = 0, 1.0
        while True:
            count += 1
            product *= rng.random()
            if product <= limit:
                return count - 1

    @staticmethod
    def pick_weighted(rng, weights):
        return rng.choices(list(weights.keys()), weights=list(weights.values()))[0]

    def generate(self, num_shoppers, months):
        end = date.today()
        calendar = SeasonalCalendar(end - timedelta(days=months * 30), end)

        shoppers = []
        next_order_id = 1
        for shopper_id in range(1, num_shoppers + 1):
            shopper = Shopper(
                shopper_id,
                self.name_generator.generate(self.rng),
                self.rng.choice(self.personas),
                self.rng.choice(self.locations),
            )
            next_order_id = shopper.place_orders(self.catalogue, calendar, self.rng, months, self.rules, next_order_id)
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
