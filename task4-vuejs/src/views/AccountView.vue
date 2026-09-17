<script setup>
import { reactive, watch } from 'vue';
import { useAccountStore } from '../stores/account.js';
import { useCatalogStore } from '../stores/catalog.js';
import Breadcrumbs from '../components/common/Breadcrumbs.vue';

const account = useAccountStore();
const catalog = useCatalogStore();

const form = reactive({ name: '', email: '', password: '' });

// Not a plain onMounted check: on a fresh page load this view can mount
// before App.vue's restoreSession() (async, checking the session cookie)
// resolves, so account.user is still null at that exact instant even
// when the user is actually signed in. Watching it, rather than reading
// it once, catches both cases - already signed in when this mounts, or
// signed in moments later once the session check comes back.
watch(
  () => account.user,
  (user) => {
    if (user) catalog.fetchOrders();
  },
  { immediate: true }
);

async function submit() {
  await account.createAccount({ name: form.name, email: form.email, password: form.password });
  if (account.user) {
    // Order history is handled by the watch() above - it fires the
    // moment account.user is set, this included.
    form.name = '';
    form.email = '';
    form.password = '';
  }
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
</script>

<template>
  <div class="account-view">
    <Breadcrumbs :items="[{ label: 'Home', to: '/' }, { label: 'Account' }]" />
    <h1>Account</h1>

    <div v-if="account.user" class="account-card">
      <div class="account-card__avatar">{{ (account.user.name || account.user.email).charAt(0).toUpperCase() }}</div>
      <div class="account-card__details">
        <h2>{{ account.user.name || account.user.email }}</h2>
        <p class="account-card__email">{{ account.user.email }}</p>
        <p class="account-card__since">
          Signed in. This is a real account, bcrypt-hashed password and all, just a small one behind a demo storefront.
        </p>

        <dl class="account-card__stats">
          <div>
            <dt>Cart</dt>
            <dd>{{ catalog.cartCount }} items</dd>
          </div>
          <div>
            <dt>Saved</dt>
            <dd>{{ catalog.savedProducts.length }} items</dd>
          </div>
        </dl>

        <button type="button" class="button button--outline" @click="account.signOut">Sign out</button>
      </div>
    </div>

    <form v-else class="account-form" @submit.prevent="submit">
      <p class="account-form__intro">
        One form for both: enter a new email to create an account, or an existing one with its password to sign back in.
      </p>

      <label class="field">
        <span class="field__label">Name</span>
        <input v-model="form.name" type="text" placeholder="Optional" autocomplete="name" />
      </label>

      <label class="field">
        <span class="field__label">Email</span>
        <input v-model="form.email" type="email" placeholder="you@example.com" autocomplete="email" required />
      </label>

      <label class="field">
        <span class="field__label">Password</span>
        <input v-model="form.password" type="password" autocomplete="current-password" required minlength="1" />
      </label>

      <p v-if="account.error" class="account-form__error" role="alert">{{ account.error }}</p>

      <button type="submit" class="button button--solid" :disabled="account.loading">
        {{ account.loading ? 'Working…' : 'Continue' }}
      </button>
    </form>

    <section v-if="account.user" class="order-history">
      <h2>Order history</h2>

      <p v-if="catalog.ordersLoading" class="order-history__empty">Loading…</p>
      <p v-else-if="!catalog.orders.length" class="order-history__empty">
        No orders yet. Items you place from the cart will show up here.
      </p>

      <ul v-else class="order-list">
        <li v-for="order in catalog.orders" :key="order.id" class="order-card">
          <div class="order-card__head">
            <span>Order #{{ order.id }} · {{ formatDate(order.createdAt) }}</span>
            <span class="order-card__subtotal">${{ order.subtotal.toFixed(2) }}</span>
          </div>
          <ul class="order-card__items">
            <li v-for="item in order.items" :key="item.productId">
              {{ item.quantity }} × {{ item.product.title }} (${{ item.unitPrice.toFixed(2) }} each)
            </li>
          </ul>
        </li>
      </ul>
    </section>
  </div>
</template>
