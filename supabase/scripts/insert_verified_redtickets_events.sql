-- Revisado el 15/11/2026 en las fichas oficiales de RedTickets (fecha, hora y lugar).
-- Horarios en Uruguay (-03:00). No se guardan precios: RedTickets los muestra al comprar.
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
      -- Montevideo
      ('GUADALOOP y Hasta el Piso o Nada', 'Sala del Museo del Carnaval', 'Montevideo',
       '2026-11-20 23:50:00-03:00', '+18', 'https://redtickets.uy/evento/GUADALOOP-Y-HASTA-EL-PISO-O-NADA-UNA-FIESTA-NO-APTA-PARA--CENTENNIALS/33830/'),
      ('Onyx Club x Loka PDE', 'Radisson Montevideo Victoria Plaza Hotel', 'Montevideo',
       '2026-11-20 23:59:00-03:00', '+18', 'https://redtickets.uy/evento/Onyx-Club-x-Loka-Pde/33227/'),
      ('Sambando Plena', 'Sala Botánica', 'Montevideo',
       '2026-11-21 23:59:00-03:00', '+18', 'https://redtickets.uy/evento/Sambando-plena/34969/'),
      ('CLARITA - Hi Holidays!', 'Lotus Club', 'Montevideo',
       '2026-11-29 23:59:00-03:00', null, 'https://redtickets.uy/evento/CLARITA--Hi-Holidays/34960/'),
      ('Modo Baile - La Despedida', 'Sala Botánica', 'Montevideo',
       '2026-12-04 23:59:00-03:00', '+18', 'https://redtickets.uy/evento/MODO-BAILE--LA-DESPEDIDA/34622/'),
      ('Formato + Phonotheque - Cierre de año', 'Sala del Museo del Carnaval', 'Montevideo',
       '2026-12-05 23:00:00-03:00', '+18', 'https://redtickets.uy/evento/FORMATO---Phonotheque-CIERRE-DE-ANO/33706/'),
      ('Baile de Llamadas', 'Complejo Sala Show', 'Montevideo',
       '2026-12-05 23:59:00-03:00', '+18', 'https://redtickets.uy/evento/BAILE-DE-LLAMADAS--5-de-Diciembre/34783/'),
      ('El Gordito Latino - Salseros e Influencers', 'Sala Rincón', 'Montevideo',
       '2026-12-11 23:00:00-03:00', null, 'https://redtickets.uy/evento/El-Gordito-Latino--Salseros-e-Influencers/34532/'),
      ('La Gran Zapada - Nestor, Junior & Silver Chance', 'Complejo Sala Show', 'Montevideo',
       '2026-12-18 23:59:00-03:00', '+18', 'https://redtickets.uy/evento/LA-GRAN-ZAPADA--18-DIC--NESTOR--JUNIOR--SILVER-CHANCE/34958/'),
      ('Sótano Fest', 'Sala del Museo del Carnaval', 'Montevideo',
       '2026-12-18 23:59:00-03:00', '+18', 'https://redtickets.uy/evento/SOTANO-FEST--18-de-Diciembre/34611/'),
      ('No Sleep - Christmas Session | Oscar L & Weska', 'The Cube', 'Montevideo',
       '2026-12-25 02:00:00-03:00', null, 'https://redtickets.uy/evento/NO-SLEEP-pres-CHRISTMAS-SESSION--OSCAR-L--WESKA/34721/'),
      -- Punta del Este y alrededores
      ('Full House', 'Lotus Club La Barra', 'Punta del Este',
       '2026-12-11 23:59:00-03:00', '+21', 'https://redtickets.uy/evento/FULL-HOUSE/34758/'),
      ('Hango by Loka - Sunset', 'Puerto de Punta del Este', 'Punta del Este',
       '2026-12-28 16:00:00-03:00', '+18', 'https://redtickets.uy/evento/HANGO-BY-LOKA/34760/'),
      ('La Juanita pres. Innellea / Chapa & Castelo / Bob Tosh', 'La Pista - Medellín Polo Club', 'Punta del Este',
       '2026-12-28 23:59:00-03:00', '+18', 'https://redtickets.uy/evento/La-Juanita-Pres-Innellea--Chapa--Castelo--Bob-Tosh/34920/'),
      ('Custom by Coco Club - PDE', 'Centro de Convenciones de Punta del Este', 'Punta del Este',
       '2026-12-29 23:55:00-03:00', null, 'https://redtickets.uy/evento/CUSTOM-by-Coco-Club--PDE/34409/'),
      ('Cordón Beer - La K''onga x DJ Sanata', 'Centro de Convenciones de Punta del Este', 'Punta del Este',
       '2027-01-05 23:55:00-03:00', '+18', 'https://redtickets.uy/evento/CORDON-BEER--LA-KONGA--X-DJ-SANATA/34942/'),
      ('Escandalito Open Bar - Punta del Este', 'Ruta 104', 'Punta del Este',
       '2027-01-05 23:55:00-03:00', '+21', 'https://redtickets.uy/evento/ESCANDALITO-OPEN-BAR---PUNTA-DEL-ESTE-0501/33053/'),
      -- Interior
      ('Navidad en Hango', 'Hango Carmelo', 'Carmelo',
       '2026-12-25 01:00:00-03:00', null, 'https://redtickets.uy/evento/Navidad-en-Hango/34822/'),
      ('Año Nuevo en Hango', 'Hango Carmelo', 'Carmelo',
       '2027-01-01 01:00:00-03:00', '+18', 'https://redtickets.uy/evento/Ano-Nuevo-en-HANGO/34840/'),
      ('Navidad en el Golf - Oversize x Odisea', 'Paysandú Golf Club', 'Paysandú',
       '2026-12-24 23:55:00-03:00', null, 'https://redtickets.uy/evento/NAVIDAD-EN-EL-GOLF--OVERSIZE-X-ODISEA/34798/')
    ) as v(title, venue, city, starts_at, age, url)
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
        item.title, item.venue, item.city, '', 'Boliche', item.age,
        item.starts_at, item.url, 'verified', now(), item.url
      );
      inserted_count := inserted_count + 1;
    end if;
  end loop;

  raise notice 'Eventos insertados: %', inserted_count;
end
$$;
