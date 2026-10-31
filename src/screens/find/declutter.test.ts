import { describe, expect, it } from 'vitest';
import { spreadPoints } from './declutter';

const gap = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

describe('spreadPoints', () => {
  it('leaves far-apart points alone', () => {
    const pts = [{ x: 0, y: 0 }, { x: 100, y: 0 }];
    expect(spreadPoints(pts, 48)).toEqual(pts);
  });

  it('separates close and identical points', () => {
    const out = spreadPoints([{ x: 10, y: 10 }, { x: 10, y: 10 }, { x: 30, y: 12 }, { x: 40, y: 40 }], 48);
    for (let i = 0; i < out.length; i++) for (let j = i + 1; j < out.length; j++) expect(gap(out[i], out[j])).toBeGreaterThanOrEqual(47.5);
  });
});
