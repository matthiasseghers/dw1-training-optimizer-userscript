import { describe, it, expect, afterEach } from 'vitest';
import { getElement, getAllElements } from '../src/dom-utils';

describe('getElement', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('returns the matching element', () => {
    document.body.innerHTML = '<div id="target">Hi</div>';

    const el = getElement('#target');
    expect(el).not.toBeNull();
    expect(el?.textContent).toBe('Hi');
  });

  it('returns null when nothing matches', () => {
    expect(getElement('#missing')).toBeNull();
  });
});

describe('getAllElements', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('returns every matching element', () => {
    document.body.innerHTML = '<p class="x"></p><p class="x"></p><p></p>';

    const els = getAllElements('.x');
    expect(els).toHaveLength(2);
  });

  it('returns an empty NodeList when nothing matches', () => {
    expect(getAllElements('.missing')).toHaveLength(0);
  });
});
