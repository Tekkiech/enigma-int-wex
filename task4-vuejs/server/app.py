# The backend API for Tekkiech.Market. Needs to be running for the
# frontend to work. Most routes need you to be signed in - browsing
# products and categories doesn't.

import os
from decimal import Decimal

from flask import Flask, jsonify, request, session
from flask_cors import CORS
from sqlalchemy import func, select, text
from sqlalchemy.orm import selectinload

from auth import (
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
        user = User(name=name or None, email=email, password_hash=hash_password(password))
        db.add(user)
        db.commit()
        session["user_id"] = user.id
        return jsonify(id=user.id, name=user.name, email=user.email), 201


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
            return jsonify(id=user.id, name=user.name, email=user.email)

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
        return jsonify(id=user.id, name=user.name, email=user.email)


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


# --- metrics (synthetic dashboard data, public, read-only) ----------------


@app.get("/api/metrics/orders")
def metrics_orders():
    # Feeds the /metrics page. The synthetic_* tables only exist once
    # analytics/generate.py has been run - if it hasn't, just send back
    # an empty list instead of erroring out.
    with SessionLocal() as db:
        exists = db.scalar(
            text("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'synthetic_order_line'")
        )
        if not exists:
            return jsonify([])

        rows = db.execute(
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

        return jsonify(
            [
                {
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
                    "isOutlier": bool(row["is_outlier"]),
                }
                for row in rows
            ]
        )


if __name__ == "__main__":
    # Makes sure every table from models.py exists. Won't fix an existing
    # table if you change its columns later - you'd need a fresh database
    # for that.
    Base.metadata.create_all(engine)
    app.run(port=int(os.environ.get("PORT", 5000)), debug=True)
