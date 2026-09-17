"""Flask REST API for Tekkiech.Market - the one process that has to stay
running. Everything under /api/cart, /api/wishlist, /api/orders, and
/api/auth/me needs a signed-in session; product/category browsing doesn't.
"""

import os
from decimal import Decimal

from flask import Flask, jsonify, request, session
from flask_cors import CORS
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from auth import hash_password, login_required, verify_password
from database import SessionLocal, engine
from models import Base, CartItem, Category, Order, OrderItem, Product, ProductReview, User, WishlistItem

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev-only-change-me")
CORS(app, supports_credentials=True, origins=os.environ.get("CORS_ORIGIN", "http://localhost:1350"))


def num(value):
    """Decimal -> float for JSON; None passes through."""
    return float(value) if isinstance(value, Decimal) else value


def product_load_options(relationship=None):
    """selectinload for everything product_to_dict touches - images,
    category, tags, reviews - either directly on Product, or through a
    relationship that points at one (CartItem.product, OrderItem.product, ...).
    """
    attrs = [Product.images, Product.category, Product.tags, Product.reviews]
    if relationship is None:
        return [selectinload(attr) for attr in attrs]
    return [selectinload(relationship).selectinload(attr) for attr in attrs]


def product_to_dict(product: Product) -> dict:
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


def review_to_dict(review: ProductReview) -> dict:
    return {
        "reviewerName": review.reviewer_name,
        "reviewerEmail": review.reviewer_email,
        "rating": num(review.rating),
        "comment": review.comment,
        "date": review.created_at.isoformat(),
    }


def cart_item_to_dict(item: CartItem) -> dict:
    return {"productId": item.product_id, "quantity": item.quantity, "product": product_to_dict(item.product)}


def order_to_dict(order: Order) -> dict:
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
        if not user or not verify_password(password, user.password_hash):
            return jsonify(error="Invalid email or password."), 401
        session["user_id"] = user.id
        return jsonify(id=user.id, name=user.name, email=user.email)


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


if __name__ == "__main__":
    Base.metadata.create_all(engine)  # convenience for local dev; use Alembic for real migrations
    app.run(port=int(os.environ.get("PORT", 5000)), debug=True)
