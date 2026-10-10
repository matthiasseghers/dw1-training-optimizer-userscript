import { describe, it, expect, beforeEach, vi } from 'vitest';
import { monitorTable } from '../src/observers';
import * as eventHandlers from '../src/event-handlers';

vi.mock('../src/event-handlers');

describe('monitorTable', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('does nothing when no training table is present', () => {
    monitorTable();
    expect(eventHandlers.handleInputChangeCore).not.toHaveBeenCalled();
  });

  it('re-runs the optimization when the training table mutates', async () => {
    document.body.innerHTML = `
      <table>
        <tr><td>training</td><td>HP-Gain</td></tr>
        <tr><td>HP-Training</td><td>80</td></tr>
      </table>
    `;

    monitorTable();
    expect(eventHandlers.handleInputChangeCore).not.toHaveBeenCalled();

    const table = document.querySelector('table')!;
    const row = document.createElement('tr');
    row.innerHTML = '<td>MP-Training</td><td>80</td>';
    table.appendChild(row);

    // MutationObserver callbacks run as a microtask.
    await Promise.resolve();
    await Promise.resolve();

    expect(eventHandlers.handleInputChangeCore).toHaveBeenCalled();
  });
});
