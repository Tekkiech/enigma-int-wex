import { defineStore } from 'pinia';
import * as backend from '../api/backend.js';
import { useCatalogStore } from './catalog.js';

// A real account now: name/email/password go to the Flask API, which
// hashes the password with bcrypt and never sees it again after that.
// Signing in is what makes the cart and wishlist persist anywhere - see
// catalog.js, which falls back to local-only state for anyone not
// signed in rather than requiring an account just to browse.
export const useAccountStore = defineStore('account', {
  state: () => ({
    user: null, // { id, name, email } once signed in
    loading: false,
    error: null,
  }),

  actions: {
    // Called once on app load: the Flask session cookie can outlive a
    // page refresh even though this store's state doesn't, so check
    // whether we're already signed in before assuming we're not.
    async restoreSession() {
      try {
        this.user = await backend.fetchCurrentUser();
        await useCatalogStore().syncFromServer();
      } catch {
        this.user = null;
      }
    },

    // One form, no separate "log in" page: try creating the account,
    // and if that email's already taken, retry as a sign-in with the
    // same credentials instead of making the user start over.
    async createAccount({ name, email, password }) {
      this.loading = true;
      this.error = null;
      try {
        this.user = await backend.signup({ name: name.trim(), email: email.trim(), password });
      } catch (err) {
        if (err.status === 409) {
          try {
            this.user = await backend.login({ email: email.trim(), password });
          } catch (loginErr) {
            this.error = 'An account with that email already exists, and that password doesn\'t match it.';
            this.loading = false;
            return;
          }
        } else {
          this.error = err.message;
          this.loading = false;
          return;
        }
      }
      await useCatalogStore().syncFromServer();
      this.loading = false;
    },

    async signOut() {
      try {
        await backend.logout();
      } catch {
        // best effort - clear local state regardless
      }
      this.user = null;
      useCatalogStore().resetAccountState();
    },
  },
});
