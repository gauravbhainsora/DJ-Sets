# DJ Set Planner Decisions

## Confirmed scope

Confirmed by the user on 17 October 2026 during the design interview.

- Build a website primarily for the user's own DJ preparation.
- Produce an editable, ordered tracklist with suggested transitions and explanations of each track's role.
- Automatic audio mixing is a separate capability outside the first version.
- Discover music based on one or more selected genres, with optional must-include tracks supplied by the user.
- Let the user specify the performance occasion or slot for each set.
- Let the user choose set duration and adjust the energy arc.
- Treat the supplied two-hour structure as a default template, with starting timings rather than a fixed formula for every set.
- Start with Melodic House & Techno, House, Progressive House, and Dance / Pop.
- Blend selected genres where suitable, with optional emphasis per genre and no requirement for equal shares.
- Favor smooth, practical transitions by default and flag deliberate changes in direction.
- Use available BPM and key information to guide selection; show missing information as unknown.
- Initially provide track links and a downloadable tracklist. Prioritize an integration after establishing the user's listening and DJ workflow.
- Support replacing individual tracks, reordering tracks, and locking favorites.
- Preserve locked tracks during regeneration and flag flow issues caused by edits. Locking preserves inclusion by default; a separate position pin prevents a track from moving.
- The user's music discovery and listening platforms are Beatport and YouTube; their DJ software is Rekordbox.
- Default to a 120-minute set, adjustable per set. Base duration planning on editable intended play time per track and label totals as estimates until timings are specified.
- Use smaller waves within the peak phase: 2–3 intense tracks, a modest release, then another push. The later breather is a larger drop.
- Preserve required tracks when they conflict with other preferences, explain the compromise, and suggest bridge tracks or alternative placements.
- If suitable tracks are insufficient, return a shorter proposal and explain the gap.
- The user has a Beatport subscription and uses local downloads. The subscription tier and use of Beatport Streaming inside Rekordbox are not yet specified; do not assume entitlement to streaming features or developer APIs.
- Use a real, vetted starter catalog covering the four selected genres for the first working version. Initial discovery is limited to that catalog; broader live discovery depends on confirming a suitable data source.
- Track-energy estimates must be editable and clearly labeled, with their basis and confidence shown. Leave unsupported ratings unknown.
- Build a personal, desktop-focused website that runs locally for the first version. Save sets in the browser and provide backup/import files. Accounts and cross-device sync are later capabilities.
- Use a dark interface with an editable energy chart above a reorderable tracklist. Show phase, exact track version, BPM, key, energy estimate, planned timing, and transition notes.
- Support optional Rekordbox XML library import for matching recommendations to local files. Export a playlist containing matched local files, and list unmatched recommendations separately with discovery or purchase links.
- Export the complete set plan as CSV and plain text.
- Initially assume four minutes played per track with a 30-second overlap between tracks. Both values are editable; subtract overlaps from total duration and respect shorter track lengths.

## Default energy arc

| Phase | Starting timing in the supplied example | Intended character |
| --- | --- | --- |
| Anchor | First 10–15 minutes | Establish the groove and sonic palette at about 6/10 energy. |
| Build | 15–45 minutes | Gradually increase intensity from about 6/10 to 8/10. |
| Peak | 45–75 minutes | Reach 9–10/10, with maximum tension limited to 2–3 consecutive tracks. |
| Breather | 75–85 minutes | Pull back to about 6–7/10 to reset the listener. |
| Second climax and landing | 85–120 minutes | Return to a climax, then finish with a distinctive closing piece. |

These energy values express the user's desired musical character. Peak phases contain smaller rises and releases as confirmed above. Individual track-energy estimates are editable and must disclose their basis and confidence; unsupported ratings remain unknown.

## Implementation checks

- Verify starter catalog tracks, exact versions, source links, and metadata provenance.
- Establish evidence for energy estimates and disclose unsupported data as unknown.
- Validate local-library matching and playlist import against Rekordbox; subscription-specific streaming integration is outside the first version.
- Detect impossible position pins and unavailable required tracks without silently dropping user constraints.
- Verify duration arithmetic, browser persistence, and backup restoration.

The first version does not depend on live provider API access. Broader live discovery, streaming playlist sync, accounts, and hosted cross-device access require later decisions. Technical implementation choices remain to be made within the agreed product scope.

## Design review

The consolidated [implementation specification](product-spec.md) follows the to-spec template and records the confirmed product scope. The user approved one primary browser-level testing boundary with controlled catalog and Rekordbox XML fixtures, plus a real Rekordbox import check. Implementation has not started.

The specification is published as [DJ-Sets issue #1](https://github.com/gauravbhainsora/DJ-Sets/issues/1) with the `ready-for-agent` label. GitHub Issues, the five default triage labels, and single-context domain documentation are configured through the project agent instructions. No architecture decision records have been created because no hard-to-reverse architecture trade-off has yet been settled.

See [integration research](integration-research.md) for verified capabilities and access questions.
