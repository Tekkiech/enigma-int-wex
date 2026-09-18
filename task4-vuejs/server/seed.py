# Downloads all the products from DummyJSON and saves them to our own
# database, so the app never has to call DummyJSON again after this.
# Safe to run more than once - it updates existing products instead of
# duplicating them.
#
#   python seed.py

import sys
from datetime import datetime, timezone

import requests
from sqlalchemy import select

from database import SessionLocal, engine
from models import Base, Category, Product, ProductImage, ProductReview, ProductTag

DUMMYJSON_URL = "https://dummyjson.com/products?limit=0"


def humanize_slug(slug):
    return " ".join(word.capitalize() for word in slug.split("-"))


def seed():
    print(f"Fetching {DUMMYJSON_URL} ...")
    response = requests.get(DUMMYJSON_URL, timeout=30)
    response.raise_for_status()
    products = response.json()["products"]
    print(f"Got {len(products)} products.")

    Base.metadata.create_all(engine)

    with SessionLocal() as db:
        categories_by_slug = {c.slug: c for c in db.scalars(select(Category)).all()}

        for raw in products:
            slug = raw["category"]
            category = categories_by_slug.get(slug)
            if not category:
                category = Category(slug=slug, name=humanize_slug(slug))
                db.add(category)
                db.flush()  # assign category.id before products reference it
                categories_by_slug[slug] = category

            product = db.get(Product, raw["id"])
            if not product:
                product = Product(id=raw["id"])
                db.add(product)

            product.category_id = category.id
            product.title = raw["title"]
            product.description = raw.get("description")
            product.price = raw["price"]
            product.discount_percentage = raw.get("discountPercentage", 0)
            product.rating = raw.get("rating")
            product.stock = raw.get("stock", 0)
            product.brand = raw.get("brand")
            product.thumbnail = raw.get("thumbnail")
            product.is_active = True

            # Clear out and re-add images/tags/reviews each time, so a
            # re-run always matches whatever DummyJSON has right now.
            product.images.clear()
            for url in raw.get("images", []):
                product.images.append(ProductImage(url=url))

            product.tags.clear()
            for tag in raw.get("tags", []):
                product.tags.append(ProductTag(tag=tag))

            product.reviews.clear()
            for review in raw.get("reviews", []):
                if review.get("date"):
                    created_at = datetime.fromisoformat(review["date"].replace("Z", "+00:00"))
                else:
                    created_at = datetime.now(timezone.utc)
                product.reviews.append(
                    ProductReview(
                        reviewer_name=review.get("reviewerName"),
                        reviewer_email=review.get("reviewerEmail"),
                        rating=review.get("rating"),
                        comment=review.get("comment"),
                        created_at=created_at,
                    )
                )

        db.commit()
        print(f"Seeded {len(categories_by_slug)} categories and {len(products)} products.")


if __name__ == "__main__":
    try:
        seed()
    except requests.RequestException as exc:
        print(f"Failed to fetch DummyJSON: {exc}", file=sys.stderr)
        sys.exit(1)
