# DJ Sets

A personal DJ set planner that runs locally without an account. The first implemented slice is [issue #2: generate a first set plan from the vetted starter catalog](https://github.com/gauravbhainsora/DJ-Sets/issues/2).

Choose Melodic House & Techno, House, Progressive House, or Dance / Pop, then generate an ordered starting selection. Review exact versions, artists, source links, and source-reported BPM, key, and full recording length. Unsupported metadata appears as Unknown. Each of the four genres currently contains three verified records; this is a small starting collection, not a complete performance plan.

## Run locally

Use Node.js 22.12 or newer and npm.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite (normally `http://127.0.0.1:5173`). No provider credentials are needed. After dependencies are installed, generation makes no external requests; source links open Beatport only when you follow them. Plans currently stay in the open tab and are lost on reload.

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
- `src/set-plan.ts`: ordered placements referencing stable recording identities.
- `src/main.ts` and `src/style.css`: accessible genre selection and tracklist review.
- `tests/`: browser scenarios with clearly marked illustrative fixtures, plus production-catalog smoke coverage.

The [product specification](docs/product-spec.md) describes the complete intended product. Duration planning, editable energy arcs, multi-genre selection, editing constraints, saving/backups, and exports remain separate tickets. The current catalog has no supported energy assessments and the app makes no musical-flow or Rekordbox playback claim.
