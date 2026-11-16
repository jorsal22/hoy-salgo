-- Revisado el 15/11/2026 en el listado oficial de Entraste (app.entraste.com):
-- fecha, hora y lugar de cada ficha. Horarios en Uruguay (-03:00).
-- Precios publicados: Sensation USD 70-300, El Templo USD 50-300, Fantasy NYE USD 40-140,
-- Navidat UYU 3800-5050, Palito Bombon USD 20-65, Lovers USD 25-60, Arde USD 70-80,
-- Blavicio 05.01 USD 60-100, Bresh USD 30-90, Space is a Dream USD 150-200,
-- Key Argy USD 35-85, Blavicio 3rd USD 35-65. No se guardan precios en la tabla.
--
-- Idempotente: saltea un evento si ya existe el mismo titulo en la misma fecha.
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

  for item in
    select * from (values
      ('SENSATION - New Year''s Eve', '104 (km 3,5)', 'Punta del Este', 'Boliche', false,
       '2026-12-31 23:59:00-03:00', 'https://app.entraste.com/events/sensation-new-years-eve'),
      ('El Templo - NYE 2027', 'El Bosque', 'Punta del Este', 'Boliche', false,
       '2026-12-31 23:59:00-03:00', 'https://app.entraste.com/events/el-templo-nye-2027'),
      ('Fantasy NYE 2027', 'Open Park', 'Punta del Este', 'Electrónica', true,
       '2026-12-31 23:59:00-03:00', 'https://app.entraste.com/events/fantasy-nye-2027'),
      ('Navidat 2026', 'Lobos Rugby Club', 'Maldonado', 'Boliche', false,
       '2026-12-25 01:00:00-03:00', 'https://app.entraste.com/events/navidat-2026'),
      ('Palito Bombón', '104 (km 3,5)', 'Punta del Este', 'Boliche', false,
       '2026-12-29 23:59:00-03:00', 'https://app.entraste.com/events/palito-bombon'),
      ('Lovers', '104 (km 3,5)', 'Punta del Este', 'Boliche', false,
       '2027-01-02 23:59:00-03:00', 'https://app.entraste.com/events/lovers'),
      ('Arde by JW 2027', 'Open Park', 'Punta del Este', 'Electrónica', true,
       '2027-01-03 23:59:00-03:00', 'https://app.entraste.com/events/arde-by-jw-2027'),
      ('Blavicio at Open Park 05.01', 'Open Park', 'Punta del Este', 'Electrónica', true,
       '2027-01-05 23:59:00-03:00', 'https://app.entraste.com/events/blavicio-5-de-enero'),
      ('Bresh Open Park - 6 de enero', 'Open Park', 'Punta del Este', 'Electrónica', true,
       '2027-01-06 23:59:00-03:00', 'https://app.entraste.com/events/bresh-pde'),
      ('Space is a Dream 2027', 'Agua Verde', 'Punta del Este', 'Electrónica', false,
       '2027-01-06 22:00:00-03:00', 'https://app.entraste.com/events/spaces-is-a-dream-2027'),
      ('Key presenta Argy', 'Open Park', 'Punta del Este', 'Electrónica', true,
       '2027-01-15 23:00:00-03:00', 'https://app.entraste.com/events/key-presenta-argy'),
      ('Blavicio 3rd Chapter - at Open Park', 'Open Park', 'Punta del Este', 'Electrónica', true,
       '2027-01-16 23:59:00-03:00', 'https://app.entraste.com/events/blavicio-3rd-chapter-at-open-park'),
      ('Key presenta Pawsa', 'Sitio - Parque Roosevelt', 'Ciudad de la Costa', 'Electrónica', false,
       '2026-11-20 22:00:00-03:00', 'https://app.entraste.com/events/key-presenta-pawsa'),
      ('El Karnal en vivo', 'VOU', 'Montevideo', 'Cumbia / RKT', false,
       '2026-11-20 23:30:00-03:00', 'https://app.entraste.com/events/viernes-20-de-noviembre-el-karnal-en-vivo'),
      ('Pariseo Brasil Club', 'VOU Club', 'Montevideo', 'Boliche', false,
       '2026-11-27 23:59:00-03:00', 'https://app.entraste.com/events/pariseo-brasil-club-vie-27-nov')
    ) as v(title, venue, city, category, at_open_park, starts_at, url)
  loop
    if item.at_open_park and open_park_id is null then
      raise exception 'No se encontro el boliche Open Park en Punta del Este.';
    end if;

    if exists (
      select 1 from public.events
      where (lower(trim(title)) = lower(item.title)
          or (item.at_open_park and club_id = open_park_id))
        and (event_date::timestamptz at time zone 'America/Montevideo')::date
          = (item.starts_at::timestamptz at time zone 'America/Montevideo')::date
    ) then
      raise notice 'Ya existe, se saltea: %', item.title;
    else
      insert into public.events (
        title, venue_name, city, neighborhood, category, event_date,
        club_id, ticket_url, verification_status, verified_at, verification_source_url
      ) values (
        item.title, item.venue, item.city,
        case when item.at_open_park then coalesce(open_park_neighborhood, 'La Barra') else '' end,
        item.category, item.starts_at,
        case when item.at_open_park then open_park_id end,
        item.url, 'verified', now(), item.url
      );
      inserted_count := inserted_count + 1;
    end if;
  end loop;

  raise notice 'Eventos insertados: %', inserted_count;
end
$$;
