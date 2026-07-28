/**
 * quizManager.js
 * -----------------------------------------------------------------------
 * Builds a randomized quiz session: picks N words, picks a random
 * eligible question-type plugin for each, and generates the question.
 * This module knows nothing about the DOM — it only produces plain
 * data. quiz.html is responsible for rendering it.
 * -----------------------------------------------------------------------
 */

import { wordManager } from './wordManager.js';
import { QUESTION_TYPES } from '../questionTypes/registry.js';
import { sampleUnique, randomItem, shuffle } from '../utils.js';
import { QUIZ_CONFIG } from '../config.js';

/**
 * Returns the subset of registered question types that can be generated
 * for the given word (e.g. "synonym" needs the word to have synonyms).
 * @param {Object} word
 * @returns {Array}
 */
function eligibleTypesFor(word) {
  return QUESTION_TYPES.filter((type) => (type.isEligible ? type.isEligible(word) : true));
}

/**
 * Builds a full quiz session.
 * @param {number} [questionCount]
 * @returns {Promise<Array>} array of generated question objects
 */
async function buildQuiz(questionCount = QUIZ_CONFIG.DEFAULT_QUESTION_COUNT) {
  const allWords = await wordManager.getAll();
  const chosenWords = sampleUnique(allWords, questionCount);

  const questions = chosenWords.map((word) => {
    const types = eligibleTypesFor(word);
    const type = randomItem(types.length ? types : QUESTION_TYPES);
    return type.generate(word, allWords);
  });

  // Question order is already randomized by sampleUnique's shuffle,
  // but shuffle again defensively in case questionCount === allWords.length.
  return shuffle(questions);
}

export const quizManager = {
  buildQuiz,
};
