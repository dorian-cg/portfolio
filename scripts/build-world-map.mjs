// Rasterises Natural Earth 110m land (public domain, via the `world-atlas`
// package) into the bitmap in src/app/fx/world-map.ts: 144 × 72 cells of 2.5°,
// one bit per cell, one hex string per row (north to south).
//
// It needs packages the app does not depend on, so run it from a scratch
// directory that has them installed:
//   npm i world-atlas@2 topojson-client@3 d3-geo@3
//   node build-world-map.mjs > world-map.generated.txt
import { geoContains } from 'd3-geo';
import { createRequire } from 'node:module';
import { feature } from 'topojson-client';

const require = createRequire(import.meta.url);
const topology = require('world-atlas/land-110m.json');
const land = feature(topology, topology.objects.land);

const WIDTH = 144;
const HEIGHT = 72;
const rows = [];
for (let y = 0; y < HEIGHT; y++) {
  const lat = 90 - ((y + 0.5) * 180) / HEIGHT;
  let bits = '';
  for (let x = 0; x < WIDTH; x++) {
    const lon = -180 + ((x + 0.5) * 360) / WIDTH;
    bits += geoContains(land, [lon, lat]) ? '1' : '0';
  }
  rows.push(
    bits
      .match(/.{1,4}/g)
      .map((nibble) => parseInt(nibble, 2).toString(16))
      .join(''),
  );
}
console.log(JSON.stringify(rows, null, 2));
