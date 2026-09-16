<script setup>
import { RouterLink } from 'vue-router';
</script>

<template>
  <footer class="site-footer">
    <div class="site-footer__grid">
      <div>
        <div class="site-footer__brand">TEKKIECH.MARKET</div>
      </div>
      <div class="site-footer__col">
        <div class="site-footer__heading">Shop</div>
        <RouterLink to="/">All Products</RouterLink>
        <RouterLink to="/deals">Deals</RouterLink>
        <span>New Arrivals</span>
      </div>
      <div class="site-footer__col">
        <div class="site-footer__heading">Support</div>
        <RouterLink :to="{ name: 'support', hash: '#delivery' }">Delivery Info</RouterLink>
        <RouterLink :to="{ name: 'support', hash: '#returns' }">Returns</RouterLink>
        <RouterLink :to="{ name: 'support', hash: '#contact' }">Contact Us</RouterLink>
      </div>
      <div class="site-footer__col">
        <div class="site-footer__heading">Data</div>
        <span>Product data via <a href="https://dummyjson.com/" target="_blank" rel="noopener">DummyJSON</a></span>
      </div>
    </div>
  </footer>
</template>
