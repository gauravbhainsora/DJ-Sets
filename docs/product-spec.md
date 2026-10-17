# DJ Set Planner

## Problem Statement

Preparing a DJ set across several genres requires more than collecting good tracks. The DJ needs a coherent progression that establishes a groove, builds intensity, sustains a peak without fatigue, provides a breather, and closes memorably. They also need transitions they can perform, realistic timing, and a practical route from recommended tracks to their Rekordbox library.

The user discovers music through Beatport and YouTube, has a Beatport subscription and local downloads, and performs with Rekordbox. Their initial genres are Melodic House & Techno, House, Progressive House, and Dance / Pop. They want a personal website that reduces sequencing work while preserving control over musical choices.

## Solution

Build a local, desktop-focused website that produces an editable set plan from a vetted starter catalog. The user selects genres and their emphasis, a performance context, a target duration, and optional must-include tracks. An adjustable energy arc guides selection and sequencing.

Present a dark workspace with an editable energy chart above a reorderable tracklist. Explain each track's role and suggested transitions. Make exact versions, available musical metadata, timing estimates, and the basis of energy estimates visible. The DJ can replace tracks, reorder them, lock their inclusion, and pin their positions.

Save plans in the browser and support portable backups. Export the complete plan as CSV or plain text. Optionally import a Rekordbox XML library, match recommendations to local recordings, and export an ordered playlist for matched local files. Keep unmatched recommendations visible with discovery or purchase links.

The first version discovers tracks within a real, vetted starter catalog. It does not promise fresh catalog-wide search, automatic audio mixing, or automatic Beatport playlist synchronization.

## User Stories

