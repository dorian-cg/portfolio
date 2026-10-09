import { render } from 'ink-testing-library';
import { describe, expect, it } from 'vitest';
import { profile } from '../../content/profile';
import { BrailleCanvas } from './braille';
import { drawGlobe, Globe, project } from './globe';
import { MotionProvider } from './motion';

const { lat, lon } = profile.coordinates;

describe('project', () => {
  it('puts the point facing the viewer near the middle, in front', () => {
    const point = project(lat, lon, lon, 20, 20, 20);
    expect(point.visible).toBe(true);
    expect(point.x).toBeCloseTo(20, 5);
    expect(point.y).toBeGreaterThan(10);
    expect(point.y).toBeLessThan(30);
  });

  it('hides points on the far side', () => {
    expect(project(lat, lon + 180, lon, 20, 20, 20).visible).toBe(false);
  });

  it('moves east to the right', () => {
    const west = project(0, -20, 0, 20, 20, 20);
    const east = project(0, 20, 0, 20, 20, 20);
    expect(east.x).toBeGreaterThan(west.x);
  });

  it('moves north up the screen', () => {
    const south = project(-30, 0, 0, 20, 20, 20);
    const north = project(30, 0, 0, 20, 20, 20);
    expect(north.y).toBeLessThan(south.y);
  });

  it('keeps points on the disc', () => {
    const point = project(40, 30, 0, 20, 20, 20);
    expect(Math.hypot(point.x - 20, point.y - 20)).toBeLessThanOrEqual(20.001);
  });
});

const globeAt = (centerLon: number) => {
  const canvas = new BrailleCanvas(21, 10);
  drawGlobe(canvas, centerLon);
  return canvas.render().join('\n');
};

describe('drawGlobe', () => {
  it('draws the outline and land', () => {
    expect(globeAt(lon)).toMatch(/[⠁-⣿]/);
  });

  it('shows different land as it turns', () => {
    expect(globeAt(lon)).not.toBe(globeAt(lon + 120));
  });

  it('comes back after a full turn', () => {
    expect(globeAt(lon)).toBe(globeAt(lon + 360));
  });

  it('shows more land facing the Americas than facing the Pacific', () => {
    const dots = (text: string) => [...text].filter((char) => char !== '\n' && char !== '⠀').length;
    expect(dots(globeAt(-100))).toBeGreaterThan(dots(globeAt(-170)));
  });
});

describe('Globe', () => {
  it('renders at the requested size', () => {
    const { lastFrame } = render(<Globe columns={21} rows={10} />);
    expect(lastFrame()!.split('\n')).toHaveLength(10);
  });

  it('marks home with a pin when it faces the viewer', () => {
    const { lastFrame } = render(
      <MotionProvider reduced>
        <Globe />
      </MotionProvider>,
    );
    expect(lastFrame()).toMatch(/[◉○]/);
  });

  it('holds still when motion is reduced', async () => {
    const { lastFrame } = render(
      <MotionProvider reduced>
        <Globe />
      </MotionProvider>,
    );
    const first = lastFrame();
    await new Promise((resolve) => setTimeout(resolve, 350));
    expect(lastFrame()).toBe(first);
  });

  it('turns when motion is allowed', async () => {
    const { lastFrame } = render(<Globe />);
    const first = lastFrame();
    await new Promise((resolve) => setTimeout(resolve, 1500));
    expect(lastFrame()).not.toBe(first);
  });
});
