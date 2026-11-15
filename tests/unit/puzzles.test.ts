import { describe, expect, it } from 'vitest';
import { PUZZLES, puzzleById } from '../../src/content/puzzles';
import type { PuzzleDefinition, PuzzleId } from '../../src/game/contracts';
import { validateAnswers } from '../../src/puzzles/validate';

// Expected answers are copied from GAME_DESIGN_DOCUMENT.md, not from the validator.
const GDD: Record<Exclude<PuzzleId, 'PZ-00'>, { options: string[][]; answer: string[] }> = {
  'PZ-01': {
    options: [
      ['SEIS', 'Mössbauer Spectrometer', 'Solar array'],
      ['Ground motion', 'Iron-bearing mineral composition', 'Electrical energy'],
      ["Study Mars' interior", 'Study rock mineralogy', 'Supply spacecraft power'],
    ],
    answer: ['SEIS', 'Ground motion', "Study Mars' interior"],
  },
  'PZ-02': {
    options: [
      ['Pancam', 'SEIS', 'APXS'],
      ['Mössbauer Spectrometer', 'Pancam', 'SEIS'],
      ['Past water affected these deposits', 'Living organisms were confirmed', 'Liquid water is flowing here today'],
    ],
    answer: ['Pancam', 'Mössbauer Spectrometer', 'Past water affected these deposits'],
  },
  'PZ-03': {
    options: [
      ['NASA ARCHIVAL FACT', 'FICTIONAL ARCHIVE SYSTEM', 'UNSUPPORTED CLAIM'],
      ['NASA ARCHIVAL FACT', 'FICTIONAL ARCHIVE SYSTEM', 'UNSUPPORTED CLAIM'],
      ['NASA ARCHIVAL FACT', 'FICTIONAL ARCHIVE SYSTEM', 'UNSUPPORTED CLAIM'],
    ],
    answer: ['NASA ARCHIVAL FACT', 'FICTIONAL ARCHIVE SYSTEM', 'UNSUPPORTED CLAIM'],
  },
};

function answersByLabel(def: PuzzleDefinition, labels: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  def.fields.forEach((f, i) => {
    const opt = f.options.find((o) => o.label === labels[i]);
    if (!opt) throw new Error(`${def.id}: no option "${labels[i]}" in field ${f.id}`);
    out[f.id] = opt.id;
  });
  return out;
}

describe('puzzle definitions and validation (QA A03)', () => {
  it('defines the four puzzles in order', () => {
    expect(PUZZLES.map((p) => p.id)).toEqual(['PZ-00', 'PZ-01', 'PZ-02', 'PZ-03']);
  });

  for (const id of ['PZ-01', 'PZ-02', 'PZ-03'] as const) {
    describe(id, () => {
      const def = puzzleById(id);
      const spec = GDD[id];

      it('shows exactly the options listed in the design document', () => {
        expect(def.fields.map((f) => f.options.map((o) => o.label))).toEqual(spec.options);
        expect(def.initial).toBeUndefined();
      });

      it('accepts exactly one of the 27 complete combinations', () => {
        const solved: string[][] = [];
        let total = 0;
        for (const a of spec.options[0]!) {
          for (const b of spec.options[1]!) {
            for (const c of spec.options[2]!) {
              total++;
              const r = validateAnswers(def, answersByLabel(def, [a, b, c]));
              expect(r.complete).toBe(true);
              if (r.solved) solved.push([a, b, c]);
            }
          }
        }
        expect(total).toBe(27);
        expect(solved).toEqual([spec.answer]);
      });

      it('rejects incomplete answers without marking anything wrong', () => {
        const full = answersByLabel(def, spec.answer);
        for (const f of def.fields) {
          const partial = { ...full };
          delete partial[f.id];
          const r = validateAnswers(def, partial);
          expect(r.complete).toBe(false);
          expect(r.solved).toBe(false);
          expect(r.fields[f.id]).toBe('missing');
        }
        expect(validateAnswers(def, {}).solved).toBe(false);
      });

      it('reports each wrong field with its own feedback', () => {
        def.fields.forEach((f, i) => {
          const wrongLabel = spec.options[i]!.find((l) => l !== spec.answer[i])!;
          const labels = [...spec.answer];
          labels[i] = wrongLabel;
          const r = validateAnswers(def, answersByLabel(def, labels));
          expect(r.solved).toBe(false);
          expect(r.fields[f.id]).toBe('incorrect');
          expect(r.feedback).toEqual([f.feedback]);
          expect(f.feedback.length).toBeGreaterThan(10);
        });
      });

      it('ignores option ids that do not belong to the field', () => {
        const full = answersByLabel(def, spec.answer);
        const r = validateAnswers(def, { ...full, [def.fields[0]!.id]: 'not-an-option' });
        expect(r.complete).toBe(false);
        expect(r.solved).toBe(false);
      });

      it('offers three hints, the last one stating the answer', () => {
        expect(def.hints).toHaveLength(3);
        for (const label of spec.answer) expect(def.hints[2]).toContain(label.replace('NASA ARCHIVAL FACT', 'NASA ARCHIVAL FACT'));
      });
    });
  }

  it('uses the documented PZ-01 and PZ-02 feedback lines', () => {
    expect(puzzleById('PZ-01').fields.map((f) => f.feedback)).toEqual([
      'SEIS is the seismometer listed in this record.',
      'A seismometer records ground motion.',
      "Follow the record's interior-structure objective.",
    ]);
    expect(puzzleById('PZ-02').fields.map((f) => f.feedback)).toEqual([
      "Check this product's instrument label.",
      'A camera shows appearance; MB investigates iron-bearing minerals.',
      'Evidence of past water does not establish life or present flowing water.',
    ]);
  });

  it('PZ-00 starts OFF and only ON restores backup power', () => {
    const def = puzzleById('PZ-00');
    expect(def.fields).toHaveLength(1);
    const field = def.fields[0]!;
    expect(field.options.map((o) => o.label)).toEqual(['OFF', 'ON']);
    const off = field.options[0]!.id;
    const on = field.options[1]!.id;
    expect(def.initial).toEqual({ [field.id]: off });
    const stillOff = validateAnswers(def, { [field.id]: off });
    expect(stillOff.solved).toBe(false);
    expect(stillOff.feedback).toEqual(['Backup circuit is still off.']);
    expect(validateAnswers(def, { [field.id]: on }).solved).toBe(true);
    expect(def.hints).toEqual(['Set BACKUP POWER to ON, then confirm.']);
  });

  it('PZ-03 classifies the three documented cards', () => {
    expect(puzzleById('PZ-03').fields.map((f) => f.label)).toEqual([
      "SEIS recorded ground motion to study Mars' interior.",
      'This station is replaying its own queued archive request.',
      'The transmission proves someone is alive on Mars.',
    ]);
  });
});
