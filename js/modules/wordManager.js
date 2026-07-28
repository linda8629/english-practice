/**
 * wordManager.js
 * -----------------------------------------------------------------------
 * Repository-style module responsible for ALL access to the word list.
 * No other module should fetch words directly — this keeps a single
 * seam for swapping the data source, which is exactly what this file
 * now does:
 *
 *   - Default: reads the bundled data/words.json (works offline, no
 *     setup required).
 *   - Optional: if the user has turned on "從雲端讀取單字" in Settings,
 *     this fetches the word list from their Google Sheet instead (via
 *     the same Apps Script Web App used for session sync), so editing
 *     a spreadsheet row is enough to add/change a word — no redeploy.
 *
 * Whichever source is used, a successful fetch is cached to
 * localStorage so the app still has a word list on the next load even
 * if the network or the Sheet is temporarily unavailable.
 * -----------------------------------------------------------------------
 */

import { DATA_PATHS, STORAGE_KEYS } from '../config.js';
import { storage } from '../storage.js';
import { syncManager } from './syncManager.js';

/** @type {Array|null} in-memory cache of the word list */
let cache = null;

/**
 * Loads the word list if it hasn't been loaded yet, then returns the
 * in-memory cache. Safe to call from multiple places; the actual fetch
 * only happens once per page load.
 * @returns {Promise<Array>}
 */
async function loadWords() {
  if (cache) return cache;

  const syncConfig = syncManager.getConfig();
  const useCloud = syncConfig.useCloudWords && syncManager.isConfigured();

  if (useCloud) {
    cache = await loadFromCloud(syncConfig);
  } else {
    cache = await loadFromLocalFile();
  }
  return cache;
}

/**
 * Fetches the word list from the user's Google Sheet. Falls back to the
 * last successfully cached cloud word list (and finally the bundled
 * JSON) if the request fails, so a flaky connection never breaks the
 * quiz screen.
 * @param {{webAppUrl: string, syncKey: string}} syncConfig
 * @returns {Promise<Array>}
 */
async function loadFromCloud(syncConfig) {
  try {
    const url = `${syncConfig.webAppUrl}?key=${encodeURIComponent(syncConfig.syncKey)}&resource=words`;
    const response = await fetch(url);
    const result = await response.json();
    if (result.error) throw new Error(result.error);
    if (!Array.isArray(result.words) || result.words.length === 0) {
      throw new Error('empty_word_list');
    }

    storage.set(STORAGE_KEYS.WORDS_CACHE, result.words);
    return result.words;
  } catch (error) {
    console.error('[wordManager] Cloud word list failed, falling back:', error);
    const cached = storage.get(STORAGE_KEYS.WORDS_CACHE, null);
    if (cached && cached.length > 0) return cached;
    return loadFromLocalFile();
  }
}

/**
 * Fetches the bundled data/words.json shipped with the site.
 * @returns {Promise<Array>}
 */
async function loadFromLocalFile() {
  const response = await fetch(DATA_PATHS.WORDS);
  if (!response.ok) {
    throw new Error(`Failed to load words.json (status ${response.status})`);
  }
  const data = await response.json();
  return data.words;
}

/**
 * Returns every word currently loaded.
 * @returns {Promise<Array>}
 */
async function getAll() {
  return loadWords();
}

/**
 * Finds a single word by its id.
 * @param {string} id
 * @returns {Promise<Object|undefined>}
 */
async function getById(id) {
  const words = await loadWords();
  return words.find((word) => word.id === id);
}

/**
 * Returns words matching optional filters.
 * @param {{level?: string, partOfSpeech?: string, tag?: string, search?: string}} filters
 * @returns {Promise<Array>}
 */
async function find(filters = {}) {
  const words = await loadWords();
  return words.filter((word) => {
    if (filters.level && word.level !== filters.level) return false;
    if (filters.partOfSpeech && word.partOfSpeech !== filters.partOfSpeech) return false;
    if (filters.tag && !word.tags.includes(filters.tag)) return false;
    if (filters.search) {
      const needle = filters.search.toLowerCase();
      const haystack = `${word.word} ${word.meaning}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
}

/**
 * Forces the next getAll()/find() call to re-fetch instead of using the
 * in-memory cache. Used after the user changes the word source in Settings.
 */
function invalidateCache() {
  cache = null;
}

export const wordManager = {
  getAll,
  getById,
  find,
  invalidateCache,
};
