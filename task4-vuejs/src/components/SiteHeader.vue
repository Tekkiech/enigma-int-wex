<script setup>
import { RouterLink } from 'vue-router';
</script>

<template>
  <header class="site-header">
    <RouterLink to="/" class="site-header__brand">
      <span class="site-header__mark" aria-hidden="true"></span>
      Wavelength Audio
    </RouterLink>
    <span class="site-header__tag">product catalogue · Vue 3 demo</span>
  </header>
</template>
