import { describe, expect, it } from 'vitest';
import { profile } from './profile';

const everyString = (value: unknown): string[] =>
  typeof value === 'string'
    ? [value]
    : value && typeof value === 'object'
      ? Object.values(value).flatMap(everyString)
      : [];

describe('profile', () => {
  it('does not publish a phone number or an email address', () => {
    const text = everyString(profile).join('\n');
    expect(text).not.toMatch(/@[\w-]+\.\w+/);
    expect(text).not.toMatch(/\+\d[\d ()-]{7,}/);
    expect(text).not.toMatch(/\b\d{4}[ -]\d{4}\b/);
  });

  it('links over https', () => {
    expect(profile.links.length).toBeGreaterThan(0);
    for (const link of profile.links) {
      expect(link.url).toMatch(/^https:\/\//);
    }
  });

  it('has no placeholder links left', () => {
    for (const link of profile.links) {
      expect(link.url).not.toMatch(/your-|example\.com|placeholder/i);
    }
  });

  it('has at least one bullet for every job and items for every skill group', () => {
    profile.experience.forEach((job) => expect(job.bullets.length).toBeGreaterThan(0));
    profile.skills.forEach((group) => expect(group.items.length).toBeGreaterThan(0));
  });

  it('starts the career on a valid date', () => {
    expect(Number.isNaN(Date.parse(profile.careerStart))).toBe(false);
  });
});
