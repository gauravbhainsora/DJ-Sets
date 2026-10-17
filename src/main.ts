import { GENRES, loadCatalog, type Genre, type Recording, type EnergyEstimate } from './catalog';
import { arcError, curvePoints, defaultArc, type Phase } from './energy-arc';
import { constraintNotes, createSetPlan, elapsedTimes, energyFor, formatTime, guidance, moveTrack, replaceTrack, timingError, totalSeconds, type SetPlan, type TrackPlacement } from './set-plan';
import './style.css';
import { downloadFile, MAX_BACKUP_BYTES, readSavedPlans, savePlan, validateBundle, type PlanBundle } from './persistence';
import { csvForPlan, localPlaylist, textForPlan } from './exports';
import { localFilePath, matchRecording, parseLibrary } from './local-library';

const app = document.querySelector<HTMLElement>('#app')!;
app.innerHTML = `
  <div class="workspace">
    <header class="masthead">
      <a class="brand" href="./" aria-label="DJ Sets home">
        <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
        DJ SETS<span class="brand-divider">/</span><span class="brand-subtitle">THE PLANNING ROOM</span>
      </a>
      <span class="local-badge"><span aria-hidden="true"></span>Local workspace</span>
    </header>

    <section class="intro" aria-labelledby="intro-title">
      <div>
        <p class="eyebrow">GOOD SETS START WITH INTENTION</p>
        <h1 id="intro-title">Find your starting groove.</h1>
        <p class="intro-copy">Choose a direction. Discover the recordings. Start shaping your next set.</p>
      </div>
      <div class="edition"><span>YOUR MUSIC. YOUR DIRECTION.</span><strong>Set planner <span>01</span></strong></div>
    </section>

    <div class="planner-layout">
      <aside class="controls-panel" aria-label="Set plan settings">
        <form id="plan-form">
          <p class="eyebrow"><span class="step">01</span> THE DIRECTION</p>
          <fieldset>
            <legend>Choose genres</legend>
            <p class="field-hint">Select one or more. Emphasis guides the balance, without fixed shares.</p>
            <div id="genre-options" class="genre-options"></div>
          </fieldset>
          <label class="setting">Target duration (minutes)<input id="target-duration" type="number" min="1" max="1440" step="1" value="120" required /></label>
          <label class="setting">Performance context<input id="performance-context" type="text" value="" list="contexts" placeholder="e.g. Warm-up, Headline, Closing" /></label>
          <datalist id="contexts"><option value="Warm-up"></option><option value="Headline"></option><option value="Closing"></option></datalist>
          <details class="required-tracks"><summary>Must-include tracks</summary><label class="setting">Required recordings from catalog<select id="required-recordings" multiple size="5"></select></label><label class="setting">Additional required recordings<textarea id="additional-required" placeholder="Artist — title (version), one per line"></textarea></label><p class="session-note">Requests outside the catalog remain explicitly unresolved.</p></details>
          <button class="generate-button" id="generate" type="submit" disabled>Generate set plan<span aria-hidden="true">↗</span></button>
          <p class="session-note">No account needed. Save changes in this browser or download a portable backup.</p>
        </form>
        <div class="catalog-note">
          <span class="note-symbol" aria-hidden="true">◎</span>
          <h2>A small, considered collection.</h2>
          <p>Discovery is limited to this starter catalog. No live catalog search.</p>
          <p id="catalog-summary" class="catalog-summary">Loading starter catalog…</p>
        </div>
      </aside>

      <section class="plan-panel" aria-labelledby="plan-title">
        <div class="plan-heading">
          <div><p class="eyebrow"><span class="step">02</span> THE TRACKLIST</p><h2 id="plan-title" tabindex="-1">A blank canvas, for now.</h2></div>
          <span id="track-count" class="count-badge">NO TRACKS YET</span>
        </div>
        <p id="plan-status" role="status" class="plan-status">Choose a genre and generate your first set plan.</p>
        <p id="edit-error" class="edit-error" role="alert" hidden></p>
        <div id="constraint-notes" class="constraint-notes" aria-label="Constraint assessment" hidden></div>
        <div id="timing-summary" class="timing-summary" hidden><span>Estimated duration <strong aria-label="Estimated duration" id="estimated-duration"></strong></span><span>Difference <strong aria-label="Difference from target" id="target-difference"></strong></span><small>Estimate based on planned play times and overlaps.</small></div>
        <section class="arc-panel" aria-label="Energy arc">
          <h3>Shape the energy</h3><p>Target energy <span class="target-key">━</span> / Track energy estimates <span class="estimate-key">●</span></p>
          <svg id="arc-chart" viewBox="0 0 800 250" role="img" aria-label="Energy arc and track estimates"></svg>
          <p id="energy-uncertainty">Energy progression is unverified for recordings with unknown estimates. Target energy is a goal, not measured track energy.</p>
          <details><summary>Edit energy arc</summary><div id="arc-controls" class="arc-controls"></div></details>
        </section>
        <p class="scroll-hint">Scroll the tracklist horizontally for timing, preparation, editing, and local-library matches.</p>
        <div id="empty-state" class="empty-state">
          <div class="record" aria-hidden="true"><div></div></div>
          <h3>Every set has a first track.</h3>
          <p>Your selection will appear here, with exact versions,<br class="desktop-break" /> source links, and the metadata we can verify.</p>
        </div>
        <div id="tracklist-wrapper" class="table-scroll" role="region" aria-label="Tracklist horizontal scroll area" tabindex="0" hidden>
          <table>
            <caption class="sr-only">Tracklist</caption>
            <thead><tr><th scope="col">#</th><th scope="col">Recording</th><th scope="col">Version</th><th scope="col">BPM</th><th scope="col">Key</th><th scope="col">Full length</th><th scope="col">Energy</th><th scope="col">Source</th><th scope="col">Elapsed</th><th scope="col">Play / overlap (seconds)</th><th scope="col">Phase / preparation</th><th scope="col">Edit selection</th><th scope="col">Local library</th></tr></thead>
            <tbody id="tracklist"></tbody>
          </table>
        </div>
        <div id="plan-notes" class="plan-notes" hidden>
          <p><span aria-hidden="true">↳</span> A proposed sequence from your genres, performance context, and available metadata. Audition transitions before performing.</p>
          <p>BPM, key, and full recording length are source-reported. Energy estimates show their basis and confidence; unsupported values remain unknown.</p>
        </div>
      </section>
    </div>

    <section class="storage-panel" aria-label="Saved work">
      <h2>Keep your preparation</h2>
      <div class="toolbar"><label>Plan name<input id="plan-name" type="text" value="Untitled set" maxlength="120" /></label><button id="save-plan" type="button">Save plan</button><label>Saved plans<select id="saved-plans"></select></label><button id="open-plan" type="button">Open saved plan</button><button id="backup-plan" type="button">Back up plan</button><label class="file-label">Import plan backup<input id="import-backup" type="file" accept="application/json,.json" /></label></div>
      <p id="storage-status" aria-live="polite">Changes are not saved until you choose Save plan.</p>
      <div class="toolbar export-toolbar"><button id="export-csv" type="button">Export CSV</button><button id="export-text" type="button">Export text</button><span>Complete plan, including unmatched recommendations.</span></div>
      <div class="toolbar export-toolbar"><label class="file-label">Import Rekordbox XML<input id="import-library" type="file" accept=".xml,application/xml,text/xml" /></label><p id="library-status" aria-label="Library import status">Optional local-library metadata. Audio stays on your computer.</p></div>
      <div class="toolbar export-toolbar"><button id="export-playlist" type="button">Export local playlist</button><span>M3U8: matched local files in plan order. Planned play times and transitions remain preparation notes.</span></div><p id="playlist-status" aria-label="Local playlist export status">No local-file playlist exported yet.</p>
    </section>

    <footer class="footer"><span>LESS SEARCHING. MORE SELECTING.</span><span>A space to prepare your next performance.</span></footer>
  </div>
`;

