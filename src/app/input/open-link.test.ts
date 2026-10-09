// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { openLink } from './open-link';

afterEach(() => vi.restoreAllMocks());

describe('openLink', () => {
  it('opens the URL in a new tab that cannot reach back to this page', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    openLink('https://example.com/me');
    expect(open).toHaveBeenCalledWith('https://example.com/me', '_blank', 'noopener,noreferrer');
  });
});
