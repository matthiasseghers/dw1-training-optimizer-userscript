import { STAT_NAMES } from './constants';
import type { Stats, OptimizationResult } from './types/training';

/**
 * Application state management.
 * Stores current stats, goal stats, and the latest optimization result.
 */
interface AppState {
  currentStats: Stats;
  goalStats: Stats;
  results: OptimizationResult | null;
}

function createZeroStats(): Stats {
  return STAT_NAMES.reduce((stats, stat) => {
    stats[stat] = 0;
    return stats;
  }, {} as Stats);
}

// Application state
const state: AppState = {
  currentStats: createZeroStats(),
  goalStats: createZeroStats(),
  results: null,
};

/**
 * Get the current stats.
 */
export function getCurrentStats(): Stats {
  return { ...state.currentStats };
}

/**
 * Set the current stats.
 */
export function setCurrentStats(stats: Partial<Stats>): void {
  state.currentStats = { ...state.currentStats, ...stats };
}

/**
 * Get the goal stats.
 */
export function getGoalStats(): Stats {
  return { ...state.goalStats };
}

/**
 * Set the goal stats.
 */
export function setGoalStats(stats: Partial<Stats>): void {
  state.goalStats = { ...state.goalStats, ...stats };
}

/**
 * Calculate the difference between goal and current stats.
 *
 * Returns only positive differences (stats that need to increase). If a goal
 * stat is less than or equal to the current stat, it returns 0 for that stat
 * (meaning no training is needed for that particular stat).
 *
 * This is the input to the optimizer - it represents the total stat gains
 * needed.
 *
 * @returns Stats object with positive differences only
 */
export function getStatDifference(): Stats {
  const diff = createZeroStats();

  STAT_NAMES.forEach((stat) => {
    diff[stat] = Math.max(0, state.goalStats[stat] - state.currentStats[stat]);
  });

  return diff;
}

/**
 * Get the optimization results.
 */
export function getResults(): OptimizationResult | null {
  return state.results;
}

/**
 * Set the optimization results.
 */
export function setResults(results: OptimizationResult | null): void {
  state.results = results;
}
