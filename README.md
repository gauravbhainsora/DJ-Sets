# DJ Sets

A personal DJ set planner that runs locally without an account. The implementation follows [specification #1](https://github.com/gauravbhainsora/DJ-Sets/issues/1) and its child tickets #2–#11. See [implementation and verification status](docs/implementation-status.md), including a successful two-file playlist import into Rekordbox 7.2.19.

Select any combination of Melodic House & Techno, House, Progressive House, and Dance / Pop. Set genre emphasis, performance context, duration, and an editable five-phase energy arc. Generate a proposal, then edit planned play times and overlaps, replace or reorder tracks, add notes, lock inclusion, or pin positions. Required selections survive softer preferences; conflicts and catalog shortages remain visible.

Review exact versions, artists, source links, source-reported BPM/key/full recording length, track roles, and transition suggestions. Target energy stays distinct from recording estimates. Unsupported estimates remain Unknown; user corrections require a basis and disclose confidence. Each genre currently contains only three verified records. Long performance requests will have explicit shortfalls.

## Run locally

Use Node.js 22.12 or newer and npm.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite (normally `http://127.0.0.1:5173`). No provider credentials are needed. After dependencies are installed, generation makes no external requests; source links open Beatport only when you follow them.

Choose **Save plan** to keep a named plan in this browser, then **Open saved plan** to return to it after reload. Saving is explicit; keep a backup before clearing browser data. **Back up plan** downloads a versioned JSON file containing the plan, catalog snapshot, arc, timing, corrections, constraints, notes, and imported local-library metadata. Import validates the complete snapshot before saving and opening it. Backups containing a library include its local file paths.

**Export CSV** and **Export text** contain every ordered recommendation and its preparation information. **Import Rekordbox XML** optionally matches local library metadata by artist, title, and exact version. Same-title alternate mixes and unknown versions remain unmatched; multiple exact candidates stay ambiguous until explicitly resolved. Imported paths do not prove current file availability. **Export local playlist** creates UTF-8 M3U8 for matched local files only and reports omissions. The file preserves order, not planned trims, automated transitions, or audio mixing.

The tracklist scrolls horizontally for timing, preparation, editing controls, and library matches. Up/down buttons support keyboard reordering. Expand **Correct estimate** to enter a recording's energy, basis, and confidence; expand **Must-include tracks** to select required catalog recordings or record unavailable requests.

## Verify

```sh
npx playwright install chromium
npm run typecheck
npm test
npm run build
```

`npm test` starts the local dev server if it is not already running. Playwright tests use the rendered browser UI and controlled catalog responses. The real starter catalog has a separate browser smoke check. Production data evidence is recorded in [catalog verification](docs/catalog-verification.md).

For a production-build preview, run `npm run preview` after building and open `http://127.0.0.1:4173`.

## Implementation

The app uses TypeScript, native HTML/DOM controls, and CSS, with Vite for local development and static builds. Playwright supplies the approved browser test boundary. There is no server backend, account system, framework runtime, or music-provider API dependency.

- `public/catalog.json`: bundled recordings and metadata provenance; loaded locally and validated before generation.
- `src/catalog.ts`: recording vocabulary and catalog loading.
- `src/set-plan.ts` and `src/energy-arc.ts`: generation, constraints, timing, editing, and energy guidance.
- `src/persistence.ts`: versioned backups, validation, browser storage, and downloads.
- `src/exports.ts` and `src/local-library.ts`: complete-plan exports, conservative XML matching, and matched-file playlists.
- `src/main.ts` and `src/style.css`: accessible genre selection and tracklist review.
- `tests/`: browser scenarios with clearly marked illustrative fixtures, plus production-catalog smoke coverage.

The current starter catalog has no supported energy assessments. Generation with controlled rated fixtures demonstrates the requested energy behavior; it does not establish musical quality for unrated production recordings. Source links serve discovery rather than supplying playable audio. No provider API, account, hosting, or paid-service entitlement is required.
