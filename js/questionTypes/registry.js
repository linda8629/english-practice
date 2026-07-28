/**
 * questionTypes/registry.js
 * -----------------------------------------------------------------------
 * Plugin contract (every file in questionTypes/ must implement this):
 *
 *   {
 *     id: string,                     // unique, matches the filename
 *     label: string,                  // shown in stats / UI
 *     isEligible?(word): boolean,     // optional; default = always eligible
 *     generate(targetWord, allWords): {
 *       type: string,
 *       stem: string,                 // the question text
 *       options: [{ id, text, correct }],
 *       correctOptionId: string,
 *       explanation: string,
 *       sourceWordId: string,
 *     }
 *   }
 *
 * QuizManager never imports individual plugin files — it only imports
 * this registry. To add a brand-new question type in the future:
 *   1. Create js/questionTypes/yourType.js implementing the contract.
 *   2. Import it and add it to QUESTION_TYPES below.
 * No other file needs to change (Open/Closed Principle).
 * -----------------------------------------------------------------------
 */

import { meaningQuestionType } from './meaning.js';
import { translationQuestionType } from './translation.js';
import { synonymQuestionType } from './synonym.js';

export const QUESTION_TYPES = [
  meaningQuestionType,
  translationQuestionType,
  synonymQuestionType,
];
