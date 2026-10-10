import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../src/utils', () => ({
  log: vi.fn(),
}));
vi.mock('../src/ui-renderer', () => ({
  createCustomTable: vi.fn(),
}));
vi.mock('../src/event-handlers', () => ({
  attachEventListeners: vi.fn(),
}));
vi.mock('../src/observers', () => ({
  monitorTable: vi.fn(),
}));

describe('main', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('initializes the table, attaches listeners, and starts monitoring', async () => {
    const { log } = await import('../src/utils');
    const { createCustomTable } = await import('../src/ui-renderer');
    const { attachEventListeners } = await import('../src/event-handlers');
    const { monitorTable } = await import('../src/observers');

    await import('../src/index');

    expect(createCustomTable).toHaveBeenCalled();
    expect(attachEventListeners).toHaveBeenCalled();
    expect(monitorTable).toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith('Training Optimizer initializing...');
    expect(log).toHaveBeenCalledWith('Training Optimizer initialized successfully!');
  });
});
