# Starter catalog verification

Verified on 17 October 2026 for [issue #2](https://github.com/gauravbhainsora/DJ-Sets/issues/2).

The 12 records in `public/catalog.json` were checked individually by opening each linked Beatport track page in the browser. Each page resolved to the recording below. The artist, title, mix/version, genre, BPM, key, and full recording length were read from the page's main track details. Some automated web fetches returned 403; browser inspection of all 12 pages succeeded without an account.

The catalog is vetted for recording identity and source-reported metadata. This review did not analyze audio, audition musical flow, assess track energy, or establish that these selections fill a performance slot. All energy estimates remain `null` (shown as **Unknown**). No provider API, streaming entitlement, or local-file availability is implied.

| Recording and source | Exact version | Genre | BPM | Key | Full length |
| --- | --- | --- | --- | --- | --- |
| [Konrad Sturm — Orpheon](https://www.beatport.com/track/orpheon/22764891) | Original Mix | Melodic House & Techno | 122 | Db Minor | 6:44 |
| [Mathame — Stairway 3000](https://www.beatport.com/track/stairway-3000/13117624) | Original Mix | Melodic House & Techno | 127 | F# Minor | 7:33 |
| [Nicone, David Hasert, Enda Gallery — Always Wanting](https://www.beatport.com/track/always-wanting/19413865) | Original Mix | Melodic House & Techno | 127 | C Major | 4:49 |
| [Marius Drescher — Love](https://www.beatport.com/track/love/4979034) | Original Mix | House | 124 | A Minor | 6:03 |
| [Haushouse — Love Is Love](https://www.beatport.com/track/love-is-love/21597402) | Original Mix | House | 126 | G Minor | 6:16 |
| [Amari, Supanova — Love](https://www.beatport.com/track/love/20149223) | Original Mix | House | 126 | F Minor | 3:19 |
| [Guy J — MDQ](https://www.beatport.com/track/mdq/8803933) | Original Mix | Progressive House | 120 | Ab Major | 12:12 |
| [Guy J, Roy Rosenfeld — Aroma](https://www.beatport.com/track/aroma/14576351) | Original Mix | Progressive House | 120 | G Major | 8:02 |
| [Guy J — Selector](https://www.beatport.com/track/selector/24259545) | Original Mix | Progressive House | 121 | D Minor | 7:36 |
| [Little Nikki, Summer Is Calling — Only Us](https://www.beatport.com/track/only-us/23382479) | Extended Mix | Dance / Pop | 122 | F Major | 4:03 |
| [Baauer — Better](https://www.beatport.com/track/better/28588372) | Extended Mix | Dance / Pop | 130 | E Minor | 4:26 |
| [Peggy Gou — D.A.N.C.E.](https://www.beatport.com/track/dance/20599776) | Extended Mix | Dance / Pop | 133 | B Minor | 4:53 |

Beatport lists Always Wanting under “Melodic House & Techno | Melodic House”; the catalog uses the confirmed parent genre, Melodic House & Techno. Trailing whitespace in Love Is Love's displayed title is trimmed. Otherwise key spellings and mix names are preserved as reported.

Each record uses its Beatport track ID as stable identity, including its exact version, with source and check date alongside the metadata. Track placements have their own IDs and reference the recording ID; the plan does not identify a recording by title or array position. Two House entries are both called Love and remain distinct by artist and source ID.

This first slice returns all candidates for the selected genre in catalog order. Each genre currently has just three recordings, so the UI explicitly calls the result a short starting selection. Energy, harmonic compatibility, performance context, duration planning, and transition assessment are later slices. The controlled catalog under `tests/fixtures/` is illustrative test data, not production evidence.

When adding or correcting records, repeat this page review, preserve exact versions and identity, record the verification date, and use `null` for unsupported BPM, key, length, or energy. A passing browser fixture test does not verify a new real recording.
