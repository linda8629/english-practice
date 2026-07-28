/**
 * scoreManager.js
 * -----------------------------------------------------------------------
 * Tracks the learner's answers during a single quiz session, then
 * persists a summary through storage.js and announces completion via
 * the eventBus so other modules (statistics, review) can react without
 * scoreManager needing to know they exist.
 * -----------------------------------------------------------------------
 */

import { storage } from '../storage.js';
import { eventBus } from '../eventBus.js';
import { STORAGE_KEYS, EVENTS } from '../config.js';
import { formatDate } from '../utils.js';
import { syncManager } from './syncManager.js';

/** @type {Array} answers recorded so far in the current session */
let sessionAnswers = [];
let sessionStartedAt = null;

/** Resets internal state at the start of a new quiz. */
function startSession() {
  sessionAnswers = [];
  sessionStartedAt = Date.now();
}

/**
 * Records a single answered question.
 * @param {{question: Object, selectedOptionId: string, isCorrect: boolean, timeSpentMs: number}} answer
 */
function recordAnswer(answer) {
  sessionAnswers.push(answer);
}

/**
 * Finalizes the session: computes a summary, saves it to localStorage,
 * updates the mistake book and per-word stats, and emits QUIZ_FINISHED.
 * @returns {Object} the session summary
 */
function finishSession() {
  const total = sessionAnswers.length;
  const correct = sessionAnswers.filter((a) => a.isCorrect).length;
  const wrong = total - correct;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const durationMs = sessionStartedAt ? Date.now() - sessionStartedAt : 0;

  const weakestTypeEntry = computeWeakestType(sessionAnswers);

  const summary = {
    date: formatDate(),
    total,
    correct,
    wrong,
    accuracy,
    durationMs,
    weakestType: weakestTypeEntry,
  };

  const newMistakes = persistAttemptAndMistakes(summary, sessionAnswers);
  const wordStatsDelta = persistWordStats(sessionAnswers);

  eventBus.emit(EVENTS.QUIZ_FINISHED, summary);

  // Best-effort cloud backup — never blocks or throws into the caller.
  syncManager.pushSessionEvent({ summary, mistakes: newMistakes, wordStatsDelta });

  return summary;
}

/**
 * Finds the question type with the lowest accuracy in this session.
 * @param {Array} answers
 * @returns {string|null}
 */
function computeWeakestType(answers) {
  const byType = new Map();
  answers.forEach(({ question, isCorrect }) => {
    const stat = byType.get(question.type) || { correct: 0, total: 0 };
    stat.total += 1;
    if (isCorrect) stat.correct += 1;
    byType.set(question.type, stat);
  });

  let weakest = null;
  let lowestRate = Infinity;
  byType.forEach((stat, type) => {
    const rate = stat.correct / stat.total;
    if (rate < lowestRate) {
      lowestRate = rate;
      weakest = type;
    }
  });
  return weakest;
}

/**
 * Appends this session's summary to the attempt history and adds every
 * wrong answer to the mistake book.
 * @returns {Array} the mistake entries created by this session
 */
function persistAttemptAndMistakes(summary, answers) {
  const attempts = storage.get(STORAGE_KEYS.ATTEMPTS, []);
  attempts.push(summary);
  storage.set(STORAGE_KEYS.ATTEMPTS, attempts);

  const newMistakes = answers
    .filter((a) => !a.isCorrect)
    .map((a) => ({
      wordId: a.question.sourceWordId,
      questionType: a.question.type,
      stem: a.question.stem,
      date: summary.date,
    }));

  const mistakes = storage.get(STORAGE_KEYS.MISTAKES, []);
  mistakes.push(...newMistakes);
  storage.set(STORAGE_KEYS.MISTAKES, mistakes);

  return newMistakes;
}

/**
 * Updates per-word correct/incorrect counters used by future review logic.
 * @returns {Object} the delta applied this session, keyed by wordId —
 *   used as the sync payload so restoring from cloud can sum deltas
 *   without needing to know the pre-session totals.
 */
function persistWordStats(answers) {
  const wordStats = storage.get(STORAGE_KEYS.WORD_STATS, {});
  const delta = {};

  answers.forEach((a) => {
    const wordId = a.question.sourceWordId;
    const stat = wordStats[wordId] || { correct: 0, wrong: 0 };
    const wordDelta = delta[wordId] || { correct: 0, wrong: 0 };

    if (a.isCorrect) {
      stat.correct += 1;
      wordDelta.correct += 1;
    } else {
      stat.wrong += 1;
      wordDelta.wrong += 1;
    }

    wordStats[wordId] = stat;
    delta[wordId] = wordDelta;
  });

  storage.set(STORAGE_KEYS.WORD_STATS, wordStats);
  return delta;
}

export const scoreManager = {
  startSession,
  recordAnswer,
  finishSession,
};
