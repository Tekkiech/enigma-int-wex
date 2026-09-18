# The backend API for Tekkiech.Market. Needs to be running for the
# frontend to work. Most routes need you to be signed in - browsing
# products and categories doesn't.

import os
from collections import Counter
from decimal import Decimal

from flask import Flask, jsonify, request, session
from flask_cors import CORS
from sqlalchemy import func, select, text
from sqlalchemy.orm import selectinload

from auth import (
    admin_required,
    hash_password,
    lockout_seconds_remaining,
    login_required,
    password_requirement_errors,
    register_failed_login,
    register_successful_login,
    verify_login,
)
from database import SessionLocal, engine
from models import Base, CartItem, Category, Order, OrderItem, Product, ProductReview, User, WishlistItem
from shopper_profile import initial_profile, is_outlier_purchase, predict_persona

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev-only-change-me")
CORS(app, supports_credentials=True, origins=os.environ.get("CORS_ORIGIN", "http://localhost:1350"))


def num(value):
    # Decimal doesn't convert to JSON on its own, so turn it into a float.
    return float(value) if isinstance(value, Decimal) else value


def product_load_options(relationship=None):
    # Tells SQLAlchemy to load a product's images/category/tags/reviews
    # all at once, instead of one extra query per product per field.
    attrs = [Product.images, Product.category, Product.tags, Product.reviews]
    if relationship is None:
        return [selectinload(attr) for attr in attrs]
    return [selectinload(relationship).selectinload(attr) for attr in attrs]


def user_to_dict(user):
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "isAdmin": user.is_admin,
        "persona": user.persona,
        "city": user.city,
        "region": user.region,
    }


def product_to_dict(product):
    return {
        "id": product.id,
        "title": product.title,
        "description": product.description,
        "category": product.category.slug,
        "categoryName": product.category.name,
        "price": num(product.price),
        "discountPercentage": num(product.discount_percentage),
        "rating": num(product.rating),
        "stock": product.stock,
        "brand": product.brand,
        "thumbnail": product.thumbnail,
        "images": [image.url for image in product.images],
        "tags": [tag.tag for tag in product.tags],
        "reviews": [review_to_dict(review) for review in product.reviews],
    }


def review_to_dict(review):
    return {
        "userId": review.user_id,
        "reviewerName": review.reviewer_name,
        "reviewerEmail": review.reviewer_email,
        "rating": num(review.rating),
        "comment": review.comment,
        "date": review.created_at.isoformat(),
    }


def cart_item_to_dict(item):
    return {"productId": item.product_id, "quantity": item.quantity, "product": product_to_dict(item.product)}


def order_to_dict(order):
    return {
        "id": order.id,
        "status": order.status,
        "subtotal": num(order.subtotal),
        "createdAt": order.created_at.isoformat(),
        "items": [
            {
                "productId": item.product_id,
                "quantity": item.quantity,
                "unitPrice": num(item.unit_price),
                "product": product_to_dict(item.product),
            }
            for item in order.items
        ],
    }


# --- auth ---------------------------------------------------------------


@app.post("/api/auth/signup")
def signup():
    body = request.get_json(force=True)
    name = (body.get("name") or "").strip()
    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""
    if not email or not password:
        return jsonify(error="Email and password are required."), 400

    missing = password_requirement_errors(password)
    if missing:
        return jsonify(error="Password needs " + ", ".join(missing) + "."), 400

    with SessionLocal() as db:
        if db.scalar(select(User).where(User.email == email)):
            return jsonify(error="An account with that email already exists."), 409
        user = User(name=name or None, email=email, password_hash=hash_password(password), **initial_profile())
        db.add(user)
        db.commit()
        session["user_id"] = user.id
        return jsonify(user_to_dict(user)), 201


@app.post("/api/auth/login")
def login():
    body = request.get_json(force=True)
    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""

    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.email == email))
        password_ok = verify_login(password, user)

        if user:
            remaining = lockout_seconds_remaining(user)
            if remaining:
                return jsonify(error=f"Too many failed attempts. Try again in {remaining // 60 + 1} minute(s)."), 423
            if not password_ok:
                register_failed_login(user)
                db.commit()
                return jsonify(error="Invalid email or password."), 401
            register_successful_login(user)
            db.commit()
            session["user_id"] = user.id
            return jsonify(user_to_dict(user))

        return jsonify(error="Invalid email or password."), 401


@app.post("/api/auth/logout")
def logout():
    session.clear()
    return "", 204


