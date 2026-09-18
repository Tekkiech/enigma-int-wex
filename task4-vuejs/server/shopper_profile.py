# A persona is a type of shopper, like "tech-enthusiast" or "home-cook".
# Used two ways: generate_fake_shoppers.py picks a persona for each fake
# shopper and uses its weights to decide what they buy, and every real
# account gets checked against these same personas too - see
# is_outlier_purchase and predict_persona below.
#
# Every new account gets a random home city at signup, but no persona
# yet - persona starts out None ("not assigned") until they place their
# first order, then predict_persona() picks one based on what they
# actually bought.

import random

from locations import LOCATIONS


class Persona:
    def __init__(self, name, avg_orders_per_year, weights):
        self.name = name
        self.avg_orders_per_year = avg_orders_per_year
        self.weights = weights  # category -> how much this persona likes it

    @property
    def categories(self):
        return set(self.weights.keys())

    def choose_category(self, rng, categories, outlier_chance):
        # Most of the time, buy from a category this persona likes.
        # Sometimes (outlier_chance), buy something totally random instead -
        # that's what makes a tech-enthusiast buy a banana once in a while.
        if rng.random() < outlier_chance:
            return rng.choice(categories), True

        my_weights = {c: w for c, w in self.weights.items() if c in categories}
        if not my_weights:
            return rng.choice(categories), True

        picked = rng.choices(list(my_weights.keys()), weights=list(my_weights.values()))[0]
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

PERSONAS_BY_NAME = {persona.name: persona for persona in PERSONAS}


def is_outlier_purchase(persona_name, category):
    persona = PERSONAS_BY_NAME.get(persona_name)
    if not persona:
        return True
    return category not in persona.categories


def predict_persona(category_counts):
    # category_counts: {category slug: how many of that a shopper has
    # bought}. Picks whichever persona's usual categories cover the most
    # of what they've actually bought - a simple "best fit" guess, not
    # anything fancier.
    best_persona = PERSONAS[0].name
    best_score = -1
    for persona in PERSONAS:
        score = sum(count for category, count in category_counts.items() if category in persona.categories)
        if score > best_score:
            best_score = score
            best_persona = persona.name
    return best_persona


def initial_profile():
    location = random.choice(LOCATIONS)
    return {
        "persona": None,
        "city": location.city,
        "region": location.region,
        "lat": location.lat,
        "lng": location.lng,
    }