const genreOptions = document.querySelector<HTMLDivElement>('#genre-options')!;
const generateButton = document.querySelector<HTMLButtonElement>('#generate')!;
const catalogSummary = document.querySelector<HTMLParagraphElement>('#catalog-summary')!;
const planTitle = document.querySelector<HTMLHeadingElement>('#plan-title')!;
const planStatus = document.querySelector<HTMLParagraphElement>('#plan-status')!;
const trackCount = document.querySelector<HTMLSpanElement>('#track-count')!;
const tracklist = document.querySelector<HTMLTableSectionElement>('#tracklist')!;

let catalog: readonly Recording[] = [];
let selectedGenres: Genre[] = [GENRES[0]];
const genreEmphasis: Partial<Record<Genre, number>> = {};
let plan: SetPlan | null = null;
let draftArc: readonly Phase[] = defaultArc(7200);
let energyCorrections: SetPlan['energyCorrections'] = {};

function renderArc(): void {
  const svg = document.querySelector<SVGSVGElement>('#arc-chart')!;
  svg.replaceChildren();
  const arc = plan?.arc ?? draftArc;
  const duration = Math.max(arc.at(-1)!.endSeconds, plan ? totalSeconds(plan) : 0);
  const point = (time: number, energy: number) => `${20 + time / duration * 760},${200 - energy * 16}`;
  const node = (name: string, attributes: Record<string, string>, text?: string): Element => {
    const element = document.createElementNS('http://www.w3.org/2000/svg', name);
    for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
    if (text) element.textContent = text;
    svg.append(element); return element;
  };
  for (const energy of [2, 4, 6, 8, 10]) {
    node('line', { x1: '20', x2: '780', y1: String(200 - energy * 16), y2: String(200 - energy * 16), stroke: '#393042' });
    node('text', { x: '3', y: String(204 - energy * 16), fill: '#b1a5c4', 'font-size': '10' }, String(energy));
  }
  arc.forEach((phase, index) => {
    const start = arc[index - 1]?.endSeconds ?? 0;
    const points = curvePoints(arc, index, plan ? elapsedTimes(plan) : []).map(([time, energy]) => point(time, energy));
    node('polyline', { points: points.join(' '), fill: 'none', stroke: '#c8b5f6', 'stroke-width': '2' });
    const center = String(20 + (start + phase.endSeconds) / 2 / duration * 760);
    node('text', { x: center, y: '220', fill: '#c3b5d6', 'font-size': '10', 'text-anchor': 'middle' }, index === 4 ? 'Climax + landing' : phase.name);
    node('text', { x: center, y: '237', fill: '#aa9cb9', 'font-size': '10', 'text-anchor': 'middle' }, `${Math.round(start / 60 * 10) / 10}–${Math.round(phase.endSeconds / 60 * 10) / 10}m`);
  });
  if (plan) {
    const elapsed = elapsedTimes(plan);
    plan.placements.forEach((placement, index) => {
      const recording = catalog.find(item => item.id === placement.recordingId)!;
      const energy = energyFor(plan!, recording);
      if (energy) {
        const [x, y] = point(elapsed[index]!, energy.value).split(',');
        const circle = node('circle', { cx: x!, cy: y!, r: '4', fill: '#8dd5b5' });
        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title'); title.textContent = `Track ${index + 1}: ${recording.title}; ${energy.value}/10; ${energy.basis}`; circle.append(title);
      }
    });
  }
  document.querySelector<HTMLElement>('#energy-uncertainty')!.hidden = !!plan?.placements.length && plan.placements.every(placement => energyFor(plan!, catalog.find(recording => recording.id === placement.recordingId)!) !== null);
}