@app.get("/api/auth/me")
@login_required
def me():
    with SessionLocal() as db:
        user = db.get(User, session["user_id"])
        if not user:
            session.clear()
            return jsonify(error="Not signed in."), 401
        return jsonify(user_to_dict(user))


# --- catalog (public, read-only) -----------------------------------------


@app.get("/api/categories")
def list_categories():
    with SessionLocal() as db:
        categories = db.scalars(select(Category).order_by(Category.name)).all()
        return jsonify(
            [
                {
                    "slug": c.slug,
                    "name": c.name,
                    "count": len(c.products),
                    "images": [p.thumbnail for p in c.products[:4] if p.thumbnail],
                }
                for c in categories
            ]
        )


@app.get("/api/products")
def list_products():
    category_slug = request.args.get("category")
    query_text = (request.args.get("q") or "").strip().lower()

    stmt = select(Product).options(*product_load_options())
    stmt = stmt.where(Product.is_active.is_(True))
    if category_slug:
        stmt = stmt.join(Category).where(Category.slug == category_slug)
    if query_text:
        stmt = stmt.where(Product.title.ilike(f"%{query_text}%"))

    with SessionLocal() as db:
        products = db.scalars(stmt).all()
        return jsonify([product_to_dict(p) for p in products])


@app.get("/api/products/<int:product_id>")
def get_product(product_id):
    with SessionLocal() as db:
        product = db.get(Product, product_id, options=product_load_options())
        if not product or not product.is_active:
            return jsonify(error="Product not found."), 404
        return jsonify(product_to_dict(product))


FREQUENTLY_BOUGHT_TOGETHER_LIMIT = 4


@app.get("/api/products/<int:product_id>/frequently-bought-together")
def frequently_bought_together(product_id):
    # Counts how often other products show up in the same order as this
    # one - real orders and the fake shoppers' orders both count, added
    # together, so this has something to show even on a fresh database
    # before any real orders exist.
    with SessionLocal() as db:
        counts = Counter()

        real_rows = db.execute(
            text(
                """
                SELECT other.product_id AS product_id, COUNT(DISTINCT this.order_id) AS times
                FROM order_item this
                JOIN order_item other ON other.order_id = this.order_id AND other.product_id != this.product_id
                WHERE this.product_id = :product_id
                GROUP BY other.product_id
                """
            ),
            {"product_id": product_id},
        ).all()
        for other_id, times in real_rows:
            counts[other_id] += times

        synthetic_table_exists = db.scalar(
            text("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'synthetic_order_line'")
        )
        if synthetic_table_exists:
            synthetic_rows = db.execute(
                text(
                    """
                    SELECT other.product_id AS product_id, COUNT(DISTINCT this.order_id) AS times
                    FROM synthetic_order_line this
                    JOIN synthetic_order_line other
                        ON other.order_id = this.order_id AND other.product_id != this.product_id
                    WHERE this.product_id = :product_id
                    GROUP BY other.product_id
                    """
                ),
                {"product_id": product_id},
            ).all()
            for other_id, times in synthetic_rows:
                counts[other_id] += times

        top_ids = [pid for pid, _times in counts.most_common(FREQUENTLY_BOUGHT_TOGETHER_LIMIT)]
        if not top_ids:
            return jsonify([])

        products = db.scalars(
            select(Product)
            .where(Product.id.in_(top_ids), Product.is_active.is_(True))
            .options(*product_load_options())
        ).all()
        by_id = {product.id: product for product in products}
        ordered = [by_id[pid] for pid in top_ids if pid in by_id]
        return jsonify([product_to_dict(product) for product in ordered])


@app.post("/api/products/<int:product_id>/reviews")
@login_required
def add_review(product_id):
    body = request.get_json(force=True)
    rating = body.get("rating")
    comment = (body.get("comment") or "").strip()
    if not isinstance(rating, (int, float)) or not (1 <= rating <= 5):
        return jsonify(error="Rating must be between 1 and 5."), 400
    if not comment:
        return jsonify(error="Comment is required."), 400

    with SessionLocal() as db:
        product = db.get(Product, product_id)
        if not product or not product.is_active:
            return jsonify(error="Product not found."), 404
        user = db.get(User, session["user_id"])

        review = ProductReview(
            product_id=product_id,
            user_id=user.id,
            reviewer_name=user.name or user.email,
            reviewer_email=user.email,
            rating=rating,
            comment=comment,
        )
        db.add(review)
        db.flush()  # so the average below counts the row just added

        product.rating = round(
            float(
                db.scalar(
                    select(func.avg(ProductReview.rating)).where(
                        ProductReview.product_id == product_id, ProductReview.rating.is_not(None)
                    )
                )
            ),
            2,
        )
        db.commit()
        db.refresh(review)
        return jsonify(review_to_dict(review)), 201


