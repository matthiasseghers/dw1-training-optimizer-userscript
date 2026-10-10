import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { log, waitForElement } from '../src/utils';

describe('utils', () => {
  describe('log', () => {
    let consoleLogSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
    });

    it('should log a message with the UserScript prefix', () => {
      log('Test message');

      expect(consoleLogSpy).toHaveBeenCalledWith('[UserScript] Test message');
    });

    it('should log multiple messages independently', () => {
      log('First message');
      log('Second message');

      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
      expect(consoleLogSpy).toHaveBeenNthCalledWith(1, '[UserScript] First message');
      expect(consoleLogSpy).toHaveBeenNthCalledWith(2, '[UserScript] Second message');
    });

    it('should handle empty strings', () => {
      log('');

      expect(consoleLogSpy).toHaveBeenCalledWith('[UserScript] ');
    });
  });

  describe('waitForElement', () => {
    afterEach(() => {
      document.body.innerHTML = '';
      vi.useRealTimers();
    });

    it('resolves immediately when element already exists', async () => {
      document.body.innerHTML = '<div id="existing"></div>';

      const el = await waitForElement('#existing');
      expect(el).toBe(document.querySelector('#existing'));
    });

    it('resolves when element is added after a short delay', async () => {
      const promise = waitForElement('#delayed');

      // Simulate element appearing after ~50ms
      setTimeout(() => {
        const div = document.createElement('div');
        div.id = 'delayed';
        document.body.appendChild(div);
      }, 50);

      const el = await promise;
      expect(el.id).toBe('delayed');
    });

    it('rejects after timeout when element never appears', async () => {
      vi.useFakeTimers();

      const promise = waitForElement('#missing', 1000);

      // Advance time past the timeout
      vi.advanceTimersByTime(1100);

      // Flush any pending rAF callbacks
      vi.advanceTimersByTime(0);

      await expect(promise).rejects.toThrow(
        'waitForElement: element "#missing" not found within 1000ms'
      );
    });
  });
});
