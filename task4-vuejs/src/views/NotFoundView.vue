<script setup>
import { RouterLink } from 'vue-router';
</script>

<template>
  <section class="not-found">
    <h1>404</h1>
    <p>That page doesn't exist.</p>
    <RouterLink class="button button--solid" to="/">Back to groceries</RouterLink>
  </section>
</template>