function renderArcControls(): void {
  const controls = document.querySelector<HTMLElement>('#arc-controls')!;
  controls.replaceChildren();
  draftArc.forEach((phase, index) => {
    const group = document.createElement('div');
    const name = document.createElement('strong'); name.textContent = phase.name; group.append(name);
    for (const [field, labelText, value] of [
      ['endSeconds', `End of ${phase.name} (minutes)`, phase.endSeconds / 60],
      ['startEnergy', `Start target for ${phase.name}`, phase.startEnergy],
      ['endEnergy', `End target for ${phase.name}`, phase.endEnergy],
    ] as const) {
      const label = document.createElement('label'); label.textContent = labelText;
      const input = document.createElement('input'); input.type = 'number'; input.step = 'any'; input.value = String(Math.round(value * 1000) / 1000);
      input.min = field === 'endSeconds' ? '.01' : '1'; if (field !== 'endSeconds') input.max = '10';
      input.disabled = index === 4 && field === 'endSeconds';
      input.addEventListener('change', () => {
        const next = draftArc.map((item, i) => i === index ? { ...item, [field]: input.valueAsNumber * (field === 'endSeconds' ? 60 : 1) } : item);
        const error = arcError(next, draftArc.at(-1)!.endSeconds); showError(error);
        if (error) { input.value = String(draftArc[index]![field] / (field === 'endSeconds' ? 60 : 1)); return; }
        draftArc = next;
        if (plan) { plan = { ...plan, arc: next }; renderPlan(plan); }
        else renderArc();
      });
      label.append(input); group.append(label);
    }
    controls.append(group);
  });
}

