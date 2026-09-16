import { defineStore } from 'pinia';
import { fetchGroceries } from '../api/dummyjson.js';
import { chipForProduct } from '../data/categoryChips.js';

export const useCatalogStore = defineStore('catalog', {
  state: () => ({
    products: [],
    loading: false,
    error: null,

    query: '',
    chip: 'All',
    sortBy: 'featured',

    wishlist: {},
    // productId -> quantity. A plain object keeps the cart trivially
    // serializable and easy to inspect, and there's no need for anything
    // fancier with at most a few dozen possible products.
    cart: {},
  }),

  getters: {
    cartItems(state) {
      return Object.entries(state.cart)
        .map(([id, quantity]) => ({ product: state.products.find((p) => p.id === Number(id)), quantity }))
        .filter((line) => line.product);
    },

    cartCount(state) {
      return Object.values(state.cart).reduce((sum, quantity) => sum + quantity, 0);
    },

    cartTotal() {
      return this.cartItems.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
    },

    visibleProducts(state) {
      const query = state.query.trim().toLowerCase();
      let list = state.products.filter((product) => {
        const matchesQuery = !query || product.title.toLowerCase().includes(query);
        const matchesChip = state.chip === 'All' || chipForProduct(product) === state.chip;
        return matchesQuery && matchesChip;
      });

      list = [...list];
      if (state.sortBy === 'price-asc') list.sort((a, b) => a.price - b.price);
      else if (state.sortBy === 'price-desc') list.sort((a, b) => b.price - a.price);
      else if (state.sortBy === 'rating') list.sort((a, b) => b.rating - a.rating);

      return list;
    },

    productById: (state) => (id) => state.products.find((product) => product.id === Number(id)),

    relatedTo: (state) => (product, limit = 4) => {
      const chip = chipForProduct(product);
      const sameChip = state.products.filter((p) => p.id !== product.id && chipForProduct(p) === chip);
      const rest = state.products.filter((p) => p.id !== product.id && chipForProduct(p) !== chip);
      return [...sameChip, ...rest].slice(0, limit);
    },

    isWishlisted: (state) => (id) => Boolean(state.wishlist[id]),
  },

  actions: {
    async fetchProducts() {
      if (this.products.length || this.loading) return;
      this.loading = true;
      this.error = null;
      try {
        this.products = await fetchGroceries();
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    setQuery(query) {
      this.query = query;
    },

    setChip(chip) {
      this.chip = chip;
    },

    setSortBy(sortBy) {
      this.sortBy = sortBy;
    },

    toggleWishlist(id) {
      this.wishlist[id] = !this.wishlist[id];
    },

    addToCart(id, quantity = 1) {
      this.cart[id] = (this.cart[id] || 0) + quantity;
    },

    setCartQuantity(id, quantity) {
      if (quantity <= 0) {
        delete this.cart[id];
      } else {
        this.cart[id] = quantity;
      }
    },

    removeFromCart(id) {
      delete this.cart[id];
    },
  },
});
