-- سلامت طیور TV — RLS correction
-- Applied after TV_LIVE_STREAMS_V1.sql.
drop policy if exists "tv live public active read" on public.tv_live_streams;
create policy "tv live public active read" on public.tv_live_streams
for select to anon
using (is_live = true);