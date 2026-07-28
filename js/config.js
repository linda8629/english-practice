/**
 * config.js
 * -----------------------------------------------------------------------
 * Single source of truth for constants used across the app.
 * Any module that needs a storage key, a default setting, or a tunable
 * number should import it from here instead of hard-coding a literal.
 * This keeps every other file free of "magic strings" and means a key
 * only ever needs to change in one place.
 * -----------------------------------------------------------------------
 */

export const STORAGE_KEYS = Object.freeze({
  SCHEMA_VERSION: 'ep_schemaVersion',
  SETTINGS: 'ep_settings',
  MISTAKES: 'ep_mistakes',
  ATTEMPTS: 'ep_attempts',      // history of finished quiz sessions
  STATISTICS: 'ep_statistics',  // rolled-up aggregate stats
  WORD_STATS: 'ep_wordStats',   // per-word correct/incorrect counters
  SYNC_CONFIG: 'ep_syncConfig', // { webAppUrl, syncKey, lastSyncedAt, useCloudWords }
  WORDS_CACHE: 'ep_wordsCache', // last successfully fetched cloud word list, for offline fallback
});

export const CURRENT_SCHEMA_VERSION = 1;

export const DEFAULT_SETTINGS = Object.freeze({
  dailyQuestionCount: 10,
  fontSize: 'medium',       // small | medium | large
  darkMode: false,
  soundEnabled: true,
  showExplanation: true,
});

export const DEFAULT_SYNC_CONFIG = Object.freeze({
  webAppUrl: '',
  syncKey: '',
  lastSyncedAt: null,
  useCloudWords: false, // when true, wordManager fetches the word list from the Sheet instead of data/words.json
});

export const QUIZ_CONFIG = Object.freeze({
  OPTIONS_PER_QUESTION: 4,
  DEFAULT_QUESTION_COUNT: 10,
});

export const DATA_PATHS = Object.freeze({
  WORDS: 'data/words.json',
});

export const EVENTS = Object.freeze({
  QUIZ_FINISHED: 'quiz:finished',
  ANSWER_SUBMITTED: 'quiz:answerSubmitted',
  SETTINGS_CHANGED: 'settings:changed',
  SYNC_STATUS_CHANGED: 'sync:statusChanged',
});
