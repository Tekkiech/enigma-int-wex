<script setup>
import { reactive } from 'vue';
import { useAccountStore } from '../stores/account.js';
import { useCatalogStore } from '../stores/catalog.js';
import Breadcrumbs from '../components/common/Breadcrumbs.vue';

const account = useAccountStore();
const catalog = useCatalogStore();

const form = reactive({ name: '', email: '' });

function submit() {
  account.createAccount({ name: form.name, email: form.email });
  form.name = '';
  form.email = '';
}
</script>

<template>
  <div class="account-view">
    <Breadcrumbs :items="[{ label: 'Home', to: '/' }, { label: 'Account' }]" />
    <h1>Account</h1>

    <div v-if="account.user" class="account-card">
      <div class="account-card__avatar">{{ account.user.name.charAt(0).toUpperCase() }}</div>
      <div class="account-card__details">
        <h2>{{ account.user.name }}</h2>
        <p class="account-card__email">{{ account.user.email }}</p>
        <p class="account-card__since">Member since today — this is a demo account, nothing is saved once you leave.</p>

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
        There's no real login here — fill in anything (or leave it blank for a placeholder "John Doe" account) and continue.
      </p>

      <label class="field">
        <span class="field__label">Name</span>
        <input v-model="form.name" type="text" placeholder="John Doe" autocomplete="name" />
      </label>

      <label class="field">
        <span class="field__label">Email</span>
        <input v-model="form.email" type="email" placeholder="john.doe@example.com" autocomplete="email" />
      </label>

      <button type="submit" class="button button--solid">Create account</button>
    </form>
  </div>
</template>