document.querySelector<HTMLInputElement>('#target-duration')!.addEventListener('change', event => {
  const input = event.target as HTMLInputElement;
  if (!input.validity.valid) return;
  const duration = input.valueAsNumber * 60;
  const ratio = duration / draftArc.at(-1)!.endSeconds;
  draftArc = draftArc.map(phase => ({ ...phase, endSeconds: phase.endSeconds * ratio }));
  renderArcControls();
  if (plan) { plan = { ...plan, targetSeconds: duration, arc: draftArc }; renderPlan(plan); }
  else renderArc();
});
renderArcControls(); renderArc();

for (const [index, genre] of GENRES.entries()) {
  const label = document.createElement('label');
  label.className = 'genre-option';
  const radio = document.createElement('input');
  radio.type = 'checkbox';
  radio.name = 'genre';
  radio.value = genre;
  radio.setAttribute('aria-label', genre);
  radio.checked = index === 0;
  radio.addEventListener('change', () => { selectedGenres = GENRES.filter(item => genreOptions.querySelector<HTMLInputElement>(`input[value="${item}"]`)!.checked); });
  const name = document.createElement('span');
  name.textContent = genre;
  const count = document.createElement('span');
  count.className = 'genre-count';
  count.setAttribute('aria-hidden', 'true');
  label.append(radio, name, count);
  genreOptions.append(label);
  const emphasis = document.createElement('label'); emphasis.className = 'emphasis-setting'; emphasis.textContent = 'Emphasis';
  const weight = document.createElement('input'); weight.type = 'number'; weight.min = '1'; weight.max = '10'; weight.value = '1'; weight.step = '1'; weight.setAttribute('aria-label', `Emphasis for ${genre}`);
  weight.addEventListener('change', () => {
    if (!weight.validity.valid) { showError('Genre emphasis must be between 1 and 10.'); return; }
    genreEmphasis[genre] = weight.valueAsNumber; showError(null);
  });
  emphasis.append(weight); genreOptions.append(emphasis);
}

function cell(value: string | number | null): HTMLTableCellElement {
  const element = document.createElement('td');
  element.textContent = value === null ? 'Unknown' : String(value);
  if (value === null) element.className = 'unknown';
  return element;
}

function showError(message: string | null): void {
  const error = document.querySelector<HTMLElement>('#edit-error')!;
  error.textContent = message;
  error.hidden = !message;
}

function changeTiming(index: number, field: 'playSeconds' | 'overlapSeconds', value: number): void {
  if (!plan) return;
  const changed = { ...plan, placements: plan.placements.map((placement, i) => i === index ? { ...placement, [field]: value } : placement) };
  const error = timingError(changed, catalog);
  showError(error);
  if (!error) { plan = changed; renderPlan(plan); }
}

