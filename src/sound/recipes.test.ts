import { describe, expect, it } from 'vitest';
import { RECIPES } from './recipes';

describe('RECIPES', () => {
  const parts = Object.entries(RECIPES).flatMap(([name, list]) => list.map((part) => ({ name, ...part })));

  it('only has audible, finite parts', () => {
    for (const part of parts) {
      expect(part.hz, part.name).toBeGreaterThan(20);
      expect(part.ms, part.name).toBeGreaterThan(0);
      expect(part.gain, part.name).toBeGreaterThan(0);
      expect(part.gain, part.name).toBeLessThan(0.2);
    }
  });

  it('keeps the attack inside the sound', () => {
    for (const part of parts) {
      expect('atk' in part ? part.atk : 0, part.name).toBeLessThanOrEqual(part.ms);
    }
  });

  it('credits Bencho and carries the MIT notice', async () => {
    const { readFile } = await import('node:fs/promises');
    const source = await readFile(new URL('./recipes.ts', import.meta.url), 'utf8');
    expect(source).toContain('https://bencho.dev/sounds');
    expect(source).toContain('Copyright (c) 2026 Lorenzo Cabra');
    expect(source).toContain('Permission is hereby granted, free of charge');
  });
});
