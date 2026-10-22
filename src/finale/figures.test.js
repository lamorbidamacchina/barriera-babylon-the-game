import { describe, it, expect } from 'vitest';
import { Painter } from '../painter.js';
import { ADULT, KID, FRONT_ROW, SECOND_ROW, KIDS, NEIGHBOURS } from './figures.js';
import { drawPiazza, PIAZZA_W, PIAZZA_H } from './piazza.js';

const painted = (p) => p.px.filter((c) => c !== null).length;
const frames = (draw, w, h) => [0, 1].map((f) => {
  const p = new Painter(w, h);
  draw(p, f);
  return p;
});

describe('finale figures', () => {
  it('draws every grown-up at the front and second row sizes, in two different frames', () => {
    for (const [name, draw] of Object.entries({ ...FRONT_ROW, ...SECOND_ROW, ...NEIGHBOURS })) {
      for (const [w, h] of [[ADULT.w, ADULT.h], [24, 48], [14, 28]]) {
        const [a, b] = frames(draw, w, h);
        expect(painted(a), `${name} ${h}`).toBeGreaterThan(w * h * 0.3);
        expect(a.px.join(), `${name} walks`).not.toBe(b.px.join());
      }
    }
  });

  it('draws every kid', () => {
    for (const [name, draw] of Object.entries(KIDS)) {
      const [a, b] = frames(draw, KID.w, KID.h);
      expect(painted(a), name).toBeGreaterThan(KID.w * KID.h * 0.3);
      expect(a.px.join(), `${name} walks`).not.toBe(b.px.join());
    }
  });

  it('covers the whole screen with the piazza', () => {
    const p = new Painter(PIAZZA_W, PIAZZA_H);
    drawPiazza(p);
    expect(painted(p)).toBe(PIAZZA_W * PIAZZA_H);
  });
});
