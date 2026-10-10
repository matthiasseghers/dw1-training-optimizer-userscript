import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { handleInputChangeCore, attachEventListeners } from '../src/event-handlers';
import { createCustomTable, toggleRecalcIndicator } from '../src/ui-renderer';
import { ELEMENT_IDS } from '../src/constants';
import * as optimizer from '../src/optimizer';
import * as trainingParser from '../src/training-parser';

vi.mock('../src/optimizer');
vi.mock('../src/training-parser');

describe('event-handlers', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
    vi.useFakeTimers();

    vi.mocked(trainingParser.parseTrainingTable).mockReturnValue({
      HP: { HP: 80, MP: 0, OFF: 2, DEF: 0, SPD: 0, BRN: 0 },
      MP: { HP: 0, MP: 80, OFF: 0, DEF: 2, SPD: 0, BRN: 0 },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('attachEventListeners', () => {
    it('attaches a click listener to the calculate button', () => {
      createCustomTable();
      attachEventListeners();

      const button = document.querySelector(
        `#${ELEMENT_IDS.CALCULATE_BUTTON}`
      ) as HTMLButtonElement;
      expect(button).not.toBeNull();

      vi.mocked(optimizer.calculateOptimalTraining).mockReturnValue({ HP: 13 });

      button.click();
      vi.advanceTimersByTime(300);

      expect(optimizer.calculateOptimalTraining).toHaveBeenCalled();
    });

    it('attaches input listeners that show the recalc indicator', () => {
      createCustomTable();
      attachEventListeners();

      const input = document.querySelector(
        'input[data-type="current"][data-stat="HP"]'
      ) as HTMLInputElement;
      const messageRow = document.querySelector(`#${ELEMENT_IDS.MESSAGE_ROW}`) as HTMLElement;

      expect(messageRow?.style.display).toBe('none');

      input.value = '100';
      input.dispatchEvent(new Event('input'));

      expect(messageRow?.style.display).toBe('table-row');
    });

    it('clamps input values to the per-stat max', () => {
      createCustomTable();
      attachEventListeners();

      const hpInput = document.querySelector(
        'input[data-type="current"][data-stat="HP"]'
      ) as HTMLInputElement;
      const offInput = document.querySelector(
        'input[data-type="current"][data-stat="OFF"]'
      ) as HTMLInputElement;

      hpInput.value = '20000';
      hpInput.dispatchEvent(new Event('input'));
      expect(hpInput.value).toBe('9999');

      offInput.value = '5000';
      offInput.dispatchEvent(new Event('input'));
      expect(offInput.value).toBe('999');
    });

    it('attaches listeners to all current and goal inputs', () => {
      createCustomTable();
      attachEventListeners();

      const inputs = document.querySelectorAll(
        'input[data-type="current"], input[data-type="goal"]'
      );
      expect(inputs.length).toBe(12); // 6 stats x 2 types (current + goal)

      const messageRow = document.querySelector(`#${ELEMENT_IDS.MESSAGE_ROW}`) as HTMLElement;

      const goalInput = document.querySelector(
        'input[data-type="goal"][data-stat="MP"]'
      ) as HTMLInputElement;
      goalInput.value = '500';
      goalInput.dispatchEvent(new Event('input'));

      expect(messageRow?.style.display).toBe('table-row');
    });

    it('logs an error when the calculate button is missing from the page', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // No createCustomTable() call, so the button never exists.
      attachEventListeners();

      expect(consoleErrorSpy).toHaveBeenCalledWith('Calculate button not found');
      consoleErrorSpy.mockRestore();
    });
  });

  describe('handleInputChangeCore', () => {
    it('reads input values and calculates the optimization', () => {
      createCustomTable();

      const hpCurrent = document.querySelector(
        'input[data-type="current"][data-stat="HP"]'
      ) as HTMLInputElement;
      const hpGoal = document.querySelector(
        'input[data-type="goal"][data-stat="HP"]'
      ) as HTMLInputElement;
      hpCurrent.value = '0';
      hpGoal.value = '1000';

      vi.mocked(optimizer.calculateOptimalTraining).mockReturnValue({ HP: 13 });

      handleInputChangeCore();

      vi.advanceTimersByTime(100);
      const loadingOverlay = document.querySelector('#loadingOverlay') as HTMLElement;
      expect(loadingOverlay?.style.display).toBe('flex');

      vi.advanceTimersByTime(300);

      expect(optimizer.calculateOptimalTraining).toHaveBeenCalledWith(
        expect.objectContaining({
          HP: 1000,
        })
      );

      const resultCell = document.querySelector('td[data-type="result"][data-stat="HP"]');
      expect(resultCell?.textContent).toBe('13');

      expect(loadingOverlay?.style.display).toBe('none');
    });

    it('hides the recalc indicator as soon as calculation starts', () => {
      createCustomTable();

      toggleRecalcIndicator(true);
      const messageRow = document.querySelector(`#${ELEMENT_IDS.MESSAGE_ROW}`) as HTMLElement;
      expect(messageRow?.style.display).toBe('table-row');

      vi.mocked(optimizer.calculateOptimalTraining).mockReturnValue({ HP: 10 });

      handleInputChangeCore();

      expect(messageRow?.style.display).toBe('none');
    });

    it.each([
      [
        'an optimizer error',
        { error: 'No feasible solution found.' },
        'No feasible solution found',
      ],
      ['a null optimizer result', null, 'No solution found'],
    ])('handles %s gracefully', (_label, mockReturn, expectedMessage) => {
      createCustomTable();

      const hpGoal = document.querySelector(
        'input[data-type="goal"][data-stat="HP"]'
      ) as HTMLInputElement;
      hpGoal.value = '1000';

      vi.mocked(optimizer.calculateOptimalTraining).mockReturnValue(mockReturn);

      handleInputChangeCore();
      vi.advanceTimersByTime(300);

      const messageRow = document.querySelector(`#${ELEMENT_IDS.MESSAGE_ROW}`);
      expect(messageRow?.getAttribute('style')).toContain('display: table-row');

      const errorText = messageRow?.querySelector('span')?.textContent;
      expect(errorText).toContain(expectedMessage);
    });

    it('calculates stat differences correctly', () => {
      createCustomTable();

      const hpCurrent = document.querySelector(
        'input[data-type="current"][data-stat="HP"]'
      ) as HTMLInputElement;
      const hpGoal = document.querySelector(
        'input[data-type="goal"][data-stat="HP"]'
      ) as HTMLInputElement;
      const mpCurrent = document.querySelector(
        'input[data-type="current"][data-stat="MP"]'
      ) as HTMLInputElement;
      const mpGoal = document.querySelector(
        'input[data-type="goal"][data-stat="MP"]'
      ) as HTMLInputElement;

      hpCurrent.value = '500';
      hpGoal.value = '1000'; // Need 500 more HP
      mpCurrent.value = '600';
      mpGoal.value = '400'; // Current > goal, should be 0

      vi.mocked(optimizer.calculateOptimalTraining).mockReturnValue({ HP: 7 });

      handleInputChangeCore();
      vi.advanceTimersByTime(300);

      expect(optimizer.calculateOptimalTraining).toHaveBeenCalledWith(
        expect.objectContaining({
          HP: 500,
          MP: 0,
        })
      );
    });
  });

  describe('button click integration', () => {
    it('completes the flow: input change -> show indicator -> click button -> calculate -> hide indicator', () => {
      createCustomTable();
      attachEventListeners();

      const input = document.querySelector(
        'input[data-type="current"][data-stat="HP"]'
      ) as HTMLInputElement;
      const button = document.querySelector(
        `#${ELEMENT_IDS.CALCULATE_BUTTON}`
      ) as HTMLButtonElement;
      const messageRow = document.querySelector(`#${ELEMENT_IDS.MESSAGE_ROW}`) as HTMLElement;

      input.value = '100';
      input.dispatchEvent(new Event('input'));
      expect(messageRow?.style.display).toBe('table-row');

      vi.mocked(optimizer.calculateOptimalTraining).mockReturnValue({ HP: 10 });
      button.click();
      expect(messageRow?.style.display).toBe('none');

      vi.advanceTimersByTime(300);
      expect(optimizer.calculateOptimalTraining).toHaveBeenCalled();
    });
  });
});
