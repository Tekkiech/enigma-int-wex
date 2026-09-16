import { defineStore } from 'pinia';
import { fetchProductById, fetchProductPage } from '../api/dummyjson.js';

// Separate from useCatalogStore: a single-product concern (the details
// page) with its own loading/error state, so browsing the list doesn't
// have to share state with viewing one product.
export const useProductStore = defineStore('product', {
  state: () => ({
    current: null,
    loading: false,
    error: null,
    notFound: false,

    related: [],
    relatedLoading: false,
  }),

  actions: {
    async fetchProduct(id) {
      this.loading = true;
      this.error = null;
      this.notFound = false;
      this.current = null;
      this.related = [];

      try {
        this.current = await fetchProductById(id);
      } catch (err) {
        if (err.status === 404) {
          this.notFound = true;
        } else {
          this.error = err.message;
        }
        return;
      } finally {
        this.loading = false;
      }

      this.fetchRelated();
    },

    async fetchRelated() {
      if (!this.current) return;
      this.relatedLoading = true;
      try {
        const { products } = await fetchProductPage({
          category: this.current.category,
          pageSize: 5,
        });
        this.related = products.filter((product) => product.id !== this.current.id).slice(0, 4);
      } catch {
        this.related = [];
      } finally {
        this.relatedLoading = false;
      }
    },
  },
});
