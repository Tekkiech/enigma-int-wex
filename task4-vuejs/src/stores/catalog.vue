<script>
import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import * as backend from '../api/backend.js';
import { buildCategoryChips } from '../data/categoryChips.js';
import useAccountStore from './account.vue';

const DEAL_THRESHOLD = 15; // % discount or higher counts as a "deal"
const CATEGORY_TILE_IMAGE_LIMIT = 4; // how many product thumbnails a home tile cycles through

function humanizeSlug(slug) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default defineStore('catalog', () => {
  const products = ref([]);
  const loading = ref(false);
  const error = ref(null);

  const query = ref('');
  const chip = ref('All');
  const sortBy = ref('featured');

  const wishlist = ref({});
  const cart = ref({}); // productId -> quantity
  const orders = ref([]); // past orders, newest first
  const ordersLoading = ref(false);

  const cartItems = computed(() =>
    Object.entries(cart.value)
      .map(([id, quantity]) => ({ product: products.value.find((p) => p.id === Number(id)), quantity }))
      .filter((line) => line.product)
  );

  const cartCount = computed(() => Object.values(cart.value).reduce((sum, quantity) => sum + quantity, 0));

  const cartTotal = computed(() =>
    cartItems.value.reduce((sum, line) => sum + line.product.price * line.quantity, 0)
  );

  function productById(id) {
    return products.value.find((product) => product.id === Number(id));
  }

  function isWishlisted(id) {
    return Boolean(wishlist.value[id]);
  }

  const savedProducts = computed(() => products.value.filter((product) => wishlist.value[product.id]));

  function categoryName(slug) {
    return humanizeSlug(slug);
  }

  const categories = computed(() => {
    const bySlug = {};
    for (const product of products.value) {
      bySlug[product.category] ??= { slug: product.category, name: humanizeSlug(product.category), count: 0, images: [] };
      const entry = bySlug[product.category];
      entry.count += 1;
      if (entry.images.length < CATEGORY_TILE_IMAGE_LIMIT) entry.images.push(product.thumbnail);
    }
    return Object.values(bySlug).sort((a, b) => a.name.localeCompare(b.name));
  });

  function productsInCategory(slug) {
    return products.value.filter((product) => product.category === slug);
  }

  function chipsForCategory(slug) {
    return buildCategoryChips(productsInCategory(slug));
  }

  function visibleProducts(slug) {
    const { classify } = chipsForCategory(slug);
    const q = query.value.trim().toLowerCase();

    let list = productsInCategory(slug).filter((product) => {
      const matchesQuery = !q || product.title.toLowerCase().includes(q);
      const matchesChip = chip.value === 'All' || classify(product) === chip.value;
      return matchesQuery && matchesChip;
    });

    list = [...list];
    if (sortBy.value === 'price-asc') list.sort((a, b) => a.price - b.price);
    else if (sortBy.value === 'price-desc') list.sort((a, b) => b.price - a.price);
    else if (sortBy.value === 'rating') list.sort((a, b) => b.rating - a.rating);

    return list;
  }

  function relatedTo(product, limit = 4) {
    return products.value.filter((p) => p.id !== product.id && p.category === product.category).slice(0, limit);
  }

  const dealsProducts = computed(() => {
    const q = query.value.trim().toLowerCase();
    let list = products.value.filter(
      (product) => product.discountPercentage >= DEAL_THRESHOLD && (!q || product.title.toLowerCase().includes(q))
    );

    list = [...list];
    if (sortBy.value === 'price-asc') list.sort((a, b) => a.price - b.price);
    else if (sortBy.value === 'price-desc') list.sort((a, b) => b.price - a.price);
    else if (sortBy.value === 'rating') list.sort((a, b) => b.rating - a.rating);
    else list.sort((a, b) => b.discountPercentage - a.discountPercentage); // "featured" = biggest discount first

    return list;
  });

  function searchResults(q) {
    const trimmed = q.trim().toLowerCase();
    if (!trimmed) return [];
    return products.value.filter((product) => product.title.toLowerCase().includes(trimmed));
  }

  async function fetchProducts() {
    if (products.value.length || loading.value) return;
    loading.value = true;
    error.value = null;
    try {
      products.value = await backend.fetchAllProducts();
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  function setQuery(value) {
    query.value = value;
  }

  function setChip(value) {
    chip.value = value;
  }

  function setSortBy(value) {
    sortBy.value = value;
  }

  function resetFilters() {
    query.value = '';
    chip.value = 'All';
    sortBy.value = 'featured';
  }

  // Cart and wishlist changes update the screen right away, then save to
  // the server in the background if you're signed in. If you're not
  // signed in, it just stays local - you can still browse and use the
  // cart without an account.
  async function toggleWishlist(id) {
    const next = !wishlist.value[id];
    wishlist.value[id] = next;
    if (!useAccountStore().user) return;
    try {
      if (next) await backend.putWishlistItem(id);
      else await backend.deleteWishlistItem(id);
    } catch {
      wishlist.value[id] = !next; // undo if saving failed
    }
  }

  async function addToCart(id, quantity = 1) {
    const newQuantity = (cart.value[id] || 0) + quantity;
    cart.value[id] = newQuantity;
    if (!useAccountStore().user) return;
    try {
      await backend.putCartItem(id, newQuantity);
    } catch {
      // Keep the item in the cart even if saving failed - it'll sync
      // properly next time.
    }
  }

  async function setCartQuantity(id, quantity) {
    if (quantity <= 0) {
      delete cart.value[id];
    } else {
      cart.value[id] = quantity;
    }
    if (!useAccountStore().user) return;
    try {
      if (quantity <= 0) await backend.deleteCartItem(id);
      else await backend.putCartItem(id, quantity);
    } catch {
      // best effort, see addToCart
    }
  }

  async function removeFromCart(id) {
    delete cart.value[id];
    if (!useAccountStore().user) return;
    try {
      await backend.deleteCartItem(id);
    } catch {
      // best effort, see addToCart
    }
  }

  // Loads the signed-in user's real cart/wishlist from the server and
  // replaces whatever was there before.
  async function syncFromServer() {
    const [cartItemsData, wishlistProducts] = await Promise.all([backend.fetchCart(), backend.fetchWishlist()]);
    cart.value = Object.fromEntries(cartItemsData.map((item) => [item.productId, item.quantity]));
    wishlist.value = Object.fromEntries(wishlistProducts.map((product) => [product.id, true]));
  }

  function resetAccountState() {
    cart.value = {};
    wishlist.value = {};
    orders.value = [];
  }

  // Turns the current cart into a real order and empties the cart.
  async function placeOrder() {
    const order = await backend.placeOrder();
    cart.value = {};
    orders.value = [order, ...orders.value];
    return order;
  }

  async function fetchOrders() {
    if (!useAccountStore().user) return;
    ordersLoading.value = true;
    try {
      orders.value = await backend.fetchOrders();
    } finally {
      ordersLoading.value = false;
    }
  }

  // Recompute the average rating right away, so it updates on screen
  // without waiting to refetch the product.
  async function submitReview(productId, { rating, comment }) {
    const review = await backend.submitReview(productId, { rating, comment });
    const product = productById(productId);
    if (!product) return review;
    product.reviews = [review, ...product.reviews];
    const rated = product.reviews.filter((r) => r.rating != null);
    product.rating = rated.reduce((sum, r) => sum + r.rating, 0) / rated.length;
    return review;
  }

  return {
    products,
    loading,
    error,
    query,
    chip,
    sortBy,
    wishlist,
    cart,
    orders,
    ordersLoading,
    cartItems,
    cartCount,
    cartTotal,
    productById,
    isWishlisted,
    savedProducts,
    categoryName,
    categories,
    productsInCategory,
    chipsForCategory,
    visibleProducts,
    relatedTo,
    dealsProducts,
    searchResults,
    fetchProducts,
    setQuery,
    setChip,
    setSortBy,
    resetFilters,
    toggleWishlist,
    addToCart,
    setCartQuantity,
    removeFromCart,
    syncFromServer,
    resetAccountState,
    placeOrder,
    fetchOrders,
    submitReview,
  };
});
</script>
