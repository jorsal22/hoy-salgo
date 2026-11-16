-- Revisado el 15/11/2026 en las fichas oficiales de Entraste (app.entraste.com).
-- Todos son en Open Park, Punta del Este. Horarios en Uruguay (-03:00).
-- Precios publicados (USD): Blavicio desde 40, Solomun desde 120,
-- Chris Stassy desde 30, Key Mood desde 30. No se cargan precios en la tabla.
--
-- Idempotente: si ya hay un evento de Open Park en la misma fecha, lo saltea.
-- Ejecutar manualmente en el SQL Editor de Supabase.

do $$
declare
  open_park_id public.clubs.id%type;
  open_park_neighborhood public.clubs.neighborhood%type;
  item record;
  inserted_count integer := 0;
begin
  select id, neighborhood into open_park_id, open_park_neighborhood
  from public.clubs
  where lower(trim(name)) = 'open park'
    and lower(trim(city)) = 'punta del este';

  if open_park_id is null then
    raise exception 'No se encontro el boliche Open Park en Punta del Este.';
  end if;

  for item in
    select * from (values
      ('BLAVICIO 1st Chapter - Open Park', '2026-12-28 23:59:00-03:00'::timestamptz,
       'https://app.entraste.com/events/blavicio-1st-chapter-at-open-park', '+18'),
      ('Solomun PDE 2026', '2026-12-29 23:00:00-03:00'::timestamptz,
       'https://app.entraste.com/events/solomun-pde-2026', null),
      ('Key presenta Chris Stassy', '2027-01-09 23:00:00-03:00'::timestamptz,
       'https://app.entraste.com/events/key-presenta-chris-stassy', null),
      ('Key Mood w/ Massano & more', '2027-01-30 23:00:00-03:00'::timestamptz,
       'https://app.entraste.com/events/key-mood-wmassano-more', null)
    ) as v(title, starts_at, url, age)
  loop
    if exists (
      select 1 from public.events
      where club_id = open_park_id
        and (event_date::timestamptz at time zone 'America/Montevideo')::date
          = (item.starts_at at time zone 'America/Montevideo')::date
    ) then
      raise notice 'Ya hay un evento en Open Park ese dia, se saltea: %', item.title;
    else
      insert into public.events (
        title, venue_name, city, neighborhood, category, age_range, event_date,
        club_id, ticket_url, verification_status, verified_at, verification_source_url
      ) values (
        item.title, 'Open Park', 'Punta del Este', coalesce(open_park_neighborhood, 'La Barra'),
        'Electrónica', item.age, item.starts_at::text,
        open_park_id, item.url, 'verified', now(), item.url
      );
      inserted_count := inserted_count + 1;
    end if;
  end loop;

  raise notice 'Eventos insertados: %', inserted_count;
end
$$;
