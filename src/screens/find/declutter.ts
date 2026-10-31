export interface Pt {
  x: number;
  y: number;
}

/**
 * Nudges points apart until every pair is at least `min` px away (or 40 rounds pass), so
 * map pins never sit on top of each other and each stays a full-size tap target.
 * shortcut: a pin can sit a few px off its true spot, and a very tight cluster may stay
 * overlapped; the sheet always shows the true distance. Upgrade to clustering if that matters.
 */
export function spreadPoints(points: Pt[], min: number): Pt[] {
  const p = points.map((q) => ({ ...q }));
  for (let round = 0; round < 40; round++) {
    let moved = false;
    for (let i = 0; i < p.length; i++) {
      for (let j = i + 1; j < p.length; j++) {
        let dx = p[j].x - p[i].x;
        let dy = p[j].y - p[i].y;
        let d = Math.hypot(dx, dy);
        if (d >= min) continue;
        if (d < 0.01) { // same spot: split along a fixed angle per pair
          const a = (i * 7 + j) * 2.4;
          dx = Math.cos(a);
          dy = Math.sin(a);
          d = 1;
        }
        const push = (min - d) / 2 + 0.5;
        p[i].x -= (dx / d) * push;
        p[i].y -= (dy / d) * push;
        p[j].x += (dx / d) * push;
        p[j].y += (dy / d) * push;
        moved = true;
      }
    }
    if (!moved) break;
  }
  return p;
}
