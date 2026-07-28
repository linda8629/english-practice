/**
 * app.js
 * -----------------------------------------------------------------------
 * Entry point loaded by every page (via <script type="module" src="js/app.js">).
 * Responsible only for cross-page bootstrap concerns:
 *   - running any pending storage migrations
 *   - applying saved display settings (dark mode / font size)
 *   - highlighting the active nav link
 * Page-specific logic (quiz flow, vocab search, etc.) lives in that
 * page's own inline module script, which imports the managers it needs.
 * -----------------------------------------------------------------------
 */

import { storage } from './storage.js';
import { STORAGE_KEYS, DEFAULT_SETTINGS, EVENTS } from './config.js';
import { highlightActiveNav } from './router.js';
import { eventBus } from './eventBus.js';

/** Applies dark mode + font size to <html> based on saved settings. */
function applySettings(settings) {
  document.documentElement.dataset.theme = settings.darkMode ? 'dark' : 'light';
  document.documentElement.dataset.fontSize = settings.fontSize;
}

function init() {
  storage.runMigrations();

  const settings = storage.get(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  applySettings(settings);

  eventBus.on(EVENTS.SETTINGS_CHANGED, applySettings);

  const currentPageId = document.body.dataset.pageId;
  if (currentPageId) highlightActiveNav(currentPageId);
}

init();
