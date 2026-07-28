/**
 * reviewManager.js
 * -----------------------------------------------------------------------
 * Manages the "mistake book": every wrong answer scoreManager records
 * lands here. Exposes list/remove/sort helpers used by review.html.
 * -----------------------------------------------------------------------
 */

import { storage } from '../storage.js';
import { STORAGE_KEYS } from '../config.js';

/**
 * Returns all recorded mistakes, most recent first.
 * @returns {Array}
 */
function getAll() {
  const mistakes = storage.get(STORAGE_KEYS.MISTAKES, []);
  return [...mistakes].sort((a, b) => (a.date < b.date ? 1 : -1));
}

/**
 * Removes a mistake entry by its array index (within the sorted list
 * returned by getAll — callers should re-fetch after removal).
 * @param {number} index
 */
function removeAt(index) {
  const mistakes = getAll();
  mistakes.splice(index, 1);
  storage.set(STORAGE_KEYS.MISTAKES, mistakes);
}

/** Clears every mistake entry. */
function clearAll() {
  storage.set(STORAGE_KEYS.MISTAKES, []);
}

export const reviewManager = {
  getAll,
  removeAt,
  clearAll,
};
