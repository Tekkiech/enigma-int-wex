<script>
import { ref } from 'vue';
import { defineStore } from 'pinia';
import * as backend from '../api/backend.js';
import useCatalogStore from './catalog.vue';

// Keeps track of who's signed in. The actual account lives on the
// server - this store just holds a copy of the current user and talks
// to the API to sign up, log in, and log out.
export default defineStore('account', () => {
  const user = ref(null); // { id, name, email } once signed in
  const loading = ref(false);
  const error = ref(null);

  // Runs once when the app loads. The server remembers you're signed in
  // even after a page refresh (using a cookie), so this checks for that
  // instead of assuming you're logged out.
  async function restoreSession() {
    try {
      user.value = await backend.fetchCurrentUser();
      await useCatalogStore().syncFromServer();
    } catch {
      user.value = null;
    }
  }

  // Checks the passwords match here first, so you get instant feedback
  // instead of waiting on the server. The server checks again too.
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