function recordingRow(recording: Recording, position: number, placement: TrackPlacement, elapsed: number): HTMLTableRowElement {
  const row = document.createElement('tr');
  const identity = cell('');
  const title = document.createElement('strong');
  title.textContent = recording.title;
  const artists = document.createElement('span');
  artists.className = 'artists';
  artists.textContent = recording.artists.join(', ');
  const provenance = document.createElement('details');
  const summary = document.createElement('summary');
  summary.textContent = 'Metadata provenance';
  const evidence = document.createElement('p');
  evidence.textContent = `${recording.metadataSource}${recording.verifiedOn ? ` Checked ${recording.verifiedOn}.` : ''}`;
  provenance.append(summary, evidence);
  identity.append(title, artists, provenance);
  const source = cell('');
  const link = document.createElement('a');
  link.href = recording.sourceUrl;
  link.textContent = 'Source ↗';
  link.setAttribute('aria-label', `Source for ${recording.artists.join(', ')} — ${recording.title} (${recording.version})`);
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  source.append(link);
  const length = recording.durationSeconds === null ? null : `${Math.floor(recording.durationSeconds / 60)}:${String(recording.durationSeconds % 60).padStart(2, '0')}`;
  const energy = energyFor(plan!, recording);
  const energyCell = cell('');
  const energyText = document.createElement('span'); energyText.textContent = energy ? `${energy.value}/10 · ${energy.kind}: ${energy.basis} · ${energy.confidence} confidence` : 'Unknown';
  energyCell.append(energyText);
  const correction = document.createElement('details'); const correctionTitle = document.createElement('summary'); correctionTitle.textContent = 'Correct estimate'; correction.append(correctionTitle);
  const rating = document.createElement('input'); rating.type = 'number'; rating.min = '1'; rating.max = '10'; rating.step = '.1'; rating.value = energy ? String(energy.value) : ''; rating.setAttribute('aria-label', `Energy estimate for track ${position}`);
  const basis = document.createElement('input'); basis.type = 'text'; basis.value = energy?.basis ?? ''; basis.setAttribute('aria-label', `Energy basis for track ${position}`);
  const confidence = document.createElement('select'); confidence.setAttribute('aria-label', `Energy confidence for track ${position}`);
  for (const value of ['low', 'medium', 'high']) { const option = document.createElement('option'); option.value = value; option.textContent = value; confidence.append(option); }
  confidence.value = energy?.confidence ?? 'medium';
  const apply = document.createElement('button'); apply.type = 'button'; apply.textContent = 'Apply'; apply.setAttribute('aria-label', `Apply energy for track ${position}`);
  apply.addEventListener('click', () => {
    if (!plan) return;
    if (rating.value && (!rating.validity.valid || !basis.value.trim())) { showError('Energy needs a value from 1 to 10 and a stated basis.'); return; }
    const estimate: EnergyEstimate | null = rating.value ? { value: rating.valueAsNumber, basis: basis.value.trim(), confidence: confidence.value as EnergyEstimate['confidence'], kind: 'user' } : null;
    energyCorrections = { ...energyCorrections, [recording.id]: estimate };
    plan = { ...plan, energyCorrections }; showError(null); renderPlan(plan);
  });
  correction.append(rating, basis, confidence, apply); energyCell.append(correction);
  row.append(cell(String(position).padStart(2, '0')), identity, cell(recording.version), cell(recording.bpm), cell(recording.key), cell(length), energyCell, source);
  row.append(cell(formatTime(elapsed)));
  const timing = cell('');
  for (const field of ['playSeconds', 'overlapSeconds'] as const) {
    const input = document.createElement('input');
    input.type = 'number'; input.min = field === 'playSeconds' ? '1' : '0'; input.step = '1';
    input.value = String(placement[field]);
    input.setAttribute('aria-label', `${field === 'playSeconds' ? 'Play time for' : 'Overlap before'} track ${position} (seconds)`);
    if (field === 'overlapSeconds' && position === 1) input.disabled = true;
    input.addEventListener('change', () => { changeTiming(position - 1, field, input.valueAsNumber); input.value = String(plan!.placements[position - 1]![field]); });
    timing.append(input);
  }
  row.append(timing);
  const assessment = guidance(plan!, catalog, position - 1);
  row.append(cell(`${assessment.phase}. ${assessment.role} ${assessment.transition}`));
  const editing = cell('');
  const replacement = document.createElement('select'); replacement.setAttribute('aria-label', `Replacement for track ${position}`);
  const emptyOption = document.createElement('option'); emptyOption.value = ''; emptyOption.textContent = 'Choose replacement'; replacement.append(emptyOption);
  for (const candidate of catalog.filter(item => plan!.genres.includes(item.genre) && !plan!.placements.some(placement => placement.recordingId === item.id))) {
    const option = document.createElement('option'); option.value = candidate.id; option.textContent = `${candidate.artists.join(', ')} — ${candidate.title} (${candidate.version})`; replacement.append(option);
  }
  const replace = document.createElement('button'); replace.type = 'button'; replace.textContent = 'Replace'; replace.setAttribute('aria-label', `Replace track ${position}`);
  replace.addEventListener('click', () => {
    try { plan = replaceTrack(plan!, catalog, position - 1, replacement.value); showError(null); renderPlan(plan); }
    catch (error) { showError((error as Error).message); }
  });
  editing.append(replacement, replace);
  const lockLabel = document.createElement('label'); lockLabel.textContent = 'Lock inclusion';
  const lock = document.createElement('input'); lock.type = 'checkbox'; lock.checked = placement.locked; lock.setAttribute('aria-label', `Lock inclusion for track ${position}`);
  const updatePlacement = (update: Partial<TrackPlacement>): void => { plan = { ...plan!, placements: plan!.placements.map((item, i) => i === position - 1 ? { ...item, ...update } : item) }; showError(null); renderPlan(plan); };
  lock.addEventListener('change', () => updatePlacement({ locked: lock.checked })); lockLabel.prepend(lock); editing.append(lockLabel);
  const pin = document.createElement('input'); pin.type = 'number'; pin.min = '1'; pin.step = '1'; pin.placeholder = 'No position pin'; pin.value = placement.pin === null ? '' : String(placement.pin); pin.setAttribute('aria-label', `Pin position for track ${position}`);
  pin.addEventListener('change', () => {
    if (pin.value && !pin.validity.valid) { showError('Position pins must be positive whole positions.'); return; }
    updatePlacement({ pin: pin.value ? pin.valueAsNumber : null });
  }); editing.append(pin);
  const notes = document.createElement('textarea'); notes.value = placement.annotation; notes.placeholder = 'Preparation notes'; notes.setAttribute('aria-label', `Notes for track ${position}`);
  notes.addEventListener('change', () => updatePlacement({ annotation: notes.value })); editing.append(notes);
  for (const [direction, name] of [[-1, 'up'], [1, 'down']] as const) {
    const move = document.createElement('button'); move.type = 'button'; move.textContent = direction < 0 ? '↑' : '↓'; move.setAttribute('aria-label', `Move track ${position} ${name}`);
    move.disabled = position - 1 + direction < 0 || position - 1 + direction >= plan!.placements.length;
    move.addEventListener('click', () => { plan = moveTrack(plan!, position - 1, direction); showError(null); renderPlan(plan); }); editing.append(move);
  }
  row.append(editing);
  const match = matchRecording(recording, plan!.library, plan!.librarySelections[recording.id]);
  const matching = cell('');
  const matchLabel = document.createElement('p'); matchLabel.textContent = `${match.status}${match.status === 'Ambiguous' ? ` (${match.candidates.length} exact-version candidates)` : ''}`;
  matching.append(matchLabel);
  if (match.entry) { const path = document.createElement('small'); path.textContent = `${localFilePath(match.entry.location)} — file availability unverified`; matching.append(path); }
  if (match.status === 'Unmatched') { const reason = document.createElement('small'); reason.textContent = 'No exact artist, title, and version match. Use the source link for discovery.'; matching.append(reason); }
  if (match.candidates.length > 1) {
    const resolve = document.createElement('select'); resolve.setAttribute('aria-label', `Resolve local match for track ${position}`);
    const unresolved = document.createElement('option'); unresolved.value = ''; unresolved.textContent = 'Leave unresolved'; resolve.append(unresolved);
    for (const candidate of match.candidates) { const option = document.createElement('option'); option.value = candidate.id; option.textContent = localFilePath(candidate.location); resolve.append(option); }
    resolve.value = plan!.librarySelections[recording.id] ?? '';
    resolve.addEventListener('change', () => { const selections = { ...plan!.librarySelections }; if (resolve.value) selections[recording.id] = resolve.value; else delete selections[recording.id]; plan = { ...plan!, librarySelections: selections }; renderPlan(plan); }); matching.append(resolve);
  }
  row.append(matching);
  return row;
}

