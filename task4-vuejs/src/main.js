import { createApp } from 'vue';
import { createPinia } from 'pinia';
import '@fontsource/work-sans/400.css';
import '@fontsource/work-sans/500.css';
import '@fontsource/work-sans/700.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/ibm-plex-mono/600.css';
import '@fontsource/ibm-plex-mono/700.css';
import './styles.css';
import App from './App.vue';
import router from './router.js';

createApp(App).use(createPinia()).use(router).mount('#app');
