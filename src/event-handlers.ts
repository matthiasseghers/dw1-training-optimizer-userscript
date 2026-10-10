import { ELEMENT_IDS, getStatMaxValue, type StatName } from './constants';
import { setCurrentStats, setGoalStats, getStatDifference, setResults } from './state';
import { calculateOptimalTraining } from './optimizer';
import { updateResults, toggleLoading, toggleRecalcIndicator } from './ui-renderer';
import { log, parseNumber } from './utils';
import { getAllElements } from './dom-utils';

/**
 * Gather stats from input fields and update state.
 *
 * Reads all input fields with the specified data-type attribute and updates
 * the application state with the parsed numeric values.
 *
 * @param type Either 'current' (for current stats) or 'goal' (for target stats)
 */
function getStatsFromInputs(type: 'current' | 'goal'): void {
  const inputs = getAllElements<HTMLInputElement>(`input[data-type="${type}"]`);

  inputs.forEach((input) => {
    const stat = input.dataset.stat as StatName;
    const value = parseNumber(input.value);

    if (type === 'current') {
      setCurrentStats({ [stat]: value });
    } else {
      setGoalStats({ [stat]: value });
    }
  });
}

/**
 * Handle input changes and trigger optimization.
 *
 * This is the core handler that calculates the optimization. It gathers
 * current and goal stats from input fields, calculates the difference, and
 * runs the optimization to find the minimal training plan.
 *
 * Used by:
 * - Calculate button click handler
 * - Training table mutation observer (auto-recalculate when page controls change)
 */
export function handleInputChangeCore(): void {
  log('Calculating optimization...');

  // Gather current and goal stats from all input fields
  getStatsFromInputs('current');
  getStatsFromInputs('goal');

  // Calculate stat difference (only positive increases are considered).
  // If goal < current for any stat, it's treated as 0 (no training needed).
  const statDiff = getStatDifference();

  // Show loading overlay during calculation
  toggleLoading(true);

  // Hide recalculation indicator since we're now calculating
  toggleRecalcIndicator(false);

  // Run optimization with a small delay to ensure loading animation displays
  setTimeout(() => {
    const optimalPlan = calculateOptimalTraining(statDiff);
    setResults(optimalPlan);

    if (optimalPlan) {
      updateResults(optimalPlan);
    } else {
      updateResults({ error: 'No solution found' });
    }

    // Hide loading overlay
    toggleLoading(false);

    log('Optimization complete');
  }, 300);
}

/**
 * Handle input changes in our custom table fields.
 *
 * When the user types in a Current or Goal field, show an indicator that
 * recalculation is needed. The user must click Calculate to update results.
 *
 * Also enforces the per-stat max value limits (HP/MP: 9999, others: 999).
 */
function handleCustomInputChange(event: Event): void {
  const input = event.target as HTMLInputElement;
  const stat = input.dataset.stat as StatName | undefined;

  if (stat) {
    const maxValue = getStatMaxValue(stat);
    const value = parseNumber(input.value);

    if (value > maxValue) {
      input.value = maxValue.toString();
    }
  }

  log('Input changed in custom table, showing recalc indicator');
  toggleRecalcIndicator(true);
}

/**
 * Attach event listeners to all input fields and the calculate button.
 *
 * - Custom table inputs: show recalculation indicator when changed
 * - Calculate button: trigger optimization when clicked
 * - Training table (monitored by observer): auto-recalculate when page controls change
 */
export function attachEventListeners(): void {
  // Attach input listeners to show recalc indicator
  const inputs = getAllElements<HTMLInputElement>(
    'input[data-type="current"], input[data-type="goal"]'
  );

  inputs.forEach((input) => {
    input.addEventListener('input', handleCustomInputChange);
  });

  log(`Attached event listeners to ${inputs.length} input fields`);

  // Attach click listener to calculate button
  const calculateButton = document.querySelector<HTMLButtonElement>(
    `#${ELEMENT_IDS.CALCULATE_BUTTON}`
  );
  if (calculateButton) {
    calculateButton.addEventListener('click', () => {
      log('Calculate button clicked');
      handleInputChangeCore();
    });
    log('Attached event listener to calculate button');
  } else {
    console.error('Calculate button not found');
  }
}
