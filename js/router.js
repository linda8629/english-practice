/**
 * router.js
 * -----------------------------------------------------------------------
 * This project is a traditional multi-page site (each .html file is a
 * real page — simplest possible approach for GitHub Pages, no build
 * step). "Routing" here just means: a single source of truth for which
 * pages exist, so navigation bars stay consistent, and a helper to mark
 * the current page's nav link as active. If the project ever grows a
 * single-page shell, this is the file that would gain a real
 * history-API router — every page already funnels through it.
 * -----------------------------------------------------------------------
 */

export const PAGES = Object.freeze([
  { id: 'home', href: 'index.html', label: '首頁' },
  { id: 'quiz', href: 'quiz.html', label: '每日測驗' },
  { id: 'vocab', href: 'vocab.html', label: '單字庫' },
  { id: 'review', href: 'review.html', label: '錯題本' },
  { id: 'statistics', href: 'statistics.html', label: '學習統計' },
  { id: 'settings', href: 'settings.html', label: '設定' },
]);

/**
 * Adds an "active" class to the nav link matching the current page id.
 * @param {string} currentPageId one of PAGES[].id
 */
export function highlightActiveNav(currentPageId) {
  document.querySelectorAll('[data-nav-id]').forEach((link) => {
    link.classList.toggle('is-active', link.dataset.navId === currentPageId);
  });
}
