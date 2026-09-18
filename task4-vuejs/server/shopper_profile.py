# Every new account gets a random home city at signup, but no persona
# yet - persona starts out None ("not assigned") until they place their
# first order, then predict_persona() below picks one based on what
# they actually bought. The persona doesn't limit what a real account
# can buy - but /api/metrics/orders checks a purchase's category
# against PERSONA_CATEGORIES to flag it as an "unexpected purchase"
# when it's outside what that persona normally buys, the same way the
# fake shoppers work. Same persona names, categories, and cities as
# analytics/generate.py uses, kept as a separate (simpler) copy here
# since this file doesn't need the category weights, just which
# categories count as "normal" for each persona.

import random

PERSONA_CATEGORIES = {
    "tech-enthusiast": {"laptops", "smartphones", "tablets", "mobile-accessories", "mens-watches", "sunglasses"},
    "home-cook": {"groceries", "kitchen-accessories", "home-decoration", "furniture"},
    "family-shopper": {
        "groceries",
        "kitchen-accessories",
        "home-decoration",
        "furniture",
        "sports-accessories",
        "tops",
    },
    "fashion-forward": {
        "womens-dresses",
        "womens-shoes",
        "womens-bags",
        "womens-jewellery",
        "womens-watches",
        "mens-shirts",
        "mens-shoes",
        "tops",
        "sunglasses",
        "fragrances",
    },
    "fitness-outdoors": {"sports-accessories", "motorcycle", "vehicle", "mens-shoes", "womens-shoes", "groceries"},
    "beauty-selfcare": {"beauty", "skin-care", "fragrances", "womens-jewellery", "sunglasses"},
    "budget-generalist": {
        "groceries",
        "kitchen-accessories",
        "mens-shirts",
        "tops",
        "home-decoration",
        "mobile-accessories",
        "sports-accessories",
    },
}

PERSONAS = list(PERSONA_CATEGORIES.keys())


def is_outlier_purchase(persona, category):
    return category not in PERSONA_CATEGORIES.get(persona, set())


def predict_persona(category_counts):
    # category_counts: {category slug: how many of that a shopper has
    # bought}. Picks whichever persona's usual categories cover the most
    # of what they've actually bought - a simple "best fit" guess, not
    # anything fancier. Falls back to the first persona if nothing
    # matches (e.g. a brand new account with no orders yet).
    best_persona = PERSONAS[0]
    best_score = -1
    for persona, categories in PERSONA_CATEGORIES.items():
        score = sum(count for category, count in category_counts.items() if category in categories)
        if score > best_score:
            best_score = score
            best_persona = persona
    return best_persona


LOCATIONS = [
    ("New York", "NY", 40.7128, -74.0060),
    ("Los Angeles", "CA", 34.0522, -118.2437),
    ("Chicago", "IL", 41.8781, -87.6298),
    ("Houston", "TX", 29.7604, -95.3698),
    ("Phoenix", "AZ", 33.4484, -112.0740),
    ("Philadelphia", "PA", 39.9526, -75.1652),
    ("San Antonio", "TX", 29.4241, -98.4936),
    ("San Diego", "CA", 32.7157, -117.1611),
    ("Dallas", "TX", 32.7767, -96.7970),
    ("Austin", "TX", 30.2672, -97.7431),
    ("Seattle", "WA", 47.6062, -122.3321),
    ("Denver", "CO", 39.7392, -104.9903),
    ("Boston", "MA", 42.3601, -71.0589),
    ("Atlanta", "GA", 33.7490, -84.3880),
    ("Miami", "FL", 25.7617, -80.1918),
    ("Portland", "OR", 45.5152, -122.6784),
    ("Minneapolis", "MN", 44.9778, -93.2650),
    ("Detroit", "MI", 42.3314, -83.0458),
]


def initial_profile():
    city, region, lat, lng = random.choice(LOCATIONS)
    return {
        "persona": None,
        "city": city,
        "region": region,
        "lat": lat,
        "lng": lng,
    }
