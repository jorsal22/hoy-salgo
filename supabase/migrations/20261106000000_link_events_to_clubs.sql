alter table public.events
  add column if not exists club_id uuid references public.clubs(id) on delete set null;

create index if not exists events_club_id_event_date_idx
  on public.events (club_id, event_date);

update public.events as event
set club_id = matches.club_id
from (
  select event.id as event_id, min(club.id::text)::uuid as club_id
  from public.events as event
  join public.clubs as club
    on lower(trim(event.venue_name)) = lower(trim(club.name))
    and lower(trim(event.city)) = lower(trim(club.city))
  where event.club_id is null
  group by event.id
  having count(club.id) = 1
) as matches
where event.id = matches.event_id;
