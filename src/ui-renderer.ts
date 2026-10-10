/**
 * UI rendering functions for creating and updating the custom optimizer interface
 */

import { STAT_NAMES, LOADING_SPRITE, ELEMENT_IDS, getStatMaxValue } from './constants';
import type { OptimizationResult } from './types/training';

/**
 * Create the custom optimizer table for stat inputs and results display.
 *
 * Creates a table with four columns:
 * 1. Stat name (HP, MP, OFF, DEF, SPD, BRN)
 * 2. Current value (input field)
 * 3. Goal value (input field)
 * 4. # Training sessions needed (result, calculated by optimizer)
 *
 * Includes a calculate button that must be clicked to trigger optimization
 * and an indicator that shows when recalculation is needed.
 *
 * The table is inserted at the top of the page and includes a loading overlay
 * that displays during calculations.
 *
 * @returns The container div element containing the optimizer table
 */
export function createCustomTable(): HTMLDivElement {
  const container = document.createElement('div');
  container.id = 'optimizerTableContainer';

  // Create title header
  const title = document.createElement('h2');
  title.textContent = 'Training Optimizer';
  title.style.marginBottom = '10px';
  container.appendChild(title);

  const table = document.createElement('table');
  table.id = 'optimizerTable';
  table.innerHTML = `
    <thead>
      <tr>
        <th>Training Plan</th>
        <th>Current</th>
        <th>Goal</th>
        <th># Trainings</th>
      </tr>
    </thead>
    <tbody>
      ${STAT_NAMES.map((stat) => {
        const maxValue = getStatMaxValue(stat);
        return `
        <tr>
          <td>${stat}</td>
          <td><input type="number" data-type="current" data-stat="${stat}" value="0" min="0" max="${maxValue}" /></td>
          <td><input type="number" data-type="goal" data-stat="${stat}" value="0" min="0" max="${maxValue}" /></td>
          <td data-type="result" data-stat="${stat}">-</td>
        </tr>
      `;
      }).join('')}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="4" style="text-align: center; padding: 10px;">
          <button id="${ELEMENT_IDS.CALCULATE_BUTTON}" style="padding: 8px 24px; font-size: 16px; font-weight: bold; cursor: pointer; background-color: #4CAF50; color: white; border: none; border-radius: 4px;">
            Calculate
          </button>
        </td>
      </tr>
      <tr id="${ELEMENT_IDS.MESSAGE_ROW}" style="display: none;">
        <td colspan="4" style="text-align: center; padding: 10px; font-weight: bold; border-radius: 4px;">
          <span></span>
        </td>
      </tr>
    </tfoot>
  `;
  container.appendChild(table);

  // Add hover effects to calculate button
  const calculateButton = table.querySelector<HTMLButtonElement>(
    `#${ELEMENT_IDS.CALCULATE_BUTTON}`
  );
  if (calculateButton) {
    calculateButton.onmouseover = () => (calculateButton.style.backgroundColor = '#45a049');
    calculateButton.onmouseout = () => (calculateButton.style.backgroundColor = '#4CAF50');
  }

  // Insert the optimizer table at the top of the page. Captured before the
  // loading overlay is appended below, so an empty body is detected correctly.
  const firstElement = document.body.firstChild;
  if (firstElement) {
    document.body.insertBefore(container, firstElement);
  } else {
    document.body.appendChild(container);
  }

  // Also create and append the loading overlay to the document body
  const loadingOverlay = createLoadingOverlay();
  document.body.appendChild(loadingOverlay);

  return container;
}

/**
 * Create the loading overlay element.
 * @returns The loading overlay element
 */
