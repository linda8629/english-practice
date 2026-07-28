/**
 * questionTypes/meaning.js
 * -----------------------------------------------------------------------
 * Plugin: shows the English word, asks the learner to pick its Chinese
 * meaning from 4 options (1 correct + 3 distractors drawn from other
 * words). See questionTypes/registry.js for the shared plugin contract.
 * -----------------------------------------------------------------------
 */

import { shuffle, sampleUnique } from '../utils.js';
import { QUIZ_CONFIG } from '../config.js';

export const meaningQuestionType = {
  id: 'meaning',
  label: '英文 → 中文',

  /**
   * @param {Object} targetWord the word being tested
   * @param {Array} allWords the full word pool, used to build distractors
   * @returns {{type: string, stem: string, options: Array, correctOptionId: string, explanation: string, sourceWordId: string}}
   */
  generate(targetWord, allWords) {
    const distractorPool = allWords.filter((w) => w.id !== targetWord.id);
    const distractors = sampleUnique(distractorPool, QUIZ_CONFIG.OPTIONS_PER_QUESTION - 1)
      .map((w) => ({ id: w.id, text: w.meaning, correct: false }));

    const correctOption = { id: targetWord.id, text: targetWord.meaning, correct: true };
    const options = shuffle([correctOption, ...distractors]);

    return {
      type: this.id,
      stem: `「${targetWord.word}」的中文意思是？`,
      options,
      correctOptionId: correctOption.id,
      explanation: `${targetWord.word} ${targetWord.pronunciation} — ${targetWord.meaning}\n例句：${targetWord.examples[0] || ''}`,
      sourceWordId: targetWord.id,
    };
  },
};
