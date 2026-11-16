-- Revisado el 15/11/2026 en las fichas oficiales de cada ticketera.
-- Lugares sin boliche propio en la tabla clubs (club_id queda en null).
-- Precios publicados: Corona Sunset desde USD 45 (Early bird 2), Volve mi Negra
-- USD 60 (Preventa 3), Croqueta sin precio visible. No se guardan precios.
--
-- Idempotente: saltea un evento si ya existe el mismo titulo en la misma fecha.
-- Ejecutar manualmente en el SQL Editor de Supabase.

do $$
declare
  item record;
  inserted_count integer := 0;
begin
  for item in
    select * from (values
      ('Corona Sunset', '104 (km 3,5)', '2026-12-30 18:00:00-03:00'::timestamptz,
       'Boliche', null, 'https://app.entraste.com/events/corona-sunset'),
      ('Volvé mi Negra PDE', 'El Bosque', '2027-01-02 23:59:00-03:00'::timestamptz,
       'Boliche', null, 'https://app.entraste.com/events/volve-mi-negra-pde-0201'),
      ('Croqueta - Join the Experience', 'Narbona Punta del Este',
       '2027-01-15 23:30:00-03:00'::timestamptz, 'Boliche', '+25',
       'https://cobraticket.uy/e/croqueta-join-the-experience-590567')
    ) as v(title, venue, starts_at, category, age, url)
  loop
    if exists (
      select 1 from public.events
      where lower(trim(title)) = lower(item.title)
        and (event_date::timestamptz at time zone 'America/Montevideo')::date
          = (item.starts_at at time zone 'America/Montevideo')::date
    ) then
      raise notice 'Ya existe, se saltea: %', item.title;
    else
      insert into public.events (
        title, venue_name, city, neighborhood, category, age_range, event_date,
        ticket_url, verification_status, verified_at, verification_source_url
      ) values (
        item.title, item.venue, 'Punta del Este', '', item.category, item.age,
        item.starts_at::text, item.url, 'verified', now(), item.url
      );
      inserted_count := inserted_count + 1;
    end if;
  end loop;

  raise notice 'Eventos insertados: %', inserted_count;
end
$$;