function renderPlan(currentPlan: SetPlan): void {
  document.querySelector<HTMLElement>('#storage-status')!.textContent = 'Unsaved changes. Choose Save plan or Back up plan.';
  const recordingsById = new Map(catalog.map(recording => [recording.id, recording]));
  const elapsed = elapsedTimes(currentPlan);
  const rows = currentPlan.placements.map((placement, index) => recordingRow(recordingsById.get(placement.recordingId)!, index + 1, placement, elapsed[index]!));
  tracklist.replaceChildren(...rows);
  const genreName = currentPlan.genres.join(' + ');
  planTitle.textContent = `${genreName} set plan`;
  trackCount.textContent = `${rows.length} TRACK${rows.length === 1 ? '' : 'S'}`;
  const isEmpty = rows.length === 0;
  planStatus.textContent = isEmpty
    ? `No recordings available for ${genreName}. Choose another genre or add verified recordings to the starter catalog.`
    : `${rows.length} track${rows.length === 1 ? '' : 's'} available. This is a short starting selection; add more vetted recordings before planning a full performance.`;
  const total = totalSeconds(currentPlan);
  const difference = currentPlan.targetSeconds - total;
  if (!isEmpty && difference <= 0) planStatus.textContent = `${rows.length} tracks generated. Target duration reached; review the planned timings before performing.`;
  const constraints = constraintNotes(currentPlan, catalog);
  const constraintPanel = document.querySelector<HTMLElement>('#constraint-notes')!;
  constraintPanel.replaceChildren(...constraints.map(note => { const paragraph = document.createElement('p'); paragraph.textContent = note; return paragraph; }));
  constraintPanel.hidden = !constraints.length;
  if (constraints.length) planStatus.textContent += ' Planning limits or unresolved constraints need your review.';
  document.querySelector<HTMLElement>('#estimated-duration')!.textContent = formatTime(total);
  document.querySelector<HTMLElement>('#target-difference')!.textContent = `${formatTime(Math.abs(difference))} ${difference >= 0 ? 'short' : 'over'}`;
  document.querySelector<HTMLElement>('#timing-summary')!.hidden = isEmpty;
  const emptyState = document.querySelector<HTMLElement>('#empty-state')!;
  emptyState.hidden = !isEmpty;
  if (isEmpty) {
    emptyState.querySelector('h3')!.textContent = 'No recordings in this direction yet.';
    emptyState.querySelector('p')!.textContent = 'Try another genre. Only recordings in the starter catalog can appear in a set plan.';
  }
  document.querySelector<HTMLElement>('#tracklist-wrapper')!.hidden = isEmpty;
  document.querySelector<HTMLElement>('#plan-notes')!.hidden = isEmpty;
  renderArc();
  document.querySelector('#library-status')!.textContent = `${currentPlan.library.length} library entries. File availability is unverified; imported paths do not prove the media is accessible.`;
}

