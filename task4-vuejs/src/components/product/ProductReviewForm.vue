<script setup>
import { reactive, ref } from 'vue';
import useAccountStore from '../../stores/account.vue';
import useCatalogStore from '../../stores/catalog.vue';

const props = defineProps({
  productId: { type: Number, required: true },
});

const account = useAccountStore();
const catalog = useCatalogStore();

const form = reactive({ rating: 0, comment: '' });
const hoverRating = ref(0);
const submitting = ref(false);
const error = ref(null);
const submitted = ref(false);

async function submit() {
  error.value = null;
  if (!form.rating) {
    error.value = 'Pick a star rating.';
    return;
  }
  if (!form.comment.trim()) {
    error.value = 'Write a comment before submitting.';
    return;
  }
  submitting.value = true;
  try {
    await catalog.submitReview(props.productId, { rating: form.rating, comment: form.comment.trim() });
    form.rating = 0;
    form.comment = '';
    submitted.value = true;
  } catch (err) {
    error.value = err.message;
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="review-form">
    <p v-if="!account.user" class="review-form__signed-out">
      <router-link to="/account">Sign in</router-link> to leave a rating and comment.
    </p>

    <form v-else class="review-form__fields" @submit.prevent="submit">
      <div class="review-form__stars" role="radiogroup" aria-label="Rating">
        <button
          v-for="star in 5"
          :key="star"
          type="button"
          class="review-form__star"
          :class="{ 'is-filled': star <= (hoverRating || form.rating) }"
          :aria-label="`${star} star${star > 1 ? 's' : ''}`"
          @click="form.rating = star"
          @mouseenter="hoverRating = star"
          @mouseleave="hoverRating = 0"
        >★</button>
      </div>

      <textarea
        v-model="form.comment"
        class="review-form__comment"
        placeholder="Share your thoughts on this product…"
        rows="3"
        required
      ></textarea>

      <p v-if="error" class="review-form__error" role="alert">{{ error }}</p>
      <p v-if="submitted" class="review-form__success">Thanks for the review.</p>

      <button type="submit" class="button button--outline" :disabled="submitting">
        {{ submitting ? 'Posting…' : 'Post review' }}
      </button>
    </form>
  </div>
</template>
