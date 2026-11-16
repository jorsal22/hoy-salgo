-- Revisado el 15/11/2026.
-- 1) Agrega el flyer oficial (imagen de la ficha de RedTickets) a los eventos de
--    Arena La Paloma / La Nueva Escuela (Rocha) que no tienen imagen.
-- 2) Carga el 3er Festival Tradicionalista de La Coronilla (Rocha), con la
--    informacion y el flyer de la ficha oficial de Turismo Rocha
--    (turismorocha.gub.uy): 28 y 29/11, entrada sabado $250 y domingo $300.
--
-- Idempotente. Ejecutar manualmente en el SQL Editor de Supabase.

do $$
declare
  item record;
  updated_count integer := 0;
  tradicionalista_url constant text :=
    'https://turismorocha.gub.uy/eventos/2026/11/28/3er-festival-tradicionalista-5112';
begin
  for item in
    select * from (values
      ('https://redtickets.uy/evento/NEW-YEAR-EVE--ARENA-LA-PALOMA/33949/', 'https://files.redtickets.uy/imagenes/71efafce-76dc-4fbd-b661-0f52e7094e51_Event_33949.jpg'),
      ('https://redtickets.uy/evento/LA-YERRA--ARENA-LA-PALOMA/33952/', 'https://files.redtickets.uy/imagenes/7acf265d-fd58-46d8-a20e-242125470104_Event_33952.jpg'),
      ('https://redtickets.uy/evento/MENTA--ARENA-LA-PALOMA/33679/', 'https://files.redtickets.uy/imagenes/d04e454c-1e49-4867-a060-f2779e82a50f_Event_33679.jpg'),
      ('https://redtickets.uy/evento/LODGE--ARENA-LA-PALOMA/33124/', 'https://files.redtickets.uy/imagenes/ff2b138c-e74c-4778-bc7f-b7e3572e062e_Event_33124.jpg'),
      ('https://redtickets.uy/evento/BARDO--ARENA-LA-PALOMA/33202/', 'https://files.redtickets.uy/imagenes/05b8445a-0124-4df4-bad4-85e840ce8846_Event_33202.jpg'),
      ('https://redtickets.uy/evento/CABORTEADA--ARENA-LA-PALOMA/33477/', 'https://files.redtickets.uy/imagenes/93fe14e4-85b1-4a3a-b5ce-1f40f320d65c_Event_33477.jpg'),
      ('https://redtickets.uy/evento/ROTO--LA-NUEVA-ESCUELA/33404/', 'https://files.redtickets.uy/imagenes/c0c85cd2-bfd3-47d6-9a33-2056ec27fb0b_Event_33404.jpg'),
      ('https://redtickets.uy/evento/PICHEO--ARENA-LA-PALOMA/32772/', 'https://files.redtickets.uy/imagenes/5b7a87c1-35ac-44ec-a9c2-fa087baa030f_Event_32772.jpg'),
      ('https://redtickets.uy/evento/TURF--ARENA-LA-PALOMA/33724/', 'https://files.redtickets.uy/imagenes/3313a77c-367a-42e9-9953-e1265b382337_Event_33724.jpg'),
      ('https://redtickets.uy/evento/CHACHO-RAMOS--ARENA-LA-PALOMA/32771/', 'https://files.redtickets.uy/imagenes/347c002c-f372-4138-8c4e-3026e00df294_Event_32771.jpg')
    ) as v(url, image)
  loop
    update public.events
      set image_url = item.image
      where ticket_url = item.url and (image_url is null or image_url = '');
    updated_count := updated_count + 1;
  end loop;

  if exists (select 1 from public.events where ticket_url = tradicionalista_url) then
    update public.events
      set image_url = 'https://s3.amazonaws.com/turismorocha/eventos/5112/med/3er-festival-tradicionalista-082241100-1794075995.jpg'
      where ticket_url = tradicionalista_url and (image_url is null or image_url = '');
  else
    insert into public.events (
      title, venue_name, city, neighborhood, category, age_range, event_date,
      ticket_url, image_url, verification_status, verified_at, verification_source_url
    ) values (
      '3er Festival Tradicionalista', 'Ruedo Delis Silvera Lima', 'Rocha', 'La Coronilla',
      'Rock / En Vivo', null, '2026-11-28 21:30:00-03:00', tradicionalista_url,
      'https://s3.amazonaws.com/turismorocha/eventos/5112/med/3er-festival-tradicionalista-082241100-1794075995.jpg',
      'verified', now(), tradicionalista_url
    );
  end if;

  raise notice 'Eventos revisados para imagen: %', updated_count;
end
$$;