document.querySelector<HTMLFormElement>('#plan-form')!.addEventListener('submit', event => {
  event.preventDefault();
  if (generateButton.disabled) return;
  showError(null);
  if (!selectedGenres.length) { showError('Choose at least one genre.'); return; }
  const mustInclude = [...document.querySelector<HTMLSelectElement>('#required-recordings')!.selectedOptions].map(option => option.value);
  mustInclude.push(...document.querySelector<HTMLTextAreaElement>('#additional-required')!.value.split('\n').map(value => value.trim()).filter(Boolean));
  plan = createSetPlan(catalog, { genres: [...selectedGenres], targetSeconds: document.querySelector<HTMLInputElement>('#target-duration')!.valueAsNumber * 60, arc: [...draftArc], emphasis: { ...genreEmphasis }, context: document.querySelector<HTMLInputElement>('#performance-context')!.value.trim(), mustInclude: [...new Set(mustInclude)] }, energyCorrections, plan);
  renderPlan(plan);
  planTitle.focus();
});

function bundleForCurrentPlan(): PlanBundle {
  if (!plan) throw new Error('Generate or open a set plan first.');
  return { version: 1, name: document.querySelector<HTMLInputElement>('#plan-name')!.value.trim() || 'Untitled set', plan, catalog };
}

function refreshSavedPlans(): void {
  const select = document.querySelector<HTMLSelectElement>('#saved-plans')!;
  select.replaceChildren();
  for (const bundle of readSavedPlans()) { const option = document.createElement('option'); option.value = bundle.plan.id; option.textContent = bundle.name; select.append(option); }
}

function renderCatalogOptions(): void {
  const required = document.querySelector<HTMLSelectElement>('#required-recordings')!; required.replaceChildren();
  for (const recording of catalog) { const option = document.createElement('option'); option.value = recording.id; option.textContent = `${recording.artists.join(', ')} — ${recording.title} (${recording.version})`; required.append(option); }
  catalogSummary.textContent = `${catalog.length} recordings · ${GENRES.length} genres`;
  const counts = genreOptions.querySelectorAll('.genre-count');
  GENRES.forEach((genre, index) => { counts[index]!.textContent = String(catalog.filter(recording => recording.genre === genre).length).padStart(2, '0'); });
}

function openBundle(bundle: PlanBundle): void {
  catalog = bundle.catalog; plan = bundle.plan; selectedGenres = [...plan.genres]; energyCorrections = plan.energyCorrections; draftArc = plan.arc;
  generateButton.disabled = false;
  renderCatalogOptions();
  document.querySelector<HTMLInputElement>('#plan-name')!.value = bundle.name;
  document.querySelector<HTMLInputElement>('#target-duration')!.value = String(plan.targetSeconds / 60);
  document.querySelector<HTMLInputElement>('#performance-context')!.value = plan.context;
  for (const genre of GENRES) {
    genreOptions.querySelector<HTMLInputElement>(`input[value="${genre}"]`)!.checked = plan.genres.includes(genre);
    const weight = document.querySelector<HTMLInputElement>(`input[aria-label="Emphasis for ${genre}"]`)!;
    weight.value = String(plan.emphasis[genre] ?? 1); genreEmphasis[genre] = plan.emphasis[genre] ?? 1;
  }
  for (const option of document.querySelector<HTMLSelectElement>('#required-recordings')!.options) option.selected = plan.mustInclude.includes(option.value);
  document.querySelector<HTMLTextAreaElement>('#additional-required')!.value = plan.mustInclude.filter(id => !catalog.some(recording => recording.id === id)).join('\n');
  renderArcControls(); renderPlan(plan); showError(null);
  document.querySelector<HTMLElement>('#storage-status')!.textContent = 'Opened saved plan.';
}

