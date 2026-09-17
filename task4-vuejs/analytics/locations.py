"""Shopper locations for synthetic order generation - see generate.py.

A fixed set of real US cities with coordinates, so a future map view has
real lat/lng to place markers at rather than invented ones. Assigned per
shopper, not per order: a synthetic shopper has one home location for the
life of the dataset, the same way a real customer does.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class Location:
    city: str
    region: str  # US state abbreviation
    lat: float
    lng: float


LOCATIONS = [
    Location("New York", "NY", 40.7128, -74.0060),
    Location("Los Angeles", "CA", 34.0522, -118.2437),
    Location("Chicago", "IL", 41.8781, -87.6298),
    Location("Houston", "TX", 29.7604, -95.3698),
    Location("Phoenix", "AZ", 33.4484, -112.0740),
    Location("Philadelphia", "PA", 39.9526, -75.1652),
    Location("San Antonio", "TX", 29.4241, -98.4936),
    Location("San Diego", "CA", 32.7157, -117.1611),
    Location("Dallas", "TX", 32.7767, -96.7970),
    Location("Austin", "TX", 30.2672, -97.7431),
    Location("Seattle", "WA", 47.6062, -122.3321),
    Location("Denver", "CO", 39.7392, -104.9903),
    Location("Boston", "MA", 42.3601, -71.0589),
    Location("Atlanta", "GA", 33.7490, -84.3880),
    Location("Miami", "FL", 25.7617, -80.1918),
    Location("Portland", "OR", 45.5152, -122.6784),
    Location("Minneapolis", "MN", 44.9778, -93.2650),
    Location("Detroit", "MI", 42.3314, -83.0458),
]
