-- Revisado el 15/11/2026 en las fichas oficiales de CobraTicket (cobraticket.uy):
-- fecha, hora, lugar y edad. Horarios en Uruguay (-03:00).
-- No se guardan precios: CobraTicket los muestra al comprar.
-- Meller Open Bar (5/1) no se carga porque la ficha no indica lugar.
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
      ('SALASTKBRON - Mega Lokeo Curupí', 'Curupí', 'Carmelo', 'Boliche', '+18',
       '2026-11-21 23:50:00-03:00', 'https://cobraticket.uy/e/salastkbron-mega-lokeo-curupi-607187'),
      ('SPOT', 'Lotus La Barra', 'Punta del Este', 'Boliche', '+21',
       '2026-11-21 23:59:00-03:00', 'https://cobraticket.uy/e/spot-316131'),
      ('Makara Sunset', 'Malesa Beach Club', 'Punta del Este', 'Boliche', null,
       '2026-11-27 18:00:00-03:00', 'https://cobraticket.uy/e/makara-sunset-596053'),
      ('Festival MAI', 'Predio AUTE', 'Montevideo', 'Boliche', null,
       '2026-11-28 17:00:00-03:00', 'https://cobraticket.uy/e/festival-mai-325463'),
      ('MIS Goodbye Party', 'Sala 26', 'Montevideo', 'Boliche', '+18',
       '2026-12-04 23:59:00-03:00', 'https://cobraticket.uy/e/mis-goodbye-party-317714'),
      ('Piedra Lisa INAUGURACION', 'Country Atlántida', 'Canelones', 'Boliche', '+18',
       '2026-12-05 23:50:00-03:00', 'https://cobraticket.uy/e/piedra-lisa-inauguracion-329800'),
      ('Plagio - La Fiesta Final', 'Club Defensor Maldonado', 'Maldonado', 'Cumbia / RKT', '+18',
       '2026-12-18 22:00:00-03:00', 'https://cobraticket.uy/e/plagio-la-fiesta-final-385557'),
      ('SOMOS Phonetec', 'Ruta 104', 'Punta del Este', 'Boliche', '+21',
       '2027-01-07 23:59:00-03:00', 'https://cobraticket.uy/e/somos-phonetec-915720')
    ) as v(title, venue, city, category, age, starts_at, url)
  loop
    if exists (
      select 1 from public.events
      where lower(trim(title)) = lower(item.title)
        and (event_date::timestamptz at time zone 'America/Montevideo')::date
          = (item.starts_at::timestamptz at time zone 'America/Montevideo')::date
    ) then
      raise notice 'Ya existe, se saltea: %', item.title;
    else
      insert into public.events (
        title, venue_name, city, neighborhood, category, age_range, event_date,
        ticket_url, verification_status, verified_at, verification_source_url
      ) values (
        item.title, item.venue, item.city, '', item.category, item.age,
        item.starts_at, item.url, 'verified', now(), item.url
      );
      inserted_count := inserted_count + 1;
    end if;
  end loop;

  raise notice 'Eventos insertados: %', inserted_count;
end
$$;
