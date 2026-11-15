// Script from NARRATIVE_BIBLE.md (direction A, "The Preservation Loop"), plus the UI copy that
// surrounds it. Fiction is always labelled as fiction. No line here is a NASA quotation.

import type { NarrativeBeat } from '../game/contracts';

export const BEATS: NarrativeBeat[] = [
  { id: 'L00', trigger: 'menu', layer: 'EDITORIAL NOTE', caption: 'A fictional archive. Real mission records. Quiet tension, darkness and mechanical sounds.', durationMs: 0 },
  { id: 'L01', trigger: 'start', layer: 'FICTIONAL ARCHIVE SYSTEM', caption: 'LOCAL ARCHIVE — request repeated. Restore backup power.', durationMs: 7000 },
  { id: 'L02', trigger: 'PZ-00 solved', layer: 'FICTIONAL ARCHIVE SYSTEM', caption: 'Two records remain unverified. Begin with the listening station.', durationMs: 7000 },
  { id: 'L03', trigger: 'InSight terminal', layer: 'EDUCATIONAL MODEL', caption: 'What was listening? Match the instrument to its measurement and purpose.', durationMs: 0 },
  { id: 'L04', trigger: 'PZ-01 solved', layer: 'EDITORIAL NOTE', caption: 'Record restored. A measurement is not a voice.', durationMs: 7000 },
  { id: 'L05', trigger: 'return to hub after PZ-01', layer: 'FICTIONAL ARCHIVE SYSTEM', caption: '[A mechanical click repeats behind you.]', durationMs: 6000, isSoundCaption: true },
  { id: 'L06', trigger: 'Opportunity terminal', layer: 'EDUCATIONAL MODEL', caption: 'An image shows appearance. Another instrument tests composition. What can the evidence support?', durationMs: 0 },
  { id: 'L07', trigger: 'PZ-02 solved', layer: 'EDITORIAL NOTE', caption: 'Record restored. Keep the observation. Check the conclusion.', durationMs: 7000 },
  { id: 'L08', trigger: 'relay access', layer: 'FICTIONAL ARCHIVE SYSTEM', caption: 'REMOTE UPLINK: OFFLINE. REPLAY SOURCE: LOCAL QUEUE.', durationMs: 8000 },
  { id: 'L09', trigger: 'relay terminal', layer: 'FICTIONAL ARCHIVE SYSTEM', caption: 'Preserve what the records support.', durationMs: 0 },
  { id: 'L10', trigger: 'Preserve & Export', layer: 'FICTIONAL ARCHIVE SYSTEM', caption: 'No new call. A request waiting to be understood.', durationMs: 0 },
  { id: 'L11', trigger: 'ending', layer: 'EDITORIAL NOTE', caption: 'The machines remain. Their discoveries travel on.', durationMs: 0 },
  {
    id: 'L12',
    trigger: 'credits',
    layer: 'EDITORIAL NOTE',
    caption:
      'Fictional setting and events. Historical mission information is attributed in the archive. This is not an official NASA product; NASA does not endorse this project.',
    durationMs: 0,
  },
  // Suspense events and station sounds. All invented for this story.
  { id: 'S01', trigger: 'start', layer: 'FICTIONAL ARCHIVE SYSTEM', caption: '[Three slow pulses repeat somewhere north of you.]', durationMs: 6000, isSoundCaption: true },
  { id: 'S02', trigger: 'hub after PZ-02', layer: 'FICTIONAL ARCHIVE SYSTEM', caption: '[A shadow crosses the hub floor: the maintenance arm, cycling.]', durationMs: 6000, isSoundCaption: true },
  { id: 'S03', trigger: 'relay access', layer: 'FICTIONAL ARCHIVE SYSTEM', caption: 'LOCAL ARCHIVE — request repeated. LOCAL ARCHIVE — request repeated.', durationMs: 6000 },
  { id: 'S04', trigger: 'ending', layer: 'FICTIONAL ARCHIVE SYSTEM', caption: '[The three pulses stop. The ventilation settles.]', durationMs: 6000, isSoundCaption: true },
];

export const BEAT_IDS: string[] = BEATS.map((b) => b.id);

export function beat(id: string): NarrativeBeat {
  const b = BEATS.find((x) => x.id === id);
  if (!b) throw new Error(`Unknown beat ${id}`);
  return b;
}

/** Written substitutes used when "Reduced intensity" removes a sound or a moving shadow. */
export const REDUCED_SUBSTITUTES: Record<string, string> = {
  L05: 'DIAGNOSTIC: maintenance arm cycled in the hub. No personnel detected.',
  S02: 'DIAGNOSTIC: maintenance arm cycled in the hub. No personnel detected.',
};

export interface LegacyCard {
  id: string;
  missionId: string;
  title: string;
  /** The four questions every legacy card answers (NARRATIVE_BIBLE.md). */
  rows: { question: string; answer: string; claimIds: string[] }[];
  status: { text: string; claimIds: string[] };
  recordIds: string[];
}

