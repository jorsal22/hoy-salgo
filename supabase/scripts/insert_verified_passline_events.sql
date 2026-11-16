-- Revisado el 15/11/2026 en las fichas oficiales de Passline (passline.com):
-- fecha, hora, edad y precio. Horarios en Uruguay (-03:00).
-- Ciudades de Chains Disco y Complejo Sala Show: Montevideo (direcciones publicas).
-- No se cargan: Evora (agotado), Bikini Party, Navidad Complejo Jardines y
-- Navidad en Azul Beach (la ficha no indica ciudad).
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
      ('Shelby Intimo', 'Lotus Club', 'Montevideo', 'Boliche', '+18',
       '2026-11-15 23:55:00-03:00', 'https://www.passline.com/eventos/shelby-intimo-577285'),
      ('NMQ - Reggaeton vs Guaracha', 'Lotus Club', 'Montevideo', 'Cumbia / RKT', '+18',
       '2026-11-19 00:00:00-03:00', 'https://www.passline.com/eventos/nmq-reggaeton-vs-guaracha'),
      ('Summer x House of Polenta 2', 'Chains Disco', 'Montevideo', 'Electrónica', '+18',
       '2026-11-20 23:55:00-03:00', 'https://www.passline.com/eventos/summer-x-house-of-polenta-2'),
      ('La Triple P - Pink + Plop + Puerca', 'Complejo Sala Show', 'Montevideo', 'Boliche', '+18',
       '2026-11-20 23:55:00-03:00', 'https://www.passline.com/eventos/triple-p-mejor-que-2-son-3-pink-plop-puerca'),
      ('La Kliff - El Renacer', 'Chains Disco', 'Montevideo', 'Cumbia / RKT', '+18',
       '2026-11-21 22:00:00-03:00', 'https://www.passline.com/eventos/la-kliff-el-renacer'),
      ('Møss - The Lighthouse', 'Chains Disco', 'Montevideo', 'Electrónica', '+18',
       '2026-12-19 23:30:00-03:00', 'https://www.passline.com/eventos/moss-the-lighthouse'),
      ('My Tribe - Pasan Cosas', 'Narbona PDE', 'Punta del Este', 'Electrónica', '+21',
       '2026-12-29 19:00:00-03:00', 'https://www.passline.com/eventos/2912-my-tribe-pasan-cosas'),
      ('La TM - New Year''s Eve', 'Narbona PDE', 'Punta del Este', 'Electrónica', '+25',
       '2026-12-31 23:55:00-03:00', 'https://www.passline.com/eventos/la-tm-new-years-eve-pde-narbona-3112'),
      ('Michael Bibi', 'Narbona PDE', 'Punta del Este', 'Electrónica', '+18',
       '2027-01-02 18:00:00-03:00', 'https://www.passline.com/eventos/sabado-201-michael-bibi'),
      ('SUN Punta del Este 2027', 'Puerto de Punta del Este (Barco)', 'Punta del Este', 'Electrónica', '+18',
       '2027-01-07 17:00:00-03:00', 'https://www.passline.com/eventos/sun-punta-del-este-2027')
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
