import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { memoryStorage, brokenStorage } from '../test/storage.js';
import { loadCodeGs } from '../test/gas.js';

const CACHE_KEY = 'barriera-babylon-records';

// The module keeps the records in module state: a fresh copy for each test,
// loaded after localStorage and fetch are stubbed.
async function load({ cached } = {}) {
  vi.stubGlobal('localStorage', memoryStorage(cached === undefined ? {} : { [CACHE_KEY]: JSON.stringify(cached) }));
  vi.resetModules();
  return import('./leaderboard.js');
}

// A fetch whose answers the test releases by hand, in any order.
function manualFetch() {
  const calls = [];
  const fn = vi.fn((url, opts) => {
    let resolve, reject;
    const promise = new Promise((res, rej) => ((resolve = res), (reject = rej)));
    calls.push({ url, opts, answer: (data) => resolve({ json: async () => data }), fail: () => reject(new Error('offline')) });
    return promise;
  });
  return { fn, calls };
}

const flush = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => vi.useFakeTimers({ toFake: ['Date'] }));
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('cleanNickname', async () => {
  const { cleanNickname, NICKNAME_MAX } = await load();

  it.each([
    ['mei li', 'MEI LI'],
    ['Città', 'CITTA'],
    ['Perché sì', 'PERCHE SI'],
    ['  bea   la  hacker ', ' BEA LA HACK'],
    ['don_remo!', 'DON_REMO!'],
    ["l'orso.", "L'ORSO."],
    ['a<b>c/d', 'ABCD'],
    ['😀zio🍆franco', 'ZIOFRANCO'],
    ['007', '007'],
  ])('%j → %j', (input, out) => {
    expect(cleanNickname(input)).toBe(out);
  });

  it(`cuts at ${NICKNAME_MAX} characters`, () => {
    expect(cleanNickname('ABCDEFGHIJKLMNOP')).toHaveLength(NICKNAME_MAX);
  });

  it('leaves a clean nickname unchanged', () => {
    expect(cleanNickname('MEI LI 2')).toBe('MEI LI 2');
  });

  it('only produces nicknames the server accepts (Code.gs NICKNAME)', () => {
    const { NICKNAME } = loadCodeGs().gs;
    const inputs = ['mei li', 'Città', 'àèìòù', '  x  ', 'ÆØÅ ß', "a-b.c_d!e'f", 'ünïcödé', '1234567890123', 'ok?', 'tab\there'];
    for (const s of inputs) {
      // The game trims before sending, like the server does.
      const n = cleanNickname(s).trim();
      if (n) expect(NICKNAME.test(n), `${s} → ${n}`).toBe(true);
    }
  });
});

describe('records', () => {
  it('are unknown offline on the first launch', async () => {
    const lb = await load();
    expect(lb.getRecord('contrabbando', 0)).toBeUndefined();
    expect(lb.beatsRecord('contrabbando', 0, 99999)).toBe(false);
  });

  it('work without storage', async () => {
    vi.stubGlobal('localStorage', brokenStorage());
    vi.resetModules();
    const lb = await import('./leaderboard.js');
    expect(lb.getRecord('contrabbando', 0)).toBeUndefined();
  });

  it('come from the device cache', async () => {
    const lb = await load({ cached: { contrabbando: { 0: { nickname: 'BEA', score: 300 } } } });
    expect(lb.getRecord('contrabbando', 0)).toEqual({ nickname: 'BEA', score: 300 });
    expect(lb.getRecord('contrabbando', 1)).toBeNull();
    expect(lb.getRecord('muro', 0)).toBeNull();
  });

  it('are beaten only by a strictly higher score', async () => {
    const lb = await load({ cached: { contrabbando: { 0: { nickname: 'BEA', score: 300 } } } });
    expect(lb.beatsRecord('contrabbando', 0, 300)).toBe(false);
    expect(lb.beatsRecord('contrabbando', 0, 301)).toBe(true);
    expect(lb.beatsRecord('contrabbando', 1, 1)).toBe(true); // free level
    expect(lb.beatsRecord('contrabbando', 1, 0)).toBe(false);
  });
});