export const LEGACY_CARDS: LegacyCard[] = [
  {
    id: 'LEGACY-INSIGHT',
    missionId: '2018-042A',
    title: 'InSight — what it leaves behind',
    rows: [
      { question: 'What was it?', answer: 'A stationary lander on Mars (NASA record 2018-042A).', claimIds: ['F07'] },
      { question: 'Why was it sent?', answer: 'To investigate the interior structure of Mars.', claimIds: ['F07'] },
      { question: 'How did it gather information?', answer: 'Its seismometer, SEIS, recorded ground motion. Seismic waves reveal what lies inside a planet.', claimIds: ['F08'] },
      { question: 'What knowledge did it make possible?', answer: "A way to study Mars' crust, mantle and core. NASA reported 1,319 marsquakes by the end of the mission.", claimIds: ['F10'] },
    ],
    status: { text: 'Last transmission 2022-12-15. Mission declared over 2022-12-21.', claimIds: ['F09'] },
    recordIds: ['R-INSIGHT'],
  },
  {
    id: 'LEGACY-OPPORTUNITY',
    missionId: '2003-032A',
    title: 'Opportunity — what it leaves behind',
    rows: [
      { question: 'What was it?', answer: 'A solar-powered rover: Mars Exploration Rover B (NASA record 2003-032A).', claimIds: ['F01', 'F02'] },
      { question: 'Why was it sent?', answer: 'For geological investigations, including the search for clues to past water.', claimIds: ['F01'] },
      { question: 'How did it gather information?', answer: 'Pancam pictured the terrain. Arm instruments such as the Mössbauer Spectrometer tested what rocks are made of.', claimIds: ['F02', 'F03'] },
      { question: 'What knowledge did it make possible?', answer: 'Its study of small spherules and the rock around them provided evidence of past water on Mars — not evidence of life.', claimIds: ['F05'] },
    ],
    status: { text: 'Last communication 2018-06-10. End of mission declared 2019-02-13.', claimIds: ['F06'] },
    recordIds: ['R-OPPORTUNITY', 'R-WATER'],
  },
];

/** The relay's own diagnostic. Fiction: no date, no NASA field, no mission telemetry. */
export const RELAY_DIAGNOSTIC: string[] = [
  'VØRAX CONTINUITY ROUTINE',
  'REMOTE UPLINK ........ OFFLINE',
  'REPLAY SOURCE ........ LOCAL QUEUE',
  'QUEUED REQUEST ....... "VERIFY RECORDS 2018-042A, 2003-032A"',
  'REPEATS .............. UNTIL VERIFIED',
];

export const TEXT = {
  title: 'VØRAX',
  subtitle: 'THE LAST SIGNAL',
  enter: 'Enter archive',
  continue: 'Continue',
  newGame: 'New game',
  resume: 'Return to archive',
  premise:
    'You are a preservation technician. An automated archive keeps repeating one request. Find out what it is asking for.',
  notOfficial: 'Not an official NASA product. NASA does not endorse this project.',
  aiMark: 'AI-assisted production · fictional setting',
  controls: [
    ['W A S D', 'Move'],
    ['Mouse', 'Look (click to capture the pointer)'],
    ['Arrow keys', 'Look without the mouse'],
    ['E', 'Inspect the object in the reticle'],
    ['F', 'Flashlight on / off'],
    ['J', 'Journal: records, hints, map'],
    ['H', 'Next hint (inside a terminal)'],
    ['Esc', 'Pause; close a terminal'],
  ] as [string, string][],
  pointerLockFailed: 'The pointer could not be captured. Try again, or look around with the arrow keys instead.',
  retryCapture: 'Retry mouse capture',
  useKeyboard: 'Use arrow keys to look',
  saveFailed: 'Progress could not be saved on this device. This session continues in memory.',
  saveUnreadable: 'Saved progress could not be read, so it was not loaded. You can start a new session.',
  recentered: 'Returned to the last safe point. No progress was changed.',
  outOfBounds: 'Position recovered to the last safe point.',
  hintNudge: 'Stuck? The Hint button is always available (H).',
  preserve: 'Preserve & Export',
  preserveNote: '"Export" is part of the story: the records are kept inside the fictional archive. Nothing is uploaded or downloaded.',
  recordsPreserved: 'Records preserved',
  endingClosing: 'No transmission arrived from Mars in this story. The request was local. The records are real, and they are safe.',
  keepExploring: 'Keep exploring',
  skip: 'Skip presentation',
  next: 'Continue',
  unsupported: 'This experience needs WebGL 2, which this browser or device did not provide.',
  contextLost: 'The graphics context was lost. Your progress is safe. Reload to continue from the last checkpoint.',
  fatal: 'Something went wrong while running the archive. Your progress is saved at the last checkpoint.',
  reload: 'Reload',
  fictionExplained:
    'The station, VØRAX, its messages, its malfunction and every sound you heard are fiction made for this game. The mission facts, dates, instruments and the two photographs are NASA records, credited where they appear. The 3D exhibits are illustrative models, not recovered hardware.',
  aiDisclosure:
    'AI use disclosure: the project vision and constraints came from the human team. AI tools assisted with research notes, planning, code, in-game text, the Blender-built 3D models and the synthesized audio. NASA records and photographs are archival sources and were not generated or altered by AI.',
} as const;

export const ENDING_SLIDES: { id: string; layer: NarrativeBeat['layer']; lines: string[]; legacyId?: string; diagnostic?: boolean }[] = [
  { id: 'E1', layer: 'FICTIONAL ARCHIVE SYSTEM', lines: ['No new call. A request waiting to be understood.'], diagnostic: true },
  { id: 'E2', layer: 'NASA ARCHIVAL RECORD', lines: [], legacyId: 'LEGACY-INSIGHT' },
  { id: 'E3', layer: 'NASA ARCHIVAL RECORD', lines: [], legacyId: 'LEGACY-OPPORTUNITY' },
  { id: 'E4', layer: 'EDITORIAL NOTE', lines: ['The machines remain. Their discoveries travel on.'] },
];
