/**
 * utils.js
 * -----------------------------------------------------------------------
 * Small, pure, reusable helper functions with no dependencies on other
 * app modules. If a piece of logic is needed in more than one place,
 * it belongs here rather than being copy-pasted.
 * -----------------------------------------------------------------------
 */

/**
 * Returns a new array with the items of the input shuffled
 * (Fisher-Yates). Does not mutate the original array.
 * @param {Array} array
 * @returns {Array}
 */
export function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Random integer between min and max, inclusive.
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Picks `count` random, unique items from an array.
 * @param {Array} array
 * @param {number} count
 * @returns {Array}
 */
export function sampleUnique(array, count) {
  return shuffle(array).slice(0, Math.min(count, array.length));
}

/**
 * Picks one random item from an array.
 * @param {Array} array
 * @returns {*}
 */
export function randomItem(array) {
  return array[randomInt(0, array.length - 1)];
}

/**
 * Formats a Date (or ISO string) as YYYY-MM-DD.
 * @param {Date|string} date
 * @returns {string}
 */
export function formatDate(date = new Date()) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Deep clones a JSON-serializable value.
 * @param {*} value
 * @returns {*}
 */
export function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

/**
 * Shorthand for document.querySelector.
 * @param {string} selector
 * @param {ParentNode} [scope]
 * @returns {Element|null}
 */
export function qs(selector, scope = document) {
  return scope.querySelector(selector);
}

/**
 * Shorthand for document.querySelectorAll, returned as a real array.
 * @param {string} selector
 * @param {ParentNode} [scope]
 * @returns {Element[]}
 */
export function qsa(selector, scope = document) {
  return Array.from(scope.querySelectorAll(selector));
}

/**
 * Creates a DOM element with optional class names, attributes and children.
 * @param {string} tag
 * @param {{className?: string, attrs?: Object, text?: string}} [options]
 * @param {Array<Element|string>} [children]
 * @returns {HTMLElement}
 */
export function createElement(tag, options = {}, children = []) {
  const el = document.createElement(tag);
  if (options.className) el.className = options.className;
  if (options.text !== undefined) el.textContent = options.text;
  if (options.attrs) {
    Object.entries(options.attrs).forEach(([key, value]) => {
      el.setAttribute(key, value);
    });
  }
  children.forEach((child) => {
    el.append(child instanceof Node ? child : document.createTextNode(child));
  });
  return el;
}

/**
 * Clamps a number between min and max.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