describe('refreshRecords', () => {
  it('stores what the server sends and tells the listeners', async () => {
    const lb = await load();
    const f = manualFetch();
    vi.stubGlobal('fetch', f.fn);
    const listener = vi.fn();
    lb.onRecords(listener);

    lb.refreshRecords();
    f.calls[0].answer({ contrabbando: { 0: { nickname: 'BEA', score: 300 } } });
    await flush();

    expect(lb.getRecord('contrabbando', 0)).toEqual({ nickname: 'BEA', score: 300 });
    expect(JSON.parse(localStorage.getItem(CACHE_KEY))).toEqual({ contrabbando: { 0: { nickname: 'BEA', score: 300 } } });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('does not ask again within 30 seconds', async () => {
    const lb = await load();
    const f = manualFetch();
    vi.stubGlobal('fetch', f.fn);
    lb.refreshRecords();
    f.calls[0].answer({});
    await flush();
    lb.refreshRecords();
    expect(f.fn).toHaveBeenCalledTimes(1);
    vi.setSystemTime(Date.now() + 30_001);
    lb.refreshRecords();
    expect(f.fn).toHaveBeenCalledTimes(2);
  });

  it('ignores errors and server error answers', async () => {
    const lb = await load({ cached: { contrabbando: {} } });
    const f = manualFetch();
    vi.stubGlobal('fetch', f.fn);
    lb.refreshRecords();
    f.calls[0].answer({ error: 'boom' });
    await flush();
    expect(lb.getRecord('contrabbando', 0)).toBeNull();

    vi.setSystemTime(Date.now() + 30_001);
    lb.refreshRecords();
    f.calls[1].fail();
    await flush();
    expect(lb.getRecord('contrabbando', 0)).toBeNull();
  });
});

describe('submitRecord', () => {
  it('does nothing while the records are unknown', async () => {
    const lb = await load();
    const f = manualFetch();
    vi.stubGlobal('fetch', f.fn);
    lb.submitRecord('contrabbando', 0, 'BEA', 300);
    expect(f.fn).not.toHaveBeenCalled();
  });

  it('shows the record at once and posts it as text/plain', async () => {
    const lb = await load({ cached: { contrabbando: { 1: { nickname: 'X', score: 5 } } } });
    const f = manualFetch();
    vi.stubGlobal('fetch', f.fn);
    lb.submitRecord('contrabbando', 0, 'BEA', 300);

    expect(lb.getRecord('contrabbando', 0)).toEqual({ nickname: 'BEA', score: 300 });
    expect(lb.getRecord('contrabbando', 1)).toEqual({ nickname: 'X', score: 5 }); // others kept
    const { opts } = f.calls[0];
    expect(opts.method).toBe('POST');
    expect(opts.headers['Content-Type']).toMatch(/^text\/plain/); // no CORS preflight
    expect(JSON.parse(opts.body)).toEqual({ game: 'contrabbando', level: 0, nickname: 'BEA', score: 300 });
  });

  it('takes the server answer as the truth', async () => {
    const lb = await load({ cached: {} });
    const f = manualFetch();
    vi.stubGlobal('fetch', f.fn);
    lb.submitRecord('contrabbando', 0, 'BEA', 300);
    f.calls[0].answer({ contrabbando: { 0: { nickname: 'FASTER', score: 400 } } });
    await flush();
    expect(lb.getRecord('contrabbando', 0)).toEqual({ nickname: 'FASTER', score: 400 });
  });

  it('is not overwritten by an older refresh that answers later', async () => {
    const lb = await load({ cached: {} });
    const f = manualFetch();
    vi.stubGlobal('fetch', f.fn);
    lb.refreshRecords(); // calls[0]: started before the record
    lb.submitRecord('contrabbando', 0, 'BEA', 300); // calls[1]

    f.calls[0].answer({}); // stale: doesn't know about BEA
    await flush();
    expect(lb.getRecord('contrabbando', 0)).toEqual({ nickname: 'BEA', score: 300 });
  });

  it('keeps the local record when the post fails', async () => {
    const lb = await load({ cached: {} });
    const f = manualFetch();
    vi.stubGlobal('fetch', f.fn);
    lb.submitRecord('contrabbando', 0, 'BEA', 300);
    f.calls[0].fail();
    await flush();
    expect(lb.getRecord('contrabbando', 0)).toEqual({ nickname: 'BEA', score: 300 });
  });
});
