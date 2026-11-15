// Puzzle definitions from GAME_DESIGN_DOCUMENT.md. Answers are stable ids tied to reviewed
// claims; there is no randomness and no hidden audio or timing clue.

import type { PuzzleDefinition, PuzzleId } from '../game/contracts';

const CATEGORIES = [
  { id: 'fact', label: 'NASA ARCHIVAL FACT' },
  { id: 'fiction', label: 'FICTIONAL ARCHIVE SYSTEM' },
  { id: 'unsupported', label: 'UNSUPPORTED CLAIM' },
];

export const PUZZLES: PuzzleDefinition[] = [
  {
    id: 'PZ-00',
    title: 'Backup Power',
    zone: 'AIRLOCK',
    prerequisiteStage: 'ARRIVAL',
    layer: 'FICTIONAL ARCHIVE SYSTEM',
    layerNote: 'A switch of this fictional archive. It does not simulate a real spacecraft.',
    instruction: 'LOCAL ARCHIVE — request repeated. Restore backup power.',
    recordIds: [],
    fields: [
      {
        id: 'backup',
        label: 'BACKUP POWER',
        options: [
          { id: 'off', label: 'OFF' },
          { id: 'on', label: 'ON' },
        ],
        feedback: 'Backup circuit is still off.',
      },
    ],
    solution: { backup: 'on' },
    initial: { backup: 'off' },
    solutionClaimIds: [],
    hints: ['Set BACKUP POWER to ON, then confirm.'],
    success: 'Backup power restored. Door D0 is opening.',
    confirmLabel: 'Confirm',
  },
  {
    id: 'PZ-01',
    title: 'Restore the Listening Chain',
    zone: 'INSIGHT',
    prerequisiteStage: 'CHAPTER_TWO',
    layer: 'EDUCATIONAL MODEL',
    layerNote: 'EDUCATIONAL MODEL — archive indexing, not spacecraft operation.',
    instruction: 'What was listening? Match the instrument to its measurement and purpose.',
    recordIds: ['R-INSIGHT', 'R-SEIS-SOUND', 'R-INSIGHT-IMAGE'],
    fields: [
      {
        id: 'instrument',
        label: 'Instrument',
        options: [
          { id: 'seis', label: 'SEIS' },
          { id: 'mb', label: 'Mössbauer Spectrometer' },
          { id: 'solar', label: 'Solar array' },
        ],
        feedback: 'SEIS is the seismometer listed in this record.',
      },
      {
        id: 'records',
        label: 'What does it record?',
        options: [
          { id: 'motion', label: 'Ground motion' },
          { id: 'minerals', label: 'Iron-bearing mineral composition' },
          { id: 'energy', label: 'Electrical energy' },
        ],
        feedback: 'A seismometer records ground motion.',
      },
      {
        id: 'purpose',
        label: 'Scientific purpose',
        options: [
          { id: 'interior', label: "Study Mars' interior" },
          { id: 'mineralogy', label: 'Study rock mineralogy' },
          { id: 'power', label: 'Supply spacecraft power' },
        ],
        feedback: "Follow the record's interior-structure objective.",
      },
    ],
    solution: { instrument: 'seis', records: 'motion', purpose: 'interior' },
    solutionClaimIds: ['F07', 'F08'],
    hints: [
      'Read the instrument and science-goal fields in the NASA catalog.',
      'The sensor is SEIS. Follow what a seismometer measures.',
      "Choose SEIS → Ground motion → Study Mars' interior.",
    ],
    success: 'Record restored. A measurement is not a voice.',
    confirmLabel: 'Restore record',
  },
  {
    id: 'PZ-02',
    title: 'Witness in Stone',
    zone: 'OPPORTUNITY',
    prerequisiteStage: 'ARCHIVE_OPEN',
    layer: 'EDUCATIONAL MODEL',
    layerNote: 'EDUCATIONAL MODEL — archive indexing. No spectrum is simulated and no photograph is altered.',
    instruction: 'An image shows appearance. Another instrument tests composition. What can the evidence support?',
    recordIds: ['R-PIA05584', 'R-MER-INSTRUMENTS', 'R-WATER', 'R-OPPORTUNITY'],
    fields: [
      {
        id: 'camera',
        label: 'Camera for this image',
        options: [
          { id: 'pancam', label: 'Pancam' },
          { id: 'seis', label: 'SEIS' },
          { id: 'apxs', label: 'APXS' },
        ],
        feedback: "Check this product's instrument label.",
      },
      {
        id: 'minerals',
        label: 'Instrument for iron-bearing minerals',
        options: [
          { id: 'mb', label: 'Mössbauer Spectrometer' },
          { id: 'pancam', label: 'Pancam' },
          { id: 'seis', label: 'SEIS' },
        ],
        feedback: 'A camera shows appearance; MB investigates iron-bearing minerals.',
      },
      {
        id: 'conclusion',
        label: 'Supported conclusion from the combined evidence',
        options: [
          { id: 'water', label: 'Past water affected these deposits' },
          { id: 'life', label: 'Living organisms were confirmed' },
          { id: 'flowing', label: 'Liquid water is flowing here today' },
        ],
        feedback: 'Evidence of past water does not establish life or present flowing water.',
      },
    ],
    solution: { camera: 'pancam', minerals: 'mb', conclusion: 'water' },
    solutionClaimIds: ['F03', 'F04', 'F05'],
    hints: [
      'Check the labels: the instrument on the image product, and what each rover instrument does.',
      'Keep the two kinds of evidence apart. A camera shows appearance. The Mössbauer Spectrometer tests iron-bearing minerals.',
      'Choose Pancam → Mössbauer Spectrometer → Past water affected these deposits.',
    ],
    success: 'Record restored. Keep the observation. Check the conclusion.',
    confirmLabel: 'Restore record',
  },
  {
    id: 'PZ-03',
    title: 'Check the Provenance',
    zone: 'RELAY',
    prerequisiteStage: 'INSIGHT_RESTORED',
    layer: 'FICTIONAL ARCHIVE SYSTEM',
    layerNote: 'FICTIONAL ARCHIVE SYSTEM — the relay and its queue belong to this story. One card quotes a real NASA record.',
    instruction: 'Preserve what the records support. Classify each statement by where it comes from.',
    recordIds: ['R-INSIGHT', 'R-OPPORTUNITY'],
    fields: [
      {
        id: 'card-seis',
        label: "SEIS recorded ground motion to study Mars' interior.",
        options: CATEGORIES,
        feedback: 'Review card 1. Is there a real, citable source behind it?',
        reason: 'NASA record 2018-042A (claim F08). A real source you can open and check.',
      },
      {
        id: 'card-queue',
        label: 'This station is replaying its own queued archive request.',
        options: CATEGORIES,
        feedback: 'Review card 2. Who produced this diagnostic — NASA, or this station?',
        reason: 'A diagnostic of this story’s station. It is not a NASA document.',
      },
      {
        id: 'card-alive',
        label: 'The transmission proves someone is alive on Mars.',
        options: CATEGORIES,
        feedback: 'Review card 3. Does any record in this archive support that deduction?',
        reason: 'No evidence in this archive supports that deduction.',
      },
    ],
    solution: { 'card-seis': 'fact', 'card-queue': 'fiction', 'card-alive': 'unsupported' },
    solutionClaimIds: ['F08'],
    hints: [
      'NASA ARCHIVAL FACT has a cited NASA source. FICTIONAL ARCHIVE SYSTEM is something this station says about itself. UNSUPPORTED CLAIM is a conclusion no record backs.',
      'Card 1 matches the InSight record. Card 2 is the relay’s own diagnostic. Card 3 claims proof that no record provides.',
      'Choose NASA ARCHIVAL FACT → FICTIONAL ARCHIVE SYSTEM → UNSUPPORTED CLAIM.',
    ],
    success: 'Provenance checked. Preserve & Export is available.',
    confirmLabel: 'Check provenance',
  },
];

export function puzzleById(id: PuzzleId): PuzzleDefinition {
  const p = PUZZLES.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown puzzle ${id}`);
  return p;
}
