"""Shopper archetypes for synthetic order generation - see generate.py."""


class Persona:
    """A shopper archetype: which categories it buys from and how often.

    weights is a category-slug -> relative weight attribute (not required
    to sum to anything in particular - choose_category normalizes it via
    random.choices). A category left out gets weight 0 for this persona's
    "normal" purchases - it only shows up via choose_category's outlier
    roll, which samples uniformly across every category in the catalogue
    regardless of persona. That's the whole mechanism behind a tech buyer
    occasionally buying a kiwi or a plant pot: no special-cased "quirky"
    logic, just a small per-item chance of ignoring this weight map
    entirely.

    avg_orders_per_year is a Poisson mean, not a hard cap.
    """

    def __init__(self, name: str, avg_orders_per_year: int, weights: dict):
        self.name = name
        self.avg_orders_per_year = avg_orders_per_year
        self.weights = weights

    def weights_in(self, categories: list) -> dict:
        """This persona's weights, restricted to categories that actually
        exist in a given catalogue - a persona shouldn't be asked to draw
        from a category the catalogue doesn't have."""
        return {slug: weight for slug, weight in self.weights.items() if slug in categories}

    def choose_category(self, rng, categories: list, outlier_probability: float) -> tuple:
        """The generating step itself: with outlier_probability chance,
        ignore this persona's weights and pick uniformly across every
        catalogue category; otherwise pick weighted by self.weights.
        Returns (category_slug, was_outlier)."""
        if rng.random() < outlier_probability:
            return rng.choice(categories), True

        weights = self.weights_in(categories)
        if not weights:
            return rng.choice(categories), True

        slugs = list(weights.keys())
        picked = rng.choices(slugs, weights=list(weights.values()), k=1)[0]
        return picked, False


PERSONAS = [
    Persona(
        "tech-enthusiast",
        avg_orders_per_year=14,
        weights={
            "laptops": 5,
            "smartphones": 5,
            "tablets": 4,
            "mobile-accessories": 6,
            "mens-watches": 1,
            "sunglasses": 1,
        },
    ),
    Persona(
        "home-cook",
        avg_orders_per_year=20,
        weights={
            "groceries": 8,
            "kitchen-accessories": 6,
            "home-decoration": 2,
            "furniture": 1,
        },
    ),
    Persona(
        "family-shopper",
        avg_orders_per_year=16,
        weights={
            "groceries": 6,
            "kitchen-accessories": 3,
            "home-decoration": 3,
            "furniture": 2,
            "sports-accessories": 2,
            "tops": 1,
        },
    ),
    Persona(
        "fashion-forward",
        avg_orders_per_year=11,
        weights={
            "womens-dresses": 4,
            "womens-shoes": 3,
            "womens-bags": 3,
            "womens-jewellery": 2,
            "womens-watches": 2,
            "mens-shirts": 3,
            "mens-shoes": 3,
            "tops": 3,
            "sunglasses": 2,
            "fragrances": 2,
        },
    ),
    Persona(
        "fitness-outdoors",
        avg_orders_per_year=9,
        weights={
            "sports-accessories": 7,
            "motorcycle": 2,
            "vehicle": 1,
            "mens-shoes": 2,
            "womens-shoes": 2,
            "groceries": 2,
        },
    ),
    Persona(
        "beauty-selfcare",
        avg_orders_per_year=13,
        weights={
            "beauty": 5,
            "skin-care": 5,
            "fragrances": 3,
            "womens-jewellery": 1,
            "sunglasses": 1,
        },
    ),
    Persona(
        "budget-generalist",
        avg_orders_per_year=7,
        weights={
            "groceries": 4,
            "kitchen-accessories": 2,
            "mens-shirts": 1,
            "tops": 1,
            "home-decoration": 1,
            "mobile-accessories": 1,
            "sports-accessories": 1,
        },
    ),
]

PERSONAS_BY_NAME = {p.name: p for p in PERSONAS}
