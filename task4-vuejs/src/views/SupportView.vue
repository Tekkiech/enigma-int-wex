<script setup>
import Breadcrumbs from '../components/common/Breadcrumbs.vue';
import { FAQS, DELIVERY_OPTIONS, RETURNS_POLICY, CONTACT } from '../data/support.js';
</script>

<template>
  <div class="support-view">
    <Breadcrumbs :items="[{ label: 'Home', to: '/' }, { label: 'Support' }]" />
    <h1>Support</h1>

    <section id="faq" class="support-section">
      <h2>FAQ</h2>
      <div class="faq-list">
        <details v-for="faq in FAQS" :key="faq.question" class="faq-item">
          <summary>{{ faq.question }}</summary>
          <p>{{ faq.answer }}</p>
        </details>
      </div>
    </section>

    <section id="delivery" class="support-section">
      <h2>Delivery Info</h2>
      <dl class="spec-list">
        <template v-for="option in DELIVERY_OPTIONS" :key="option.label">
          <dt>{{ option.label }}</dt>
          <dd>{{ option.detail }}</dd>
        </template>
      </dl>
    </section>

    <section id="returns" class="support-section">
      <h2>Returns</h2>
      <ul class="support-list">
        <li v-for="line in RETURNS_POLICY" :key="line">{{ line }}</li>
      </ul>
    </section>

    <section id="contact" class="support-section">
      <h2>Contact Us</h2>
      <dl class="spec-list">
        <dt>Email</dt>
        <dd><a :href="`mailto:${CONTACT.email}`">{{ CONTACT.email }}</a></dd>
        <dt>Phone</dt>
        <dd>{{ CONTACT.phone }}</dd>
        <dt>Hours</dt>
        <dd>{{ CONTACT.hours }}</dd>
      </dl>
    </section>
  </div>
</template>
