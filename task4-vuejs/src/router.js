import { createRouter, createWebHashHistory } from 'vue-router';
import HomeView from './views/HomeView.vue';
import CategoryView from './views/CategoryView.vue';
import ProductDetailView from './views/ProductDetailView.vue';
import SearchView from './views/SearchView.vue';
import DealsView from './views/DealsView.vue';
import SavedView from './views/SavedView.vue';
import AccountView from './views/AccountView.vue';
import CartView from './views/CartView.vue';
import SupportView from './views/SupportView.vue';
import MetricsView from './views/MetricsView.vue';
import NotFoundView from './views/NotFoundView.vue';

// Hash history (#/product/42 style URLs) means links still work even
// though this is just a static build with no server routing.
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/category/:slug', name: 'category', component: CategoryView, props: true },
    { path: '/product/:id(\\d+)', name: 'product', component: ProductDetailView, props: true },
    { path: '/search', name: 'search', component: SearchView },
    { path: '/deals', name: 'deals', component: DealsView },
    { path: '/saved', name: 'saved', component: SavedView },
    { path: '/account', name: 'account', component: AccountView },
    { path: '/cart', name: 'cart', component: CartView },
    { path: '/support', name: 'support', component: SupportView },
    { path: '/metrics', name: 'metrics', component: MetricsView },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView },
  ],
  scrollBehavior(to) {
    if (to.hash) return { el: to.hash, behavior: 'smooth' };
    return { top: 0 };
  },
});

export default router;
