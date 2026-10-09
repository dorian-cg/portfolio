import { Box, Text, useAnimation } from 'ink';
import { hud } from '../hud/palette';
import { BrailleCanvas } from './braille';
import { useAmbientMotion } from './motion';

type Point = readonly [x: number, y: number];

/** Radians per second the D turns about its vertical axis. */
const SPIN = 1.2;

/** Segments in the curve of the D. */
const CURVE_SEGMENTS = 12;

/**
 * The outline of a D: a straight stem on the left at `left`, a flat top and
 * bottom, and a half circle of `radius` on the right, centred on the origin.
 * Points run from the bottom of the stem, up it, then round the curve.
 */
function dOutline(left: number, radius: number): Point[] {
  const curve = Array.from({ length: CURVE_SEGMENTS + 1 }, (_, i): Point => {
    const angle = Math.PI / 2 - (i * Math.PI) / CURVE_SEGMENTS;
    return [Math.cos(angle) * radius, Math.sin(angle) * radius];
  });
  return [[left, -radius], [left, radius], ...curve];
}

/** The corners, where the front and back of the letter are joined. More lines than this clutter a letter this small. */
const JOINTS = [0, 1, 2, 2 + CURVE_SEGMENTS];

/** Letters smaller than this have no room for the hole in the middle of the D. */
const MIN_RADIUS_FOR_HOLE = 7;

/**
 * Draws a letter D as a wireframe slab, turned `seconds * SPIN` radians about
 * its vertical axis: at 0 it faces the viewer, at a quarter turn it is edge on.
 */
export function drawEmblem(canvas: BrailleCanvas, seconds: number): void {
  const cx = (canvas.width - 1) / 2;
  const cy = (canvas.height - 1) / 2;
  const radius = Math.min(canvas.width, canvas.height) * 0.42;
  const stem = radius * 0.55;
  const thickness = radius * 0.34;
  const depth = radius * 0.14;
  // Turn about the middle of the letter, not about the edge of its stem.
  const middle = (radius - stem) / 2;

  const angle = seconds * SPIN;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const camera = radius * 5;

  const project = ([x, y]: Point, z: number): Point => {
    const turnedX = (x - middle) * cos + z * sin;
    const turnedZ = -(x - middle) * sin + z * cos;
    const scale = camera / (camera - turnedZ);
    return [cx + turnedX * scale, cy - y * scale];
  };

  const outlines = [dOutline(-stem, radius)];
  if (radius >= MIN_RADIUS_FOR_HOLE) {
    outlines.push(dOutline(-stem + thickness, radius - thickness));
  }

  for (const outline of outlines) {
    const front = outline.map((point) => project(point, depth));
    const back = outline.map((point) => project(point, -depth));
    for (const face of [front, back]) {
      for (let i = 0; i < face.length; i++) {
        const [x0, y0] = face[i]!;
        const [x1, y1] = face[(i + 1) % face.length]!;
        canvas.line(x0, y0, x1, y1);
      }
    }
    for (const joint of JOINTS) {
      const [x0, y0] = front[joint]!;
      const [x1, y1] = back[joint]!;
      canvas.line(x0, y0, x1, y1);
    }
  }
}

export interface EmblemProps {
  /** Width in terminal cells. */
  columns?: number;
  /** Height in terminal cells. */
  rows?: number;
}

/** The spinning letter D. Holds still, facing the viewer, when motion is reduced. */
export function Emblem({ columns = 15, rows = 7 }: EmblemProps) {
  const animated = useAmbientMotion();
  const { time } = useAnimation({ interval: 80, isActive: animated });

  const canvas = new BrailleCanvas(columns, rows);
  drawEmblem(canvas, animated ? time / 1000 : 0);

  return (
    <Box width={columns} height={rows} flexDirection="column">
      {canvas.render().map((line, row) => (
        <Text key={row} color={hud.line}>
          {line}
        </Text>
      ))}
    </Box>
  );
}
