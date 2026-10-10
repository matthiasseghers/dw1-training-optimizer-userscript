/**
 * Constants used throughout the training optimizer
 */

import loadingGif from './assets/loading.gif';

/**
 * Array of stat names in the order they appear in the training table
 */
export const STAT_NAMES = ['HP', 'MP', 'OFF', 'DEF', 'SPD', 'BRN'] as const;

/**
 * Valid stat names in Digimon World 1, derived from {@link STAT_NAMES} so the
 * literal union can never drift out of sync with the runtime list.
 */
export type StatName = (typeof STAT_NAMES)[number];

/**
 * Maximum allowed value per stat, per the game's own limits.
 * HP and MP cap at 9999; every other stat caps at 999.
 */
export const STAT_MAX_VALUES: Record<StatName, number> = {
  HP: 9999,
  MP: 9999,
  OFF: 999,
  DEF: 999,
  SPD: 999,
  BRN: 999,
};

/**
 * Looks up the maximum allowed value for a given stat.
 */
export function getStatMaxValue(stat: StatName): number {
  return STAT_MAX_VALUES[stat];
}

/**
 * Loading spinner image, inlined as a base64 data URI at build time.
 */
export const LOADING_SPRITE = loadingGif;

/**
 * Element IDs for the optimizer UI
 */
export const ELEMENT_IDS = {
  CALCULATE_BUTTON: 'calculateButton',
  MESSAGE_ROW: 'messageRow',
} as const;
