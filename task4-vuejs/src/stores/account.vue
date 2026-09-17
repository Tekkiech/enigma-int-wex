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

  // Separate from logIn on purpose: signup owns password quality (a
  // confirmation match, length/complexity - all things Flask's
  // /api/auth/signup also re-checks server-side, this just gives faster
  // feedback), none of which apply to signing into an account that
  // already exists.
  async function signUp({ name, email, password, passwordConfirm }) {
    error.value = null;
    if (password !== passwordConfirm) {
      error.value = "Passwords don't match.";
      return;
    }
    loading.value = true;
    try {
      user.value = await backend.signup({ name: name.trim(), email: email.trim(), password });
    } catch (err) {
      error.value = err.message;
      loading.value = false;
      return;
    }
    await useCatalogStore().syncFromServer();
    loading.value = false;
  }

  // Separate from signUp on purpose: login owns brute-force resistance
  // (Flask tracks failed attempts per account and locks it out after
  // too many - see server/auth.py) rather than password quality, since
  // there's nothing to validate the shape of on a login attempt.
  async function logIn({ email, password }) {
    loading.value = true;
    error.value = null;
    try {
      user.value = await backend.login({ email: email.trim(), password });
    } catch (err) {
      error.value = err.message;
      loading.value = false;
      return;
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

  return { user, loading, error, restoreSession, signUp, logIn, signOut };
});
</script>
