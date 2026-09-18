# Every new account gets a random persona and home city, just so their
# real orders can show up on the /metrics dashboard next to the fake
# shoppers - it has nothing to do with what they actually buy. Same
# persona names and cities as analytics/generate.py uses, kept as a
# separate copy here since this file doesn't need everything that one
# does (the category weights, the outlier logic, etc).

import random

PERSONAS = [
    "tech-enthusiast",
    "home-cook",
    "family-shopper",
    "fashion-forward",
    "fitness-outdoors",
    "beauty-selfcare",
    "budget-generalist",
]

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


def random_profile():
    city, region, lat, lng = random.choice(LOCATIONS)
    return {
        "persona": random.choice(PERSONAS),
        "city": city,
        "region": region,
        "lat": lat,
        "lng": lng,
    }