1. As a DJ, I want to select Melodic House & Techno, House, Progressive House, or Dance / Pop, so that recommendations reflect the music I play.
2. As a DJ, I want to select multiple genres for one set plan, so that I can prepare a performance that crosses genres.
3. As a DJ, I want to specify optional genre emphasis, so that one genre can lead without forcing equal shares.
4. As a DJ, I want genres to blend where musically suitable, so that the tracklist develops naturally.
5. As a DJ, I want to specify the performance context, so that a warm-up slot and a headline performance can have different musical intentions.
6. As a DJ, I want a 120-minute default duration that I can change, so that I can prepare for different slots.
7. As a DJ, I want an anchor, build, peak, breather, and second climax with a landing, so that the set has a deliberate progression.
8. As a DJ, I want to adjust phase boundaries and target energy, so that the energy arc fits my intended performance.
9. As a DJ, I want the default arc to adapt to the requested duration, so that shorter sets do not retain two-hour timestamps.
10. As a DJ, I want small releases after two or three intense tracks during a peak, so that a long peak phase does not require continuous maximum tension.
11. As a DJ, I want a more substantial breather after the peak, so that the audience has a reset before the finale.
12. As a DJ, I want a distinctive landing after the second climax, so that the set ends intentionally.
13. As a DJ, I want to designate must-include tracks, so that the plan incorporates recordings important to my performance.
14. As a DJ, I want to discover real tracks within the starter catalog, so that I can extend my selections beyond tracks I supply.
15. As a DJ, I want the initial discovery boundary to be clear, so that I understand that recommendations come from a curated collection.
16. As a DJ, I want exact track versions and source links, so that I can find the recording the plan actually recommends.
17. As a DJ, I want available BPM and key information to inform sequencing, so that transitions are practical to perform.
18. As a DJ, I want missing metadata to remain visibly unknown, so that I can judge where preparation is still needed.
19. As a DJ, I want an explanation of each track's role, so that I understand why it belongs at that point in the set.
20. As a DJ, I want suggested transition notes and flagged changes in direction, so that I can prepare deliberate musical shifts.
21. As a DJ, I want target energy distinguished from track energy estimates, so that a desired curve is not mistaken for measured track behavior.
22. As a DJ, I want each energy estimate's basis and confidence shown, so that I can assess how much to trust it.
23. As a DJ, I want to correct energy estimates after listening, so that the plan can reflect my judgment.
24. As a DJ, I want to see the energy chart and tracklist together, so that I can relate individual choices to the whole performance.
25. As a DJ, I want phase, version, BPM, key, energy, timing, and transition notes visible in the workspace, so that I can review the plan efficiently.
26. As a DJ, I want to replace one track without unnecessarily changing the rest, so that I can refine an otherwise useful plan.
27. As a DJ, I want to reorder tracks, so that I can exercise creative control over the sequence.
28. As a DJ, I want to lock a track's inclusion while allowing it to move, so that regeneration keeps favorites while improving their placement.
29. As a DJ, I want to pin a track's position separately, so that an intentional opening, closing, or other placement stays fixed.
30. As a DJ, I want regeneration to preserve locks and pins, so that it respects decisions I have already made.
31. As a DJ, I want timing and flow assessments to update after edits, so that I see the consequences of my changes.
32. As a DJ, I want required tracks retained when they conflict with softer musical preferences, so that the planner explains a compromise instead of discarding my choice.
33. As a DJ, I want suggested bridges or alternative placements for conflicts, so that I have practical ways to improve the sequence.
34. As a DJ, I want unavailable required tracks and contradictory constraints identified, so that an incomplete result is not presented as fully satisfying my request.
35. As a DJ, I want a shorter proposal with an explanation when the catalog is insufficient, so that I can decide how to fill the gap.
36. As a DJ, I want planned play time distinct from full recording length, so that timing reflects how I intend to perform.
37. As a DJ, I want editable defaults of four minutes per track and 30 seconds of transition overlap, so that I can get an initial timing estimate quickly.
38. As a DJ, I want short recordings and overlaps accounted for correctly, so that the estimated set duration is credible.
39. As a DJ, I want the estimated duration and its difference from my target shown, so that I can adjust the plan before performing.
40. As a DJ, I want to save and reopen plans in my browser, so that I can continue preparing later.
41. As a DJ, I want backup and import files, so that browser storage is not the only copy of my work.
42. As a DJ, I want restored plans to retain my sequence, arc, timing, locks, pins, and corrections, so that backup preserves the meaningful work.
43. As a DJ, I want optional Rekordbox XML library import, so that I can identify recommendations already represented in my local library.
44. As a DJ, I want local library matches to respect exact versions, so that a radio edit is not silently substituted for an extended mix.
45. As a DJ, I want ambiguous matches left unresolved, so that uncertainty does not become an incorrect playable export.
46. As a DJ, I want matched and unmatched recommendations clearly distinguished, so that I know which tracks still require preparation or acquisition.
47. As a DJ, I want an ordered local-file playlist for matched recordings, so that I can bring those selections into Rekordbox.
48. As a DJ, I want partial local-file exports identified as partial, so that missing tracks do not surprise me during preparation.
49. As a DJ, I want CSV and plain-text exports of the complete set plan, so that I can use the sequence and notes outside the website.
50. As a DJ, I want to use the first version locally without creating an account, so that I can start preparing with minimal setup.

## Implementation Decisions

