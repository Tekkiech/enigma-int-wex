<script setup>
import { reactive, ref, watch } from 'vue';
import useAccountStore from '../stores/account.vue';
import useCatalogStore from '../stores/catalog.vue';
import Breadcrumbs from '../components/common/Breadcrumbs.vue';

const account = useAccountStore();
const catalog = useCatalogStore();

const mode = ref('signup');
const signupForm = reactive({ name: '', email: '', password: '', passwordConfirm: '' });
const loginForm = reactive({ email: '', password: '' });

// account.user might not be set yet when this page loads, since
// checking the login cookie takes a moment. Watching it (instead of
// just checking once) catches it whenever it's ready.
watch(
  () => account.user,
  (user) => {
    if (user) catalog.fetchOrders();
  },
  { immediate: true }
);

function switchMode(next) {
  mode.value = next;
  account.error = null;
}

async function submitSignUp() {
  await account.signUp({ ...signupForm });
  if (account.user) {
    // order history loads on its own, via the watch() above
    signupForm.name = '';
    signupForm.email = '';
    signupForm.password = '';
    signupForm.passwordConfirm = '';
  }
}

async function submitLogIn() {
  await account.logIn({ ...loginForm });
  if (account.user) {
    loginForm.email = '';
    loginForm.password = '';
  }
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function humanize(slug) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
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
          <div v-if="account.user.persona">
            <dt>Shopper type</dt>
            <dd>{{ humanize(account.user.persona) }}</dd>
          </div>
          <div v-if="account.user.city">
            <dt>Home city</dt>
            <dd>{{ account.user.city }}, {{ account.user.region }}</dd>
          </div>
        </dl>

        <p v-if="account.user.persona" class="account-card__since">
          Picked randomly when you signed up - it's what groups your orders on the
          <router-link to="/metrics">shopper metrics</router-link> dashboard. Pick "Just me" there to see only your own orders.
        </p>

        <button type="button" class="button button--outline" @click="account.signOut">Sign out</button>
      </div>
    </div>

    <div v-else class="account-form-wrap">
      <div class="account-mode-toggle" role="tablist">
        <button type="button" :class="{ 'is-active': mode === 'signup' }" @click="switchMode('signup')">
          Sign up
        </button>
        <button type="button" :class="{ 'is-active': mode === 'login' }" @click="switchMode('login')">
          Log in
        </button>
      </div>

      <form v-if="mode === 'signup'" class="account-form" @submit.prevent="submitSignUp">
        <p class="account-form__intro">Create an account to save your cart, wishlist, and order history.</p>

        <label class="field">
          <span class="field__label">Name</span>
          <input v-model="signupForm.name" type="text" placeholder="Optional" autocomplete="name" />
        </label>

        <label class="field">
          <span class="field__label">Email</span>
          <input v-model="signupForm.email" type="email" placeholder="you@example.com" autocomplete="email" required />
        </label>

        <label class="field">
          <span class="field__label">Password</span>
          <input v-model="signupForm.password" type="password" autocomplete="new-password" required minlength="8" />
          <span class="field__hint">At least 8 characters, with a letter and a number.</span>
        </label>

        <label class="field">
          <span class="field__label">Confirm password</span>
          <input v-model="signupForm.passwordConfirm" type="password" autocomplete="new-password" required minlength="8" />
        </label>

        <p v-if="account.error" class="account-form__error" role="alert">{{ account.error }}</p>

        <button type="submit" class="button button--solid" :disabled="account.loading">
          {{ account.loading ? 'Working…' : 'Create account' }}
        </button>
      </form>

      <form v-else class="account-form" @submit.prevent="submitLogIn">
        <p class="account-form__intro">Sign in with an email and password you already have.</p>

        <label class="field">
          <span class="field__label">Email</span>
          <input v-model="loginForm.email" type="email" placeholder="you@example.com" autocomplete="email" required />
        </label>

        <label class="field">
          <span class="field__label">Password</span>
          <input v-model="loginForm.password" type="password" autocomplete="current-password" required minlength="1" />
        </label>

        <p v-if="account.error" class="account-form__error" role="alert">{{ account.error }}</p>

        <button type="submit" class="button button--solid" :disabled="account.loading">
          {{ account.loading ? 'Working…' : 'Log in' }}
        </button>
      </form>
    </div>

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
