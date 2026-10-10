/**
 * Linear programming optimizer for training sessions
 */

import { STAT_NAMES } from './constants';
import type { Stats, OptimizationResult } from './types/training';
import { parseTrainingTable } from './training-parser';
import type { SolverModel, SolverResult } from './types/solver';

/**
 * Calculate the optimal training plan based on stat goals.
 *
 * Uses linear programming to minimize the number of training sessions needed
 * to reach the target stats. The optimization considers all available
 * training types and their effects on each stat, then finds the combination
 * that achieves goals with minimum sessions.
 *
 * The LP model:
 * - Objective: Minimize total training sessions
 * - Constraints: Each stat must reach at least the target value
 * - Variables: Number of sessions for each training type
 *
 * @param statGoals Target stats to achieve (difference between goal and current stats)
 * @returns Object mapping training names to session counts, or an error object if not feasible,
 *          or null if the training table could not be parsed
 */
export function calculateOptimalTraining(statGoals: Stats): OptimizationResult | null {
  const trainingEffects = parseTrainingTable();
  if (!trainingEffects) return null;

  // Build the linear programming model
  const model: SolverModel = {
    optimize: 'sessions', // Minimize training sessions
    opType: 'min', // Optimization type (minimization)
    constraints: {},
    variables: {},
  };

  // Add constraints: each stat must reach at least the target value
  STAT_NAMES.forEach((stat) => {
    model.constraints[stat] = { min: statGoals[stat] };
  });

  // Set up variables: each training type with its stat effects
  // The 'sessions' coefficient of 1 means each training counts as one session
  for (const training in trainingEffects) {
    model.variables[training] = { sessions: 1 };
    STAT_NAMES.forEach((stat) => {
      model.variables[training][stat] = trainingEffects[training][stat];
    });
  }

  // Solve the optimization problem using the LP solver
  const solver: SolverResult = window.solver.Solve(model);

  if (!solver.feasible) {
    return { error: 'No feasible solution found.' };
  }

  // Solution found - extract training counts and round up to whole sessions
  const result: OptimizationResult = {};
  for (const [key, value] of Object.entries(solver)) {
    // Filter out solver metadata, keep only training variables
    if (key === 'feasible' || key === 'result' || key === 'bounded') continue;
    if (typeof value === 'number') {
      result[key] = Math.ceil(value); // Round up (can't do partial sessions)
    }
  }
  return result;
}
