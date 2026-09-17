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
  // productId -> quantity. A plain object keeps the cart trivially
  // serializable and easy to inspect, and there's no need for anything
  // fancier with at most a few dozen possible products.
  const cart = ref({});

  // Past orders for the signed-in user, newest first - as returned by
  // the API, not derived from anything else here.
  const orders = ref([]);
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

  // DummyJSON's category display names are just Title Case of the slug
  // for all 24 categories, so there's no need for a separate lookup call.
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

  // Cart/wishlist writes are optimistic and local-first, same as before
  // sign-in existed: the UI updates immediately either way, and only
  // reaches out to the API when someone's actually signed in. Signed
  // out, this is exactly the old in-memory-only behavior - browsing,
  // cart and wishlist still don't require an account.
  async function toggleWishlist(id) {
    const next = !wishlist.value[id];
    wishlist.value[id] = next;
    if (!useAccountStore().user) return;
    try {
      if (next) await backend.putWishlistItem(id);
      else await backend.deleteWishlistItem(id);
    } catch {
      wishlist.value[id] = !next; // revert on a failed sync
    }
  }

  async function addToCart(id, quantity = 1) {
    const newQuantity = (cart.value[id] || 0) + quantity;
    cart.value[id] = newQuantity;
    if (!useAccountStore().user) return;
    try {
      await backend.putCartItem(id, newQuantity);
    } catch {
      // Leave the optimistic local update in place - a sync failure
      // shouldn't yank an item back out of the cart the user just saw
      // added; it'll reconcile next time syncFromServer runs.
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

  // Pulls the signed-in user's real cart/wishlist down and replaces
  // whatever was there locally (guest-session items don't merge into
  // an account - matches the fresh-slate framing the rest of the app
  // already uses for signing in).
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

  // Snapshots the current cart into a real order server-side and
  // empties it - requires a signed-in session, same as the cart/
  // wishlist API calls above.
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
  };
});
</script>
