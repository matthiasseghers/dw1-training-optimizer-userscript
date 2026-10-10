import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { log, parseNumber, debounce, waitForElement } from '../src/utils';

describe('log', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('logs a message with the DW1 Training Optimizer prefix', () => {
    log('Test message');

    expect(consoleLogSpy).toHaveBeenCalledWith('[DW1 Training Optimizer] Test message');
  });

  it('logs multiple messages independently', () => {
    log('First message');
    log('Second message');

    expect(consoleLogSpy).toHaveBeenCalledTimes(2);
    expect(consoleLogSpy).toHaveBeenNthCalledWith(1, '[DW1 Training Optimizer] First message');
    expect(consoleLogSpy).toHaveBeenNthCalledWith(2, '[DW1 Training Optimizer] Second message');
  });
});

describe('parseNumber', () => {
  it('parses valid integer strings', () => {
    expect(parseNumber('123')).toBe(123);
    expect(parseNumber('0')).toBe(0);
    expect(parseNumber('999')).toBe(999);
  });

  it('handles strings with whitespace', () => {
    expect(parseNumber('  123  ')).toBe(123);
    expect(parseNumber('\n456\n')).toBe(456);
  });

  it('returns 0 for invalid inputs', () => {
    expect(parseNumber('')).toBe(0);
    expect(parseNumber('abc')).toBe(0);
    expect(parseNumber('12.34')).toBe(12); // parseInt truncates decimals
  });

  it('handles negative numbers', () => {
    expect(parseNumber('-50')).toBe(-50);
  });
});

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('delays function execution', () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 300);

    debouncedFn();
    expect(mockFn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('only calls the function once for multiple rapid calls', () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 300);

    debouncedFn();
    debouncedFn();
    debouncedFn();

    vi.advanceTimersByTime(300);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('resets the timer on subsequent calls', () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 300);

    debouncedFn();
    vi.advanceTimersByTime(200);

    debouncedFn(); // This resets the timer
    vi.advanceTimersByTime(200);
    expect(mockFn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(mockFn).toHaveBeenCalledTimes(1);
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

    vi.advanceTimersByTime(1100);
    vi.advanceTimersByTime(0);

    await expect(promise).rejects.toThrow(
      'waitForElement: element "#missing" not found within 1000ms'
    );
  });
});
