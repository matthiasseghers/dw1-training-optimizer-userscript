import { describe, it, expect, beforeEach, vi } from 'vitest';
import { calculateOptimalTraining } from '../src/optimizer';
import * as trainingParser from '../src/training-parser';
import type { Stats } from '../src/types/training';

vi.mock('../src/training-parser');

const ZERO_GOALS: Stats = { HP: 0, MP: 0, OFF: 0, DEF: 0, SPD: 0, BRN: 0 };

/** Builds a full Stats object, defaulting every stat to 0 except the given overrides. */
function goals(overrides: Partial<Stats>): Stats {
  return { ...ZERO_GOALS, ...overrides };
}

/** Stubs the training table parser to report a single HP-only training. */
function mockHpOnlyTrainingEffects(): void {
  vi.mocked(trainingParser.parseTrainingTable).mockReturnValue({
    HP: { HP: 80, MP: 0, OFF: 2, DEF: 0, SPD: 0, BRN: 0 },
  });
}

describe('calculateOptimalTraining', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null if the training table cannot be parsed', () => {
    vi.mocked(trainingParser.parseTrainingTable).mockReturnValue(null);

    const result = calculateOptimalTraining(goals({ HP: 1000 }));

    expect(result).toBeNull();
  });

  it('calculates optimal training for an HP goal', () => {
    vi.mocked(trainingParser.parseTrainingTable).mockReturnValue({
      HP: { HP: 80, MP: 0, OFF: 2, DEF: 0, SPD: 0, BRN: 0 },
      MP: { HP: 0, MP: 80, OFF: 0, DEF: 2, SPD: 0, BRN: 0 },
      OFF: { HP: 0, MP: 0, OFF: 8, DEF: 0, SPD: 2, BRN: 0 },
      DEF: { HP: 0, MP: 0, OFF: 0, DEF: 8, SPD: 0, BRN: 2 },
      SPD: { HP: 10, MP: 0, OFF: 0, DEF: 0, SPD: 8, BRN: 0 },
      BRN: { HP: 0, MP: 10, OFF: 0, DEF: 0, SPD: 0, BRN: 8 },
    });

    vi.mocked(window.solver.Solve).mockReturnValue({
      feasible: true,
      result: 12.5,
      bounded: true,
      HP: 12.5,
    });

    const result = calculateOptimalTraining(goals({ HP: 1000 }));

    // 1000 HP / 80 HP per session = 12.5, rounds up to 13
    expect(result).toEqual({ HP: 13 });
  });

  it('filters out solver metadata (feasible, result, bounded)', () => {
    vi.mocked(trainingParser.parseTrainingTable).mockReturnValue({
      HP: { HP: 80, MP: 0, OFF: 2, DEF: 0, SPD: 0, BRN: 0 },
      MP: { HP: 0, MP: 80, OFF: 0, DEF: 2, SPD: 0, BRN: 0 },
    });

    vi.mocked(window.solver.Solve).mockReturnValue({
      feasible: true,
      result: 15.0,
      bounded: true,
      HP: 10,
      MP: 5,
    });

    const result = calculateOptimalTraining(goals({ HP: 800, MP: 400 }));

    expect(result).toEqual({ HP: 10, MP: 5 });
    expect(result).not.toHaveProperty('feasible');
    expect(result).not.toHaveProperty('result');
    expect(result).not.toHaveProperty('bounded');
  });

  it('rounds up fractional session counts', () => {
    mockHpOnlyTrainingEffects();

    vi.mocked(window.solver.Solve).mockReturnValue({
      feasible: true,
      result: 12.3,
      HP: 12.3,
    });

    const result = calculateOptimalTraining(goals({ HP: 984 }));

    // 12.3 should round up to 13
    expect(result).toEqual({ HP: 13 });
  });

  it('ignores non-numeric extra fields on the solver result', () => {
    mockHpOnlyTrainingEffects();

    vi.mocked(window.solver.Solve).mockReturnValue({
      feasible: true,
      result: 12.5,
      HP: 13,
      // A boolean (or otherwise non-numeric) extra field the solver might add,
      // besides the fixed feasible/result/bounded metadata.
      isIntegral: true,
    });

    const result = calculateOptimalTraining(goals({ HP: 1000 }));

    expect(result).toEqual({ HP: 13 });
    expect(result).not.toHaveProperty('isIntegral');
  });

  it('returns an error when no solution is feasible', () => {
    mockHpOnlyTrainingEffects();

    vi.mocked(window.solver.Solve).mockReturnValue({
      feasible: false,
    });

    const result = calculateOptimalTraining(goals({ HP: 1000 }));

    expect(result).toEqual({ error: 'No feasible solution found.' });
  });

  it('builds the correct LP model structure', () => {
    const mockTrainingEffects = {
      HP: { HP: 80, MP: 0, OFF: 2, DEF: 0, SPD: 0, BRN: 0 },
      MP: { HP: 0, MP: 80, OFF: 0, DEF: 2, SPD: 0, BRN: 0 },
    };

    vi.mocked(trainingParser.parseTrainingTable).mockReturnValue(mockTrainingEffects);
    vi.mocked(window.solver.Solve).mockReturnValue({ feasible: false });

    calculateOptimalTraining(goals({ HP: 100, MP: 50 }));

    const solverCall = vi.mocked(window.solver.Solve).mock.calls[0][0];

    expect(solverCall.optimize).toBe('sessions');
    expect(solverCall.opType).toBe('min');
    expect(solverCall.constraints).toEqual({
      HP: { min: 100 },
      MP: { min: 50 },
      OFF: { min: 0 },
      DEF: { min: 0 },
      SPD: { min: 0 },
      BRN: { min: 0 },
    });
    expect(solverCall.variables.HP).toEqual({
      sessions: 1,
      HP: 80,
      MP: 0,
      OFF: 2,
      DEF: 0,
      SPD: 0,
      BRN: 0,
    });
  });
});
