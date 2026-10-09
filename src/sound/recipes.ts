/*
 * Sound recipes from Bencho (https://bencho.dev/sounds), MIT licensed
 * (https://bencho.dev/licence). Each one is a few oscillators, not an audio
 * file, so there is nothing to download or decode.
 *
 * Copyright (c) 2026 Lorenzo Cabra
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the “Software”), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/** One oscillator of a sound. */
export interface Part {
  /** Start frequency in Hz. */
  hz: number;
  /** Frequency in Hz the pitch glides to by the end. */
  to?: number;
  /** Length in milliseconds. */
  ms: number;
  /** Peak gain, 0 to 1. */
  gain: number;
  wave?: OscillatorType;
  /** Low-pass cut-off in Hz. */
  cut?: number;
  /** Attack time in milliseconds. */
  atk?: number;
  /** Delay before this part starts, in milliseconds. */
  at?: number;
}

export const RECIPES = {
  boot: [{ hz: 291, ms: 360, gain: 0.043, wave: 'sine', cut: 560, atk: 90 }],
  drone: [{ hz: 115, ms: 294, gain: 0.068, wave: 'sine', cut: 560, atk: 72 }],
  tock: [{ hz: 250, ms: 28, gain: 0.045, wave: 'triangle', cut: 1700, atk: 10 }],
  cog: [{ hz: 408, ms: 24, gain: 0.061, wave: 'sine', cut: 1100, atk: 10 }],
  check: [{ hz: 370, ms: 90, gain: 0.055, wave: 'square', cut: 2400, atk: 10 }],
  rise: [{ hz: 394, to: 612, ms: 360, gain: 0.057, wave: 'triangle', cut: 1700, atk: 13 }],
  whisk: [{ hz: 124, to: 65, ms: 130, gain: 0.067, wave: 'sine', cut: 560, atk: 50 }],
  deny: [{ hz: 208, to: 165, ms: 120, gain: 0.03, wave: 'sine', cut: 520, atk: 10 }],
  poke: [{ hz: 380, ms: 20, gain: 0.047, wave: 'triangle', cut: 1700, atk: 5 }],
  mark: [{ hz: 280, ms: 20, gain: 0.035, wave: 'square', cut: 2400, atk: 6 }],
  chime: [{ hz: 220, ms: 271, gain: 0.046, wave: 'sine', cut: 820, atk: 90 }],
  expand: [
    { hz: 196, to: 174, ms: 360, gain: 0.042, wave: 'sine', cut: 880, atk: 36 },
    { hz: 294, to: 262, ms: 300, gain: 0.014, wave: 'sine', cut: 1100, atk: 48, at: 24 },
  ],
  pick: [{ hz: 245, ms: 41, gain: 0.044, wave: 'square', cut: 2400, atk: 6 }],
  lift: [{ hz: 660, to: 720, ms: 38, gain: 0.028, wave: 'sine' }],
  glide: [{ hz: 397, to: 276, ms: 205, gain: 0.065, wave: 'sine', cut: 820, atk: 90 }],
  bump: [
    { hz: 150, to: 92, ms: 140, gain: 0.07, wave: 'sine', cut: 640, atk: 4 },
    { hz: 420, ms: 26, gain: 0.014, wave: 'triangle', cut: 1500, atk: 3 },
  ],
  press: [{ hz: 168, ms: 95, gain: 0.028, wave: 'sine', cut: 480, atk: 14 }],
  click: [{ hz: 196, to: 130, ms: 150, gain: 0.07, wave: 'sine', cut: 900 }],
  off: [{ hz: 330, to: 247, ms: 88, gain: 0.03, wave: 'sine', cut: 720, atk: 8 }],
} as const satisfies Record<string, readonly Part[]>;

export type RecipeName = keyof typeof RECIPES;
