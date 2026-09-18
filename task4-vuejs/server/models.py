# The database tables, one class per table. See schema.dbml for a diagram.
#
# Note: "order" is a reserved SQL word, but SQLAlchemy handles that for us
# automatically, so it's not something we need to worry about.

from datetime import date, datetime, timezone

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

    # id is set by seed.py, not auto-generated, so it matches the id
    # DummyJSON gave the product originally.
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
    # Empty for reviews we pulled from DummyJSON. Only set for a review
    # someone actually posted through the site.
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
    # Never the real password - just the bcrypt hash of it.
    password_hash: Mapped[str] = mapped_column(nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=utcnow)

    # Used to lock an account after too many wrong passwords - see auth.py.
    failed_login_attempts: Mapped[int] = mapped_column(nullable=False, default=0)
    locked_until: Mapped[datetime | None] = mapped_column(default=None)

    # Only admins can see /metrics and the persona/city fields below.
    is_admin: Mapped[bool] = mapped_column(nullable=False, default=False)

    # None until this account places its first order (see
    # shopper_profile.py), then recomputed after every order to match
    # what they actually buy most. Groups real orders on the /metrics
    # dashboard next to the fake shoppers, and a purchase outside the
    # persona's usual categories gets flagged there as an "unexpected
    # purchase" too.
    persona: Mapped[str | None] = mapped_column(default=None)
    city: Mapped[str | None] = mapped_column(default=None)
    region: Mapped[str | None] = mapped_column(default=None)
    lat: Mapped[float | None] = mapped_column(default=None)
    lng: Mapped[float | None] = mapped_column(default=None)

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
    # The price when the order was placed, in case it changes later.
    unit_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    quantity: Mapped[int] = mapped_column(nullable=False, default=1)

    order: Mapped["Order"] = relationship(back_populates="items")
    product: Mapped["Product"] = relationship()


# Fake shoppers for the /metrics dashboard (see generate_fake_shoppers.py).
# Their own tables, kept apart from the real user/order/order_item ones
# above so a fake shopper never mixes in with a real account.


class SyntheticShopper(Base):
    __tablename__ = "synthetic_shopper"

    # id is picked by generate_fake_shoppers.py, not auto-generated.
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=False)
    name: Mapped[str] = mapped_column(nullable=False)
    persona: Mapped[str] = mapped_column(nullable=False)
    city: Mapped[str] = mapped_column(nullable=False)
    region: Mapped[str] = mapped_column(nullable=False)
    lat: Mapped[float] = mapped_column(nullable=False)
    lng: Mapped[float] = mapped_column(nullable=False)

    orders: Mapped[list["SyntheticOrder"]] = relationship(back_populates="shopper", cascade="all, delete-orphan")


class SyntheticOrder(Base):
    __tablename__ = "synthetic_order"

    # id looks like "so-1", "so-2", ... so it never collides with a real
    # order's plain integer id once the two get blended together for
    # /api/metrics/orders.
    id: Mapped[str] = mapped_column(primary_key=True, autoincrement=False)
    shopper_id: Mapped[int] = mapped_column(ForeignKey("synthetic_shopper.id"), nullable=False)
    order_date: Mapped[date] = mapped_column(nullable=False)

    shopper: Mapped["SyntheticShopper"] = relationship(back_populates="orders")
    lines: Mapped[list["SyntheticOrderLine"]] = relationship(back_populates="order", cascade="all, delete-orphan")


class SyntheticOrderLine(Base):
    __tablename__ = "synthetic_order_line"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[str] = mapped_column(ForeignKey("synthetic_order.id"), nullable=False)
    product_id: Mapped[int] = mapped_column(ForeignKey("product.id"), nullable=False)
    quantity: Mapped[int] = mapped_column(nullable=False)
    # True when this persona bought outside their usual categories -
    # see Persona.choose_category in shopper_profile.py.
    is_outlier: Mapped[bool] = mapped_column(nullable=False, default=False)

    order: Mapped["SyntheticOrder"] = relationship(back_populates="lines")
    product: Mapped["Product"] = relationship()