# --- cart -----------------------------------------------------------------


@app.get("/api/cart")
@login_required
def get_cart():
    with SessionLocal() as db:
        items = db.scalars(
            select(CartItem)
            .where(CartItem.user_id == session["user_id"])
            .options(*product_load_options(CartItem.product))
        ).all()
        return jsonify([cart_item_to_dict(item) for item in items])


@app.put("/api/cart/<int:product_id>")
@login_required
def upsert_cart_item(product_id):
    quantity = int((request.get_json(force=True) or {}).get("quantity", 1))
    if quantity < 1:
        return jsonify(error="Quantity must be at least 1."), 400

    with SessionLocal() as db:
        product = db.get(Product, product_id)
        if not product or not product.is_active:
            return jsonify(error="Product not found."), 404

        item = db.scalar(
            select(CartItem).where(CartItem.user_id == session["user_id"], CartItem.product_id == product_id)
        )
        if item:
            item.quantity = quantity
        else:
            item = CartItem(user_id=session["user_id"], product_id=product_id, quantity=quantity)
            db.add(item)
        db.commit()
        db.refresh(item, attribute_names=["product"])
        return jsonify(cart_item_to_dict(item))


@app.delete("/api/cart/<int:product_id>")
@login_required
def remove_cart_item(product_id):
    with SessionLocal() as db:
        item = db.scalar(
            select(CartItem).where(CartItem.user_id == session["user_id"], CartItem.product_id == product_id)
        )
        if item:
            db.delete(item)
            db.commit()
        return "", 204


# --- wishlist ---------------------------------------------------------------


@app.get("/api/wishlist")
@login_required
def get_wishlist():
    with SessionLocal() as db:
        items = db.scalars(
            select(WishlistItem)
            .where(WishlistItem.user_id == session["user_id"])
            .options(*product_load_options(WishlistItem.product))
        ).all()
        return jsonify([product_to_dict(item.product) for item in items])


@app.put("/api/wishlist/<int:product_id>")
@login_required
def add_wishlist_item(product_id):
    with SessionLocal() as db:
        product = db.get(Product, product_id)
        if not product or not product.is_active:
            return jsonify(error="Product not found."), 404
        exists = db.scalar(
            select(WishlistItem).where(WishlistItem.user_id == session["user_id"], WishlistItem.product_id == product_id)
        )
        if not exists:
            db.add(WishlistItem(user_id=session["user_id"], product_id=product_id))
            db.commit()
        return "", 204


@app.delete("/api/wishlist/<int:product_id>")
@login_required
def remove_wishlist_item(product_id):
    with SessionLocal() as db:
        item = db.scalar(
            select(WishlistItem).where(WishlistItem.user_id == session["user_id"], WishlistItem.product_id == product_id)
        )
        if item:
            db.delete(item)
            db.commit()
        return "", 204


# --- orders -----------------------------------------------------------------


@app.post("/api/orders")
@login_required
def place_order():
    with SessionLocal() as db:
        cart_items = db.scalars(
            select(CartItem).where(CartItem.user_id == session["user_id"]).options(*product_load_options(CartItem.product))
        ).all()
        if not cart_items:
            return jsonify(error="Your cart is empty."), 400

        subtotal = sum(item.product.price * item.quantity for item in cart_items)
        order = Order(user_id=session["user_id"], subtotal=subtotal)
        for item in cart_items:
            order.items.append(OrderItem(product_id=item.product_id, unit_price=item.product.price, quantity=item.quantity))
            db.delete(item)
        db.add(order)
        db.commit()

        # Now that this order is part of their history, re-guess their
        # persona from everything they've bought so far (see
        # predict_persona in shopper_profile.py).
        category_counts = dict(
            db.execute(
                select(Category.slug, func.sum(OrderItem.quantity))
                .join(Product, OrderItem.product_id == Product.id)
                .join(Category, Product.category_id == Category.id)
                .join(Order, OrderItem.order_id == Order.id)
                .where(Order.user_id == session["user_id"])
                .group_by(Category.slug)
            ).all()
        )
        user = db.get(User, session["user_id"])
        user.persona = predict_persona(category_counts)
        db.commit()

        db.refresh(order, attribute_names=["items"])
        for item in order.items:
            db.refresh(item, attribute_names=["product"])
        return jsonify(order_to_dict(order)), 201


