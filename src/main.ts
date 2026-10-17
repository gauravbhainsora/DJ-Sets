import { GENRES, loadCatalog, type Genre, type Recording } from './catalog';
import { createSetPlan, type SetPlan } from './set-plan';
import './style.css';

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
            <legend>Choose a genre</legend>
            <p class="field-hint">One sound to start. Where are we going?</p>
            <div id="genre-options" class="genre-options"></div>
          </fieldset>
          <button class="generate-button" id="generate" type="submit" disabled>Generate set plan<span aria-hidden="true">↗</span></button>
          <p class="session-note">No account needed. This plan stays in this tab until you leave or reload.</p>
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
        <div id="empty-state" class="empty-state">
          <div class="record" aria-hidden="true"><div></div></div>
          <h3>Every set has a first track.</h3>
          <p>Your selection will appear here, with exact versions,<br class="desktop-break" /> source links, and the metadata we can verify.</p>
        </div>
        <div id="tracklist-wrapper" class="table-scroll" hidden>
          <table>
            <caption class="sr-only">Tracklist</caption>
            <thead><tr><th scope="col">#</th><th scope="col">Recording</th><th scope="col">Version</th><th scope="col">BPM</th><th scope="col">Key</th><th scope="col">Full length</th><th scope="col">Energy</th><th scope="col">Source</th></tr></thead>
            <tbody id="tracklist"></tbody>
          </table>
        </div>
        <div id="plan-notes" class="plan-notes" hidden>
          <p><span aria-hidden="true">↳</span> A first selection in catalog order. Review the recordings before performing.</p>
          <p>BPM, key, and full recording length are source-reported. Unknown means no supporting data; energy has not been assessed.</p>
        </div>
      </section>
    </div>

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
let selectedGenre: Genre = GENRES[0];
let plan: SetPlan | null = null;

for (const [index, genre] of GENRES.entries()) {
  const label = document.createElement('label');
  label.className = 'genre-option';
  const radio = document.createElement('input');
  radio.type = 'radio';
  radio.name = 'genre';
  radio.value = genre;
  radio.setAttribute('aria-label', genre);
  radio.checked = index === 0;
  radio.addEventListener('change', () => { selectedGenre = genre; });
  const name = document.createElement('span');
  name.textContent = genre;
  const count = document.createElement('span');
  count.className = 'genre-count';
  count.setAttribute('aria-hidden', 'true');
  label.append(radio, name, count);
  genreOptions.append(label);
}

function cell(value: string | number | null): HTMLTableCellElement {
  const element = document.createElement('td');
  element.textContent = value === null ? 'Unknown' : String(value);
  if (value === null) element.className = 'unknown';
  return element;
}

function recordingRow(recording: Recording, position: number): HTMLTableRowElement {
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
  row.append(cell(String(position).padStart(2, '0')), identity, cell(recording.version), cell(recording.bpm), cell(recording.key), cell(length), cell(recording.energyEstimate), source);
  return row;
}

function renderPlan(currentPlan: SetPlan): void {
  const recordingsById = new Map(catalog.map(recording => [recording.id, recording]));
  const rows = currentPlan.placements.map((placement, index) => recordingRow(recordingsById.get(placement.recordingId)!, index + 1));
  tracklist.replaceChildren(...rows);
  planTitle.textContent = `${currentPlan.genre} set plan`;
  trackCount.textContent = `${rows.length} TRACK${rows.length === 1 ? '' : 'S'}`;
  const isEmpty = rows.length === 0;
  planStatus.textContent = isEmpty
    ? `No recordings available for ${currentPlan.genre}. Choose another genre or add verified recordings to the starter catalog.`
    : `${rows.length} track${rows.length === 1 ? '' : 's'} available. This is a short starting selection; add more vetted recordings before planning a full performance.`;
  const emptyState = document.querySelector<HTMLElement>('#empty-state')!;
  emptyState.hidden = !isEmpty;
  if (isEmpty) {
    emptyState.querySelector('h3')!.textContent = 'No recordings in this direction yet.';
    emptyState.querySelector('p')!.textContent = 'Try another genre. Only recordings in the starter catalog can appear in a set plan.';
  }
  document.querySelector<HTMLElement>('#tracklist-wrapper')!.hidden = isEmpty;
  document.querySelector<HTMLElement>('#plan-notes')!.hidden = isEmpty;
  planTitle.focus();
}

document.querySelector<HTMLFormElement>('#plan-form')!.addEventListener('submit', event => {
  event.preventDefault();
  if (generateButton.disabled) return;
  plan = createSetPlan(catalog, selectedGenre);
  renderPlan(plan);
});

try {
  catalog = await loadCatalog();
  catalogSummary.textContent = `${catalog.length} recordings · ${GENRES.length} genres`;
  const counts = genreOptions.querySelectorAll('.genre-count');
  GENRES.forEach((genre, index) => {
    counts[index]!.textContent = String(catalog.filter(recording => recording.genre === genre).length).padStart(2, '0');
  });
  generateButton.disabled = false;
} catch {
  catalogSummary.textContent = 'The starter catalog could not be loaded. Reload to try again.';
  catalogSummary.setAttribute('role', 'alert');
}
