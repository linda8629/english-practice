/**
 * eventBus.js
 * -----------------------------------------------------------------------
 * A minimal publish/subscribe bus so modules never need to call each
 * other directly. Example: when QuizManager finishes a session it emits
 * EVENTS.QUIZ_FINISHED; StatisticsManager and ReviewManager each listen
 * for that event independently. Neither manager needs to know the other
 * exists, which keeps the codebase Open for extension (new listeners
 * can be added anytime) and Closed for modification (QuizManager never
 * changes just because a new feature wants to react to quiz results).
 * -----------------------------------------------------------------------
 */

class EventBus {
  constructor() {
    /** @type {Map<string, Set<Function>>} */
    this.listeners = new Map();
  }

  /**
   * Subscribe to an event.
   * @param {string} eventName
   * @param {Function} handler
   * @returns {Function} unsubscribe function
   */
  on(eventName, handler) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName).add(handler);
    return () => this.off(eventName, handler);
  }

  /**
   * Unsubscribe from an event.
   * @param {string} eventName
   * @param {Function} handler
   */
  off(eventName, handler) {
    this.listeners.get(eventName)?.delete(handler);
  }

  /**
   * Emit an event to every subscriber.
   * @param {string} eventName
   * @param {*} [payload]
   */
  emit(eventName, payload) {
    this.listeners.get(eventName)?.forEach((handler) => handler(payload));
  }
}

// Exported as a singleton so every module shares the same bus instance.
export const eventBus = new EventBus();
