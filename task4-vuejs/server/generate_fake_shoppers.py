# Makes up a bunch of fake orders for the /metrics dashboard to show.
#
# Reads the real products already in the database, then writes fake
# shoppers and orders into their own tables (synthetic_shopper,
# synthetic_order, synthetic_order_line - see models.py) so they never
# mix with real accounts.
#
# Run it with:
#   python generate_fake_shoppers.py [--seed N] [--users N] [--months N]

import argparse
import random
from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from database import SessionLocal, engine
from locations import LOCATIONS
from models import Base, Product, SyntheticOrder, SyntheticOrderLine, SyntheticShopper
from names import NameGenerator
from shopper_profile import PERSONAS

DEFAULT_SEED = 42
DEFAULT_USERS = 60
DEFAULT_MONTHS = 18


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


class GenerationRules:
    # Just a small bundle of settings, so we're not passing three
    # separate arguments around everywhere.
    def __init__(self):
        self.outlier_chance = 0.08  # chance a line item ignores the persona and buys something random
        self.items_per_order = {1: 5, 2: 4, 3: 2, 4: 1}  # most orders only have 1-2 items
        self.quantities = {1: 6, 2: 2, 3: 1}


def random_poisson(average, rng):
    # Knuth's method for picking a random count around an average, e.g.
    # "usually 14 orders a year, but sometimes 11, sometimes 17".
    if average <= 0:
        return 0
    limit = 2.718281828459045**-average
    count, product = 0, 1.0
    while True:
        count += 1
        product *= rng.random()
        if product <= limit:
            return count - 1


def pick_weighted(rng, weights):
    return rng.choices(list(weights.keys()), weights=list(weights.values()))[0]


def how_many_orders(persona, months, rng):
    average = persona.avg_orders_per_year * (months / 12)
    return max(1, random_poisson(average, rng))


def build_shopper(shopper_id, name_generator, rng, months, products_by_category, calendar, rules, next_order_id):
    persona = rng.choice(PERSONAS)
    location = rng.choice(LOCATIONS)
    categories = list(products_by_category.keys())

    shopper = SyntheticShopper(
        id=shopper_id,
        name=name_generator.generate(rng),
        persona=persona.name,
        city=location.city,
        region=location.region,
        lat=location.lat,
        lng=location.lng,
    )

    for _ in range(how_many_orders(persona, months, rng)):
        order = SyntheticOrder(id=f"so-{next_order_id}", order_date=calendar.random_date(rng))
        next_order_id += 1

        item_count = pick_weighted(rng, rules.items_per_order)
        for _ in range(item_count):
            category, is_outlier = persona.choose_category(rng, categories, rules.outlier_chance)
            product = rng.choice(products_by_category[category])
            quantity = pick_weighted(rng, rules.quantities)
            order.lines.append(SyntheticOrderLine(product_id=product.id, quantity=quantity, is_outlier=is_outlier))

        shopper.orders.append(order)

    return shopper, next_order_id


def generate(db, num_shoppers, months, seed):
    products = db.scalars(
        select(Product).where(Product.is_active.is_(True)).options(selectinload(Product.category))
    ).all()
    products_by_category = {}
    for product in products:
        products_by_category.setdefault(product.category.slug, []).append(product)

    rng = random.Random(seed)
    name_generator = NameGenerator()
    rules = GenerationRules()
    end = date.today()
    calendar = SeasonalCalendar(end - timedelta(days=months * 30), end)

    shoppers = []
    next_order_id = 1
    for shopper_id in range(1, num_shoppers + 1):
        shopper, next_order_id = build_shopper(
            shopper_id, name_generator, rng, months, products_by_category, calendar, rules, next_order_id
        )
        shoppers.append(shopper)
    return shoppers


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--seed", type=int, default=DEFAULT_SEED)
    parser.add_argument("--users", type=int, default=DEFAULT_USERS)
    parser.add_argument("--months", type=int, default=DEFAULT_MONTHS)
    args = parser.parse_args()

    Base.metadata.create_all(engine)

    with SessionLocal() as db:
        shoppers = generate(db, args.users, args.months, args.seed)

        # Wipe the old fake data before writing the fresh batch - re-running
        # this replaces, it doesn't pile up. Children first, so nothing is
        # left pointing at a row that no longer exists.
        db.query(SyntheticOrderLine).delete()
        db.query(SyntheticOrder).delete()
        db.query(SyntheticShopper).delete()
        db.add_all(shoppers)
        db.commit()

        order_count = sum(len(shopper.orders) for shopper in shoppers)
        line_count = sum(len(order.lines) for shopper in shoppers for order in shopper.orders)
        print(f"Wrote {len(shoppers)} shoppers, {order_count} orders, {line_count} line items.")


if __name__ == "__main__":
    main()
