import { describe, it, expect, vi, afterEach } from 'vitest';
import { loadSave, writeSave } from './save.js';
import { memoryStorage, brokenStorage } from '../test/storage.js';

afterEach(() => vi.unstubAllGlobals());

describe('save', () => {
  it('reads back what it wrote', () => {
    vi.stubGlobal('localStorage', memoryStorage());
    const data = { contrabbando: { unlocked: 2, best: [120, 340] }, nickname: 'BEA' };
    writeSave(data);
    expect(loadSave()).toEqual(data);
  });

  it('starts empty on the first launch', () => {
    vi.stubGlobal('localStorage', memoryStorage());
    expect(loadSave()).toEqual({});
  });

  it('starts empty when the save is corrupt', () => {
    vi.stubGlobal('localStorage', memoryStorage({ 'barriera-babylon': '{not json' }));
    expect(loadSave()).toEqual({});
  });

  it('works without storage (private mode, blocked site data)', () => {
    vi.stubGlobal('localStorage', brokenStorage());
    expect(loadSave()).toEqual({});
    expect(() => writeSave({ a: 1 })).not.toThrow();
  });
});
