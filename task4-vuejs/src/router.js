import { createRouter, createWebHashHistory } from 'vue-router';
import ProductListView from './views/ProductListView.vue';
import ProductDetailView from './views/ProductDetailView.vue';
import CartView from './views/CartView.vue';
import NotFoundView from './views/NotFoundView.vue';

// Hash history keeps deep links (e.g. #/product/42) working when this is
// deployed as a plain static build with no server-side rewrite rules.
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'products', component: ProductListView },
    { path: '/product/:id(\\d+)', name: 'product', component: ProductDetailView, props: true },
    { path: '/cart', name: 'cart', component: CartView },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView },
  ],
  scrollBehavior() {
    return { top: 0 };
  },
});

export default router;
