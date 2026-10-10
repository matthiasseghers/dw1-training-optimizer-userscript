import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the utils module
vi.mock('../src/utils', () => ({
  log: vi.fn(),
}));

describe('main', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear the module cache to ensure fresh imports in each test
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('should initialize and call log when imported', async () => {
    const { log } = await import('../src/utils');

    // Dynamically import to ensure it runs with mocked utils
    await import('../src/index');

    expect(log).toHaveBeenCalledWith('Hello from TypeScript Userscript!');
  });
});
