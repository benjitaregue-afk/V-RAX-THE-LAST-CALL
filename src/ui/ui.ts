// Science and narrative are read from reviewed content, never as executable HTML.
// The first hybrid terminal prototype is scoped to Opportunity pending visual review.
import type { GameState, PuzzleId, ScientificRecord } from '../game/contracts';
import { stageIndex } from '../game/contracts';
import { RECTS } from '../world/layout';
import { project } from '../game/projection';
import { PUZZLES, puzzleById } from '../content/puzzles';
import { RECORDS, recordById } from '../content/records';
import { SOURCES } from '../content/claims';
import { assetById } from '../content/assets';
import { BEATS, LEGACY_CARDS, RELAY_DIAGNOSTIC, TEXT } from '../content/narrative';
import type { Settings } from '../save/save';
import type { ValidationResult } from '../puzzles/validate';
import { STORY, SHIP_CONTEXT, SURVIVOR_PREMISE } from '../content/story';
import type { SceneBeat } from '../content/story';
import './style.css';
import './terminal.css';

export interface UIActions {
  getState(): GameState;
  getSettings(): Settings;
  start(fresh: boolean): void;
  resume(): void;
  recenter(): void;
  updateSettings(settings: Settings): void;
  submit(id: PuzzleId, answers: Record<string, string>): ValidationResult;
  preserve(): void;
  finishEnding(): void;
  keepExploring(): void;
  recordViewed(id: string): void;
  onCinematicBeat?(beat: SceneBeat): void;
}

const AI_DISCLOSURE = 'AI tools assisted with research notes, planning, code, in-game text, synthesized audio and original Blender environment and first-person hand art. Visual and artistic review is ongoing. NASA records and photographs are archival sources, not AI-generated observations.';
function node<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string, cls?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (text !== undefined) e.textContent = text;
  if (cls) e.className = cls;
  return e;
}
function button(text: string, action: () => void, cls = ''): HTMLButtonElement {
  const b = node('button', text, cls);
  b.type = 'button';
  b.addEventListener('click', action);
  return b;
}
function link(text: string, url: string): HTMLAnchorElement {
  const a = node('a', text);
  // All source URLs originate in the reviewed content. Still constrain the scheme.
  if (url.startsWith('https://')) a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  return a;
}
function details(title: string, ...children: Node[]): HTMLDetailsElement {
  const d = node('details');
  d.append(node('summary', title), ...children);
  return d;
}

export class GameUI {
  private readonly overlay = node('div', undefined, 'overlay');
  private readonly panel = node('section', undefined, 'panel');
  private readonly objective = node('p', '', 'objective');
  private readonly interaction = node('p', '', 'interaction');
  private readonly zone = node('span', '', 'zone');
  private readonly captionBox = node('div', undefined, 'caption-box');
  private readonly toast = node('div', '', 'toast');
  private readonly hudBox = node('div', undefined, 'hud');
  private readonly missionProgress = node('ol', undefined, 'mission-progress');
  private readonly missionCount = node('span', '', 'mission-count');
  private lastMissionStage = '';
  private closingFrame: HTMLElement | null = null;
  private hintAction: (() => void) | null = null;
  private cinematic: { title: string; beats: SceneBeat[]; index: number; beatStart: number; elapsed: number; onDone: () => void; onBeat?: (beat: SceneBeat, index: number) => void } | null = null;
  private noticeTimer = 0;
  private captionTimer = 0;

