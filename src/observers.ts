import { handleInputChangeCore } from './event-handlers';
import { log } from './utils';
import { findTrainingTable } from './training-parser';

/**
 * Monitor the training table for changes using MutationObserver.
 *
 * Sets up a MutationObserver to watch for changes in the training table's
 * content. This is useful for dynamic pages where training values might
 * change after initial load (e.g., when the user interacts with
 * checkboxes/dropdowns on the original page).
 *
 * When the original training table changes, optimization is recalculated
 * automatically WITHOUT requiring the user to click the Calculate button.
 * This is because changes to the training table affect the optimization
 * logic itself (different training effects), not just the user's input
 * values.
 *
 * The observer watches for:
 * - Child elements being added/removed (childList)
 * - Changes in nested elements (subtree)
 * - Text content changes (characterData)
 */
export function monitorTable(): void {
  const table = findTrainingTable();

  if (!table) {
    log('Training table not found, cannot monitor changes');
    return;
  }

  const observer = new MutationObserver(() => {
    log('Training table content changed, auto-recalculating...');
    // Auto-recalculate when training table changes (no button click needed)
    handleInputChangeCore();
  });

  observer.observe(table, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  log('Started monitoring training table for changes');
}
