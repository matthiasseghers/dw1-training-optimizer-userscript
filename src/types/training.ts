/**
 * Domain types for the Digimon World 1 Training Optimizer
 */

import type { StatName } from '../constants';

/**
 * Stats object containing all six stat values
 */
export type Stats = Record<StatName, number>;

/**
 * Training effect - how much each stat increases from a training session.
 * Same structure as Stats.
 */
export type TrainingEffect = Stats;

/**
 * Collection of training effects keyed by training name
 */
export interface TrainingEffects {
  [trainingName: string]: TrainingEffect;
}

/**
 * Result from the optimization calculation.
 * Contains number of sessions for each training, or an error message.
 */
export type OptimizationResult = { [trainingName: string]: number } | { error: string };
