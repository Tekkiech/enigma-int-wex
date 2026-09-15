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

// Every page one level under the root (trend/, map/, table/, about/)
// sets <body data-base="../">; the root landing page sets data-base="./".
// Internal nav links are wired up here rather than written as real
// hrefs in the HTML: Parcel treats an <a href="..."> pointing at
// another page it's bundling as a build dependency and rewrites it to
// a root-absolute path (e.g. "/trend/index.html") no matter how it was
// written in source. That's correct only when the site is deployed at
// a domain root; opened straight off disk, or hosted under a sub-path
// (a project page, a preview deploy, anything not served from "/"), a
// root-absolute link points outside the site entirely and silently
// fails - which looks exactly like "the links don't do anything".
// A plain string in a data attribute isn't a link Parcel's bundler
// recognises, so it passes through untouched and lets us build the
// real, correctly-relative href at runtime instead.
const PAGES = {
  home: 'index.html',
  trend: 'trend/index.html',
  map: 'map/index.html',
  table: 'table/index.html',
  about: 'about/index.html',
};

function wireNavLinks() {
  const base = document.body.dataset.base ?? './';
  document.querySelectorAll('[data-nav]').forEach((link) => {
    const target = PAGES[link.dataset.nav];
    if (!target) return;
    link.href = base + target;
    if (link.classList.contains('chrome-nav-link') && link.dataset.nav === document.body.dataset.page) {
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
  wireNavLinks();
  if (document.readyState === 'complete') {
    initScrollAnimations();
  } else {
    window.addEventListener('load', initScrollAnimations);
  }
}
