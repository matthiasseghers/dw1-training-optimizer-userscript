/**
 * Shared userscript utilities: prefixed logging and DOM element polling.
 */

export function log(message: string): void {
  console.log(`[UserScript] ${message}`);
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