- **Application scope:** A personal, local website with a desktop-focused dark workspace, browser persistence, and file-based backup/import. No framework, test runner, storage engine, hosted service, or paid API has been selected. Choose those implementation details within this scope.
- **Logical responsibilities:** Keep the set-planning workflow cohesive. Its responsibilities include catalog access, set generation and editing, energy and timing assessment, persistence, local-library matching, and exports. These are conceptual responsibilities rather than a requirement for separate services or a specific file layout. No existing application modules or interfaces require migration.
- **Domain model:** Use the established terms set plan, tracklist, energy arc, phase, must-include track, genre emphasis, locked track, position pin, planned play time, transition overlap, target energy, track energy estimate, starter catalog, and local library match. Keep locked inclusion distinct from a fixed position and desired energy distinct from an assessment of a recording.
- **Catalog and identity:** Begin with real, vetted tracks covering all four genres. Preserve recording identity and mix/version, source links, available BPM, key and duration, and the basis of energy estimates. Verify records during curation. Catalog size and the actual selections remain implementation work, not previously approved facts.
- **Energy evidence:** Energy estimates are editable and disclose basis and confidence. A user rating, a documented curated assessment, and a measured value must remain distinguishable. Unsupported values remain unknown. Do not manufacture energy scores to fit the requested curve or claim audio, phrase, or cue-point analysis that has not occurred. The evidence available for the starter catalog must be established during implementation; metadata presence alone does not demonstrate an energy arc.
- **Default arc:** The two-hour starting template establishes the anchor during roughly the first 10–15 minutes at 6/10, builds during minutes 15–45 toward 8/10, peaks during minutes 45–75 at 9–10/10 in smaller waves, provides a breather during minutes 75–85 at 6–7/10, and returns to a climax before landing during minutes 85–120. Keep boundaries editable and use a coherent, gap-free timeline when initializing the template. Adapt the template for other durations.
- **Selection and sequencing:** Use selected genres, genre emphasis, performance context, target energy, and available BPM/key information to produce a practical sequence. Equal genre shares are not required. Preserve must-include tracks and user locks or pins; explain softer musical compromises. Report unsatisfied constraints, uncertain assessments, and catalog shortfalls rather than inventing tracks or silently dropping requirements. Exact ranking weights remain implementation choices.
- **Editing interactions:** Single-track replacement, manual reorder, inclusion lock, position pin, energy correction, and regeneration operate on the same saved set plan. Refresh timing and relevant flow notes after changes. Report contradictory pins or unavailable required recordings explicitly; offer bridges or alternative placements where supported by the catalog.
- **Timing:** Default planned play time is four minutes per track, capped by a shorter known recording duration. Default overlap is 30 seconds between adjacent tracks. Both are editable. Estimated set duration is total planned play time minus total overlaps; a single track has no transition overlap. Validate edits against adjacent play times and prevent impossible totals. Preserve an estimate label while performance timing or recording metadata is uncertain.
- **Persistence:** Browser storage retains the musical choices necessary to reopen a plan. Backups preserve the energy arc, track sequence and identity, timing, locks, pins, annotations, and user corrections. Validate imported data before replacing saved work. Choose a versioned backup representation so incompatible imports can be reported clearly.
- **Local library matching:** Accept optional Rekordbox XML library metadata and local-file references. Matching must distinguish exact mix/version and leave ambiguous candidates unresolved. An imported file reference does not prove current file availability. Audio upload is not required for this metadata-based workflow.
- **Export contracts:** CSV and plain text represent the complete ordered plan and its useful annotations. A Rekordbox-compatible local-file playlist contains matched recordings in plan order; report omissions separately and mark partial exports clearly. Product-page and video links remain discovery references rather than substitutes for local audio. Select and validate the specific playlist format during implementation.
- **External boundaries:** Beatport and YouTube links serve discovery and listening. The first version does not require provider API credentials or automated catalog access. A Beatport consumer subscription does not establish developer API or playlist-writing access. Subscription tier is not a prerequisite for the agreed local-file handoff.

## Testing Decisions

The user approved one primary browser-level test boundary covering the public set-planning workflow, with controlled catalog and Rekordbox XML fixtures, plus a separate real Rekordbox import check.

