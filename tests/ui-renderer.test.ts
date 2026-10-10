import { describe, it, expect, beforeEach } from 'vitest';
import {
  createCustomTable,
  updateResults,
  toggleLoading,
  toggleRecalcIndicator,
} from '../src/ui-renderer';
import { ELEMENT_IDS } from '../src/constants';

describe('ui-renderer', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('createCustomTable', () => {
    it('creates the table with the correct structure', () => {
      const container = createCustomTable();

      expect(container.id).toBe('optimizerTableContainer');

      const title = container.querySelector('h2');
      expect(title?.textContent).toBe('Training Optimizer');

      const headers = container.querySelectorAll('th');
      expect(headers).toHaveLength(4);
      expect(headers[0].textContent).toBe('Training Plan');
      expect(headers[1].textContent).toBe('Current');
      expect(headers[2].textContent).toBe('Goal');
      expect(headers[3].textContent).toBe('# Trainings');
    });

    it('creates input fields for all stats', () => {
      const container = createCustomTable();

      const currentInputs = container.querySelectorAll('input[data-type="current"]');
      const goalInputs = container.querySelectorAll('input[data-type="goal"]');

      expect(currentInputs).toHaveLength(6); // HP, MP, OFF, DEF, SPD, BRN
      expect(goalInputs).toHaveLength(6);

      const stats = ['HP', 'MP', 'OFF', 'DEF', 'SPD', 'BRN'];
      currentInputs.forEach((input, i) => {
        expect(input.getAttribute('data-stat')).toBe(stats[i]);
      });
    });

    it('sets the correct max attribute per stat', () => {
      const container = createCustomTable();

      const hpInput = container.querySelector('input[data-type="current"][data-stat="HP"]');
      const offInput = container.querySelector('input[data-type="current"][data-stat="OFF"]');

      expect(hpInput?.getAttribute('max')).toBe('9999');
      expect(offInput?.getAttribute('max')).toBe('999');
    });

    it('creates a calculate button in the table footer', () => {
      const container = createCustomTable();

      const button = container.querySelector(`#${ELEMENT_IDS.CALCULATE_BUTTON}`);
      expect(button).not.toBeNull();
      expect(button?.tagName).toBe('BUTTON');
      expect(button?.textContent?.trim()).toBe('Calculate');

      const tfoot = container.querySelector('tfoot');
      expect(tfoot).not.toBeNull();
      expect(tfoot?.contains(button!)).toBe(true);
    });

    it('creates a message row for warnings and errors', () => {
      const container = createCustomTable();

      const messageRow = container.querySelector(`#${ELEMENT_IDS.MESSAGE_ROW}`);
      expect(messageRow).not.toBeNull();
      expect(messageRow?.tagName).toBe('TR');
      expect(messageRow?.getAttribute('style')).toContain('display: none');
    });

    it('creates the loading overlay', () => {
      createCustomTable();

      const overlay = document.querySelector('#loadingOverlay');
      expect(overlay).not.toBeNull();
      expect(overlay?.querySelector('#loadingImage')).not.toBeNull();
    });

    it('appends the table when the body is otherwise empty', () => {
      // document.body.innerHTML is already cleared by the outer beforeEach.
      const container = createCustomTable();

      expect(document.body.firstChild).toBe(container);
    });

    it('inserts the table before existing body content', () => {
      const existing = document.createElement('p');
      existing.id = 'existing';
      document.body.appendChild(existing);

      const container = createCustomTable();

      expect(document.body.firstChild).toBe(container);
      expect(document.body.contains(existing)).toBe(true);
    });
  });

  describe('updateResults', () => {
    beforeEach(() => {
      createCustomTable();
    });

    it('updates result cells with training counts', () => {
      updateResults({ HP: 13, MP: 5, OFF: 2 });

      const hpCell = document.querySelector('td[data-type="result"][data-stat="HP"]');
      const mpCell = document.querySelector('td[data-type="result"][data-stat="MP"]');
      const offCell = document.querySelector('td[data-type="result"][data-stat="OFF"]');
      const defCell = document.querySelector('td[data-type="result"][data-stat="DEF"]');

      expect(hpCell?.textContent).toBe('13');
      expect(mpCell?.textContent).toBe('5');
      expect(offCell?.textContent).toBe('2');
      expect(defCell?.textContent).toBe('-'); // No DEF training needed
    });

    it('shows the error message in the table footer with red styling', () => {
      updateResults({ error: 'No feasible solution found.' });

      const messageRow = document.querySelector(`#${ELEMENT_IDS.MESSAGE_ROW}`);
      expect(messageRow?.getAttribute('style')).toContain('display: table-row');

      const cell = messageRow?.querySelector('td');
      expect((cell as HTMLElement)?.style.backgroundColor).toBe('#ffebee');
      expect((cell as HTMLElement)?.style.color).toBe('#c62828');

      const errorText = messageRow?.querySelector('span')?.textContent;
      expect(errorText).toContain('No feasible solution found');
      expect(errorText).toContain('⚠️');
    });

    it('sets N/A in result cells when an error occurs', () => {
      updateResults({ error: 'No feasible solution found.' });

      const resultCells = document.querySelectorAll('td[data-type="result"]');
      resultCells.forEach((cell) => {
        expect(cell.textContent).toBe('N/A');
      });
    });

    it('hides the message row when results are successful', () => {
      updateResults({ error: 'Test error' });
      updateResults({ HP: 10 });

      const messageRow = document.querySelector(`#${ELEMENT_IDS.MESSAGE_ROW}`);
      expect(messageRow?.getAttribute('style')).toContain('display: none');
    });
  });

  describe('toggleLoading', () => {
    beforeEach(() => {
      createCustomTable();
    });

    it('shows the loading overlay', () => {
      toggleLoading(true);

      const overlay = document.querySelector('#loadingOverlay') as HTMLElement;
      expect(overlay?.style.display).toBe('flex');
    });

    it('hides the loading overlay', () => {
      toggleLoading(false);

      const overlay = document.querySelector('#loadingOverlay') as HTMLElement;
      expect(overlay?.style.display).toBe('none');
    });
  });

  describe('toggleRecalcIndicator', () => {
    beforeEach(() => {
      createCustomTable();
    });

    it('shows the recalculation warning with orange styling', () => {
      toggleRecalcIndicator(true);

      const messageRow = document.querySelector(`#${ELEMENT_IDS.MESSAGE_ROW}`) as HTMLElement;
      expect(messageRow?.style.display).toBe('table-row');

      const cell = messageRow?.querySelector('td') as HTMLElement;
      expect(cell?.style.backgroundColor).toBe('#fff3e0');
      expect(cell?.style.color).toBe('#e65100');

      const text = messageRow?.querySelector('span')?.textContent;
      expect(text).toContain('Recalculation needed');
    });

    it('hides the recalculation indicator', () => {
      toggleRecalcIndicator(false);

      const messageRow = document.querySelector(`#${ELEMENT_IDS.MESSAGE_ROW}`) as HTMLElement;
      expect(messageRow?.style.display).toBe('none');
    });
  });
});
