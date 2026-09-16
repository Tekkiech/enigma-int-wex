import { defineStore } from 'pinia';
import { fetchAllProducts } from '../api/dummyjson.js';
import { buildCategoryChips } from '../data/categoryChips.js';

const DEAL_THRESHOLD = 15; // % discount or higher counts as a "deal"
const CATEGORY_TILE_IMAGE_LIMIT = 4; // how many product thumbnails a home tile cycles through

function humanizeSlug(slug) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

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

    productById: (state) => (id) => state.products.find((product) => product.id === Number(id)),

    isWishlisted: (state) => (id) => Boolean(state.wishlist[id]),

    savedProducts: (state) => state.products.filter((product) => state.wishlist[product.id]),

    // DummyJSON's category display names are just Title Case of the slug
    // for all 24 categories, so there's no need for a separate lookup call.
    categoryName: () => (slug) => humanizeSlug(slug),

    categories(state) {
      const bySlug = {};
      for (const product of state.products) {
        bySlug[product.category] ??= { slug: product.category, name: humanizeSlug(product.category), count: 0, images: [] };
        const entry = bySlug[product.category];
        entry.count += 1;
        if (entry.images.length < CATEGORY_TILE_IMAGE_LIMIT) entry.images.push(product.thumbnail);
      }
      return Object.values(bySlug).sort((a, b) => a.name.localeCompare(b.name));
    },

    productsInCategory: (state) => (slug) => state.products.filter((product) => product.category === slug),

    chipsForCategory() {
      return (slug) => buildCategoryChips(this.productsInCategory(slug));
    },

    visibleProducts() {
      return (slug) => {
        const { classify } = this.chipsForCategory(slug);
        const query = this.query.trim().toLowerCase();

        let list = this.productsInCategory(slug).filter((product) => {
          const matchesQuery = !query || product.title.toLowerCase().includes(query);
          const matchesChip = this.chip === 'All' || classify(product) === this.chip;
          return matchesQuery && matchesChip;
        });

        list = [...list];
        if (this.sortBy === 'price-asc') list.sort((a, b) => a.price - b.price);
        else if (this.sortBy === 'price-desc') list.sort((a, b) => b.price - a.price);
        else if (this.sortBy === 'rating') list.sort((a, b) => b.rating - a.rating);

        return list;
      };
    },

    relatedTo: (state) => (product, limit = 4) =>
      state.products.filter((p) => p.id !== product.id && p.category === product.category).slice(0, limit),

    dealsProducts() {
      const query = this.query.trim().toLowerCase();
      let list = this.products.filter(
        (product) => product.discountPercentage >= DEAL_THRESHOLD && (!query || product.title.toLowerCase().includes(query))
      );

      list = [...list];
      if (this.sortBy === 'price-asc') list.sort((a, b) => a.price - b.price);
      else if (this.sortBy === 'price-desc') list.sort((a, b) => b.price - a.price);
      else if (this.sortBy === 'rating') list.sort((a, b) => b.rating - a.rating);
      else list.sort((a, b) => b.discountPercentage - a.discountPercentage); // "featured" = biggest discount first

      return list;
    },

    searchResults() {
      return (query) => {
        const q = query.trim().toLowerCase();
        if (!q) return [];
        return this.products.filter((product) => product.title.toLowerCase().includes(q));
      };
    },
  },

  actions: {
    async fetchProducts() {
      if (this.products.length || this.loading) return;
      this.loading = true;
      this.error = null;
      try {
        this.products = await fetchAllProducts();
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

    resetFilters() {
      this.query = '';
      this.chip = 'All';
      this.sortBy = 'featured';
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
