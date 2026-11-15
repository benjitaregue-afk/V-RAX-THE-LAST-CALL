import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import hashes from '../../src/content/asset-hashes.json';
import { ASSETS, RESEARCH_ORIGINALS } from '../../src/content/assets';
import { CLAIMS, SOURCES } from '../../src/content/claims';
import { BEATS, LEGACY_CARDS, RELAY_DIAGNOSTIC, TEXT, beat } from '../../src/content/narrative';
import { PUZZLES } from '../../src/content/puzzles';
import { RECORDS, recordById } from '../../src/content/records';
import { validateContent } from '../../src/content/validate';

const root = join(__dirname, '..', '..');
const publicDir = join(root, 'public');
const sha = (file: string): string => createHash('sha256').update(readFileSync(file)).digest('hex');
const walk = (dir: string): string[] =>
  readdirSync(dir)
    .filter((n) => !n.startsWith('.'))
    .flatMap((n) => (statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : [join(dir, n)]));
const hashTable = hashes as Record<string, { sha256: string; bytes: number }>;

describe('content integrity (QA A05)', () => {
  it('passes the built-in validator', () => {
    expect(validateContent()).toEqual([]);
  });

  it('registers claims F01–F16, every fact with a primary source', () => {
    expect(CLAIMS.map((c) => c.id)).toEqual(Array.from({ length: 16 }, (_, i) => `F${String(i + 1).padStart(2, '0')}`));
    for (const c of CLAIMS) {
      expect(c.evidenceKind).toBe('FACT');
      expect(c.sourceIds.length).toBeGreaterThan(0);
      for (const s of c.sourceIds) expect(SOURCES[s], `${c.id} → ${s}`).toBeDefined();
    }
  });

  it('keeps the exact mission and product identities', () => {
    expect(recordById('R-INSIGHT').missionId).toBe('2018-042A');
    expect(recordById('R-OPPORTUNITY').missionId).toBe('2003-032A');
    const pia = recordById('R-PIA05584');
    const text = JSON.stringify(pia);
    expect(pia.credit).toBe('NASA/JPL/Cornell');
    expect(text).toContain('Pancam');
    expect(text).toContain('False-color composite');
    expect(text).not.toContain('Microscopic Imager');
    expect(recordById('R-INSIGHT-IMAGE').credit).toBe('NASA/JPL-Caltech');
    expect(JSON.stringify(recordById('R-SEIS-SOUND'))).toMatch(/sonification/i);
  });

  it('attributes every record and separates source values from the summary', () => {
    for (const r of RECORDS) {
      expect(r.layer).toBe('NASA ARCHIVAL RECORD');
      expect(r.sourceUrl).toMatch(/^https:\/\/([a-z-]+\.)*(nasa\.gov)\//);
      expect(r.credit).toMatch(/NASA/);
      expect(r.sourceFields.length).toBeGreaterThan(0);
      expect(r.editorialSummary.length).toBeGreaterThan(0);
    }
  });

  it('never presents scripted fiction as a NASA record', () => {
    for (const b of BEATS) expect(b.layer, b.id).not.toBe('NASA ARCHIVAL RECORD');
    const scienceText = JSON.stringify([RECORDS, CLAIMS, LEGACY_CARDS]);
    for (const fiction of ['VØRAX', 'LOCAL QUEUE', 'request repeated', 'relay']) expect(scienceText).not.toContain(fiction);
    expect(RELAY_DIAGNOSTIC.join(' ')).toContain('LOCAL QUEUE');
  });

  it('keeps the approved script lines', () => {
    expect(beat('L01').caption).toBe('LOCAL ARCHIVE — request repeated. Restore backup power.');
    expect(beat('L04').caption).toBe('Record restored. A measurement is not a voice.');
    expect(beat('L05').caption).toBe('[A mechanical click repeats behind you.]');
    expect(beat('L08').caption).toBe('REMOTE UPLINK: OFFLINE. REPLAY SOURCE: LOCAL QUEUE.');
    expect(beat('L10').caption).toBe('No new call. A request waiting to be understood.');
    expect(beat('L11').caption).toBe('The machines remain. Their discoveries travel on.');
    expect(beat('L12').caption).toContain('NASA does not endorse this project');
    expect(TEXT.notOfficial).toContain('Not an official NASA product');
  });

  it('never states that life was found or that a mission spoke', () => {
    const facts = [...CLAIMS.map((c) => c.statementEn), ...RECORDS.flatMap((r) => [...r.sourceFields.map((f) => `${f.label}: ${f.value}`), ...r.editorialSummary.map((s) => s.text)]), ...LEGACY_CARDS.flatMap((c) => c.rows.map((r) => r.answer))];
    for (const line of facts) {
      if (/\blife\b|alive|organism/i.test(line)) expect(line, line).toMatch(/\bnot\b|\bNot supported\b/i);
      expect(line).not.toMatch(/my battery is low/i);
    }
    const wrongOptions = PUZZLES.flatMap((p) => p.fields.flatMap((f) => f.options.filter((o) => o.id !== p.solution[f.id]).map((o) => o.label)));
    expect(wrongOptions).toContain('Living organisms were confirmed');
  });

  it('stays close to the planned word budgets', () => {
    const words = (s: string): number => s.split(/\s+/).filter(Boolean).length;
    const story = BEATS.reduce((n, b) => n + words(b.caption), 0) + words(RELAY_DIAGNOSTIC.join(' ')) + words(TEXT.endingClosing) + words(TEXT.premise);
    const records = RECORDS.reduce((n, r) => n + r.editorialSummary.reduce((m, s) => m + words(s.text), 0), 0);
    expect(story).toBeLessThanOrEqual(450);
    expect(records).toBeLessThanOrEqual(550);
  });

  it('registers every served asset with a matching hash, and nothing else', () => {
    const served = walk(join(publicDir, 'assets')).map((f) => relative(publicDir, f).split(sep).join('/')).sort();
    expect(served).toEqual(ASSETS.map((a) => a.path).sort());
    for (const a of ASSETS) {
      const file = join(publicDir, a.path);
      expect(existsSync(file), a.path).toBe(true);
      expect(hashTable[a.path]?.sha256, a.path).toBe(sha(file));
      expect(hashTable[a.path]?.bytes).toBe(statSync(file).size);
    }
  });

  it('respects the per-file and total download budgets', () => {
    // Budgets were raised on 2026-11-14 for the cinematic art pass (baked lighting, textured shell).
    let total = 0;
    for (const a of ASSETS) {
      const bytes = statSync(join(publicDir, a.path)).size;
      total += bytes;
      if (a.path.startsWith('assets/nasa/')) expect(bytes, a.path).toBeLessThanOrEqual(1024 * 1024);
      else if (a.kind === 'image') expect(bytes, a.path).toBeLessThanOrEqual(1.5 * 1024 * 1024);
    }
    expect(total).toBeLessThanOrEqual(40 * 1024 * 1024);
  });

  it('keeps the unmodified NASA originals, and serves PIA05584 byte-identical', () => {
    for (const o of RESEARCH_ORIGINALS) {
      const file = join(root, o.file);
      expect(existsSync(file), o.file).toBe(true);
      expect(sha(file)).toBe(o.sha256);
      expect(statSync(file).size).toBe(o.bytes);
      expect(o.downloadUrl).toMatch(/^https:\/\/assets\.science\.nasa\.gov\//);
    }
    expect(sha(join(publicDir, 'assets/nasa/pia05584.jpg'))).toBe(RESEARCH_ORIGINALS[0]!.sha256);
  });
});
