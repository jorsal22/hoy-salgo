-- Revisado el 15/11/2026 en las fichas oficiales de MiEntrada (mientrada.com.uy):
-- fecha, hora, lugar y edad cuando figura. Horarios en Uruguay (-03:00).
-- No se cargan: Chacho Ramos (Chui, Brasil), Festival Verao Morphine y Reveillon
-- Campestre (Brasil), Close Roomba (la ficha no da hora) ni La Planta en Trinidad (ya existe).
--
-- Idempotente: saltea un evento si ya existe el mismo ticket_url.
-- Ejecutar manualmente en el SQL Editor de Supabase.

do $$
declare
  item record;
  inserted_count integer := 0;
begin
  for item in
    select * from (values
      ('Palma Fest', 'Roll and Rock Beach House', 'Punta del Este', 'Electrónica', null,
       '2026-11-20 23:59:00-03:00', 'https://www.mientrada.com.uy/evento/palma-fest-30331'),
      ('Emile presenta: Pryma Showcase', 'Emile', 'Montevideo', 'Electrónica', null,
       '2026-11-20 23:59:00-03:00', 'https://www.mientrada.com.uy/evento/emile-presenta-pryma-showcase-montei-nico-lampariello-vinz-30789'),
      ('Rave de Trolxs', 'Emile', 'Montevideo', 'Electrónica', null,
       '2026-11-21 23:59:00-03:00', 'https://www.mientrada.com.uy/evento/rave-de-trolxs-emile-30671'),
      ('La de Antes - Fiesta Retro', 'Hotel Radisson Montevideo', 'Montevideo', 'Fiesta Retro', null,
       '2026-11-21 22:30:00-03:00', 'https://www.mientrada.com.uy/evento/la-de-antes-21noviembre-30798'),
      ('La de Antes - Fiesta Final', 'Hotel Radisson Montevideo', 'Montevideo', 'Fiesta Retro', null,
       '2026-12-05 23:00:00-03:00', 'https://www.mientrada.com.uy/evento/la-de-antes-fiesta-final-05diciembre-30799'),
      ('Apoca Luz - Neón Party', 'L''Club', 'Montevideo', 'Boliche', null,
       '2026-11-21 23:00:00-03:00', 'https://www.mientrada.com.uy/evento/apoca-luz-cuban-party-30788'),
      ('20 años de La Máquina del Tiempo', 'Gimnasio de Juventud Soriano', 'Mercedes', 'Fiesta Retro', null,
       '2026-11-21 23:30:00-03:00', 'https://www.mientrada.com.uy/evento/20-anos-de-la-maquina-del-tiempo-2111-30719'),
      ('Navidad en La Rumba', 'La Rumba', 'Colonia', 'Boliche', null,
       '2026-12-24 23:59:00-03:00', 'https://www.mientrada.com.uy/evento/navidad-en-la-rumba-30712'),
      ('Punta Verano 2027 - Réveillon Unique', 'Serena Hotel, Playa Mansa', 'Punta del Este', 'Electrónica', null,
       '2026-12-31 23:00:00-03:00', 'https://www.mientrada.com.uy/evento/punta-verano-2027-reveillon-unique-30351'),
      ('Punta Verano 2027 - Hugel Closing Season', 'Manantiales Beach', 'Punta del Este', 'Electrónica', '+21',
       '2027-01-03 19:00:00-03:00', 'https://www.mientrada.com.uy/evento/punta-verano-2027-hugel-closing-season-30286')
    ) as v(title, venue, city, category, age, starts_at, url)
  loop
    if exists (select 1 from public.events where ticket_url = item.url) then
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
