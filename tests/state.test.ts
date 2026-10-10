import { describe, it, expect, beforeEach } from 'vitest';
import {
  getCurrentStats,
  setCurrentStats,
  getGoalStats,
  setGoalStats,
  getStatDifference,
  setResults,
  getResults,
} from '../src/state';

describe('state', () => {
  beforeEach(() => {
    // Reset state before each test
    setCurrentStats({ HP: 0, MP: 0, OFF: 0, DEF: 0, SPD: 0, BRN: 0 });
    setGoalStats({ HP: 0, MP: 0, OFF: 0, DEF: 0, SPD: 0, BRN: 0 });
    setResults(null);
  });

  describe('getCurrentStats / setCurrentStats', () => {
    it('gets and sets current stats', () => {
      const stats = { HP: 100, MP: 50, OFF: 20, DEF: 15, SPD: 10, BRN: 5 };
      setCurrentStats(stats);
      expect(getCurrentStats()).toEqual(stats);
    });

    it('allows partial updates', () => {
      setCurrentStats({ HP: 100 });
      setCurrentStats({ MP: 50 });

      const stats = getCurrentStats();
      expect(stats.HP).toBe(100);
      expect(stats.MP).toBe(50);
      expect(stats.OFF).toBe(0);
    });

    it('returns a copy, not a live reference', () => {
      const stats = getCurrentStats();
      stats.HP = 999;
      expect(getCurrentStats().HP).toBe(0);
    });
  });

  describe('getGoalStats / setGoalStats', () => {
    it('gets and sets goal stats', () => {
      const stats = { HP: 1000, MP: 500, OFF: 200, DEF: 150, SPD: 100, BRN: 50 };
      setGoalStats(stats);
      expect(getGoalStats()).toEqual(stats);
    });
  });

  describe('getStatDifference', () => {
    it('returns positive differences only', () => {
      setCurrentStats({ HP: 100, MP: 50, OFF: 20, DEF: 15, SPD: 10, BRN: 5 });
      setGoalStats({ HP: 200, MP: 100, OFF: 30, DEF: 25, SPD: 20, BRN: 10 });

      const diff = getStatDifference();
      expect(diff).toEqual({
        HP: 100,
        MP: 50,
        OFF: 10,
        DEF: 10,
        SPD: 10,
        BRN: 5,
      });
    });

    it('returns 0 for stats where goal <= current', () => {
      setCurrentStats({ HP: 100, MP: 50, OFF: 20, DEF: 15, SPD: 10, BRN: 5 });
      setGoalStats({ HP: 50, MP: 50, OFF: 30, DEF: 10, SPD: 20, BRN: 0 });

      const diff = getStatDifference();
      expect(diff.HP).toBe(0); // goal < current
      expect(diff.MP).toBe(0); // goal = current
      expect(diff.OFF).toBe(10); // goal > current
      expect(diff.DEF).toBe(0); // goal < current
      expect(diff.SPD).toBe(10); // goal > current
      expect(diff.BRN).toBe(0); // goal < current
    });

    it('handles all zeros', () => {
      const diff = getStatDifference();
      expect(diff).toEqual({
        HP: 0,
        MP: 0,
        OFF: 0,
        DEF: 0,
        SPD: 0,
        BRN: 0,
      });
    });
  });

  describe('getResults / setResults', () => {
    it('gets and sets optimization results', () => {
      const results = { HP: 13, MP: 0, OFF: 0, DEF: 0, SPD: 0, BRN: 0 };
      setResults(results);
      expect(getResults()).toEqual(results);
    });

    it('handles null results', () => {
      setResults(null);
      expect(getResults()).toBeNull();
    });

    it('handles error results', () => {
      const errorResult = { error: 'No feasible solution found.' };
      setResults(errorResult);
      expect(getResults()).toEqual(errorResult);
    });
  });
});