- **Good tests assert externally observable behavior:** Interact with the rendered website, imported files, browser persistence, and downloaded outputs. Assert musical constraints, displayed uncertainty, timing, saved choices, and export contents. Avoid assertions about component structure, private helpers, or exact algorithm weights. Where several sequences satisfy the request, test the constraints rather than one incidental ordering.
- **Modules covered through the public workflow:** Exercise catalog selection, generation, editing, energy and timing presentation, persistence/backup, local-library matching, and exports together at the browser boundary. Add a lower-level boundary only if a concrete verification gap cannot be exercised reliably here.
- **Prior art:** The project currently contains design documentation only. There is no existing application, test framework, test suite, or reusable test boundary to extend. No tests have been run because implementation has not started.
- **Controlled data:** Use fixtures with all four genres; known and unknown energy/BPM/key fields; short recordings; required tracks; conflicting positions; insufficient candidates; exact-version matches; same-title alternate mixes; ambiguous matches; unmatched recordings; and representative local-file references. Fixtures must distinguish illustrative test values from verified production catalog evidence.
- **Creation and arc behavior:** Verify duration defaults, multi-genre selection and emphasis, performance context, adjustable phase boundaries, and generated plans. With suitably rated fixture tracks, verify peak waves and the larger breather. Where estimates are missing, verify that uncertainty is visible rather than claiming the requested musical progression is established.
- **Editing and constraints:** Verify isolated replacement, reorder, inclusion locks, position pins, regeneration, energy corrections, and updated assessments. Confirm required tracks survive softer musical conflicts. Verify explicit unresolved states for impossible pins or unavailable required tracks and an explained shortfall when the catalog cannot meet the request.
- **Timing examples:** Ten tracks played for four minutes each with nine 30-second overlaps must display 35 minutes 30 seconds. A single four-minute track must display four minutes. Exercise shorter recordings, editable overlaps, and updates after replacement or reorder. Invalid timing input must not produce misleading totals.
- **Persistence and restoration:** Create and edit a plan, reload the application, and verify preserved choices. Back up the plan, restore it into a fresh browser state, and verify the same sequence, arc, timing, locks, pins, and corrections. An invalid backup must report a useful error and preserve existing saved work.
- **Matching and downloads:** Import a representative XML library through the UI. Verify exact-version matching and unresolved ambiguity. Download all supported exports, inspect them as public artifacts, and confirm order, annotations, omission reporting, and the separation between full-plan and matched-file exports.
- **Production catalog review:** Check that starter records are real, source links resolve to the intended recordings, and metadata/energy provenance supports the displayed claims. This is a data-quality check; a passing algorithm test with synthetic fixtures cannot substitute for it.
- **Rekordbox compatibility:** Import a generated local-file playlist into Rekordbox with known accessible media and verify sequence and recording identity. Record the tested Rekordbox version and result. If software or suitable media is unavailable, report this check as unverified; XML parsing or export syntax checks alone do not establish playable compatibility.

## Out of Scope

- Automatic audio mixing, rendered continuous audio, or automatic performance of transitions.
- Broad live discovery of new releases or catalog-wide Beatport/YouTube search in the first version.
- Automatic Beatport playlist creation, streaming playlist synchronization, or assumptions about the user's subscription tier.
- Acquiring music files on the user's behalf or downloading audio from YouTube.
- Claims of measured energy, phrase detection, cue points, or arrangement analysis without a verified supporting process.
- Accounts, multi-user collaboration, cloud synchronization, public hosting, or cross-device persistence beyond manual backup/import.
- Guaranteed playable export for recordings without a confirmed local library match, or guaranteed file availability based solely on an imported path.
- Expanding the initial genre scope beyond the four confirmed genres.

## Further Notes

- The individual product choices above were accepted during the design interview. The testing approach was explicitly approved during spec synthesis. This task prepares the specification; it does not report implementation as complete.
- Before implementation can claim the musical outcome is demonstrated, verify a suitable catalog and the evidence for its track energy estimates. Unknown data must remain visible even if this limits the quality or completeness of a generated plan.
- The existing integration research identifies official references for [YouTube video metadata](https://developers.google.com/youtube/v3/docs/videos), [Beatport developer access](https://api.beatport.com/v4/docs/), the [Rekordbox XML format](https://cdn.rekordbox.com/files/20200410160904/xml_format_list.pdf), and [Rekordbox playlist imports](https://cdn.rekordbox.com/files/20260409151936/rekordbox7.214_manual_EN.pdf). These establish integration boundaries, not successful implementation or API entitlement.
- No architecture decision record exists because no hard-to-reverse architectural trade-off has yet been settled. Stack, ranking implementation, catalog contents, and playlist serialization format should be chosen and verified during implementation within the scope above.
- Issue tracker: GitHub Issues in `gauravbhainsora/DJ-Sets`. This specification uses the `ready-for-agent` triage label and the five-role default label vocabulary.