export function createLoadingOverlay(): HTMLDivElement {
  const overlay = document.createElement('div');
  overlay.id = 'loadingOverlay';
  overlay.innerHTML = `
    <div id="loadingContent">
      <img src="${LOADING_SPRITE}" alt="Loading..." id="loadingImage" />
      <div id="loadingMessage">Processing...</div>
    </div>
  `;

  // Overlay styles
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  overlay.style.color = 'white';
  overlay.style.fontSize = '24px';
  overlay.style.display = 'none'; // Initially hidden
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center';
  overlay.style.zIndex = '9999';

  // Image styles
  const loadingImage = overlay.querySelector<HTMLImageElement>('#loadingImage');
  if (loadingImage) {
    loadingImage.style.maxWidth = '200px';
    loadingImage.style.maxHeight = '120px';
    loadingImage.style.padding = '3px';
    loadingImage.style.borderRadius = '6px';
  }

  return overlay;
}

/**
 * Toggle the visibility of the loading overlay.
 * @param show Whether to show or hide the loading overlay
 */
export function toggleLoading(show: boolean): void {
  const overlay = document.querySelector<HTMLDivElement>('#loadingOverlay');
  if (overlay) {
    overlay.style.display = show ? 'flex' : 'none';
  }
}

/**
 * Toggle the visibility of the recalculation indicator.
 *
 * Shows/hides the message that alerts users that their input changes require
 * clicking the Calculate button to update results.
 *
 * Uses the shared message row with warning styling (orange background).
 *
 * @param show Whether to show or hide the indicator
 */
export function toggleRecalcIndicator(show: boolean): void {
  const messageRow = document.querySelector<HTMLTableRowElement>(`#${ELEMENT_IDS.MESSAGE_ROW}`);
  if (!messageRow) return;

  if (show) {
    const cell = messageRow.querySelector('td');
    const span = messageRow.querySelector('span');
    if (cell && span) {
      // Warning styling (orange)
      cell.style.backgroundColor = '#fff3e0';
      cell.style.color = '#e65100';
      span.textContent = '⚠️ Recalculation needed.';
    }
    messageRow.style.display = 'table-row';
  } else {
    messageRow.style.display = 'none';
  }
}

/**
 * Update the results table with optimization results.
 *
 * Takes the output from the optimizer and displays the training session
 * counts in the corresponding result cells. Each stat (HP, MP, OFF, etc.) has
 * its own cell that shows how many sessions of that training are needed.
 *
 * If the optimizer returns an error (no feasible solution), displays 'N/A' in
 * all cells and shows the error message instead.
 *
 * @param results The optimization results - either session counts or an error message
 */
export function updateResults(results: OptimizationResult): void {
  const messageRow = document.querySelector<HTMLTableRowElement>(`#${ELEMENT_IDS.MESSAGE_ROW}`);

  if ('error' in results) {
    // Show error message in styled row
    STAT_NAMES.forEach((stat) => {
      const resultCell = document.querySelector<HTMLTableCellElement>(
        `td[data-type="result"][data-stat="${stat}"]`
      );
      if (resultCell) {
        resultCell.textContent = 'N/A';
      }
    });

    // Display error message in table footer with error styling (red)
    if (messageRow) {
      const cell = messageRow.querySelector('td');
      const span = messageRow.querySelector('span');
      if (cell && span) {
        cell.style.backgroundColor = '#ffebee';
        cell.style.color = '#c62828';
        span.textContent = `⚠️ ${results.error}`;
      }
      messageRow.style.display = 'table-row';
    }
    return;
  }

  // Hide message row if no error
  if (messageRow) {
    messageRow.style.display = 'none';
  }

  // Update each result cell with training counts.
  // The result keys are training names (HP, MP, OFF, DEF, SPD, BRN),
  // which match our stat names.
  STAT_NAMES.forEach((stat) => {
    const resultCell = document.querySelector<HTMLTableCellElement>(
      `td[data-type="result"][data-stat="${stat}"]`
    );
    if (resultCell) {
      // Display the training count if it exists, otherwise show "-"
      const value = results[stat];
      resultCell.textContent = value !== undefined ? value.toString() : '-';
    }
  });
}
