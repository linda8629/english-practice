/**
 * syncManager.js
 * -----------------------------------------------------------------------
 * Optional cloud backup layer on top of storage.js. LocalStorage stays
 * the primary, instant, offline-friendly data source; this module only
 * adds a best-effort background copy of every finished quiz session to
 * a Google Sheet (via a Google Apps Script Web App acting as a tiny
 * REST API), plus a manual "restore from cloud" action that replays
 * every backed-up session back into LocalStorage.
 *
 * Design notes:
 *  - The Web App URL and shared key are supplied by the user via the
 *    Settings page and stored only in this browser's LocalStorage —
 *    they are never hard-coded in source, so nothing secret ends up in
 *    the public GitHub repository.
 *  - Sync is entirely optional: if no URL is configured, every function
 *    here becomes a no-op and the app behaves exactly like v0.1.
 *  - Uploads are pure appends (one row per finished session), so there
 *    is nothing to "merge" or conflict-resolve. Restoring replays the
 *    full event log and rebuilds attempts / mistakes / word stats from
 *    scratch, which is simple and deterministic at the cost of being a
 *    manual, user-initiated action rather than silent auto-merge.
 * -----------------------------------------------------------------------
 */

import { storage } from '../storage.js';
import { eventBus } from '../eventBus.js';
import { STORAGE_KEYS, DEFAULT_SYNC_CONFIG, EVENTS } from '../config.js';

/** @returns {{webAppUrl: string, syncKey: string, lastSyncedAt: string|null}} */
function getConfig() {
  return { ...DEFAULT_SYNC_CONFIG, ...storage.get(STORAGE_KEYS.SYNC_CONFIG, {}) };
}

/**
 * Saves the user-provided Web App URL + shared key.
 * @param {{webAppUrl: string, syncKey: string}} partialConfig
 */
function saveConfig(partialConfig) {
  const merged = { ...getConfig(), ...partialConfig };
  storage.set(STORAGE_KEYS.SYNC_CONFIG, merged);
  eventBus.emit(EVENTS.SYNC_STATUS_CHANGED, merged);
  return merged;
}

/** @returns {boolean} whether cloud sync has been configured by the user */
function isConfigured() {
  const { webAppUrl, syncKey } = getConfig();
  return Boolean(webAppUrl && syncKey);
}

/**
 * Uploads one finished-session "event" to the Sheet. Fire-and-forget:
 * failures are logged but never interrupt the local quiz flow, since
 * cloud backup must never be a precondition for the app working.
 * @param {{summary: Object, mistakes: Array, wordStatsDelta: Object}} payload
 */
async function pushSessionEvent(payload) {
  const config = getConfig();
  if (!isConfigured()) return { skipped: true };

  try {
    const response = await fetch(config.webAppUrl, {
      method: 'POST',
      // text/plain avoids a CORS preflight request, which Apps Script
      // Web Apps do not handle; the server still parses this as JSON.
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        key: config.syncKey,
        type: 'session',
        payload,
      }),
    });
    const result = await response.json();
    if (result.error) throw new Error(result.error);

    saveConfig({ lastSyncedAt: new Date().toISOString() });
    return { ok: true };
  } catch (error) {
    console.error('[syncManager] Upload failed:', error);
    return { ok: false, error: String(error) };
  }
}

/**
 * Fetches every previously-uploaded session event and rebuilds
 * attempts / mistakes / word stats in LocalStorage from them.
 * This REPLACES local history with the cloud's — intended for
 * restoring onto a fresh browser/device, not for routine merging.
 * @returns {Promise<{ok: boolean, sessionCount?: number, error?: string}>}
 */
async function restoreFromCloud() {
  const config = getConfig();
  if (!isConfigured()) return { ok: false, error: '尚未設定雲端同步' };

  try {
    const url = `${config.webAppUrl}?key=${encodeURIComponent(config.syncKey)}`;
    const response = await fetch(url);
    const result = await response.json();
    if (result.error) throw new Error(result.error);

    const sessionEvents = (result.events || []).filter((e) => e.type === 'session');

    const attempts = [];
    const mistakes = [];
    const wordStats = {};

    sessionEvents.forEach(({ payload }) => {
      if (payload.summary) attempts.push(payload.summary);
      if (Array.isArray(payload.mistakes)) mistakes.push(...payload.mistakes);
      if (payload.wordStatsDelta) {
        Object.entries(payload.wordStatsDelta).forEach(([wordId, delta]) => {
          const stat = wordStats[wordId] || { correct: 0, wrong: 0 };
          stat.correct += delta.correct || 0;
          stat.wrong += delta.wrong || 0;
          wordStats[wordId] = stat;
        });
      }
    });

    storage.set(STORAGE_KEYS.ATTEMPTS, attempts);
    storage.set(STORAGE_KEYS.MISTAKES, mistakes);
    storage.set(STORAGE_KEYS.WORD_STATS, wordStats);
    saveConfig({ lastSyncedAt: new Date().toISOString() });

    return { ok: true, sessionCount: sessionEvents.length };
  } catch (error) {
    console.error('[syncManager] Restore failed:', error);
    return { ok: false, error: String(error) };
  }
}

export const syncManager = {
  getConfig,
  saveConfig,
  isConfigured,
  pushSessionEvent,
  restoreFromCloud,
};
