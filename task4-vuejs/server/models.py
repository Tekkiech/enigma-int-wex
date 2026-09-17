"""SQLAlchemy 2.0 declarative models - one class per table in schema.dbml.

`Order.__tablename__ = "order"` is a reserved word in every SQL dialect.
SQLAlchemy's dialects know this and auto-quote it in generated SQL, so the
ORM/Core layer is unaffected - it only matters if you ever open the .db
file directly (`sqlite3 tekkiech.db "SELECT * FROM \"order\""`).
"""

from datetime import datetime, timezone

from sqlalchemy import ForeignKey, Numeric, UniqueConstraint
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


class Category(Base):
    __tablename__ = "category"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(unique=True, nullable=False)
    name: Mapped[str] = mapped_column(nullable=False)

    products: Mapped[list["Product"]] = relationship(back_populates="category")


class Product(Base):
    __tablename__ = "product"

    # Matches the DummyJSON product id at seed time - not autoincrement,
    # set explicitly by seed.py so cart/wishlist/order references line up
    # with the same ids the frontend already knows from the DummyJSON era.
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=False)
    category_id: Mapped[int] = mapped_column(ForeignKey("category.id"), nullable=False)
    title: Mapped[str] = mapped_column(nullable=False)
    description: Mapped[str | None] = mapped_column(default=None)
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    discount_percentage: Mapped[float] = mapped_column(Numeric(5, 2), default=0)
    rating: Mapped[float | None] = mapped_column(Numeric(3, 2), default=None)
    stock: Mapped[int] = mapped_column(nullable=False, default=0)
    brand: Mapped[str | None] = mapped_column(default=None)
    thumbnail: Mapped[str | None] = mapped_column(default=None)
    is_active: Mapped[bool] = mapped_column(nullable=False, default=True)

    category: Mapped["Category"] = relationship(back_populates="products")
    images: Mapped[list["ProductImage"]] = relationship(back_populates="product", cascade="all, delete-orphan")
    tags: Mapped[list["ProductTag"]] = relationship(back_populates="product", cascade="all, delete-orphan")
    reviews: Mapped[list["ProductReview"]] = relationship(back_populates="product", cascade="all, delete-orphan")


class ProductTag(Base):
    __tablename__ = "product_tag"

    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("product.id"), nullable=False)
    tag: Mapped[str] = mapped_column(nullable=False)

    product: Mapped["Product"] = relationship(back_populates="tags")


class ProductReview(Base):
    __tablename__ = "product_review"

    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("product.id"), nullable=False)
    # Null for the reviews seed.py imported from DummyJSON - only a review
    # posted through the API by a signed-in user has one of these.
    user_id: Mapped[int | None] = mapped_column(ForeignKey("user.id"), default=None)
    reviewer_name: Mapped[str | None] = mapped_column(default=None)
    reviewer_email: Mapped[str | None] = mapped_column(default=None)
    rating: Mapped[float | None] = mapped_column(Numeric(3, 2), default=None)
    comment: Mapped[str | None] = mapped_column(default=None)
    created_at: Mapped[datetime] = mapped_column(default=utcnow)

    product: Mapped["Product"] = relationship(back_populates="reviews")


class ProductImage(Base):
    __tablename__ = "product_image"

    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("product.id"), nullable=False)
    url: Mapped[str] = mapped_column(nullable=False)

    product: Mapped["Product"] = relationship(back_populates="images")


class User(Base):
    __tablename__ = "user"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str | None] = mapped_column(default=None)
    email: Mapped[str] = mapped_column(unique=True, nullable=False)
    # bcrypt's own encoded output ($2b$12$<22-char salt><31-char hash>) -
    # algorithm, cost factor, salt and hash all live in this one string.
    password_hash: Mapped[str] = mapped_column(nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=utcnow)

    # Login lockout - see auth.py's LOCKOUT_THRESHOLD/LOCKOUT_MINUTES.
    # failed_login_attempts resets to 0 on any successful login;
    # locked_until is None except during an active lockout window.
    failed_login_attempts: Mapped[int] = mapped_column(nullable=False, default=0)
    locked_until: Mapped[datetime | None] = mapped_column(default=None)

    cart_items: Mapped[list["CartItem"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    wishlist_items: Mapped[list["WishlistItem"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    orders: Mapped[list["Order"]] = relationship(back_populates="user")


class CartItem(Base):
    __tablename__ = "cart_item"
    __table_args__ = (UniqueConstraint("user_id", "product_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"), nullable=False)
    product_id: Mapped[int] = mapped_column(ForeignKey("product.id"), nullable=False)
    quantity: Mapped[int] = mapped_column(nullable=False, default=1)
    added_at: Mapped[datetime] = mapped_column(default=utcnow)

    user: Mapped["User"] = relationship(back_populates="cart_items")
    product: Mapped["Product"] = relationship()


class WishlistItem(Base):
    __tablename__ = "wishlist_item"
    __table_args__ = (UniqueConstraint("user_id", "product_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"), nullable=False)
    product_id: Mapped[int] = mapped_column(ForeignKey("product.id"), nullable=False)
    added_at: Mapped[datetime] = mapped_column(default=utcnow)

    user: Mapped["User"] = relationship(back_populates="wishlist_items")
    product: Mapped["Product"] = relationship()


class Order(Base):
    __tablename__ = "order"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"), nullable=False)
    status: Mapped[str] = mapped_column(default="placed")
    subtotal: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=utcnow)

    user: Mapped["User"] = relationship(back_populates="orders")
    items: Mapped[list["OrderItem"]] = relationship(back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_item"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("order.id"), nullable=False)
    product_id: Mapped[int] = mapped_column(ForeignKey("product.id"), nullable=False)
    # Snapshot at order time - price history, kept even if the product's
    # live price changes later or it gets deactivated.
    unit_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    quantity: Mapped[int] = mapped_column(nullable=False, default=1)

    order: Mapped["Order"] = relationship(back_populates="items")
    product: Mapped["Product"] = relationship()
