// Content validation, run in tests and once at boot. Small functions instead of a schema
// dependency (ARCHITECTURE.md). Returns human-readable problems; an empty list means valid.

import { STORY_STAGES, ZONE_IDS } from '../game/contracts';
import { ASSETS } from './assets';
import { CLAIMS, SOURCES } from './claims';
import { BEATS, ENDING_SLIDES, LEGACY_CARDS } from './narrative';
import { PUZZLES } from './puzzles';
import { RECORDS } from './records';

function duplicates(ids: string[]): string[] {
  return ids.filter((id, i) => ids.indexOf(id) !== i);
}

export function validateContent(): string[] {
  const problems: string[] = [];
  const claimIds = new Set(CLAIMS.map((c) => c.id));
  const recordIds = new Set(RECORDS.map((r) => r.id));
  const assetIds = new Set(ASSETS.map((a) => a.id));
  const needClaims = (where: string, ids: string[]): void => {
    for (const id of ids) if (!claimIds.has(id)) problems.push(`${where}: unknown claim ${id}`);
  };

  for (const [name, ids] of [
    ['claim', CLAIMS.map((c) => c.id)],
    ['record', RECORDS.map((r) => r.id)],
    ['puzzle', PUZZLES.map((p) => p.id)],
    ['beat', BEATS.map((b) => b.id)],
    ['asset', ASSETS.map((a) => a.id)],
    ['asset path', ASSETS.map((a) => a.path)],
  ] as [string, string[]][]) {
    for (const d of duplicates(ids)) problems.push(`duplicate ${name} id ${d}`);
  }

  for (const c of CLAIMS) {
    if (!/^F\d\d$/.test(c.id)) problems.push(`${c.id}: claim ids look like F01`);
    if (c.statementEn.trim().length < 20) problems.push(`${c.id}: statement too short`);
    if (c.evidenceKind === 'FACT' && c.sourceIds.length === 0) problems.push(`${c.id}: FACT without a source`);
    for (const s of c.sourceIds) if (!SOURCES[s]) problems.push(`${c.id}: unknown source ${s}`);
  }
  for (const s of Object.values(SOURCES)) {
    if (!s.url.startsWith('https://')) problems.push(`${s.id}: source URL must be https`);
  }

  for (const r of RECORDS) {
    const at = `record ${r.id}`;
    if (r.layer !== 'NASA ARCHIVAL RECORD') problems.push(`${at}: science records carry the NASA ARCHIVAL RECORD layer`);
    if (!SOURCES[r.sourceId]) problems.push(`${at}: unknown source ${r.sourceId}`);
    else if (SOURCES[r.sourceId]!.url !== r.sourceUrl) problems.push(`${at}: sourceUrl does not match ${r.sourceId}`);
    if (!r.credit.trim()) problems.push(`${at}: missing credit`);
    if (!r.usageTerms.trim()) problems.push(`${at}: missing usage terms`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(r.retrievedAt)) problems.push(`${at}: retrievedAt must be an ISO date`);
    if (r.sourceFields.length === 0) problems.push(`${at}: no source fields`);
    needClaims(at, r.claimIds);
    for (const f of r.sourceFields) {
      if (f.claimIds.length === 0) problems.push(`${at}: source field "${f.label}" has no claim`);
      needClaims(`${at} field "${f.label}"`, f.claimIds);
      for (const id of f.claimIds) if (!r.claimIds.includes(id)) problems.push(`${at}: field claim ${id} missing from record claimIds`);
    }
    for (const s of r.editorialSummary) needClaims(`${at} summary`, s.claimIds);
    if (r.image) {
      if (!assetIds.has(r.image.assetId)) problems.push(`${at}: unknown image asset ${r.image.assetId}`);
      if (r.image.alt.trim().length < 20) problems.push(`${at}: image needs alt text`);
      if (r.image.fallbackText.trim().length < 20) problems.push(`${at}: image needs a text fallback`);
      if (!r.image.caption.includes('Credit')) problems.push(`${at}: image caption must carry the credit`);
    }
  }

  for (const p of PUZZLES) {
    const at = `puzzle ${p.id}`;
    if (!STORY_STAGES.includes(p.prerequisiteStage)) problems.push(`${at}: unknown stage`);
    if (!ZONE_IDS.includes(p.zone)) problems.push(`${at}: unknown zone`);
    for (const id of p.recordIds) if (!recordIds.has(id)) problems.push(`${at}: unknown record ${id}`);
    needClaims(at, p.solutionClaimIds);
    if (p.hints.length === 0) problems.push(`${at}: needs at least one hint`);
    for (const d of duplicates(p.fields.map((f) => f.id))) problems.push(`${at}: duplicate field ${d}`);
    for (const f of p.fields) {
      for (const d of duplicates(f.options.map((o) => o.id))) problems.push(`${at}/${f.id}: duplicate option ${d}`);
      const answer = p.solution[f.id];
      if (!answer || !f.options.some((o) => o.id === answer)) problems.push(`${at}/${f.id}: solution is not one of the options`);
      if (!f.feedback.trim()) problems.push(`${at}/${f.id}: missing feedback`);
      if (p.initial && p.initial[f.id] !== undefined && !f.options.some((o) => o.id === p.initial![f.id])) {
        problems.push(`${at}/${f.id}: initial value is not an option`);
      }
    }
    for (const key of Object.keys(p.solution)) if (!p.fields.some((f) => f.id === key)) problems.push(`${at}: solution for unknown field ${key}`);
  }

  for (const b of BEATS) {
    if (b.layer === 'NASA ARCHIVAL RECORD') problems.push(`beat ${b.id}: scripted lines are never labelled as NASA records`);
    if (!b.caption.trim()) problems.push(`beat ${b.id}: empty caption`);
    if (b.isSoundCaption && !/^\[.*\]$/.test(b.caption)) problems.push(`beat ${b.id}: sound captions are bracketed`);
  }
  for (let i = 0; i <= 12; i++) {
    const id = `L${String(i).padStart(2, '0')}`;
    if (!BEATS.some((b) => b.id === id)) problems.push(`missing scripted beat ${id}`);
  }

  for (const card of LEGACY_CARDS) {
    if (card.rows.length !== 4) problems.push(`${card.id}: a legacy card answers four questions`);
    for (const row of card.rows) {
      if (row.claimIds.length === 0) problems.push(`${card.id}: "${row.question}" has no claim`);
      needClaims(card.id, row.claimIds);
    }
    needClaims(card.id, card.status.claimIds);
    for (const id of card.recordIds) if (!recordIds.has(id)) problems.push(`${card.id}: unknown record ${id}`);
  }
  for (const s of ENDING_SLIDES) {
    if (s.legacyId && !LEGACY_CARDS.some((c) => c.id === s.legacyId)) problems.push(`ending ${s.id}: unknown legacy card`);
  }

  for (const a of ASSETS) {
    const at = `asset ${a.id}`;
    for (const key of ['path', 'title', 'sourceUrl', 'rights', 'credit', 'fallback'] as const) {
      if (!a[key].trim()) problems.push(`${at}: missing ${key}`);
    }
    if (a.transforms.length === 0) problems.push(`${at}: transforms must be stated, even when there are none`);
    if (a.kind === 'image' && a.aiAssisted) problems.push(`${at}: NASA evidence is never marked as AI-assisted`);
  }

  return problems;
}
