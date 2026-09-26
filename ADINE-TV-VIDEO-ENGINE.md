# آدینه‌تی‌وی — Video Discovery Engine V1

## معماری
- Frontend: `adine-tv.html` + `adine-tv-search.js`
- Backend: Supabase Edge Function `video-search`
- Live providers: YouTube Data API v3 + optional Brave Video Search federation
- Curated fallback: selected ITPNews, Aparat, Aviagen entries
- Video files are never downloaded or stored by the application.

## Production secret
The Edge Function supports two optional live providers:
- `YOUTUBE_API_KEY` — official YouTube Data API v3 for direct YouTube results.
- `BRAVE_VIDEO_API_KEY` — Brave Video Search for multi-source web video discovery across indexed platforms/sites.

Set either or both in Supabase Edge Function Secrets. For the full multi-source experience, configure both. Never place keys in GitHub or browser JavaScript. Do not place the key in GitHub or browser JavaScript.

## Safety / quota controls
- Query length capped at 80 characters.
- Per-instance rate limit: 8 requests / minute / forwarded IP.
- Initial live result count capped at 12.
- Pagination only happens after the user clicks «نمایش نتایج بیشتر».
- YouTube search uses one `search.list` call per page.
- Results link to the original provider; no third-party video files are mirrored.

## Source expansion
The adapter boundary is intentionally provider-neutral. Additional providers should be added only after their official API/feed/usage terms are verified. Do not implement brittle scraping as the core discovery path.

## User experience
- Search examples are shown immediately.
- The page always has curated content, so it does not look empty before the live provider is configured.
- Provider is visible on every result.
- Live search failure falls back to relevant curated content rather than showing a broken empty state.
