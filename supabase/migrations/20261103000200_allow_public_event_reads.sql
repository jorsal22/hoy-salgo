grant select on public.events to anon, authenticated;

drop policy if exists "Anyone can read events" on public.events;
create policy "Anyone can read events"
  on public.events
  for select
  to anon, authenticated
  using (true);
