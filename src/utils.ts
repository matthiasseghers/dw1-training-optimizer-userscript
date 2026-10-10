/**
 * Shared userscript utilities: prefixed logging, number parsing, debouncing,
 * and DOM element polling.
 */

export function log(message: string): void {
  console.log(`[DW1 Training Optimizer] ${message}`);
}

/**
 * Parse a number from a string value.
 * @param value The string value to parse
 * @returns Parsed integer or 0 if invalid
 */
export function parseNumber(value: string): number {
  return parseInt(value.trim(), 10) || 0;
}

/**
 * Debounce function to limit rapid function execution.
 * @param func The function to debounce
 * @param delay Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: never[]) => unknown>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  return function (...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
}

/**
 * Polls for an element matching `selector` using requestAnimationFrame.
 * Resolves once found; rejects when a `setTimeout` deadline of `timeout` ms
 * expires. The deadline lives on the timer (not inside the rAF loop) because
 * browsers suspend requestAnimationFrame in background tabs.
 */
export function waitForElement(selector: string, timeout = 5000): Promise<Element> {
  return new Promise<Element>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`waitForElement: element "${selector}" not found within ${timeout}ms`));
    }, timeout);

    function poll(): void {
      const el = document.querySelector(selector);
      if (el) {
        clearTimeout(timer);
        resolve(el);
        return;
      }
      requestAnimationFrame(poll);
    }

    requestAnimationFrame(poll);
  });
}
