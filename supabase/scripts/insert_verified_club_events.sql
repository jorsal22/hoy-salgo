-- Revisado el 12/11/2026. Volver a comprobar el evento antes de publicar.
-- Fuente: https://venti.live/evento/colyn-27-de-diciembre-en-pde
-- Inicio publicado: 2026-12-28 02:00 UTC = 27/12/2026 23:00 en Uruguay.
-- Sin flyer, enlace de entradas ni venta propia: requieren autorizacion.
--
-- Ejecutar manualmente en el SQL Editor de Supabase. Si ya hay cualquier
-- evento en el mismo local y fecha, no inserta otro y muestra un aviso.
-- No ejecutar simultaneamente desde dos sesiones.

do $$
declare
  matching_clubs integer;
  selected_club_id public.clubs.id%type;
  selected_neighborhood public.clubs.neighborhood%type;
  date_column_type text;
begin
  select data_type into date_column_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'events'
    and column_name = 'event_date';

  if date_column_type is null or date_column_type not in ('text', 'character varying') then
    raise exception 'Revisar el tipo de events.event_date antes de importar: %', date_column_type;
  end if;

  if (now() at time zone 'America/Montevideo') >= timestamp '2026-12-27 23:00:00' then
    raise exception 'El evento ya comenzo; comprobar su vigencia antes de importarlo.';
  end if;

  select count(*) into matching_clubs
  from public.clubs
  where lower(trim(name)) = lower('Roll and Rock Beach House')
    and lower(trim(city)) = lower('Punta del Este');

  if matching_clubs <> 1 then
    raise exception 'Se esperaba un unico Roll and Rock Beach House en Punta del Este; encontrados: %', matching_clubs;
  end if;

  select id, neighborhood into selected_club_id, selected_neighborhood
  from public.clubs
  where lower(trim(name)) = lower('Roll and Rock Beach House')
    and lower(trim(city)) = lower('Punta del Este');

  if exists (
    select 1
    from public.events
    where left(event_date::text, 10) = '2026-12-27'
      and (
        club_id = selected_club_id
        or (
          lower(trim(venue_name)) = lower('Roll and Rock Beach House')
          and lower(trim(city)) = lower('Punta del Este')
        )
      )
  ) then
    raise notice 'Ya hay un evento en este local y fecha; revisar antes de insertar.';
  else
    insert into public.events (
      title, venue_name, city, neighborhood, category, age_range, event_date, club_id
    ) values (
      'Colyn - Flama x Boomer', 'Roll and Rock Beach House', 'Punta del Este',
      selected_neighborhood, 'Electrónica', '+18', '2026-12-27 23:00:00',
      selected_club_id
    );
    raise notice 'Evento Colyn insertado y vinculado al boliche.';
  end if;
end
$$;
