/**
 * Vitest setup file — runs before each test file.
 *
 * Stubs `window.solver`, the global exposed by the javascript-lp-solver
 * library that the userscript loads via its `@require` directive
 * (see meta.json). Individual tests override `window.solver.Solve`'s
 * return value with `vi.fn().mockReturnValue(...)` / `mockImplementation(...)`.
 */
import { vi } from 'vitest';

window.solver = {
  Solve: vi.fn(),
};
