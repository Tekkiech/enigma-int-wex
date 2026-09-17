<script>
import { ref } from 'vue';
import { defineStore } from 'pinia';
import * as backend from '../api/backend.js';
import useCatalogStore from './catalog.vue';

// A real account now: name/email/password go to the Flask API, which
// hashes the password with bcrypt and never sees it again after that.
// Signing in is what makes the cart and wishlist persist anywhere - see
// catalog.vue, which falls back to local-only state for anyone not
// signed in rather than requiring an account just to browse.
export default defineStore('account', () => {
  const user = ref(null); // { id, name, email } once signed in
  const loading = ref(false);
  const error = ref(null);

  // Called once on app load: the Flask session cookie can outlive a
  // page refresh even though this store's state doesn't, so check
  // whether we're already signed in before assuming we're not.
  async function restoreSession() {
    try {
      user.value = await backend.fetchCurrentUser();
      await useCatalogStore().syncFromServer();
    } catch {
      user.value = null;
    }
  }

  // One form, no separate "log in" page: try creating the account,
  // and if that email's already taken, retry as a sign-in with the
  // same credentials instead of making the user start over.
  async function createAccount({ name, email, password }) {
    loading.value = true;
    error.value = null;
    try {
      user.value = await backend.signup({ name: name.trim(), email: email.trim(), password });
    } catch (err) {
      if (err.status === 409) {
        try {
          user.value = await backend.login({ email: email.trim(), password });
        } catch {
          error.value = "An account with that email already exists, and that password doesn't match it.";
          loading.value = false;
          return;
        }
      } else {
        error.value = err.message;
        loading.value = false;
        return;
      }
    }
    await useCatalogStore().syncFromServer();
    loading.value = false;
  }

  async function signOut() {
    try {
      await backend.logout();
    } catch {
      // best effort - clear local state regardless
    }
    user.value = null;
    useCatalogStore().resetAccountState();
  }

  return { user, loading, error, restoreSession, createAccount, signOut };
});
</script>
