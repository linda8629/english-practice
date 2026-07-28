/**
 * storage.js
 * -----------------------------------------------------------------------
 * The ONLY module allowed to touch window.localStorage directly.
 * Every other module (managers, pages) must read/write through the
 * functions exported here. This gives us:
 *   - one place to change if we ever swap the storage backend
 *   - centralized JSON parsing/serialization + error handling
 *   - a schema-version + migration hook so the data shape can evolve
 *     over the multi-year life of this project without breaking
 *     existing users' saved data.
 * -----------------------------------------------------------------------
 */

import { STORAGE_KEYS, CURRENT_SCHEMA_VERSION } from './config.js';

/**
 * Reads a JSON value from localStorage.
 * @param {string} key
 * @param {*} fallback value returned if the key is missing or invalid
 * @returns {*}
 */
function get(key, fallback = null) {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (error) {
    console.error(`[storage] Failed to read "${key}":`, error);
    return fallback;
  }
}

/**
 * Writes a JSON-serializable value to localStorage.
 * @param {string} key
 * @param {*} value
 * @returns {boolean} whether the write succeeded
 */
function set(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`[storage] Failed to write "${key}":`, error);
    return false;
  }
}

/**
 * Removes a key from localStorage.
 * @param {string} key
 */
function remove(key) {
  window.localStorage.removeItem(key);
}

/**
 * Wipes every key this app owns. Used by the "reset data" setting.
 */
function clearAll() {
  Object.values(STORAGE_KEYS).forEach((key) => remove(key));
}

/**
 * Runs once on app start. Ensures the stored schema version matches
 * CURRENT_SCHEMA_VERSION, running migration steps in between if the
 * user's saved data was written by an older version of the app.
 * Add a new `case` here whenever CURRENT_SCHEMA_VERSION is bumped;
 * never rewrite past cases, so the migration chain stays honest.
 */
function runMigrations() {
  let version = get(STORAGE_KEYS.SCHEMA_VERSION, 0);

  while (version < CURRENT_SCHEMA_VERSION) {
    switch (version) {
      case 0:
        // Fresh install / pre-versioned data: nothing to migrate yet.
        break;
      default:
        break;
    }
    version += 1;
  }

  set(STORAGE_KEYS.SCHEMA_VERSION, CURRENT_SCHEMA_VERSION);
}

export const storage = {
  get,
  set,
  remove,
  clearAll,
  runMigrations,
};
