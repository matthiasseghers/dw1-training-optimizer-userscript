import { describe, it, expect, beforeEach } from 'vitest';
import { findTrainingTable, parseTrainingTable } from '../src/training-parser';

describe('findTrainingTable', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('finds the table with "training" as first cell', () => {
    document.body.innerHTML = `
      <table id="other-table">
        <tr><td>Something</td></tr>
      </table>
      <table id="training-table">
        <tr><td>training</td><td>HP-Gain</td></tr>
        <tr><td>HP-Training</td><td>80</td></tr>
      </table>
    `;

    const table = findTrainingTable();
    expect(table).not.toBeNull();
    expect(table?.id).toBe('training-table');
  });

  it('returns null if no training table exists', () => {
    document.body.innerHTML = `
      <table>
        <tr><td>Something</td></tr>
      </table>
    `;

    const table = findTrainingTable();
    expect(table).toBeNull();
  });

  it('is case-insensitive', () => {
    document.body.innerHTML = `
      <table>
        <tr><td>TRAINING</td></tr>
      </table>
    `;

    const table = findTrainingTable();
    expect(table).not.toBeNull();
  });

  it('handles whitespace in cell text', () => {
    document.body.innerHTML = `
      <table>
        <tr><td>  training  </td></tr>
      </table>
    `;

    const table = findTrainingTable();
    expect(table).not.toBeNull();
  });
});

describe('parseTrainingTable', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('returns null if table not found', () => {
    const result = parseTrainingTable();
    expect(result).toBeNull();
  });

  it('parses training effects correctly', () => {
    document.body.innerHTML = `
      <table>
        <tr>
          <td>training</td>
          <td>HP-Gain</td>
          <td>MP-Gain</td>
          <td>OFF-Gain</td>
          <td>DEF-Gain</td>
          <td>SPD-Gain</td>
          <td>BRN-Gain</td>
        </tr>
        <tr>
          <td>HP-Training</td>
          <td>80</td>
          <td>0</td>
          <td>2</td>
          <td>0</td>
          <td>0</td>
          <td>0</td>
        </tr>
        <tr>
          <td>MP-Training</td>
          <td>0</td>
          <td>80</td>
          <td>0</td>
          <td>2</td>
          <td>0</td>
          <td>0</td>
        </tr>
      </table>
    `;

    const effects = parseTrainingTable();

    expect(effects).not.toBeNull();
    expect(effects?.HP).toEqual({
      HP: 80,
      MP: 0,
      OFF: 2,
      DEF: 0,
      SPD: 0,
      BRN: 0,
    });
    expect(effects?.MP).toEqual({
      HP: 0,
      MP: 80,
      OFF: 0,
      DEF: 2,
      SPD: 0,
      BRN: 0,
    });
  });

  it('removes the "-Training" suffix from training names', () => {
    document.body.innerHTML = `
      <table>
        <tr><td>training</td><td>HP-Gain</td><td>MP-Gain</td><td>OFF-Gain</td><td>DEF-Gain</td><td>SPD-Gain</td><td>BRN-Gain</td></tr>
        <tr><td>HP-Training</td><td>80</td><td>0</td><td>2</td><td>0</td><td>0</td><td>0</td></tr>
      </table>
    `;

    const effects = parseTrainingTable();

    expect(effects).toHaveProperty('HP');
    expect(effects).not.toHaveProperty('HP-Training');
  });

  it('skips the header row (first row)', () => {
    document.body.innerHTML = `
      <table>
        <tr><td>training</td><td>HP-Gain</td><td>MP-Gain</td><td>OFF-Gain</td><td>DEF-Gain</td><td>SPD-Gain</td><td>BRN-Gain</td></tr>
        <tr><td>HP-Training</td><td>80</td><td>0</td><td>2</td><td>0</td><td>0</td><td>0</td></tr>
      </table>
    `;

    const effects = parseTrainingTable();

    expect(effects).not.toHaveProperty('training');
    expect(effects).toHaveProperty('HP');
  });

  it('falls back to an empty training name when the first cell has no text', () => {
    document.body.innerHTML = `
      <table>
        <tr><td>training</td><td>HP-Gain</td><td>MP-Gain</td><td>OFF-Gain</td><td>DEF-Gain</td><td>SPD-Gain</td><td>BRN-Gain</td></tr>
        <tr><td></td><td>80</td><td>0</td><td>2</td><td>0</td><td>0</td><td>0</td></tr>
      </table>
    `;

    const effects = parseTrainingTable();

    expect(effects).toHaveProperty('');
    expect(effects?.['']).toEqual({ HP: 80, MP: 0, OFF: 2, DEF: 0, SPD: 0, BRN: 0 });
  });

  it('handles invalid/missing cell values', () => {
    document.body.innerHTML = `
      <table>
        <tr><td>training</td><td>HP-Gain</td><td>MP-Gain</td><td>OFF-Gain</td><td>DEF-Gain</td><td>SPD-Gain</td><td>BRN-Gain</td></tr>
        <tr><td>HP-Training</td><td>abc</td><td></td><td>2</td><td>0</td><td>0</td><td>0</td></tr>
      </table>
    `;

    const effects = parseTrainingTable();

    // parseNumber returns 0 for invalid values
    expect(effects?.HP.HP).toBe(0);
    expect(effects?.HP.MP).toBe(0);
    expect(effects?.HP.OFF).toBe(2);
  });
});
