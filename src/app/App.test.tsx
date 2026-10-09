import { render } from 'ink-testing-library';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('greets the visitor', () => {
    const { lastFrame } = render(<App />);
    expect(lastFrame()).toContain('Hello from Ink');
  });

  it('shows the terminal size', () => {
    const { lastFrame } = render(<App />);
    expect(lastFrame()).toMatch(/\d+ × \d+/);
  });
});
