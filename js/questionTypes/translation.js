/**
 * questionTypes/translation.js
 * -----------------------------------------------------------------------
 * Plugin: shows the Chinese meaning, asks the learner to pick the
 * matching English word from 4 options.
 * -----------------------------------------------------------------------
 */

import { shuffle, sampleUnique } from '../utils.js';
import { QUIZ_CONFIG } from '../config.js';

export const translationQuestionType = {
  id: 'translation',
  label: '中文 → 英文',

  generate(targetWord, allWords) {
    const distractorPool = allWords.filter((w) => w.id !== targetWord.id);
    const distractors = sampleUnique(distractorPool, QUIZ_CONFIG.OPTIONS_PER_QUESTION - 1)
      .map((w) => ({ id: w.id, text: w.word, correct: false }));

    const correctOption = { id: targetWord.id, text: targetWord.word, correct: true };
    const options = shuffle([correctOption, ...distractors]);

    return {
      type: this.id,
      stem: `「${targetWord.meaning}」的英文是？`,
      options,
      correctOptionId: correctOption.id,
      explanation: `${targetWord.word} ${targetWord.pronunciation} — ${targetWord.meaning}\n例句：${targetWord.examples[0] || ''}`,
      sourceWordId: targetWord.id,
    };
  },
};
