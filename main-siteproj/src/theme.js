/*
  Shared across every page: the light/dark toggle and the GSAP
  ScrollTrigger entrance/reveal animations. Each page's own script
  calls bootPage() once, then listens for the 'themechange' event if it
  needs to re-colour anything (a chart, for example) on toggle.
*/
const THEME_KEY = 'main-siteproj-theme';

function initTheme() {
  const themeToggle = document.getElementById('theme-toggle');
  const themeLabel = document.getElementById('theme-label');
  const themeColorMeta = document.getElementById('theme-color-meta');

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    if (themeLabel) themeLabel.textContent = theme;
    if (themeColorMeta) themeColorMeta.setAttribute('content', theme === 'light' ? '#f6f4ef' : '#0b0b0a');
    document.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
  }

  if (themeLabel) {
    themeLabel.textContent = document.documentElement.getAttribute('data-theme') || 'dark';
  }
  themeToggle?.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });
}

// Marks the nav link for the current page so a visitor can see where
// they are, matching the URL path to each link's href.
function markActiveNavLink() {
  const path = window.location.pathname.replace(/\/index\.html$/, '/');
  document.querySelectorAll('.chrome-nav-link').forEach((link) => {
    const href = link.getAttribute('href');
    if (href === path || (href !== '/' && path.startsWith(href))) {
      link.classList.add('is-active');
    }
  });
}

function initScrollAnimations() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion || !window.gsap || !window.ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);

  gsap.fromTo(
    '.hero .prompt-line, .hero h1, .hero-tags, .hero-bio, .hero .nav-cards',
    { opacity: 0, y: 16 },
    { opacity: 1, y: 0, duration: 0.7, stagger: 0.08, ease: 'power3.out' }
  );

  document.querySelectorAll('.reveal-block, .page__outro').forEach((sec) => {
    gsap.fromTo(
      sec,
      { opacity: 0, y: 24 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        // 'play none none none': animate in once and stay, rather than
        // re-hiding content on every scroll back up past it.
        scrollTrigger: { trigger: sec, start: 'top 88%', toggleActions: 'play none none none' },
      }
    );
  });
}

export function bootPage() {
  initTheme();
  markActiveNavLink();
  if (document.readyState === 'complete') {
    initScrollAnimations();
  } else {
    window.addEventListener('load', initScrollAnimations);
  }
}