document.querySelector('#save-plan')!.addEventListener('click', () => {
  try { savePlan(bundleForCurrentPlan()); refreshSavedPlans(); showError(null); document.querySelector('#storage-status')!.textContent = 'Saved locally.'; }
  catch (error) { showError(`Saving failed: ${(error as Error).message}`); }
});
document.querySelector('#open-plan')!.addEventListener('click', () => {
  try {
    const bundle = readSavedPlans().find(item => item.plan.id === document.querySelector<HTMLSelectElement>('#saved-plans')!.value);
    if (!bundle) throw new Error('Choose a saved plan to open.');
    openBundle(bundle);
  } catch (error) { showError((error as Error).message); }
});
document.querySelector('#backup-plan')!.addEventListener('click', () => {
  try { downloadFile('dj-set-backup.json', JSON.stringify(bundleForCurrentPlan(), null, 2), 'application/json'); showError(null); }
  catch (error) { showError((error as Error).message); }
});
for (const format of ['csv', 'text'] as const) {
  document.querySelector(`#export-${format}`)!.addEventListener('click', () => {
    try {
      const bundle = bundleForCurrentPlan();
      if (!bundle.plan.placements.length) throw new Error('No tracks to export.');
      downloadFile(`dj-set-plan.${format === 'csv' ? 'csv' : 'txt'}`, format === 'csv' ? csvForPlan(bundle.plan, bundle.catalog) : textForPlan(bundle.name, bundle.plan, bundle.catalog), format === 'csv' ? 'text/csv;charset=utf-8' : 'text/plain;charset=utf-8');
      showError(null);
    } catch (error) { showError((error as Error).message); }
  });
}
document.querySelector<HTMLInputElement>('#import-backup')!.addEventListener('change', async event => {
  const input = event.target as HTMLInputElement;
  try {
    const file = input.files?.[0]; if (!file) return;
    if (file.size > MAX_BACKUP_BYTES) throw new Error('Backup exceeds the 50 MB limit. Existing work was preserved.');
    const bundle = validateBundle(JSON.parse(await file.text()));
    savePlan(bundle); openBundle(bundle); refreshSavedPlans();
  } catch (error) { showError(`Import failed: ${(error as Error).message}`); }
  finally { input.value = ''; }
});
document.querySelector<HTMLInputElement>('#import-library')!.addEventListener('change', async event => {
  const input = event.target as HTMLInputElement;
  try {
    const file = input.files?.[0]; if (!file) return;
    if (!plan) throw new Error('Generate or open a plan before importing library metadata.');
    if (file.size > 10_000_000) throw new Error('The XML library exceeds the 10 MB limit.');
    const library = parseLibrary(await file.text());
    plan = { ...plan, library, librarySelections: {} }; showError(null); renderPlan(plan);
  } catch (error) { showError((error as Error).message); }
  finally { input.value = ''; }
});
document.querySelector('#export-playlist')!.addEventListener('click', () => {
  try {
    const bundle = bundleForCurrentPlan();
    const playlist = localPlaylist(bundle.plan, bundle.catalog);
    downloadFile(playlist.omitted.length ? 'dj-set-partial.m3u8' : 'dj-set.m3u8', playlist.content, 'audio/x-mpegurl;charset=utf-8');
    document.querySelector('#playlist-status')!.textContent = `${playlist.omitted.length ? 'Partial' : 'Complete'} local-file playlist: ${playlist.count} matched recordings; ${playlist.omitted.length} omitted. ${playlist.omitted.join('; ')} File availability must be checked in Rekordbox.`;
    showError(null);
  } catch (error) { showError((error as Error).message); }
});

try {
  const loadedCatalog = await loadCatalog();
  if (!plan) { catalog = loadedCatalog; renderCatalogOptions(); }
  generateButton.disabled = false;
} catch {
  if (!plan) {
    catalogSummary.textContent = 'The starter catalog could not be loaded. Reload to try again.';
    catalogSummary.setAttribute('role', 'alert');
  }
}
try { refreshSavedPlans(); } catch (error) { showError(`Saved plans unavailable: ${(error as Error).message}`); }
