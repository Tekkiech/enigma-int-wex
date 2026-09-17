"""Synthetic order-history generator for the metrics dashboard.

Reads the real product catalogue straight out of tekkiech.db (read-only -
this never writes to the live app's database, see the README in this
folder for why) and fabricates a year and a half of orders for a batch of
synthetic shoppers, each assigned a persona from personas.py. Every line
item has a small independent chance of ignoring its shopper's persona
entirely and buying from a random category instead - that's the "quirky
outlier" behaviour (a tech buyer's occasional banana), not a special case,
just noise layered on top of the persona's normal weights.

Output is a flat JSON array, one record per order line item, written to
synthetic-orders.json - deliberately not written back into the SQLite DB,
so this stays a self-contained dataset the eventual Chart.js dashboard can
fetch directly, decoupled from real user data.

Usage:
    python3 generate.py [--seed N] [--users N] [--months N] [--out PATH]
"""

import argparse
import json
import random
import sqlite3
from dataclasses import dataclass
from datetime import date, timedelta
from pathlib import Path

from personas import PERSONAS, Persona

DB_PATH = Path(__file__).resolve().parent.parent / "server" / "tekkiech.db"
OUT_PATH = Path(__file__).resolve().parent / "synthetic-orders.json"


@dataclass(frozen=True)
class Product:
    id: int
    title: str
    price: float
    category: str


class Catalogue:
    """The real product catalogue, grouped by category - read-only, loaded
    once from tekkiech.db and never written back to."""

    def __init__(self, by_category: dict):
        self._by_category = by_category

    @classmethod
    def from_db(cls, db_path: Path) -> "Catalogue":
        conn = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
        try:
            cur = conn.cursor()
            cur.execute(
                """
                SELECT p.id, p.title, p.price, c.slug
                FROM product p JOIN category c ON p.category_id = c.id
                WHERE p.is_active = 1
                """
            )
            by_category = {}
            for product_id, title, price, slug in cur.fetchall():
                by_category.setdefault(slug, []).append(Product(product_id, title, price, slug))
        finally:
            conn.close()
        return cls(by_category)

    @property
    def categories(self) -> list:
        return list(self._by_category.keys())

    def products_in(self, category: str) -> list:
        return self._by_category[category]


@dataclass(frozen=True)
class OrderLine:
    """One line item within an order - the record a JSON export row
    represents one-to-one."""

    order_id: str
    order_date: date
    user_id: str
    persona: str
    product: Product
    quantity: int
    is_outlier: bool

    @property
    def line_total(self) -> float:
        return round(self.product.price * self.quantity, 2)

    def to_dict(self) -> dict:
        return {
            "orderId": self.order_id,
            "date": self.order_date.isoformat(),
            "userId": self.user_id,
            "persona": self.persona,
            "productId": self.product.id,
            "title": self.product.title,
            "category": self.product.category,
            "price": self.product.price,
            "quantity": self.quantity,
            "lineTotal": self.line_total,
            "isOutlier": self.is_outlier,
        }


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
    """One synthetic user: an id and a persona. Owns nothing about *when*
    it shops (that's OrderGenerator's calendar) or *what's for sale*
    (that's the catalogue) - just how many orders it places and, per
    order, what it tends to buy."""

    def __init__(self, user_id: str, persona: Persona):
        self.user_id = user_id
        self.persona = persona

    def order_count(self, months: int, rng: random.Random) -> int:
        mean = self.persona.avg_orders_per_year * (months / 12)
        return max(1, OrderGenerator.poisson_sample(mean, rng))


class OrderGenerator:
    """Orchestrates the whole synthetic dataset: assigns shoppers to
    personas, decides how many orders and items each places, and where the
    small outlier chance sends a line item outside its shopper's persona.
    """

    OUTLIER_PROBABILITY = 0.08  # chance any single line item ignores the persona's weights
    ITEMS_PER_ORDER_WEIGHTS = {1: 5, 2: 4, 3: 2, 4: 1}  # most orders are small
    QUANTITY_WEIGHTS = {1: 6, 2: 2, 3: 1}

    def __init__(self, catalogue: Catalogue, personas: list, seed: int = 42):
        self.catalogue = catalogue
        self.personas = personas
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

    def _weighted_choice(self, weight_map: dict):
        return self.rng.choices(list(weight_map.keys()), weights=list(weight_map.values()), k=1)[0]

    def _random_product(self, category: str) -> Product:
        return self.rng.choice(self.catalogue.products_in(category))

    def _generate_line(self, shopper: Shopper, order_id: str, order_date: date, persona_weights: dict) -> OrderLine:
        is_outlier = self.rng.random() < self.OUTLIER_PROBABILITY
        if is_outlier:
            category = self._weighted_choice({slug: 1 for slug in self.catalogue.categories})
        else:
            category = self._weighted_choice(persona_weights)
        quantity = self._weighted_choice(self.QUANTITY_WEIGHTS)
        return OrderLine(
            order_id, order_date, shopper.user_id, shopper.persona.name, self._random_product(category), quantity, is_outlier
        )

    def _generate_for_shopper(self, shopper: Shopper, calendar: SeasonalCalendar, months: int, order_seq: int) -> tuple:
        persona_weights = shopper.persona.weights_in(self.catalogue.categories)
        if not persona_weights:
            return [], order_seq

        lines = []
        for _ in range(shopper.order_count(months, self.rng)):
            order_seq += 1
            order_id = f"so-{order_seq}"
            order_date = calendar.random_date(self.rng)
            num_items = self._weighted_choice(self.ITEMS_PER_ORDER_WEIGHTS)
            lines.extend(self._generate_line(shopper, order_id, order_date, persona_weights) for _ in range(num_items))
        return lines, order_seq

    def generate(self, num_users: int, months: int) -> list:
        end = date.today()
        calendar = SeasonalCalendar(end - timedelta(days=months * 30), end)

        lines = []
        order_seq = 0
        for i in range(num_users):
            shopper = Shopper(f"synthetic-{i + 1}", self.rng.choice(self.personas))
            shopper_lines, order_seq = self._generate_for_shopper(shopper, calendar, months, order_seq)
            lines.extend(shopper_lines)

        lines.sort(key=lambda line: line.order_date)
        return lines

    def write(self, lines: list, out_path: Path) -> None:
        out_path.write_text(json.dumps([line.to_dict() for line in lines], indent=2))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--users", type=int, default=60)
    parser.add_argument("--months", type=int, default=18)
    parser.add_argument("--out", type=Path, default=OUT_PATH)
    args = parser.parse_args()

    catalogue = Catalogue.from_db(DB_PATH)
    generator = OrderGenerator(catalogue, PERSONAS, seed=args.seed)
    lines = generator.generate(args.users, args.months)
    generator.write(lines, args.out)

    print(f"Wrote {len(lines)} line items across {args.users} synthetic shoppers to {args.out}")


if __name__ == "__main__":
    main()
