/**
 * Type declarations for the javascript-lp-solver library, loaded on the page
 * via the userscript's @require directive (see meta.json) and exposed as the
 * global `window.solver`.
 * https://github.com/JWally/jsLPSolver
 */

export {};

declare global {
  interface Window {
    solver: {
      Solve: (model: SolverModel) => SolverResult;
    };
  }
}

/**
 * Constraint definition for optimization
 */
export interface SolverConstraint {
  min?: number;
  max?: number;
  equal?: number;
}

/**
 * Variable definition with coefficients
 */
export interface SolverVariable {
  [key: string]: number;
}

/**
 * Complete solver model for optimization
 */
export interface SolverModel {
  /** Name of the objective to optimize */
  optimize: string;
  /** Type of optimization: 'min' for minimize, 'max' for maximize */
  opType: 'min' | 'max';
  /** Constraints for the optimization problem */
  constraints: Record<string, SolverConstraint>;
  /** Variables with their coefficients */
  variables: Record<string, SolverVariable>;
}

/**
 * Result returned by the solver. Besides the fixed metadata fields, it carries
 * one additional numeric property per decision variable (training name) whose
 * exact keys aren't known statically — hence the index signature.
 */
export interface SolverResult {
  /** Whether a feasible solution was found */
  feasible: boolean;
  /** The optimal value of the objective function (if feasible) */
  result?: number;
  /** Whether the solution is bounded */
  bounded?: boolean;
  /** Per-variable solution values, keyed by training name */
  [key: string]: number | boolean | undefined;
}
