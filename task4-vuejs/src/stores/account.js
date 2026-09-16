import { defineStore } from 'pinia';

// A deliberately fake "account": there's no backend, so creating one just
// stores a name/email in memory for the rest of the session. Nothing is
// validated or persisted — it exists to demonstrate the interaction, not
// to be a real auth system.
export const useAccountStore = defineStore('account', {
  state: () => ({
    user: null, // { name, email } once "signed up"
  }),

  actions: {
    createAccount({ name, email }) {
      this.user = {
        name: name.trim() || 'John Doe',
        email: email.trim() || 'john.doe@example.com',
      };
    },

    signOut() {
      this.user = null;
    },
  },
});
