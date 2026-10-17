# Music Integration Research

Official documentation reviewed on 17 October 2026 supports discovery links and downloadable set plans. Playable Rekordbox handoff requires a separate local-file or supported streaming workflow. These findings inform design choices; no integration has been implemented or tested.

## Beatport

Public track pages display DJ metadata including mix/version, genre, BPM, key, duration, and release date. See this [official track page](https://www.beatport.com/track/support/14119969).

The [API documentation](https://api.beatport.com/v4/docs/) and [partner integration portal](https://partnerportal.beatport.com/hc/en-us) require sign-in. Publicly visible metadata does not establish authorized programmatic access. API entitlement, catalog endpoints, preview reuse, and playlist writes remain unverified for this application.

## YouTube

The official [search API](https://developers.google.com/youtube/v3/docs/search/list) supports text queries and video and embeddability filters. The [video resource](https://developers.google.com/youtube/v3/docs/videos) provides descriptive metadata, duration, and availability information, but has no documented BPM, musical-key, or energy field.

YouTube search and supported player playback are candidates for discovery and auditioning. [Developer policies](https://developers.google.com/youtube/terms/developer-policies) restrict audiovisual downloading and audio separation, so raw YouTube audio is not the planned analysis or DJ-file acquisition route. A YouTube match also needs version checks: the title alone may not establish that it is the same mix as a Beatport release.

## Rekordbox

The [Rekordbox 7.2.14 manual](https://cdn.rekordbox.com/files/20260409151936/rekordbox7.214_manual_EN.pdf), page 40, documents M3U, M3U8, and PLS imports. The [XML specification](https://cdn.rekordbox.com/files/20200410160904/xml_format_list.pdf) requires a track location and describes local-file media references.

A list of webpage links does not supply playable local audio. A local-library export would require matching recommendations to the user's real media files and validating import in their installed Rekordbox version.

Rekordbox supports Beatport Streaming through a separate signup and exposes Beatport playlists; see the [FAQ](https://rekordbox.com/en/support/faq/rekordbox7/#faq-q502610) and [streaming guide](https://cdn.rekordbox.com/files/20241004105937/rekordbox7.0.4_streaming_service_usage_guide_EN.pdf), pages 9–10. This does not establish permission or API support for this website to write Beatport playlists.

## Energy assessment

The inspected documentation does not establish an accessible track-energy score, arrangement-density measure, phrase map, or cue-point analysis. The planner must distinguish the target energy arc from assessments of individual tracks. The user has accepted editable estimates with their basis and confidence shown, leaving unsupported ratings unknown. The evidence used to produce these estimates still needs to be defined.

## Remaining questions

- The user has local downloads and a Beatport subscription; whether they use Beatport Streaming inside Rekordbox and their exact tier remain unspecified.
- What authorized Beatport catalog access is available?
- What evidence can support energy estimates for the starter catalog?
- Which exact-version matching and confidence rules should the planner use?
- Which export workflow can be validated with the user's library and Rekordbox version?
