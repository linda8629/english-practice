/**
 * statisticsManager.js
 * -----------------------------------------------------------------------
 * Reads the attempt history + per-word stats saved by scoreManager and
 * derives the aggregate numbers statistics.html displays. Keeping this
 * separate from scoreManager means scoreManager only needs to worry
 * about *recording* a session, while this module worries about
 * *reporting* on everything recorded so far.
 * -----------------------------------------------------------------------
 */

import { storage } from '../storage.js';
import { STORAGE_KEYS } from '../config.js';
import { formatDate } from '../utils.js';

/**
 * @returns {{
 *   totalQuestions: number,
 *   totalCorrect: number,
 *   overallAccuracy: number,
 *   last7DaysAccuracy: number,
 *   last30DaysAccuracy: number,
 *   totalSessions: number,
 * }}
 */
function getSummary() {
  const attempts = storage.get(STORAGE_KEYS.ATTEMPTS, []);

  const totalQuestions = attempts.reduce((sum, a) => sum + a.total, 0);
  const totalCorrect = attempts.reduce((sum, a) => sum + a.correct, 0);
  const overallAccuracy = totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  return {
    totalQuestions,
    totalCorrect,
    overallAccuracy,
    last7DaysAccuracy: accuracyForLastNDays(attempts, 7),
    last30DaysAccuracy: accuracyForLastNDays(attempts, 30),
    totalSessions: attempts.length,
  };
}

/**
 * Computes accuracy across attempts whose date falls within the last N days.
 * @param {Array} attempts
 * @param {number} days
 * @returns {number}
 */
function accuracyForLastNDays(attempts, days) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = formatDate(cutoff);

  const recent = attempts.filter((a) => a.date >= cutoffStr);
  const total = recent.reduce((sum, a) => sum + a.total, 0);
  const correct = recent.reduce((sum, a) => sum + a.correct, 0);
  return total ? Math.round((correct / total) * 100) : 0;
}

/**
 * Returns per-word accuracy, sorted weakest-first — useful for future
 * "AI 推薦複習" features that need to know which words need attention.
 * @returns {Array<{wordId: string, correct: number, wrong: number, accuracy: number}>}
 */
function getWeakestWords(limit = 10) {
  const wordStats = storage.get(STORAGE_KEYS.WORD_STATS, {});

  return Object.entries(wordStats)
    .map(([wordId, stat]) => {
      const total = stat.correct + stat.wrong;
      return { wordId, ...stat, accuracy: total ? Math.round((stat.correct / total) * 100) : 0 };
    })
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, limit);
}

export const statisticsManager = {
  getSummary,
  getWeakestWords,
};
