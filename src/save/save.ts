// Versioned localStorage persistence with an in-memory fallback. A failed write never
// blocks the session; an unreadable save is reported, not silently replaced.

import { isStoryStage } from '../game/contracts';
import type { GameState } from '../game/contracts';

export const SAVE_KEY = 'vorax.save.v1';
export const SETTINGS_KEY = 'vorax.settings.v1';
export const SCHEMA_VERSION = 1;
export const CONTENT_VERSION = '2026-11-14.2';

export interface SavePayload {
  schemaVersion: number;
  contentVersion: string;
  storyStage: GameState['storyStage'];
  awakened: boolean;
  viewedRecordIds: string[];
  seenBeatIds: string[];
  savedAt: string;
}

export interface KnownIds {
  recordIds: readonly string[];
  beatIds: readonly string[];
}

export type LoadResult = { ok: true; state: GameState } | { ok: false; reason: 'empty' | 'corrupt' | 'version' | 'invalid' };

export function serializeSave(state: GameState, now: Date): SavePayload {
  return {
    schemaVersion: SCHEMA_VERSION,
    contentVersion: CONTENT_VERSION,
    storyStage: state.storyStage,
    awakened: state.awakened,
    viewedRecordIds: [...state.viewedRecordIds],
    seenBeatIds: [...state.seenBeatIds],
    savedAt: now.toISOString(),
  };
}

export function parseSave(raw: string | null, known: KnownIds): LoadResult {
  if (raw === null || raw === '') return { ok: false, reason: 'empty' };
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false, reason: 'corrupt' };
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return { ok: false, reason: 'corrupt' };
  const p = data as Record<string, unknown>;
  // A valid shape does not make progress compatible with another puzzle/story revision.
  // Migrations must be explicit; leave unknown saves untouched for recovery.
  if (p.schemaVersion !== SCHEMA_VERSION || p.contentVersion !== CONTENT_VERSION) return { ok: false, reason: 'version' };
  if (typeof p.awakened !== 'boolean' || !isStoryStage(p.storyStage) || (p.storyStage !== 'ARRIVAL' && !p.awakened) || !Array.isArray(p.viewedRecordIds) || !Array.isArray(p.seenBeatIds)) {
    return { ok: false, reason: 'invalid' };
  }
  const keep = (list: unknown[], allowed: readonly string[]): string[] => [
    ...new Set(list.filter((v): v is string => typeof v === 'string' && allowed.includes(v))),
  ];
  return {
    ok: true,
    state: {
      storyStage: p.storyStage,
      awakened: p.awakened,
      presenting: p.storyStage === 'EPILOGUE',
      viewedRecordIds: keep(p.viewedRecordIds, known.recordIds),
      seenBeatIds: keep(p.seenBeatIds, known.beatIds),
    },
  };
}

// ---------------------------------------------------------------- settings

export interface Settings {
  reducedIntensity: boolean;
  fov: number;
  sensitivity: number;
  invertY: boolean;
  master: number;
  ambience: number;
  effects: number;
  textScale: 1 | 1.25 | 1.5;
  quality: 'standard' | 'low';
  brightness: number;
  lookMode: 'mouse' | 'keyboard';
}

export const DEFAULT_SETTINGS: Readonly<Settings> = Object.freeze({
  reducedIntensity: false,
  fov: 75,
  sensitivity: 1,
  invertY: false,
  master: 0.8,
  ambience: 0.7,
  effects: 0.8,
  textScale: 1,
  quality: 'standard',
  brightness: 1,
  lookMode: 'mouse',
});

const clamp = (v: unknown, min: number, max: number, fallback: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;

export function sanitizeSettings(raw: unknown): Settings {
  const d = DEFAULT_SETTINGS;
  if (typeof raw !== 'object' || raw === null) return { ...d };
  const r = raw as Record<string, unknown>;
  const scale = r.textScale === 1.25 || r.textScale === 1.5 ? r.textScale : 1;
  return {
    reducedIntensity: typeof r.reducedIntensity === 'boolean' ? r.reducedIntensity : d.reducedIntensity,
    fov: clamp(r.fov, 60, 90, d.fov),
    sensitivity: clamp(r.sensitivity, 0.2, 3, d.sensitivity),
    invertY: typeof r.invertY === 'boolean' ? r.invertY : d.invertY,
    master: clamp(r.master, 0, 1, d.master),
    ambience: clamp(r.ambience, 0, 1, d.ambience),
    effects: clamp(r.effects, 0, 1, d.effects),
    textScale: scale,
    quality: r.quality === 'low' || r.quality === 'standard' ? r.quality : d.quality,
    brightness: clamp(r.brightness, 0.6, 1.6, d.brightness),
    lookMode: r.lookMode === 'keyboard' || r.lookMode === 'mouse' ? r.lookMode : d.lookMode,
  };
}

// ---------------------------------------------------------------- store

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export class SaveStore {
  constructor(
    private readonly storage: StorageLike | null,
    private readonly known: KnownIds,
  ) {}

  private read(key: string): string | null {
    try {
      return this.storage ? this.storage.getItem(key) : null;
    } catch {
      return null;
    }
  }

  private write(key: string, value: string): boolean {
    if (!this.storage) return false;
    try {
      this.storage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }

  load(): LoadResult {
    return parseSave(this.read(SAVE_KEY), this.known);
  }

  /** Returns false when the write failed; the caller keeps playing from memory. */
  save(state: GameState): boolean {
    return this.write(SAVE_KEY, JSON.stringify(serializeSave(state, new Date())));
  }

  /** Removes VØRAX progress only. Settings and foreign keys are left alone. */
  clearProgress(): void {
    try {
      this.storage?.removeItem(SAVE_KEY);
    } catch {
      /* storage unavailable: nothing to clear */
    }
  }

  loadSettings(): Settings {
    const raw = this.read(SETTINGS_KEY);
    if (raw === null) return { ...DEFAULT_SETTINGS };
    try {
      return sanitizeSettings(JSON.parse(raw));
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  saveSettings(settings: Settings): boolean {
    return this.write(SETTINGS_KEY, JSON.stringify(sanitizeSettings(settings)));
  }
}

/** localStorage can throw on access in private or sandboxed contexts. */
export function browserStorage(): StorageLike | null {
  try {
    const s = window.localStorage;
    const probe = '__vorax_probe__';
    s.setItem(probe, '1');
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}
