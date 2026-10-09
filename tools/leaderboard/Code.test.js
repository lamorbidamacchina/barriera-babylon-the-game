import { describe, it, expect } from 'vitest';
import { loadCodeGs } from '../../test/gas.js';

const valid = { game: 'contrabbando', level: 0, nickname: 'MEI LI', score: 500 };
const dataRows = (sheet) => sheet.rows.slice(1);

describe('Code.gs doPost', () => {
  it('saves a first record and returns the best per level', () => {
    const { post, get, sheet } = loadCodeGs();
    expect(post(valid)).toEqual({ contrabbando: { 0: { nickname: 'MEI LI', score: 500 } } });
    expect(get()).toEqual({ contrabbando: { 0: { nickname: 'MEI LI', score: 500 } } });
    expect(dataRows(sheet)).toHaveLength(1);
  });

  it('uppercases and trims the nickname', () => {
    const { post } = loadCodeGs();
    expect(post({ ...valid, nickname: '  franco ' }).contrabbando[0].nickname).toBe('FRANCO');
  });

  it.each([
    ['unknown game', { game: 'tetris' }],
    ['negative level', { level: -1 }],
    ['fractional level', { level: 1.5 }],
    ['level too high', { level: 50 }],
    ['zero score', { score: 0 }],
    ['fractional score', { score: 10.5 }],
    ['score above the cap', { score: 20001 }],
    ['score as a string', { score: '500' }],
    ['empty nickname', { nickname: '' }],
    ['nickname too long', { nickname: 'ABCDEFGHIJKLM' }],
    ['nickname with accents', { nickname: 'CITTÀ' }],
    ['nickname with symbols', { nickname: '<script>' }],
  ])('rejects %s', (_, change) => {
    const { post, sheet } = loadCodeGs();
    expect(post({ ...valid, ...change })).toEqual({ error: 'invalid' });
    expect(dataRows(sheet)).toHaveLength(0);
  });

  it('rejects bad JSON', () => {
    const { post } = loadCodeGs();
    expect(post('{nope')).toEqual({ error: 'bad json' });
  });

  it('replaces the row only when the record is beaten', () => {
    const { post, sheet } = loadCodeGs();
    post(valid);
    post({ ...valid, nickname: 'TIE', score: 500 });
    post({ ...valid, nickname: 'LOWER', score: 100 });
    expect(dataRows(sheet)).toHaveLength(1);
    expect(dataRows(sheet)[0][3]).toBe('MEI LI');

    const res = post({ ...valid, nickname: 'BEA', score: 501 });
    expect(res.contrabbando[0]).toEqual({ nickname: 'BEA', score: 501 });
    expect(dataRows(sheet)).toHaveLength(1);
  });

  it('keeps one row per game and level', () => {
    const { post, sheet } = loadCodeGs();
    post(valid);
    post({ ...valid, level: 1 });
    post({ ...valid, game: 'muro' });
    expect(dataRows(sheet)).toHaveLength(3);
  });

  it('stops writing after the daily limit, but still answers', () => {
    const { post, gs, props, sheet } = loadCodeGs();
    props.set('writes-day', '2026-10-09');
    props.set('writes-count', String(gs.MAX_WRITES_PER_DAY));
    expect(post(valid)).toEqual({});
    expect(dataRows(sheet)).toHaveLength(0);
  });

  it('resets the daily counter on a new day', () => {
    const { post, props } = loadCodeGs();
    props.set('writes-day', '2026-10-08');
    props.set('writes-count', '300');
    expect(post(valid).contrabbando).toBeDefined();
    expect(props.get('writes-count')).toBe('1');
  });
});

describe('Code.gs best()', () => {
  it('keeps the best score per level when the sheet has duplicates (hand edits)', () => {
    const { get, sheet } = loadCodeGs();
    const t = new Date();
    sheet.rows.push([t, 'contrabbando', 0, 'A', 100], [t, 'contrabbando', 0, 'B', 300], [t, 'contrabbando', 0, 'C', 200], [t, '', 0, 'X', 999], [t, 'muro', 2, 'D', 0]);
    expect(get()).toEqual({ contrabbando: { 0: { nickname: 'B', score: 300 } } });
  });

  it('keeps numeric nicknames as text', () => {
    const { get, sheet } = loadCodeGs();
    sheet.rows.push([new Date(), 'contrabbando', 0, 7, 100]);
    expect(get().contrabbando[0].nickname).toBe('7');
  });
});