  constructor(private readonly root: HTMLElement, private readonly actions: UIActions) {
    this.panel.setAttribute('role', 'dialog');
    this.panel.setAttribute('aria-modal', 'true');
    this.panel.tabIndex = -1;
    this.overlay.append(this.panel);
    const top = node('div', undefined, 'hud-top');
    const identity = node('div', undefined, 'hud-identity');
    identity.append(node('span', 'VØRAX / SURVIVOR LINK'), node('span', 'LOCAL', 'hud-link-state'));
    const location = node('div', undefined, 'hud-location');
    location.append(this.zone, this.missionCount);
    top.append(identity, location, node('p', 'ACTIVE OBJECTIVE', 'hud-objective-label'), this.objective, this.missionProgress);
    this.missionProgress.setAttribute('aria-label', 'Ship recovery objectives');
    const controls = node('p', 'WASD move · Shift sprint · Mouse / arrows look · E inspect · F light · J journal · Esc pause', 'hud-controls');
    const mark = node('span', 'AI-ASSISTED FICTIONAL ENVIRONMENT', 'build-mark');
    this.hudBox.append(top, node('div', '+', 'reticle'), this.interaction, controls, mark);
    this.captionBox.setAttribute('aria-live', 'polite');
    this.toast.setAttribute('role', 'status');
    root.replaceChildren(this.hudBox, this.captionBox, this.toast, this.overlay);
    this.overlay.hidden = true;
    this.presentationSettings();
    document.addEventListener('keydown', (event) => {
      if (this.overlay.hidden) return;
      if (event.code === 'KeyH' && this.hintAction && !(event.target instanceof HTMLInputElement)) {
        event.preventDefault();
        this.hintAction();
      }
      if (event.key === 'Tab') {
        const items = Array.from(this.panel.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input, select, summary, [tabindex="0"]')).filter((e) => e.getClientRects().length > 0);
        const first = items[0];
        const last = items[items.length - 1];
        if (!first) { event.preventDefault(); this.panel.focus(); }
        else if (event.shiftKey && (document.activeElement === first || document.activeElement === this.panel)) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    });
  }

  private show(title: string, layer?: string): HTMLElement {
    this.presentationSettings();
    this.closingFrame?.remove(); this.closingFrame = null;
    this.overlay.classList.remove('terminal-overlay');
    this.panel.classList.remove('terminal-panel');
    delete this.panel.dataset.device;
    this.hintAction = null;
    this.cinematic = null;
    this.overlay.classList.remove('cinematic-overlay', 'ending-overlay');
    this.panel.classList.remove('cinematic-panel', 'end-panel');
    this.root.classList.remove('cinematic-active');
    delete this.panel.dataset.puzzle;
    delete this.panel.dataset.cinematic;
    delete this.panel.dataset.beat;
    delete this.panel.dataset.sequence;
    delete this.root.dataset.cinematic;
    delete this.root.dataset.cinematicBeat;
    this.panel.replaceChildren();
    this.panel.setAttribute('aria-label', title);
    if (layer) this.panel.append(node('p', layer, 'layer'));
    this.panel.append(node('h1', title));
    this.overlay.hidden = false;
    this.hudBox.classList.add('muted');
    requestAnimationFrame(() => this.panel.focus());
    return this.panel;
  }

  hide(): void {
    this.closeTerminalFrame();
    this.cinematic = null;
    delete this.panel.dataset.cinematic;
    delete this.panel.dataset.beat;
    delete this.panel.dataset.sequence;
    this.overlay.classList.remove('cinematic-overlay', 'ending-overlay');
    this.panel.classList.remove('cinematic-panel', 'end-panel');
    this.root.classList.remove('cinematic-active');
    delete this.root.dataset.cinematic;
    delete this.root.dataset.cinematicBeat;
    this.hintAction = null;
    this.overlay.hidden = true;
    this.hudBox.classList.remove('muted');
  }

  hud(objective: string, interaction: string, zone: string): void {
    if (this.objective.textContent !== objective) this.objective.textContent = objective;
    if (this.interaction.textContent !== interaction) this.interaction.textContent = interaction;
    if (this.zone.textContent !== zone) this.zone.textContent = zone;
    this.presentationSettings();
    const state = this.actions.getState();
    if (state.storyStage !== this.lastMissionStage) {
      this.lastMissionStage = state.storyStage;
      const current = stageIndex(state.storyStage);
      const steps = [
        ['Power', 'ARCHIVE_OPEN'], ['Opportunity', 'OPPORTUNITY_RESTORED'],
        ['InSight', 'INSIGHT_RESTORED'], ['Beacon', 'EPILOGUE'],
      ] as const;
      const complete = steps.filter(([, threshold]) => current >= stageIndex(threshold)).length;
      this.missionCount.textContent = `${complete} / ${steps.length} RECOVERY`;
      this.missionProgress.replaceChildren(...steps.map(([name, threshold], index) => {
        const item = node('li', name);
        const done = current >= stageIndex(threshold);
        item.classList.toggle('complete', done);
        if (!done && index === complete) item.setAttribute('aria-current', 'step');
        item.setAttribute('aria-label', `${name}: ${done ? 'complete' : index === complete ? 'current objective' : 'pending'}`);
        return item;
      }));
    }
  }

  private presentationSettings(): void {
    const settings = this.actions.getSettings();
    this.root.classList.toggle('reduced-intensity', settings.reducedIntensity);
    this.root.classList.toggle('large-interface-text', settings.textScale >= 1.25);
  }

  private calmInterface(): boolean {
    return this.actions.getSettings().reducedIntensity || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /** The closing shell is decorative; exploration and focus return immediately. */
  private closeTerminalFrame(): void {
    this.closingFrame?.remove(); this.closingFrame = null;
    if (!this.overlay.classList.contains('terminal-overlay') || this.overlay.hidden || this.calmInterface()) return;
    const rect = this.panel.getBoundingClientRect();
    const frame = node('div', undefined, 'terminal-closing-frame');
    frame.setAttribute('aria-hidden', 'true'); frame.inert = true;
    Object.assign(frame.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
    this.root.append(frame); this.closingFrame = frame;
    window.setTimeout(() => { frame.remove(); if (this.closingFrame === frame) this.closingFrame = null; }, 240);
  }

  caption(text: string, layer = 'FICTIONAL ARCHIVE SYSTEM'): void {
    window.clearTimeout(this.captionTimer);
    this.captionBox.replaceChildren(node('span', layer, 'layer'), node('p', text));
    this.captionBox.hidden = !text;
    this.captionTimer = window.setTimeout(() => { this.captionBox.hidden = true; }, 9500);
  }

  notify(text: string): void {
    window.clearTimeout(this.noticeTimer);
    this.toast.textContent = text;
    this.toast.hidden = false;
    this.noticeTimer = window.setTimeout(() => { this.toast.hidden = true; }, 7000);
  }

  showLoading(): void {
    const p=this.show('Loading archive', 'FICTIONAL SETTING · REAL MISSION RECORDS');
    p.append(node('p', 'Preparing the 3D environment, controls and local records…'));
  }

  showMenu(hasSave: boolean, notice?: string): void {
    const p = this.show(TEXT.title, 'FICTIONAL SETTING · REAL MISSION RECORDS');
    p.append(node('h2', TEXT.subtitle), node('p', SURVIVOR_PREMISE), node('p', BEATS[0]!.caption));
    p.append(node('p', 'Production-art build. Visual polish and performance review are in progress.', 'note'));
    if (notice) p.append(node('p', notice, 'feedback'));
    const row = node('div', undefined, 'actions');
    row.append(button(hasSave ? 'Continue saved game' : TEXT.enter, () => this.actions.start(false), 'primary'));
    if (hasSave) row.append(button(TEXT.newGame, () => this.confirmNewGame(() => this.showMenu(hasSave))));
    p.append(row, this.settings(), this.controls(), this.credits());
  }

  showPause(message?: string): void {
    const p = this.show('Archive paused', 'FICTIONAL ARCHIVE SYSTEM');
    p.append(node('p', project(this.actions.getState()).objective));
    if (message) p.append(node('p', message, 'feedback'));
    const row = node('div', undefined, 'actions');
    row.append(button(TEXT.resume, () => this.actions.resume(), 'primary'), button(TEXT.useKeyboard, () => {
      this.actions.updateSettings({ ...this.actions.getSettings(), lookMode: 'keyboard' });
      this.actions.resume();
    }), button('Recenter at checkpoint', () => { this.actions.recenter(); this.actions.resume(); }), button(TEXT.newGame, () => this.confirmNewGame(() => this.showPause())));
    p.append(row, this.settings(), this.controls(), this.credits());
  }

  private confirmNewGame(back: () => void): void {
    const p = this.show('Start a new game?');
    p.append(node('p', 'This resets VØRAX progress on this device. Your settings are kept.'), button('Start new game', () => this.actions.start(true), 'primary'), button('Keep current progress', back));
  }

  private controls(): HTMLDetailsElement {
    const dl = node('dl', undefined, 'controls-list');
    for (const [key, action] of TEXT.controls) dl.append(node('dt', key), node('dd', action));
    dl.append(node('dt', 'Shift'), node('dd', 'Hold to sprint; collisions stay active.'));
    return details('Controls and accessibility', dl, node('p', 'There is no timer, death or jump. Every puzzle has hints. Captions carry the information needed to play without sound. Arrow keys always provide an alternative way to look.'));
  }

  private settings(): HTMLDetailsElement {
    const box = node('div', undefined, 'settings-grid');
    const update = (key: keyof Settings, value: unknown): void => {
      this.actions.updateSettings({ ...this.actions.getSettings(), [key]: value });
      this.root.style.setProperty('--text-scale', String(this.actions.getSettings().textScale));
      this.presentationSettings();
    };
    const check = (key: 'reducedIntensity' | 'invertY', label: string): void => {
      const l = node('label', undefined, 'setting');
      const input = node('input'); input.type = 'checkbox'; input.checked = this.actions.getSettings()[key];
      input.addEventListener('change', () => update(key, input.checked));
      l.append(input, node('span', label)); box.append(l);
    };
    const range = (key: 'fov' | 'sensitivity' | 'master' | 'ambience' | 'effects' | 'brightness', label: string, min: number, max: number, step: number): void => {
      const l = node('label', undefined, 'setting');
      const input = node('input'); input.type = 'range'; input.min = String(min); input.max = String(max); input.step = String(step); input.value = String(this.actions.getSettings()[key]);
      const output = node('output', input.value);
      input.setAttribute('aria-label', label);
      input.addEventListener('input', () => { output.value = input.value; update(key, Number(input.value)); });
      l.append(node('span', label), input, output); box.append(l);
    };
    const select = (key: 'quality' | 'lookMode' | 'textScale', label: string, options: [string, string][]): void => {
      const l = node('label', undefined, 'setting');
      const input = node('select'); input.setAttribute('aria-label', label);
      for (const [value, name] of options) { const o = node('option', name); o.value = value; input.append(o); }
      input.value = String(this.actions.getSettings()[key]);
      input.addEventListener('change', () => update(key, key === 'textScale' ? Number(input.value) : input.value));
      l.append(node('span', label), input); box.append(l);
    };
    check('reducedIntensity', 'Reduced intensity'); check('invertY', 'Invert mouse Y');
    select('lookMode', 'Look mode', [['mouse', 'Mouse capture'], ['keyboard', 'Arrow keys']]);
    select('quality', 'Quality', [['standard', 'Standard'], ['low', 'Low']]);
    select('textScale', 'Text size', [['1', '100%'], ['1.25', '125%'], ['1.5', '150%']]);
    range('fov', 'Field of view', 60, 90, 1); range('sensitivity', 'Mouse sensitivity', 0.2, 3, 0.1);
    range('brightness', 'Brightness', 0.6, 1.6, 0.1); range('master', 'Master volume', 0, 1, 0.05);
    range('ambience', 'Ambience volume', 0, 1, 0.05); range('effects', 'Effects volume', 0, 1, 0.05);
    return details('Settings', box);
  }

  showPuzzle(id: PuzzleId): void {
    const def = puzzleById(id);
    const status = project(this.actions.getState()).puzzles[id];
    const p = this.show(def.title, def.layer);
    p.dataset.puzzle = id;
    p.append(node('p', SHIP_CONTEXT[id], 'ship-context'), node('p', def.layerNote, 'note'), node('p', def.instruction));
    if (id === 'PZ-03') p.append(this.diagnostic());
    if (status === 'locked') {
      p.append(node('p', 'Restore the previous record first. Follow the objective in your HUD.', 'feedback'), button(TEXT.resume, () => this.actions.resume()));
      return;
    }
    const columns = node('div', undefined, 'puzzle-columns');
    const evidence = node('section', undefined, 'evidence');
    if (def.recordIds.length) evidence.append(node('h2', 'Evidence library'));
    for (const recordId of def.recordIds) {
      const record = recordById(recordId);
      if (id === 'PZ-02' && recordId === 'R-PIA05584') {
        const primary = this.record(record); primary.classList.add('terminal-primary-record');
        evidence.append(primary);
        this.actions.recordViewed(record.id);
      } else {
        const d = details(record.title, this.record(record));
        d.addEventListener('toggle', () => { if (d.open) this.actions.recordViewed(record.id); });
        evidence.append(d);
      }
    }
    const form = node('form', undefined, 'puzzle-form');
    const answers: Record<string, string> = { ...(def.initial ?? {}) };
    const solved = status === 'solved';
    if (solved) Object.assign(answers, def.solution);
    const selects = new Map<string, HTMLSelectElement>();
    for (const field of def.fields) {
      const l = node('label', undefined, 'puzzle-field');
      const select = node('select');
      select.name = field.id; select.id = `${id}-${field.id}`; select.setAttribute('aria-label', field.label);
      const empty = node('option', 'Choose…'); empty.value = ''; select.append(empty);
      for (const opt of field.options) { const o = node('option', opt.label); o.value = opt.id; select.append(o); }
      select.value = answers[field.id] ?? ''; select.disabled = solved;
      select.addEventListener('change', () => { answers[field.id] = select.value; });
      l.append(node('span', field.label), select);
      if (solved && field.reason) l.append(node('small', field.reason));
      selects.set(field.id, select); form.append(l);
    }
    const result = node('div', undefined, 'feedback'); result.setAttribute('role', 'status');
    const hint = node('p', '', 'hint');
    let hintIndex = -1;
    const hintButton = button('Hint (H)', () => {
      hintIndex = Math.min(hintIndex + 1, def.hints.length - 1);
      hint.textContent = def.hints[hintIndex] ?? '';
    });
    this.hintAction = () => hintButton.click();
    if (!solved) {
      const submit = node('button', def.confirmLabel, 'primary'); submit.type = 'submit';
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const validation = this.actions.submit(id, answers);
        if (validation.solved) { this.showPuzzle(id); return; }
        result.replaceChildren(node('p', validation.complete ? 'Check the evidence and try again.' : 'Choose an answer for every field.'));
        for (const text of validation.feedback) result.append(node('p', text));
        for (const [key, select] of selects) select.setAttribute('aria-invalid', String(validation.fields[key] !== 'correct'));
      });
      form.append(submit, hintButton, hint);
    } else {
      result.append(node('p', def.success));
      if (id === 'PZ-01') result.append(this.legacy('LEGACY-INSIGHT'));
      if (id === 'PZ-02') result.append(this.legacy('LEGACY-OPPORTUNITY'));
    }
    form.append(result);
    if (id === 'PZ-03' && project(this.actions.getState()).canPreserve) form.append(button('Activate distress beacon', () => this.actions.preserve(), 'primary'), node('p', 'FICTIONAL SHIP SYSTEM: this opens the survivor channel in the story. No real spacecraft is contacted and no data is uploaded.', 'note'));
    form.append(button(TEXT.resume, () => this.actions.resume()));
    columns.append(evidence, form); p.append(columns);
    if (id === 'PZ-02') this.opportunityTerminal(p, evidence, form, def.recordIds.length);
  }

  /** First device prototype: only the Opportunity restoration terminal is dressed. */
  private opportunityTerminal(panel: HTMLElement, evidence: HTMLElement, form: HTMLElement, recordCount: number): void {
    this.overlay.classList.add('terminal-overlay'); panel.classList.add('terminal-panel');
    panel.dataset.device = 'opportunity-archive';
    const title = panel.querySelector('h1')!;
    const layer = panel.querySelector(':scope > .layer')!;
    const header = node('header', undefined, 'terminal-header');
    const identity = node('div', undefined, 'terminal-identity');
    identity.append(node('span', 'VØRAX / LOCAL ARCHIVE'), node('span', 'EAST BAY · CONSOLE 02', 'terminal-serial'));
    const heading = node('div', undefined, 'terminal-heading');
    const titleBlock = node('div'); titleBlock.append(layer, title);
    const state = node('div', undefined, 'terminal-state');
    state.append(node('span', 'LOCAL COPY', 'terminal-state-light'), node('span', 'SOURCES AVAILABLE OFFLINE'));
    heading.append(titleBlock, state);
    const nav = node('nav', undefined, 'terminal-nav'); nav.setAttribute('aria-label', 'Archive terminal sections');
    const jump = (target: HTMLElement): void => {
      target.scrollIntoView({ behavior: this.calmInterface() ? 'auto' : 'smooth', block: 'start' });
      target.focus({ preventScroll: true });
    };
    evidence.id = 'terminal-evidence'; evidence.tabIndex = -1; evidence.setAttribute('aria-label', 'Opportunity scientific evidence');
    form.id = 'terminal-restoration'; form.tabIndex = -1; form.setAttribute('aria-label', 'Opportunity restoration choices');
    nav.append(button('01 / Evidence', () => jump(evidence), 'terminal-section-link'), button('02 / Restore interpretation', () => jump(form), 'terminal-section-link'));
    header.append(identity, heading, nav);
    const brief = node('div', undefined, 'terminal-brief');
    for (const item of Array.from(panel.children)) if (item.tagName === 'P') brief.append(item);
    const mission = node('div', undefined, 'terminal-mission');
    mission.append(node('span', 'ACTIVE SHIP OBJECTIVE', 'terminal-kicker'), node('p', project(this.actions.getState()).objective));
    const rail = node('aside', undefined, 'terminal-rail');
    rail.setAttribute('aria-label', 'Fictional terminal location and archive index');
    rail.append(node('p', 'TERMINAL LOCATION', 'terminal-kicker'), node('h2', 'Opportunity'), node('p', 'EAST / WITNESS IN STONE', 'terminal-location'), this.stationMap());
    const index = node('div', undefined, 'terminal-index');
    index.append(node('p', 'ARCHIVE CONTENTS', 'terminal-kicker'), node('strong', `${String(recordCount).padStart(2, '0')} records`), node('p', 'Image · Instruments · Geological context · Mission catalog'));
    const limits = node('div', undefined, 'terminal-index');
    limits.append(node('p', 'INTERPRETATION', 'terminal-kicker'), node('p', 'Read the evidence. Separate appearance, composition and conclusion.'));
    rail.append(index, limits, node('p', 'TAB focus / H hint / ESC pause', 'terminal-keyboard'));
    const columns = panel.querySelector('.puzzle-columns')!;
    const workspace = node('div', undefined, 'terminal-workspace'); workspace.append(rail, columns);
    form.prepend(node('p', 'RESTORATION / EDUCATIONAL MODEL', 'terminal-kicker'), node('h2', 'Restore interpretation'));
    const footer = node('footer', undefined, 'terminal-footer');
    footer.append(node('span', 'FICTIONAL SHIP INTERFACE'), node('span', 'NASA evidence retains its source, credit and original image.'));
    panel.replaceChildren(header, mission, brief, workspace, footer);
  }

  private stationMap(): HTMLElement {
    const figure = node('figure', undefined, 'terminal-map');
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '-16 -32 32 42'); svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Fictional station layout. Opportunity is east of the hub.');
    for (const rect of RECTS) {
      const shape = document.createElementNS(ns, 'rect');
      shape.setAttribute('x', String(rect.x0)); shape.setAttribute('y', String(-rect.z1));
      shape.setAttribute('width', String(rect.x1 - rect.x0)); shape.setAttribute('height', String(rect.z1 - rect.z0));
      shape.setAttribute('class', rect.zone === 'OPPORTUNITY' ? 'map-current' : rect.kind === 'connector' ? 'map-connector' : 'map-room');
      svg.append(shape);
      if (rect.kind === 'room') {
        const text = document.createElementNS(ns, 'text');
        text.setAttribute('x', String((rect.x0 + rect.x1) / 2)); text.setAttribute('y', String(-(rect.z0 + rect.z1) / 2));
        text.textContent = ({ AIRLOCK: 'A0', HUB: 'HUB', OPPORTUNITY: 'OPP', INSIGHT: 'INS', RELAY: 'RELAY', OBSERVATION: 'DECK' } as const)[rect.zone];
        svg.append(text);
      }
    }
    figure.append(svg, node('figcaption', 'FICTIONAL SHIP LAYOUT'), node('p', '● East archive / current terminal', 'terminal-map-location'));
    return figure;
  }

  private record(r: ScientificRecord): HTMLElement {
    const section = node('article', undefined, 'science-record');
    section.dataset.record = r.id;
    section.append(node('p', r.layer, 'layer'), node('h3', r.title), node('p', `Mission / product: ${r.missionId}`));
    if (r.image) {
      const a = assetById(r.image.assetId);
      const figure = node('figure');
      const image = node('img'); image.alt = r.image.alt; image.src = `${import.meta.env.BASE_URL}${a.path}`; image.loading = 'lazy';
      const fallback = node('p', `Image unavailable. ${r.image.fallbackText}`, 'image-fallback'); fallback.hidden = true;
      image.addEventListener('error', () => { image.hidden = true; fallback.hidden = false; }, { once: true });
      figure.append(image, fallback, node('figcaption', r.image.caption));
      for (const label of r.image.labels) figure.append(node('span', label, 'image-label'));
      section.append(figure);
    }
    const dl = node('dl', undefined, 'record-fields');
    for (const field of r.sourceFields) dl.append(node('dt', field.label), node('dd', field.value));
    section.append(node('h4', 'Catalog fields'), dl, node('h4', 'Editorial explanation of the record'));
    for (const summary of r.editorialSummary) section.append(node('p', `${summary.aspect}: ${summary.text}`));
    section.append(link(`Primary source · ${r.sourceId}`, r.sourceUrl), node('p', `Credit: ${r.credit} · Retrieved ${r.retrievedAt}`, 'credit'), details('Usage conditions and evidence IDs', node('p', r.usageTerms), node('p', r.claimIds.join(' · '))));
    return section;
  }

  showRecord(id: string): void {
    const r = recordById(id);
    this.actions.recordViewed(id);
    const p = this.show(r.title, r.layer);
    p.append(this.record(r), button(TEXT.resume, () => this.actions.resume()), button('Journal', () => this.showJournal()));
  }

  private unlockedRecords(): string[] {
    const index = stageIndex(this.actions.getState().storyStage);
    return [...new Set([...this.actions.getState().viewedRecordIds, ...PUZZLES.filter((p) => index >= stageIndex(p.prerequisiteStage)).flatMap((p) => p.recordIds)])];
  }

  showJournal(): void {
    const state = this.actions.getState();
    const p = this.show('Archive journal', 'RECORDS · MAP · HINTS');
    p.append(node('p', project(state).objective), button(TEXT.resume, () => this.actions.resume(), 'primary'));
    const map = node('pre', '                     NORTH\n              [ OBSERVATION DECK ]\n                       |\n                   [ OBSERVATION DECK ]\n                       |\n                   [ RELAY ]\n                       | D2\n[ INSIGHT ] — HUB — D1 [ OPPORTUNITY ]\n                       | D0\n                   [ AIRLOCK ]', 'map');
    p.append(details('Archive map', map, node('p', 'D0 / D1: backup power · D2: both scientific records. Chapter I: Opportunity, east. Chapter II: InSight, west. The observation deck is north of the relay.')));
    const records = node('section'); records.append(node('h2', 'Unlocked records'));
    const ids = this.unlockedRecords();
    if (!ids.length) records.append(node('p', 'Restore backup power to open the first mission records.'));
    for (const r of RECORDS.filter((r) => ids.includes(r.id))) {
      const d = details(r.title, this.record(r));
      d.addEventListener('toggle', () => { if (d.open) this.actions.recordViewed(r.id); });
      records.append(d);
    }
    p.append(records);
    for (const puzzle of PUZZLES.filter((puzzle) => project(state).puzzles[puzzle.id] !== 'locked')) {
      const hints = node('div');
      for (const [i, hint] of puzzle.hints.entries()) hints.append(details(`Hint ${i + 1}`, node('p', hint)));
      p.append(details(`${puzzle.title} — hints`, hints));
    }
    const logs = node('section'); logs.append(node('h2', 'Ship log — fictional evacuation and rescue'));
    if(state.awakened)logs.append(node('p','FICTIONAL SHIP RECORD: evacuation completed while the survivor was unconscious after an impact. Find power and send a distress signal.'));
    if(stageIndex(state.storyStage)>=stageIndex('OPPORTUNITY_RESTORED'))logs.append(node('p','FICTIONAL EVACUATION MANIFEST: medical sensor offline; occupancy reconciliation incomplete. One berth incorrectly marked empty. The crew did not know anyone remained.'));
    if(stageIndex(state.storyStage)>=stageIndex('EPILOGUE'))logs.append(node('p','FICTIONAL RESCUE CHANNEL: Rescue One received the distress beacon. Reach the observation deck for visual confirmation.'));
    for (const b of BEATS.filter((b) => state.seenBeatIds.includes(b.id))) logs.append(node('p', `${b.layer}: ${b.caption}`));
    p.append(logs, this.credits());
  }

  private diagnostic(): HTMLElement {
    const box = node('section', undefined, 'diagnostic');
    box.append(node('p', 'FICTIONAL ARCHIVE SYSTEM', 'layer'), node('pre', RELAY_DIAGNOSTIC.join('\n')));
    return box;
  }

  private legacy(id: string): HTMLElement {
    const card = LEGACY_CARDS.find((card) => card.id === id);
    const section = node('section', undefined, 'legacy');
    if (!card) return section;
    section.append(node('p', 'NASA ARCHIVAL RECORD · cited editorial summary', 'layer'), node('h2', card.title));
    for (const row of card.rows) section.append(node('h3', row.question), node('p', row.answer));
    section.append(node('p', card.status.text, 'note'));
    for (const recordId of card.recordIds) {
      const record = recordById(recordId); section.append(link(`Source: ${record.sourceId}`, record.sourceUrl));
    }
    return section;
  }

  /** Cumulative elapsed seconds since showCinematic(), not frame delta. */
  updateCinematic(elapsedSeconds: number): void {
    const current = this.cinematic;
    if (!current || !Number.isFinite(elapsedSeconds)) return;
    current.elapsed = Math.max(current.elapsed, elapsedSeconds);
    const sinceBeat = current.elapsed - current.beatStart;
    const beat = current.beats[current.index];
    if (beat && sinceBeat >= Math.max(0.1, beat.duration)) this.nextCinematicBeat();
    this.root.style.setProperty('--cinematic-elapsed', String(current.elapsed));
  }

  showCinematic(title: string, beats: SceneBeat[], onDone: () => void, onBeat?: (beat: SceneBeat, index: number) => void): void {
    this.show(title, 'FICTIONAL STORY · ORIGINAL CHARACTER DIALOGUE');
    this.cinematic = { title, beats: [...beats], index: 0, beatStart: 0, elapsed: 0, onDone, onBeat };
    if (!beats.length) { this.skipCinematic(); return; }
    this.overlay.classList.add('cinematic-overlay');
    this.panel.classList.add('cinematic-panel');
    this.root.classList.add('cinematic-active');
    this.root.dataset.cinematic = title;
    this.panel.dataset.cinematic = title;
    this.captionBox.hidden = true;
    this.renderCinematicBeat();
  }

  private renderCinematicBeat(): void {
    const current = this.cinematic;
    if (!current) return;
    const beat = current.beats[current.index];
    if (!beat) { this.skipCinematic(); return; }
    this.root.dataset.cinematicBeat = String(current.index);
    this.panel.dataset.beat = String(current.index);
    this.panel.dataset.sequence = current.title;
    this.panel.replaceChildren();
    const title = node('h1', current.title, 'chapter-title');
    const body = node('div', undefined, 'cinematic-caption');
    body.setAttribute('aria-live', 'polite');
    body.append(node('p', beat.speaker, 'layer'), node('p', beat.text, 'cinematic-line'));
    const actions = node('div', undefined, 'cinematic-actions');
    actions.append(button('Continue', () => this.nextCinematicBeat(), 'primary'), button('Skip sequence', () => this.skipCinematic()));
    this.panel.append(title, body, node('p', `${current.index + 1} / ${current.beats.length} · Fictional emergency and dialogue. NASA evidence remains in the archive.`, 'note'), actions);
    current.onBeat?.(beat, current.index);
    this.actions.onCinematicBeat?.(beat);
  }

  private nextCinematicBeat(): void {
    const current = this.cinematic;
    if (!current) return;
    current.index++;
    current.beatStart = current.elapsed;
    if (current.index >= current.beats.length) this.skipCinematic();
    else this.renderCinematicBeat();
  }

  skipCinematic(): void {
    const current = this.cinematic;
    if (!current) return;
    const done = current.onDone;
    this.hide();
    done();
  }

  showEnding(): void {
    this.showCinematic('EPILOGUE\nNOT FORGOTTEN', STORY.monologue, () => this.actions.finishEnding());
  }

  showComplete(): void {
    const p = this.show('THE END', 'VØRAX · THE LAST SIGNAL');
    this.overlay.classList.add('ending-overlay');
    p.classList.add('end-panel');
    p.append(node('p', 'Some missions never truly end.', 'ending-line'));
    p.append(node('p', 'The evacuation, survivor, damaged spacecraft and Rescue One are fiction. The scientific records of Opportunity and InSight are real, with sources and credits available below.', 'note'));
    const row = node('div', undefined, 'actions');
    row.append(button('RESTART', () => this.actions.start(true), 'primary'), button('CREDITS', () => this.showFinalCredits()));
    p.append(row);
  }

  showFinalCredits(): void {
    const p = this.show('CREDITS', 'SCIENCE · ORIGINAL FICTION · CONTRIBUTORS');
    this.overlay.classList.add('ending-overlay');
    p.append(node('p', 'Opportunity and InSight: scientific legacy preserved through real NASA records. The survivor and rescue narrative is an original fictional frame, not historical mission evidence.'));
    p.append(this.legacy('LEGACY-OPPORTUNITY'), this.legacy('LEGACY-INSIGHT'));
    const credits = this.credits(); credits.open = true;
    p.append(credits, button('Back to THE END', () => this.showComplete()), button('RESTART', () => this.actions.start(true), 'primary'));
  }

  private credits(): HTMLDetailsElement {
    const body = node('section');
    body.append(node('p', TEXT.notOfficial), node('p', AI_DISCLOSURE), node('p', 'Technical foundation and integration: Codex. Scientific content, narrative and earlier Blender production: project team and prior attributed contributors. Original Blender environment art and animated first-person hands are included. Artistic review is ongoing. Babylon.js · TypeScript · Vite.'));
    for (const source of Object.values(SOURCES)) body.append(link(`${source.id} — ${source.title} · ${source.publisher}`, source.url));
    body.append(node('h3', 'Image credits'), node('p', 'PIA05584 — NASA/JPL/Cornell. PIA25680 — NASA/JPL-Caltech. Credits, transformations and usage conditions are displayed with each record.'));
    return details('Sources, credits and AI disclosure', body);
  }
}
