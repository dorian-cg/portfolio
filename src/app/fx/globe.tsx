import { Box, Text, useAnimation } from 'ink';
import { profile } from '../../content/profile';
import { hud } from '../hud/palette';
import { BrailleCanvas } from './braille';
import { useAmbientMotion } from './motion';
import { isLand } from './world-map';

const RAD = Math.PI / 180;

/** Degrees of latitude the viewer is raised above the equator. */
const TILT = 18;

interface Projected {
  /** Dot position on the canvas. */
  x: number;
  y: number;
  /** Whether the point is on the side of the globe facing the viewer. */
  visible: boolean;
}

/** Where `lat`/`lon` appear on a globe of `radius` dots centred at (cx, cy), turned so `centerLon` faces the viewer. */
export function project(
  lat: number,
  lon: number,
  centerLon: number,
  radius: number,
  cx: number,
  cy: number,
): Projected {
  const phi = lat * RAD;
  const lambda = (lon - centerLon) * RAD;
  const tilt = TILT * RAD;
  const x = Math.cos(phi) * Math.sin(lambda);
  const y0 = Math.sin(phi);
  const z0 = Math.cos(phi) * Math.cos(lambda);
  const y = y0 * Math.cos(tilt) - z0 * Math.sin(tilt);
  const z = y0 * Math.sin(tilt) + z0 * Math.cos(tilt);
  return { x: cx + x * radius, y: cy - y * radius, visible: z > 0 };
}

/** The point of the globe that `x`/`y` (dots) show, as latitude and longitude, or `null` outside the disc. */
function unproject(x: number, y: number, centerLon: number, radius: number, cx: number, cy: number) {
  const nx = (x - cx) / radius;
  const ny = (cy - y) / radius;
  const r2 = nx * nx + ny * ny;
  if (r2 > 1) {
    return null;
  }
  const nz = Math.sqrt(1 - r2);
  const tilt = TILT * RAD;
  const y0 = ny * Math.cos(tilt) + nz * Math.sin(tilt);
  const z0 = -ny * Math.sin(tilt) + nz * Math.cos(tilt);
  return { lat: Math.asin(y0) / RAD, lon: centerLon + Math.atan2(nx, z0) / RAD };
}

const geometry = (canvas: BrailleCanvas) => ({
  cx: (canvas.width - 1) / 2,
  cy: (canvas.height - 1) / 2,
  radius: Math.min(canvas.width, canvas.height) / 2 - 0.5,
});

/** Draws the globe: an outline and the land, turned so `centerLon` faces the viewer. */
export function drawGlobe(canvas: BrailleCanvas, centerLon: number): void {
  const { cx, cy, radius } = geometry(canvas);
  canvas.circle(cx, cy, radius);
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const point = unproject(x, y, centerLon, radius - 1, cx, cy);
      if (point && isLand(point.lat, point.lon)) {
        canvas.set(x, y);
      }
    }
  }
}

export interface GlobeProps {
  columns?: number;
  rows?: number;
}

const DEGREES_PER_SECOND = 10;

/** A turning globe with a pin on the portfolio's home. Holds still, facing home, when motion is reduced. */
export function Globe({ columns = 21, rows = 10 }: GlobeProps) {
  const animated = useAmbientMotion();
  const { time } = useAnimation({ interval: 150, isActive: animated });

  const home = profile.coordinates;
  const centerLon = home.lon + (animated ? (time / 1000) * DEGREES_PER_SECOND : 0);

  const canvas = new BrailleCanvas(columns, rows);
  drawGlobe(canvas, centerLon);

  const { cx, cy, radius } = geometry(canvas);
  const pin = project(home.lat, home.lon, centerLon, radius - 1, cx, cy);
  const pulse = Math.floor(time / 500) % 2 === 0;

  return (
    <Box width={columns} height={rows}>
      <Box flexDirection="column">
        {canvas.render().map((line, row) => (
          <Text key={row} color={hud.line}>
            {line}
          </Text>
        ))}
      </Box>
      {pin.visible && (
        <Box position="absolute" marginLeft={Math.floor(pin.x / 2)} marginTop={Math.floor(pin.y / 4)}>
          <Text bold color={hud.accent}>
            {pulse ? '◉' : '○'}
          </Text>
        </Box>
      )}
    </Box>
  );
}
