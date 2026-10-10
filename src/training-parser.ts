/**
 * Functions for parsing training data from the page
 */

import { STAT_NAMES } from './constants';
import type { TrainingEffects } from './types/training';
import { parseNumber } from './utils';

/**
 * Find the training table on the page.
 *
 * The training table is identified by having "training" (case-insensitive) as
 * the first cell text in its first row. This is more reliable than using CSS
 * selectors, which can break when the page structure changes.
 *
 * @returns The training table element, or null if not found on the page
 */
export function findTrainingTable(): HTMLTableElement | null {
  const tables = Array.from(document.querySelectorAll<HTMLTableElement>('table'));

  // Search through all tables to find the one with "training" as first cell
  for (const table of tables) {
    const firstRow = table.querySelector('tr');
    const firstCell = firstRow?.querySelector('td');
    const cellText = firstCell?.textContent?.trim().toLowerCase();

    // The training table has "training" as the first cell in the header row
    if (cellText === 'training') {
      return table;
    }
  }

  // Table not found
  return null;
}

/**
 * Parse the training table to extract training effects.
 * @returns Object mapping training names to their stat effects, or null if table not found
 */
export function parseTrainingTable(): TrainingEffects | null {
  const table = findTrainingTable();

  if (!table) {
    console.error('Training table not found on the page.');
    return null;
  }

  const trainingEffects: TrainingEffects = {};
  const rows = table.querySelectorAll<HTMLTableRowElement>('tr');

  rows.forEach((row, index) => {
    if (index === 0) return; // Skip header row

    const cells = row.querySelectorAll<HTMLTableCellElement>('td');
    const trainingName = cells[0]?.textContent?.trim().replace('-Training', '') || '';

    trainingEffects[trainingName] = STAT_NAMES.reduce(
      (effects, stat, i) => {
        effects[stat] = parseNumber(cells[i + 1]?.textContent || '0');
        return effects;
      },
      {} as TrainingEffects[string]
    );
  });

  return trainingEffects;
}
