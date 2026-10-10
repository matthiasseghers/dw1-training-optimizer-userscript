/**
 * DOM utility functions for querying elements
 */

/**
 * Get a single DOM element by selector.
 * @param selector CSS selector string
 * @returns The matching element or null if not found
 */
export function getElement<T extends Element = Element>(selector: string): T | null {
  return document.querySelector<T>(selector);
}

/**
 * Get all matching DOM elements by selector.
 * @param selector CSS selector string
 * @returns NodeList of all matching elements
 */
export function getAllElements<T extends Element = Element>(selector: string): NodeListOf<T> {
  return document.querySelectorAll<T>(selector);
}
