// theme.js — Dark/Light theme toggle + in-page section observer
// Features:
// - Respects OS prefers-color-scheme when no stored preference
// - Persists user choice to localStorage
// - Accessible toggle button updates aria-pressed and tooltip
// - Highlights nav links for visible sections using IntersectionObserver

const THEME_KEY = 'theme-preference';
const TOGGLE_ID = 'theme-toggle';
const NAV_SELECTOR = '.main-nav';

function getStoredTheme() {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch (e) {
    return null;
  }
}

function storeTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (e) {
    // ignore
  }
}

function systemPrefersDark() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyTheme(theme) {
  if (!theme) return;
  document.documentElement.setAttribute('data-theme', theme);

  const btn = document.getElementById(TOGGLE_ID);
  if (btn) {
    const isDark = theme === 'dark';
    btn.setAttribute('aria-pressed', String(isDark));
    btn.textContent = isDark ? '☀️' : '🌙';
    btn.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
  }
}

function initThemeToggle() {
  const stored = getStoredTheme();
  const initial = stored ? stored : (systemPrefersDark() ? 'dark' : 'light');
  applyTheme(initial);

  // Listen for OS theme changes only if the user hasn't set a preference
  if (!stored && window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    // Use addEventListener where supported
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', e => {
        if (!getStoredTheme()) applyTheme(e.matches ? 'dark' : 'light');
      });
    } else if (typeof mq.addListener === 'function') {
      mq.addListener(e => { if (!getStoredTheme()) applyTheme(e.matches ? 'dark' : 'light'); });
    }
  }

  const btn = document.getElementById(TOGGLE_ID);
  if (!btn) return;
  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    storeTheme(next);
  });
}

function initSectionObserver() {
  const nav = document.querySelector(NAV_SELECTOR);
  if (!nav) return;

  const links = Array.from(nav.querySelectorAll('a'));
  if (!links.length) return;

  const sections = links
    .map(l => document.getElementById(l.getAttribute('href').slice(1)))
    .filter(Boolean);

  const setActive = id => {
    links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + id));
  };

  // Highlight on click too (immediate feedback)
  links.forEach(l => {
    l.addEventListener('click', () => setActive(l.getAttribute('href').slice(1)));
  });

  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter(e => e.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
    if (visible.length) setActive(visible[0].target.id);
  }, { threshold: [0.35, 0.5, 0.75] });

  sections.forEach(s => observer.observe(s));

  if (location.hash) setActive(location.hash.slice(1));
}

function initAll() {
  initThemeToggle();
  initSectionObserver();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAll);
} else {
  initAll();
}