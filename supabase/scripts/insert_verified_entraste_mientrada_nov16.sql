-- Revisado el 16/11/2026 en las fichas oficiales de Entraste y MiEntrada: fecha, hora y lugar.
-- Horarios en Uruguay (-03:00). Entraste muestra precios (Navivicio y Ano Nuevo: primera tanda UYU 570).
-- No se cargan: Mitic (14/11, ya paso), Miss Monique y FLOW (Punta del Este / sin ciudad clara),
-- Mega Pariseo (sin lugar publicado), Chacho Ramos (Chui, Brasil).
--
-- Idempotente: saltea un evento si ya existe el mismo ticket_url.

do $$
declare
  item record;
  inserted_count integer := 0;
begin
  for item in
    select * from (values
      ('Navivicio - 6ta Edición', 'Vicio', 'Florida', 'Boliche', '+18',
       '2026-12-24 23:59:00-03:00',
       'https://app.entraste.com/events/navivicio-6ta-edicion',
       'https://storage.googleapis.com/entraste-media/1794522862_810e7c306ba64a9a.webp'),
      ('Año Nuevo - Fiesta de Blanco', 'Vicio', 'Florida', 'Boliche', '+18',
       '2026-12-31 23:59:00-03:00',
       'https://app.entraste.com/events/ano-nuevo-fiesta-de-blanco',
       'https://storage.googleapis.com/entraste-media/1794522944_7f5fcb1af41b2860.webp'),
      ('Cadáveres Ilustres', 'Debbie 80s Music Club', 'Montevideo', 'Rock / En Vivo', null,
       '2026-11-20 22:00:00-03:00',
       'https://www.mientrada.com.uy/evento/cadaveres-ilustres-30790',
       null),
      ('Emile presenta: Pryma Showcase', 'Emile', 'Montevideo', 'Electrónica', null,
       '2026-11-20 23:59:00-03:00',
       'https://www.mientrada.com.uy/evento/emile-presenta-pryma-showcase-montei-nico-lampariello-vinz-30789',
       null),
      ('El Zucará y Carlos Malo', 'Anastasia', 'Montevideo', 'Música en vivo', null,
       '2026-11-19 20:00:00-03:00',
       'https://www.mientrada.com.uy/evento/el-zucara-y-carlos-malo-30729',
       null)
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
        item.starts_at::timestamptz, item.url, item.image, 'verified', now(), item.url
      );
      inserted_count := inserted_count + 1;
    end if;
  end loop;

  if inserted_count <> 5 then
    raise exception 'Se esperaban 5 eventos nuevos; se insertaron %', inserted_count;
  end if;
end
$$;
