import { describe, expect, it } from 'vitest';
import { STORY_STAGES } from '../../src/game/contracts';
import { initialState } from '../../src/game/reducer';
import {
  DEFAULT_SETTINGS,
  SAVE_KEY,
  SETTINGS_KEY,
  SaveStore,
  parseSave,
  sanitizeSettings,
  serializeSave,
} from '../../src/save/save';

class FakeStorage {
  data = new Map<string, string>();
  getItem(k: string): string | null {
    return this.data.has(k) ? this.data.get(k)! : null;
  }
  setItem(k: string, v: string): void {
    this.data.set(k, v);
  }
  removeItem(k: string): void {
    this.data.delete(k);
  }
}
class BlockedStorage extends FakeStorage {
  override setItem(): void {
    throw new Error('QuotaExceededError');
  }
}
class HostileStorage {
  getItem(): string | null {
    throw new Error('SecurityError');
  }
  setItem(): void {
    throw new Error('SecurityError');
  }
  removeItem(): void {
    throw new Error('SecurityError');
  }
}

const known = { recordIds: ['R-INSIGHT', 'R-OPPORTUNITY'], beatIds: ['L01', 'L05'] };

describe('save and settings (QA A04)', () => {
  it('round-trips all ten narrative stages', () => {
    for (const storyStage of STORY_STAGES) {
      const state = { ...initialState(), awakened: true, presenting: storyStage === 'EPILOGUE', storyStage, viewedRecordIds: ['R-INSIGHT'], seenBeatIds: ['L01'] };
      const raw = JSON.stringify(serializeSave(state, new Date('2026-11-14T12:00:00Z')));
      const parsed = parseSave(raw, known);
      expect(parsed.ok).toBe(true);
      if (parsed.ok) expect(parsed.state).toEqual(state);
    }
  });

  it('derives epilogue presentation from the saved stage without skipping the physical walk', () => {
    const state = { ...initialState(), awakened: true, storyStage: 'EPILOGUE' as const, presenting: true };
    const payload = serializeSave(state, new Date());
    expect(Object.keys(payload).sort()).toEqual(
      ['awakened', 'contentVersion', 'savedAt', 'schemaVersion', 'seenBeatIds', 'storyStage', 'viewedRecordIds'].sort(),
    );
    const parsed = parseSave(JSON.stringify(payload), known);
    expect(parsed.ok && parsed.state.presenting).toBe(true);
    expect(parsed.ok && parsed.state.storyStage).toBe('EPILOGUE');
  });

  it('explains why a save cannot be loaded', () => {
    expect(parseSave(null, known)).toEqual({ ok: false, reason: 'empty' });
    expect(parseSave('{not json', known)).toEqual({ ok: false, reason: 'corrupt' });
    expect(parseSave('[]', known)).toEqual({ ok: false, reason: 'corrupt' });
    const good = serializeSave(initialState(), new Date());
    expect(parseSave(JSON.stringify({ ...good, schemaVersion: 99 }), known)).toEqual({ ok: false, reason: 'version' });
    expect(parseSave(JSON.stringify({ ...good, storyStage: 'TELEPORTED' }), known)).toEqual({ ok: false, reason: 'invalid' });
    expect(parseSave(JSON.stringify({ ...good, viewedRecordIds: 'R-INSIGHT' }), known)).toEqual({ ok: false, reason: 'invalid' });
  });

  it('rejects contradictory unconscious progress and retains an interrupted awakening', () => {
    const initial=serializeSave(initialState(),new Date());
    expect(parseSave(JSON.stringify(initial),known)).toEqual({ok:true,state:initialState()});
    for(const awakened of [undefined,null,1,'true'])expect(parseSave(JSON.stringify({...initial,awakened}),known)).toEqual({ok:false,reason:'invalid'});
    expect(parseSave(JSON.stringify({...initial,storyStage:'OBSERVATION'}),known)).toEqual({ok:false,reason:'invalid'});
    const awake=serializeSave({...initialState(),awakened:true},new Date());
    const parsed=parseSave(JSON.stringify(awake),known);expect(parsed.ok && parsed.state.awakened).toBe(true);
  });

  it('drops unknown record and beat ids instead of trusting them', () => {
    const payload = { ...serializeSave(initialState(), new Date()), viewedRecordIds: ['R-INSIGHT', 'R-EVIL', 7], seenBeatIds: ['L01', 'L99'] };
    const parsed = parseSave(JSON.stringify(payload), known);
    expect(parsed.ok && parsed.state.viewedRecordIds).toEqual(['R-INSIGHT']);
    expect(parsed.ok && parsed.state.seenBeatIds).toEqual(['L01']);
  });

  it('rejects incompatible content versions without discarding the original save', () => {
    const good = serializeSave({ ...initialState(), awakened: true, storyStage: 'INSIGHT_RESTORED' }, new Date());
    for (const contentVersion of ['2099-01-01.1', '2026-11-14.1', '2026-11-13.1', undefined, null, 7]) {
      const storage = new FakeStorage();
      const raw = JSON.stringify({ ...good, contentVersion });
      storage.setItem(SAVE_KEY, raw);
      const store = new SaveStore(storage, known);
      expect(store.load()).toEqual({ ok: false, reason: 'version' });
      expect(storage.getItem(SAVE_KEY)).toBe(raw);
    }
  });

  it('saves, loads and clears only its own keys', () => {
    const storage = new FakeStorage();
    storage.setItem('someone.else', 'keep me');
    const store = new SaveStore(storage, known);
    const state = { ...initialState(), awakened: true, storyStage: 'INSIGHT_RESTORED' as const };
    expect(store.save(state)).toBe(true);
    expect(storage.getItem(SAVE_KEY)).toContain('INSIGHT_RESTORED');
    const loaded = store.load();
    expect(loaded.ok && loaded.state.storyStage).toBe('INSIGHT_RESTORED');
    store.saveSettings({ ...DEFAULT_SETTINGS, fov: 80 });
    expect(storage.getItem(SETTINGS_KEY)).toContain('80');
    store.clearProgress();
    expect(storage.getItem(SAVE_KEY)).toBeNull();
    expect(storage.getItem(SETTINGS_KEY)).not.toBeNull();
    expect(storage.getItem('someone.else')).toBe('keep me');
  });

  it('keeps the session alive when storage is blocked or missing', () => {
    for (const storage of [new BlockedStorage(), new HostileStorage(), null]) {
      const store = new SaveStore(storage, known);
      expect(() => store.save(initialState())).not.toThrow();
      expect(store.save(initialState())).toBe(false);
      expect(store.load().ok).toBe(false);
      expect(() => store.clearProgress()).not.toThrow();
      expect(store.loadSettings()).toEqual(DEFAULT_SETTINGS);
      expect(store.saveSettings(DEFAULT_SETTINGS)).toBe(false);
    }
  });

  it('reports a corrupt stored save without destroying the running session', () => {
    const storage = new FakeStorage();
    storage.setItem(SAVE_KEY, '{"schemaVersion":1,"storyStage":');
    const store = new SaveStore(storage, known);
    expect(store.load()).toEqual({ ok: false, reason: 'corrupt' });
    expect(storage.getItem(SAVE_KEY)).not.toBeNull();
  });

  it('clamps settings to the documented ranges', () => {
    expect(sanitizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings('nope')).toEqual(DEFAULT_SETTINGS);
    expect(DEFAULT_SETTINGS.fov).toBe(75);
    const s = sanitizeSettings({ fov: 500, sensitivity: -3, master: 7, ambience: 'loud', textScale: 1.3, quality: 'ultra', invertY: 1, reducedIntensity: true, lookMode: 'keyboard', brightness: 99 });
    expect(s.fov).toBe(90);
    expect(sanitizeSettings({ fov: 10 }).fov).toBe(60);
    expect(s.sensitivity).toBeGreaterThan(0);
    expect(s.master).toBe(1);
    expect(s.ambience).toBe(DEFAULT_SETTINGS.ambience);
    expect([1, 1.25, 1.5]).toContain(s.textScale);
    expect(s.quality).toBe(DEFAULT_SETTINGS.quality);
    expect(s.invertY).toBe(DEFAULT_SETTINGS.invertY);
    expect(s.reducedIntensity).toBe(true);
    expect(s.lookMode).toBe('keyboard');
    expect(s.brightness).toBeLessThanOrEqual(1.6);
  });
});
