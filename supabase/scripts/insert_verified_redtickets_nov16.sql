-- Revisado el 16/11/2026 en las fichas oficiales de RedTickets (redtickets.uy):
-- fecha, hora, lugar y edad. Horarios en Uruguay (-03:00). Sin precio publicado en la ficha.
-- No se cargan: Mistika (reprogramado, fecha a confirmar), Pena Final Agronomia (sin fecha).
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
      ('La Nueva Escuela en La Bambola', 'La Bambola - La Casa Verde', 'Salto', 'Boliche', null,
       '2026-11-21 23:59:00-03:00',
       'https://redtickets.uy/evento/21NOV--LA-NUEVA-ESCUELA-en-LA-BAMBOLA/34833/',
       'https://files.redtickets.uy/imagenes/aac73f95-b675-456f-ba78-cc9dc742c127_Event_0.jpg'),
      ('Epica pres. Valentin Vargas & Marka Akme', 'Camino Guaycuru', 'San Jose de Mayo', 'Electrónica', '+18',
       '2026-11-21 23:00:00-03:00',
       'https://redtickets.uy/evento/EPICA-pres-Valentin-Vargas--Marka-Akme--San-Jose/34062/',
       'https://files.redtickets.uy/imagenes/385013c2-2f2a-442f-b732-a74265559c00_Event_34062.jpg'),
      ('El Cumple de Mabel - Edicion de Luxe', 'Sala del Museo del Carnaval', 'Montevideo', 'Fiesta', null,
       '2026-12-10 20:00:00-03:00',
       'https://redtickets.uy/evento/EL-CUMPLE-DE-MABEL--La-fiesta-mas-divertida---DICIEMBRE/34735/',
       'https://files.redtickets.uy/imagenes/053eb790-3468-4960-83ff-4e6e7bb8f183_Event_34735.jpg'),
      ('Jadeo XL - Fin de ano bailable', 'Sala del Museo del Carnaval', 'Montevideo', 'Boliche', '+18',
       '2026-12-12 23:59:00-03:00',
       'https://redtickets.uy/evento/JADEO-XL--12-DE-DICIEMBRE/33849/',
       'https://files.redtickets.uy/imagenes/4a4a2258-9f9b-4e42-8595-b87aa63665d2_Event_33849.jpg'),
      ('Coopada Fest - Fiesta Final', 'Complejo Sala Show', 'Montevideo', 'Boliche', '+18',
       '2026-12-12 23:59:00-03:00',
       'https://redtickets.uy/evento/Coopada-FEST--12-DIC--Fiesta-Final/34998/',
       'https://files.redtickets.uy/imagenes/e8c729f7-ef3b-46bb-a3dc-5fa5f0c798b5_Event_0.jpg'),
      ('MTV Hitz + TK 90', 'Live Era', 'Montevideo', 'Boliche', '+18',
       '2026-12-12 23:55:00-03:00',
       'https://redtickets.uy/evento/MTV-HITZ---TK-90/34435/',
       'https://files.redtickets.uy/imagenes/31ad45a7-553a-438c-9614-ae8df89db0f9_Event_0.jpg'),
      ('Samba do Marcio - Diciembre', 'Sala del Museo del Carnaval', 'Montevideo', 'Música en vivo', null,
       '2026-12-17 20:00:00-03:00',
       'https://redtickets.uy/evento/Samba-Do-Marcio--DICIEMBRE/34945/',
       'https://files.redtickets.uy/imagenes/47d1b2f7-ebcd-4b31-987c-1248a8a8228d_Event_34945.jpg')
    ) as v(title, venue, city, category, age, starts_at, url, image)
  loop
    if exists (select 1 from public.events where ticket_url = item.url) then
      raise notice 'Ya existe, se saltea: %', item.title;
    else
      insert into public.events (
        title, venue_name, city, neighborhood, category, age_range, event_date,
        ticket_url, image_url, verification_status, verified_at, verification_source_url
      ) values (
        item.title, item.venue, item.city, '', item.category, item.age,
        item.starts_at, item.url, item.image, 'verified', now(), item.url
      );
      inserted_count := inserted_count + 1;
    end if;
  end loop;

  raise notice 'Eventos insertados: %', inserted_count;
end
$$;
