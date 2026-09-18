/*
  Stuff every page uses: the light/dark toggle and the scroll-in
  animations. Each page calls bootPage() once on load, and can listen
  for the 'themechange' event if it needs to recolor something (like a
  chart) when the toggle is clicked.
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

// We build nav links in JS instead of just writing <a href="..."> in
// the HTML, because Parcel rewrites those hrefs to start from "/" -
// which breaks if the site isn't hosted right at the domain root (like
// on a preview deploy or behind a proxy with its own path prefix).
// Each page knows its own name (<body data-page="...">), and that name
// always shows up somewhere in the current URL - so we find it there
// and use everything before it as the real site root, whatever prefix
// it's hosted under.
const PAGES = {
  home: 'index.html',
  trend: 'trend/index.html',
  map: 'map/index.html',
  table: 'table/index.html',
  about: 'about/index.html',
};

function siteRoot() {
  const page = document.body.dataset.page;
  const target = PAGES[page] || 'index.html';
  const slash = target.indexOf('/');
  const path = location.pathname;

  if (slash === -1) {
    // home page has no folder of its own, so it IS the root already
    if (path.endsWith('/index.html')) return path.slice(0, -'index.html'.length);
    return path.endsWith('/') ? path : `${path}/`;
  }

  const marker = `/${target.slice(0, slash)}`; // e.g. "/trend"
  const idx = path.lastIndexOf(marker);
  return idx === -1 ? './' : path.slice(0, idx + 1);
}

function wireNavLinks() {
  const root = siteRoot();
  document.querySelectorAll('[data-nav]').forEach((link) => {
    const target = PAGES[link.dataset.nav];
    if (!target) return;
    link.href = root + target;
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
        // play once and stay visible, don't re-hide on scrolling back up
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