@app.get("/api/orders")
@login_required
def list_orders():
    with SessionLocal() as db:
        items_loader = selectinload(Order.items).selectinload(OrderItem.product)
        orders = db.scalars(
            select(Order)
            .where(Order.user_id == session["user_id"])
            .order_by(Order.created_at.desc())
            .options(
                items_loader.selectinload(Product.images),
                items_loader.selectinload(Product.category),
                items_loader.selectinload(Product.tags),
                items_loader.selectinload(Product.reviews),
            )
        ).all()
        return jsonify([order_to_dict(order) for order in orders])


# --- metrics (admin-only dashboard data) ------------------------------------


def metrics_row(row, is_outlier):
    return {
        "orderId": row["order_id"],
        "date": row["date"],
        "userId": row["shopper_id"],
        "shopperName": row["shopper_name"],
        "persona": row["persona"],
        "city": row["city"],
        "region": row["region"],
        "lat": row["lat"],
        "lng": row["lng"],
        "productId": row["product_id"],
        "title": row["title"],
        "category": row["category"],
        "price": num(row["price"]),
        "quantity": row["quantity"],
        "lineTotal": round(row["price"] * row["quantity"], 2),
        "isOutlier": is_outlier,
    }


@app.get("/api/metrics/orders")
@admin_required
def metrics_orders():
    # Feeds the /metrics page: the fake shoppers from analytics/generate.py,
    # plus every real order from a signed-up account (each account gets a
    # random persona/city at signup - see shopper_profile.py - just so
    # their orders have somewhere to show up on these charts too).
    with SessionLocal() as db:
        records = []

        # order_id and shopper_id both get a "real-" prefix so they never
        # collide with the synthetic "so-N" order ids or plain-integer
        # synthetic_shopper ids below - the frontend needs unique ids to
        # tell "my own orders" apart from a fake shopper's.
        real_rows = db.execute(
            text(
                """
                SELECT
                    'real-' || o.id AS order_id, date(o.created_at) AS date,
                    'real-' || u.id AS shopper_id, COALESCE(u.name, u.email) AS shopper_name, u.persona AS persona,
                    u.city AS city, u.region AS region, u.lat AS lat, u.lng AS lng,
                    p.id AS product_id, p.title AS title, c.slug AS category, i.unit_price AS price,
                    i.quantity AS quantity
                FROM order_item i
                JOIN "order" o ON i.order_id = o.id
                JOIN "user" u ON o.user_id = u.id
                JOIN product p ON i.product_id = p.id
                JOIN category c ON p.category_id = c.id
                WHERE u.persona IS NOT NULL
                """
            )
        ).mappings().all()
        records += [
            metrics_row(row, is_outlier=is_outlier_purchase(row["persona"], row["category"])) for row in real_rows
        ]

        # The synthetic_* tables only exist once analytics/generate.py has
        # been run - skip them instead of erroring out if it hasn't.
        synthetic_table_exists = db.scalar(
            text("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'synthetic_order_line'")
        )
        if synthetic_table_exists:
            synthetic_rows = db.execute(
                text(
                    """
                    SELECT
                        o.id AS order_id, o.order_date AS date,
                        s.id AS shopper_id, s.name AS shopper_name, s.persona AS persona,
                        s.city AS city, s.region AS region, s.lat AS lat, s.lng AS lng,
                        p.id AS product_id, p.title AS title, c.slug AS category, p.price AS price,
                        l.quantity AS quantity, l.is_outlier AS is_outlier
                    FROM synthetic_order_line l
                    JOIN synthetic_order o ON l.order_id = o.id
                    JOIN synthetic_shopper s ON o.shopper_id = s.id
                    JOIN product p ON l.product_id = p.id
                    JOIN category c ON p.category_id = c.id
                    """
                )
            ).mappings().all()
            records += [metrics_row(row, is_outlier=bool(row["is_outlier"])) for row in synthetic_rows]

        return jsonify(records)


if __name__ == "__main__":
    # Makes sure every table from models.py exists. Won't fix an existing
    # table if you change its columns later - you'd need a fresh database
    # for that.
    Base.metadata.create_all(engine)
    app.run(port=int(os.environ.get("PORT", 5000)), debug=True)
