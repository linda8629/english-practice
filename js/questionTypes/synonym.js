/**
 * questionTypes/synonym.js
 * -----------------------------------------------------------------------
 * Plugin: shows the English word, asks the learner to pick a synonym.
 * Words without any synonyms listed are skipped by QuizManager's
 * eligibility check (see modules/quizManager.js).
 * -----------------------------------------------------------------------
 */

import { shuffle, sampleUnique, randomItem } from '../utils.js';
import { QUIZ_CONFIG } from '../config.js';

export const synonymQuestionType = {
  id: 'synonym',
  label: '同義字',

  /** Only words that have at least one synonym can generate this type. */
  isEligible(word) {
    return Array.isArray(word.synonyms) && word.synonyms.length > 0;
  },

  generate(targetWord, allWords) {
    const correctText = randomItem(targetWord.synonyms);

    const distractorPool = allWords.filter((w) => w.id !== targetWord.id);
    const distractors = sampleUnique(distractorPool, QUIZ_CONFIG.OPTIONS_PER_QUESTION - 1)
      .map((w) => ({ id: w.id, text: randomItem(w.synonyms?.length ? w.synonyms : [w.word]), correct: false }));

    const correctOption = { id: targetWord.id, text: correctText, correct: true };
    const options = shuffle([correctOption, ...distractors]);

    return {
      type: this.id,
      stem: `「${targetWord.word}」的同義字是？`,
      options,
      correctOptionId: correctOption.id,
      explanation: `${targetWord.word} ${targetWord.pronunciation} — ${targetWord.meaning}\n同義字：${targetWord.synonyms.join(', ')}`,
      sourceWordId: targetWord.id,
    };
  },
};
