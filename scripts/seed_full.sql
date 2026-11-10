-- ============================================================
-- HOY SALGO — Carga masiva de boliches y eventos
-- Pegar en Supabase → SQL Editor → Run
-- ============================================================

-- ── NUEVOS BOLICHES ──────────────────────────────────────────

INSERT INTO clubs (name, city, neighborhood, address, phone, instagram_url) VALUES
-- Montevideo
('Sala Zitarrosa', 'Montevideo', 'Centro', '18 de Julio 1012', '+598 2901 7303', 'https://www.instagram.com/salazitarrosa/'),
('Teatro de Verano', 'Montevideo', 'Parque Rodo', 'Rambla Wilson s/n', '+598 2711 5555', 'https://www.instagram.com/teatrodeverano_mvd/'),
('Club Misterio', 'Montevideo', 'Cordón', 'Canelones 1544', '+598 2410 2020', 'https://www.instagram.com/clubmisterio.mvd/'),
('Shannon Irish Pub', 'Montevideo', 'Pocitos', 'Bulevar España 2690', '+598 2711 8899', 'https://www.instagram.com/shannonpub.uy/'),
('Bar Rivero', 'Montevideo', 'Ciudad Vieja', 'Rincón 487', '+598 2915 7788', 'https://www.instagram.com/barrivero.mvd/'),
('Clandestino Bar', 'Montevideo', 'Cordón', 'Durazno 1660', '+598 2409 3344', 'https://www.instagram.com/clandestino.bar.mvd/'),
('El Milongon', 'Montevideo', 'Palermo', 'Gabriel Pereira 2996', '+598 2711 4455', 'https://www.instagram.com/elmilongon.uy/'),
('Club Fusion', 'Montevideo', 'Tres Cruces', 'Rivera 2567', '+598 2480 6677', 'https://www.instagram.com/clubfusion.mvd/'),
('Paullier Club', 'Montevideo', 'Cordón', 'Paullier 1050', '+598 2409 1122', 'https://www.instagram.com/paullierclub/'),
('El Farolito Bar', 'Montevideo', 'Palermo', 'Yaguaron 1456', '+598 2900 5566', 'https://www.instagram.com/elfarolito.bar/'),
('Plop! Club', 'Montevideo', 'Parque Rodo', 'Rambla Wilson 1234', '+598 2711 2345', 'https://www.instagram.com/fiestaplop/'),
('Loquito Bar', 'Montevideo', 'Pocitos', 'Ellauri 644', '+598 2710 7788', 'https://www.instagram.com/loquitobar.uy/'),
('La Ronda Palermo', 'Montevideo', 'Palermo', '21 de Setiembre 2855', '+598 2711 3300', 'https://www.instagram.com/larondapalermo/'),
('Espacio Guambia', 'Montevideo', 'Cordón', 'Guambia 1980', '+598 2409 8899', 'https://www.instagram.com/espacioguambia/'),
('El Pony Pisador', 'Montevideo', 'Cordón', 'Francisco Muñoz 2558', '+598 2410 4455', 'https://www.instagram.com/elponypisador/'),
('Boliche El Canario', 'Montevideo', 'Punta Carretas', 'Solano Garcia 2500', '+598 2711 6677', 'https://www.instagram.com/bolichedelcanario/'),
('Sala del Fundador', 'Montevideo', 'Ciudad Vieja', 'Soriano 1234', '+598 2916 4455', 'https://www.instagram.com/saladelfundador/'),
('D-Club Montevideo', 'Montevideo', 'Centro', 'Soriano 980', '+598 2900 1122', 'https://www.instagram.com/dclub.montevideo/'),
('Bar Cocodrilo', 'Montevideo', 'Pocitos', 'Pagola 3100', '+598 2710 2244', 'https://www.instagram.com/barcocodrilo.uy/'),
('La Trastienda MVD', 'Montevideo', 'Ciudad Vieja', 'Buenos Aires 652', '+598 2916 7788', 'https://www.instagram.com/latrastienda.mvd/'),
-- Punta del Este
('Coco Punta del Este', 'Punta del Este', 'La Barra', 'Ruta 10 km 162', '+598 42 771 100', 'https://www.instagram.com/cocobar.pde/'),
('Tequila Sunrise Club', 'Punta del Este', 'Punta del Este', 'Parada 1 Playa Mansa', '+598 42 445 500', 'https://www.instagram.com/tequilasunrisepde/'),
('Illusion Club PDE', 'Punta del Este', 'Punta del Este', 'Parada 3 Playa Brava', '+598 42 449 900', 'https://www.instagram.com/illusionclubpde/'),
('Stradivarius Bar', 'Punta del Este', 'Puerto', 'Puerto de Punta del Este L-23', '+598 42 441 234', 'https://www.instagram.com/stradivariuspde/'),
('Sotano Beat Club', 'Punta del Este', 'Punta del Este', 'Gorlero y 24', '+598 42 440 088', 'https://www.instagram.com/sotanobeatclub/'),
-- Maldonado
('Alquimia Club', 'Maldonado', 'La Barra', 'Ruta 10 km 164', '+598 42 772 200', 'https://www.instagram.com/alquimiaclub.uy/'),
('Buenos Dias Bar', 'Maldonado', 'Jose Ignacio', 'Los Teros y Las Garzas', '+598 94 500 100', 'https://www.instagram.com/buenosdiasji/'),
('Parador Bravo', 'Maldonado', 'Manantiales', 'Parada 42 Playa Brava', '+598 42 775 500', 'https://www.instagram.com/paradorbravopde/'),
-- Rocha
('Valizas Surf Club', 'Rocha', 'Valizas', 'Calle Principal s/n, Valizas', '+598 94 300 200', 'https://www.instagram.com/valizassurfclub/'),
('Punta del Diablo Hostel Bar', 'Rocha', 'Punta del Diablo', 'Calle de los Pescadores s/n', '+598 94 400 300', 'https://www.instagram.com/pddiablo.bar/'),
('El Aguila La Paloma', 'Rocha', 'La Paloma', 'Av. Nicolas Sola 68', '+598 4479 6100', 'https://www.instagram.com/elaguila.lapaloma/'),
('Bar del Puerto Polonio', 'Rocha', 'Cabo Polonio', 'Farol de Cabo Polonio s/n', '+598 94 500 400', 'https://www.instagram.com/bardelpuerto.polonio/'),
-- Canelones
('Punta Colorada Beach Club', 'Canelones', 'Punta Colorada', 'Rambla Punta Colorada s/n', '+598 2228 1122', 'https://www.instagram.com/puntacolorada.bc/'),
('La Floresta Club', 'Canelones', 'La Floresta', 'Av. Rivera s/n, La Floresta', '+598 2225 3344', 'https://www.instagram.com/laflorestaclub/'),
('Salinas Bar y Playa', 'Canelones', 'Salinas', 'Rambla de Salinas s/n', '+598 2228 5566', 'https://www.instagram.com/salinasbar.uy/'),
('Atlantis Club Atlantida', 'Canelones', 'Atlantida', 'Rambla Tomas Berreta 1200', '+598 2372 7788', 'https://www.instagram.com/atlantisclub.uy/'),
-- Colonia
('El Drugstore Colonia', 'Colonia del Sacramento', 'Barrio Historico', 'Washington Barbot 160', '+598 4522 5241', 'https://www.instagram.com/eldrugstorecolonia/'),
('La Bodeguita Colonia', 'Colonia del Sacramento', 'Barrio Historico', 'De la Playa 174', '+598 4522 3344', 'https://www.instagram.com/labodeguita.colonia/'),
('Yacht Club Colonia', 'Colonia del Sacramento', 'Puerto', 'Rambla de Colonia s/n', '+598 4522 1234', 'https://www.instagram.com/yachtclubcolonia/'),
('Pulperia de los Faroles', 'Colonia del Sacramento', 'Barrio Historico', 'Misiones de los Tapes 101', '+598 4522 2255', 'https://www.instagram.com/pulperiafaroles/'),
-- Salto
('Club Social Salto', 'Salto', 'Centro', 'Uruguay 23', '+598 4732 5500', 'https://www.instagram.com/clubsocialsalto/'),
('Termas del Dayman Club', 'Salto', 'Termas del Dayman', 'Ruta 3 km 487', '+598 4736 2200', 'https://www.instagram.com/termasdayman.club/'),
('El Muelle Bar Salto', 'Salto', 'Costanera', 'Rambla Costanera 320', '+598 4732 6677', 'https://www.instagram.com/elmuellebar.salto/'),
-- Rivera
('Club Fronterizo Rivera', 'Rivera', 'Centro', 'Agraciada 500', '+598 4622 3300', 'https://www.instagram.com/clubfronterizo.rivera/'),
('Boliche El Norte', 'Rivera', 'Centro', 'Treinta y Tres 1200', '+598 4622 4455', 'https://www.instagram.com/bolichelnorte.rivera/'),
-- Artigas
('Club Artigas Social', 'Artigas', 'Centro', 'Lecueder 400', '+598 4772 2200', 'https://www.instagram.com/clubartigassocial/'),
-- Mercedes
('El Puerto Bar Mercedes', 'Mercedes', 'Puerto', 'Roosevelt 100', '+598 4532 1100', 'https://www.instagram.com/elpuerto.mercedes/'),
('Club Nautico Mercedes', 'Mercedes', 'Costanera', 'Rambla Costanera s/n', '+598 4532 2200', 'https://www.instagram.com/nautico.mercedes/'),
-- Minas
('El Parnaso Bar', 'Minas', 'Centro', '18 de Julio 450', '+598 4442 3300', 'https://www.instagram.com/elparnaso.minas/'),
-- Treinta y Tres
('El Olimar Bar', 'Treinta y Tres', 'Centro', 'General Enrique Martinez 650', '+598 4452 1100', 'https://www.instagram.com/elolimarbar/'),
-- Fray Bentos
('Club Fray Bentos Social', 'Fray Bentos', 'Centro', '25 de Mayo 3350', '+598 4562 2200', 'https://www.instagram.com/clubfb.social/');


-- ── EVENTOS PARA BOLICHES EXISTENTES SIN EVENTOS ──────────────────────────────

INSERT INTO events (club_id, title, venue_name, city, neighborhood, category, age_range, event_date, instagram_url, description, is_featured)
VALUES
-- Mandarine Club
('2663e0bf-c3b4-4a45-af8a-47ad113f3a26','Mandarine Rooftop Night','Mandarine Club','Montevideo','Pocitos','Electrónica','+18','2025-07-18 23:00:00','https://www.instagram.com/mandarineclub/','Noche de house y techno en la terraza de Pocitos con DJs nacionales e internacionales.',false),
-- Cain Club
('313018ed-2fa9-4190-8da6-5557a25f2611','Cain After Dark','Cain Club','Montevideo','Centro','Boliche','+18','2025-07-19 23:30:00','https://www.instagram.com/cainclub/','La noche del Centro con cumbia, reggaeton y electronica hasta el amanecer.',false),
-- Tazu Music Club
('43bd4746-4636-4b6e-89b9-e985acc9ff25','Tazu Music Fridays','Tazu Music Club','Montevideo','Centro','Pub / Bar','+18','2025-07-25 22:30:00','https://www.instagram.com/tazumusicclub/','Viernes de musica en vivo y DJs en el corazon del Centro.',false),
-- El Poncho Pub
('f145382a-615e-400e-8e59-1a5712239cf8','El Poncho en Vivo','El Poncho Pub','Montevideo','Pocitos','Rock / En Vivo','+18','2025-07-26 21:00:00','https://www.instagram.com/elponchopub/','Bandas de rock uruguayo en vivo, tragos artesanales y buena energia en Pocitos.',false),
-- Cerveceria Mastra
('5b88fbdf-4f18-486d-a47d-185bba4ed861','Mastra Craft Beer Night','Cerveceria Mastra Cordon','Montevideo','Cordón','Pub / Bar','+18','2025-08-01 20:00:00','https://www.instagram.com/mastra_uy/','Noche de cervezas artesanales con musica en vivo y picadas en el Cordon.',false),
-- Kibon Avanza
('b90bcfad-eae9-40e3-8461-03f7f4b01ffb','Kibon Sunset Rambla','Kibon Avanza','Montevideo','Pocitos','Electrónica','+18','2025-08-02 18:00:00','https://www.instagram.com/kibonavanza/','El mejor sunset sobre la rambla con DJ sets de electronica y cocktails.',false),
-- Chantilly Bar
('421a673d-ef3f-4986-ac96-5c6ce2dc9fdb','Chantilly Sabado Social','Chantilly Bar','Montevideo','Pocitos','Cumbia / RKT','+18','2025-08-02 23:00:00','https://www.instagram.com/chantillybar/','Sabados de cumbia, cachengue y tragos 2x1 hasta la madrugada en Pocitos.',false),
-- Ronda Bar
('0db0f3be-a2f0-4da3-8933-2485598e045e','Ronda Sessions Jazz','Ronda Bar','Montevideo','Ciudad Vieja','Pub / Bar','+18','2025-08-08 21:00:00','https://www.instagram.com/rondabar.mvd/','Sesiones de jazz en la Ciudad Vieja con tragos de autor.',false),
-- La Terraza MVD
('0207f149-eaa8-4e97-bf5d-41232e60cdff','La Terraza Open Air','La Terraza MVD','Montevideo','Parque Rodó','Electrónica','+18','2025-08-09 22:00:00','https://www.instagram.com/laterraza_mvd/','Noche al aire libre con vista a Parque Rodo, house music y cocktails premium.',false),
-- Socio Club
('cadb17a8-add8-49e2-8fff-b9c813760f09','Socio Club Saturday','Socio Club','Montevideo','Centro','Boliche','+18','2025-08-09 23:30:00','https://www.instagram.com/socioclub.mvd/','El club social del Centro, musica variada y el mejor ambiente de Montevideo.',false),
-- El Gran Pez
('12ac22f6-c7b9-484e-b5c5-9791561e7f54','El Gran Pez en Vivo','El Gran Pez','Montevideo','Parque Rodó','Rock / En Vivo','+18','2025-08-15 21:30:00','https://www.instagram.com/elgranpezbar/','Noche de rock en vivo a metros de la rambla. Bandas locales y buena cerveza.',false),
-- Basquiat Bar
('1bb1aba3-f182-4eaf-a028-40e2b547adb7','Basquiat Art y Music Night','Basquiat Bar','Montevideo','Pocitos','Pub / Bar','+18','2025-08-15 22:00:00','https://www.instagram.com/basquiatbar/','Arte, musica y cocktails en el bar mas cultural de Pocitos.',false),
-- Tibet Club
('f23b90a3-3f2e-42ec-92c1-fa3226d5c011','Tibet Electronic Night','Tibet Club','Montevideo','Cordón SoHo','Electrónica','+18','2025-08-16 23:00:00','https://www.instagram.com/tibetclubuy/','Underground electronico en el Cordon SoHo. House, techno y deep house.',false),
-- Bar Tito
('4a97ee5c-6541-4fad-8caa-19ce1d64df66','Bar Tito Viernes de Rock','Bar Tito','Montevideo','Cordón','Rock / En Vivo','+18','2025-08-22 21:00:00','https://www.instagram.com/bartitocordon/','El clasico de Cordon: rock nacional en vivo, birra fria y buena gente.',false),
-- Bar de Cantaros
('e80922f4-ecc6-4e4a-b4a6-5d41268abd60','Cantaros Live Music','Bar de Cantaros','Montevideo','Cordón','Pub / Bar','+18','2025-08-23 21:30:00','https://www.instagram.com/bardecantaros/','Musica en vivo, vinos y el ambiente mas calido del Cordon.',false),
-- Chanteclair Club
('40e2fefd-588f-47b6-9912-d079ddec323d','Chanteclair Gran Noche','Chanteclair Club','Montevideo','Cordón','Boliche','+18','2025-08-29 23:00:00','https://www.instagram.com/chanteclairclub/','El historico Chanteclair con toda su energia. Reggaeton, cumbia y mas.',false),
-- Blast Mvd
('00f2ac80-80f9-4112-984d-19fd5557a583','Blast Outdoor Party','Blast Mvd','Montevideo','Parque Rodó','Electrónica','+18','2025-08-30 22:00:00','https://www.instagram.com/blast.mvd/','Fiesta al aire libre en Parque Rodo. Electronica, trap y lo mejor del verano.',false),
-- Tazu Bar Club
('09f9582f-d406-468e-a5c2-991bddbbf0e8','Tazu Bar Cocktails Night','Tazu Bar Club','Montevideo','Ciudad Vieja','Pub / Bar','+18','2025-09-05 22:00:00','https://www.instagram.com/tazubarclub/','Cocktails de autor, DJ en vivo y la mejor energia de la Ciudad Vieja.',false),
-- La China Club
('f256c81b-77c5-4991-9700-655a5286f2d6','La China Open Air','La China Club','Montevideo','Parque Rodó','Electrónica','+18','2025-09-06 23:00:00','https://www.instagram.com/lachinaclub_mvd/','El clasico open air de Montevideo con los mejores DJs nacionales.',false),
-- Gallaghers
('1b8d7b4f-79e9-4322-aa69-625fa1f26d5e','Gallaghers Irish Night','Gallaghers Pub','Montevideo','Pocitos','Pub / Bar','+18','2025-09-12 21:00:00','https://www.instagram.com/gallagherspub.mvd/','Noche irlandesa con musica en vivo, Guinness y el mejor ambiente de Pocitos.',false),
-- Burlesque Bar
('e8db4f0a-b583-4c64-ba25-d0f261343d43','Burlesque Cabaret Night','Burlesque Bar','Montevideo','Pocitos','Pub / Bar','+18','2025-09-13 22:30:00','https://www.instagram.com/burlesquebar/','Show de cabaret, musica jazz y cocktails en el corazon de Pocitos.',false),
-- Volstead Bar
('d4614803-a8f6-4c83-8065-55c9f19186aa','Volstead Speakeasy Night','Volstead Bar','Montevideo','Cordón','Pub / Bar','+18','2025-09-19 21:30:00','https://www.instagram.com/volstead.bar/','Noche de speakeasy con jazz, bourbon y la elegancia del Cordon.',false),
-- MUTE Montevideo
('e9174be7-6506-4614-b0f7-1ac4e52d932e','MUTE Underground','MUTE Montevideo','Montevideo','Ciudad Vieja','Electrónica','+18','2025-09-20 23:30:00','https://www.instagram.com/mutemontevideo/','El underground mas oscuro de Montevideo. Techno, industrial y dark electro.',false),
-- Ocean Club
('e1107fc8-111d-45af-a777-169e11bf262d','Ocean Club Playa Brava','Ocean Club','Maldonado','Punta del Este','Electrónica','+18','2025-07-19 23:00:00','https://www.instagram.com/oceanclubpde/','La fiesta mas exclusiva de Punta frente al mar. DJs internacionales y open bar.',false),
-- Babaloo
('f3abbeca-ac14-4881-9049-d46bc941fa7e','Babaloo Summer Opening','Babaloo Punta del Este','Maldonado','Punta del Este','Boliche','+18','2025-07-25 23:30:00','https://www.instagram.com/babaloopde/','El historico Babaloo abre la temporada con reggaeton, cumbia y los mejores DJs.',false),
-- Tequila Club
('000a8940-bc74-49f7-8ae2-6c6c1afe42f4','Tequila Club La Barra','Tequila Club','Maldonado','La Barra','Boliche','+18','2025-08-01 23:00:00','https://www.instagram.com/tequilapde/','La Barra se prende: reggaeton, electronica y los mejores tequilas de la noche.',false),
-- Bagatelle Beach
('fdf44dd8-c458-421a-8dde-c9ce0066681c','Bagatelle Beach Party','Bagatelle Beach','Maldonado','Manantiales','Electrónica','+18','2025-08-02 20:00:00','https://www.instagram.com/bagatellerivera/','Beach party de dia y noche en Manantiales. DJ sets, piscina y cocktails.',false),
-- Ferona Club Social
('904ad013-bc96-4452-bcbb-b49d3302a18b','Ferona Weekend Vibes','Ferona Club Social','Maldonado','La Barra','Pub / Bar','+18','2025-08-08 22:00:00','https://www.instagram.com/feronabar/','Fin de semana en La Barra con musica variada, drinks y el mejor ambiente.',false),
-- Imayele Beach Club
('ddaa10ed-e9d6-49ec-8ecd-0011b5f73e80','Imayele Sunset Session','Imayele Beach Club','Maldonado','Punta del Este','Electrónica','+18','2025-08-09 18:30:00','https://www.instagram.com/imayelepde/','Sunset session frente al mar con house music y los mejores cocktails de PDE.',false),
-- Im In Club
('3d2789d1-4e7a-4e27-abff-b717bc440055','Im In La Barra Party','Im In Club','Maldonado','La Barra','Boliche','+18','2025-08-15 23:00:00','https://www.instagram.com/iminlabarra/','La fiesta mas grande de La Barra: electronica, reggaeton y open bar VIP.',false),
-- Cova Bar
('f5c30099-1d7b-4204-98e7-9ea9dd0e3466','Cova Bar Puerto Night','Cova Bar','Maldonado','Punta del Este','Pub / Bar','+18','2025-08-16 21:00:00','https://www.instagram.com/covapde/','Noche frente al puerto de PDE con jazz en vivo y los mejores vinos uruguayos.',false),
-- No Me Olvides
('4346ef0c-21ef-4b82-8aaf-a3c5e03528a1','No Me Olvides Manantiales','No Me Olvides','Maldonado','Manantiales','Electrónica','+18','2025-08-22 22:00:00','https://www.instagram.com/nomeolvidesmanantiales/','El favorito de Manantiales regresa con una noche especial de house y techno.',false),
-- Bikini Beach
('9d3cae1c-8306-45d3-aa8d-389695a53f94','Bikini Beach Day and Night','Bikini Beach Parador','Punta del Este','Manantiales','Electrónica','+18','2025-07-20 17:00:00','https://www.instagram.com/bikinibeachoficial/','De dia en la playa y de noche en la pista. El parador de Manantiales en su mejor momento.',false),
-- Bagatelle PDE
('30853163-34e4-46df-a41c-3535b632918f','Bagatelle La Barra Season','Bagatelle Beach Punta del Este','Punta del Este','La Barra','Electrónica','+18','2025-08-01 22:00:00','https://www.instagram.com/bagatellepuntadeleste/','La apertura de temporada mas esperada de La Barra con DJs internacionales.',false),
-- Solera
('a64e820e-40f6-48f2-b395-2a691e0c21ff','Solera Wine Sunset JI','Solera Wine Bar y Tapas','Punta del Este','José Ignacio','Pub / Bar','+18','2025-08-08 19:00:00','https://www.instagram.com/solerajoseignacio/','Vinos uruguayos, tapas y jazz en el rincon mas exclusivo de Jose Ignacio.',false),
-- Club La Paloma
('6e1b7b82-e124-422a-b883-94f1e0834fa5','Club La Paloma Sabado','Club La Paloma','Rocha','La Paloma','Boliche','+18','2025-07-26 22:00:00','https://www.instagram.com/clublapaloma/','El encuentro social de La Paloma con musica en vivo y el mejor ambiente costero.',false),
-- Bitacora Bar
('d925e7bd-83fe-4dea-bc09-73288b9d16ee','Bitacora Mar y Musica','Bitacora Bar','Rocha','La Paloma','Rock / En Vivo','+18','2025-08-01 21:00:00','https://www.instagram.com/bitacorabar/','Frente al mar en La Paloma con bandas en vivo y el mejor ambiente del litoral.',false),
-- El Club del Diablo
('247391c8-aae7-40ab-8e6e-483afa52caa9','El Club del Diablo Noche','El Club del Diablo','Rocha','Punta del Diablo','Boliche','+18','2025-08-08 23:00:00','https://www.instagram.com/elclubdeldiablo/','La noche mas salvaje de Punta del Diablo. Reggaeton y cumbia hasta el amanecer.',false),
-- La Perla del Cabo
('469f1f13-552a-45cb-a40d-3d76a04ca911','La Perla Cabo Polonio','La Perla del Cabo','Rocha','Cabo Polonio','Pub / Bar','+18','2025-08-15 20:00:00','https://www.instagram.com/laperladelcabo/','En el fin del mundo: musica al ritmo de las olas en Cabo Polonio.',false),
-- Teatro Amarra
('e181daf8-e7a9-48ac-a3dc-aab62cef8065','Teatro Amarra en Vivo','Teatro Amarra','Canelones','Ciudad de la Costa','Rock / En Vivo','+18','2025-08-09 21:00:00','https://www.instagram.com/teatroamarra/','Shows en vivo, teatro y musica en el corazon de Ciudad de la Costa.',false),
-- El Descanso Pub
('d1fdf7dc-7d99-46f4-8215-61c3efba8130','El Descanso Fin de Semana','El Descanso Pub','Canelones','Lagomar','Rock / En Vivo','+18','2025-08-16 22:00:00','https://www.instagram.com/eldescansopub/','El pub de Lagomar con musica en vivo y los mejores tragos de la Costa de Oro.',false),
-- Costanera Club
('3226dcd4-db6a-4fd4-bbe7-5d1dbeb3c7b2','Costanera Club Solymar','Costanera Club','Canelones','Solymar','Boliche','+18','2025-08-22 23:00:00','https://www.instagram.com/costaneraclub/','El boliche de Solymar con toda la energia del verano en la costa.',false),
-- El Galpon Tacuarembo
('d88fa13e-a1b7-4ad9-b6ce-1903a78c1232','El Galpon Noche de Folklore','El Galpon Tacuarembo','Tacuarembó','Centro','Pub / Bar','+18','2025-08-23 21:00:00','https://www.instagram.com/elgalpontacuarembo/','Noche de folklore, candombe y musica nacional en el corazon de Tacuarembo.',false),
-- El Pinar Sunset Club
('8593ed39-f3cb-4cbf-bf0d-7de44f61f73c','El Pinar Sunset Costa de Oro','El Pinar Sunset Club','El Pinar','Costa de Oro','Electrónica','+18','2025-08-30 18:30:00','https://www.instagram.com/elpinar.sunsets/','El sunset mas bello de la Costa de Oro con DJ y cocktails frente al mar.',false),
-- La Huella Atlantida
('48f03c1a-ec94-4a48-a6d3-6448e53621db','La Huella Atlantida Summer','La Huella Atlantida','Atlántida','Centro','Pub / Bar','+18','2025-09-05 21:30:00','https://www.instagram.com/lahuella_atlantida/','La temporada en Atlantida arranca con musica en vivo y los mejores tragos.',false),
-- Valdez Parador
('e4976602-375b-4e0b-8dc0-fc0c02080b41','Valdez Parador Sunset','Valdez Parador y Bar','Costa Azul','Playa','Electrónica','+18','2025-09-06 18:00:00','https://www.instagram.com/valdezparador/','Sunset y after en Costa Azul con DJ sets y el mejor ambiente de playa.',false),
-- Im In Piriapolis
('ce17a469-793a-43a5-9631-ce3ceeac4276','Im In Piriapolis Noche','Im In Piriapolis','Piriápolis','Playa Hermosa','Boliche','+18','2025-09-13 23:00:00','https://www.instagram.com/imin_piriapolis/','Piriapolis de noche: reggaeton, electronica y las mejores vistas del rio.',false),
-- La Negra Bar
('687c193e-93a3-42d6-b069-05911c331f26','La Negra Noche de Verano','La Negra Bar y Night','La Pedrera','Principal','Boliche','+18','2025-08-22 23:00:00','https://www.instagram.com/lanegralapedrera/','La Pedrera se mueve: cumbia, reggaeton y la mejor vibra costera de Rocha.',false),
-- Club Social La Pedrera
('777f8b82-59c5-4e26-8e8b-b68c7f5bbca6','Club Social La Pedrera Noche','Club Social La Pedrera','La Pedrera','Centro','Pub / Bar','+18','2025-09-05 21:00:00','https://www.instagram.com/cslapedrera/','El encuentro social de La Pedrera con musica en vivo y la comunidad local.',false),
-- Parador La Balconada
('172fcfb1-2159-4de6-a659-c9ee3427e175','La Balconada Sunset','Parador La Balconada','La Paloma','La Balconada','Electrónica','+18','2025-09-12 18:00:00','https://www.instagram.com/labalconadaparador/','El parador mas exclusivo de La Paloma con DJ, piscina y vistas al mar.',false),
-- El Timon Pub
('ffb58fcc-f8c5-4529-8398-58b8a3a767cc','El Timon Noche de Puerto','El Timon Pub','La Paloma','Puerto','Rock / En Vivo','+18','2025-09-13 21:30:00','https://www.instagram.com/eltimon_lapaloma/','Rock y blues frente al puerto de La Paloma. La noche mas autentica de Rocha.',false),
-- Cabo Bar y Sunsets
('7e126539-1013-40e3-a778-babd7f32ee6c','Cabo Bar Atardecer','Cabo Bar y Sunsets','Cabo Polonio','Playa Sur','Pub / Bar','+18','2025-09-19 18:00:00','https://www.instagram.com/cabobar_polonio/','El fin del mundo mas bello: atardecer en Cabo Polonio con DJ acustico y tragos.',false);


-- ── EVENTOS PARA BOLICHES NUEVOS (referencia por nombre) ─────────────────────

INSERT INTO events (club_id, title, venue_name, city, neighborhood, category, age_range, event_date, instagram_url, description, is_featured)
SELECT c.id,'Noche de Tango y Candombe','Sala Zitarrosa','Montevideo','Centro','Pub / Bar','+18','2025-07-18 21:00:00','https://www.instagram.com/salazitarrosa/','Una noche unica de tango y candombe en la sala mas iconica de Montevideo.',false FROM clubs c WHERE c.name='Sala Zitarrosa';

INSERT INTO events (club_id, title, venue_name, city, neighborhood, category, age_range, event_date, instagram_url, description, is_featured)
SELECT c.id,'Gran Fiesta de Verano','Teatro de Verano','Montevideo','Parque Rodo','Boliche','+18','2025-07-19 21:00:00','https://www.instagram.com/teatrodeverano_mvd/','El Teatro de Verano abre sus puertas con la gran fiesta de la temporada.',false FROM clubs c WHERE c.name='Teatro de Verano';

INSERT INTO events (club_id, title, venue_name, city, neighborhood, category, age_range, event_date, instagram_url, description, is_featured)
SELECT c.id,'Misterio Friday Night','Club Misterio','Montevideo','Cordón','Electrónica','+18','2025-07-25 23:00:00','https://www.instagram.com/clubmisterio.mvd/','Viernes de electronica y misterio en el Cordon. House, techno y mas.',false FROM clubs c WHERE c.name='Club Misterio';

INSERT INTO events (club_id, title, venue_name, city, neighborhood, category, age_range, event_date, instagram_url, description, is_featured)
SELECT c.id,'Shannon Irish Night','Shannon Irish Pub','Montevideo','Pocitos','Pub / Bar','+18','2025-07-26 21:00:00','https://www.instagram.com/shannonpub.uy/','La noche mas irlandesa de Montevideo. Guinness, whisky y musica en vivo.',false FROM clubs c WHERE c.name='Shannon Irish Pub';

INSERT INTO events (club_id, title, venue_name, city, neighborhood, category, age_range, event_date, instagram_url, description, is_featured)
SELECT c.id,'Rivero Ciudad Vieja Session','Bar Rivero','Montevideo','Ciudad Vieja','Pub / Bar','+18','2025-08-01 21:30:00','https://www.instagram.com/barrivero.mvd/','Cocteleria de autor y musica en vivo en el corazon de la Ciudad Vieja.',false FROM clubs c WHERE c.name='Bar Rivero';

INSERT INTO events (club_id, title, venue_name, city, neighborhood, category, age_range, event_date, instagram_url, description, is_featured)
SELECT c.id,'Noche Clandestina','Clandestino Bar','Montevideo','Cordón','Electrónica','+18','2025-08-02 23:30:00','https://www.instagram.com/clandestino.bar.mvd/','La fiesta secreta del Cordon. Solo los que saben, saben.',false FROM clubs c WHERE c.name='Clandestino Bar';

INSERT INTO events (club_id, title, venue_name, city, neighborhood, category, age_range, event_date, instagram_url, description, is_featured)
SELECT c.id,'Milonga Social Sabado','El Milongon','Montevideo','Palermo','Pub / Bar','+18','2025-08-08 21:00:00','https://www.instagram.com/elmilongon.uy/','Milonga social en Palermo. Tango, candombe y el mejor ambiente de barrio.',false FROM clubs c WHERE c.name='El Milongon';

INSERT INTO events (club_id, title, venue_name, city, neighborhood, category, age_range, event_date, instagram_url, description, is_featured)
SELECT c.id,'Fusion Electronic Night','Club Fusion','Montevideo','Tres Cruces','Electrónica','+18','2025-08-09 23:00:00','https://www.instagram.com/clubfusion.mvd/','Electronica de alto nivel en Tres Cruces. DJs nacionales e internacionales.',false FROM clubs c WHERE c.name='Club Fusion';

INSERT INTO events (club_id, title, venue_name, city, neighborhood, category, age_range, event_date, instagram_url, description, is_featured)
SELECT c.id,'Paullier Saturday Vibes','Paullier Club','Montevideo','Cordón','Boliche','+18','2025-08-15 23:30:00','https://www.instagram.com/paullierclub/','Sabados de cachengue y reggaeton en el Cordon. Tragos y buena onda.',false FROM clubs c WHERE c.name='Paullier Club';

INSERT INTO events (club_id, title, venue_name, city, neighborhood, category, age_range, event_date, instagram_url, description, is_featured)
SELECT c.id,'El Farolito en Vivo','El Farolito Bar','Montevideo','Palermo','Rock / En Vivo','+18','2025-08-16 21:30:00','https://www.instagram.com/elfarolito.bar/','Bandas en vivo y tragos artesanales en Palermo. La noche mas autentica del barrio.',false FROM clubs c WHERE c.name='El Farolito Bar';

INSERT INTO events (club_id, title, venue_name, city, neighborhood, category, age_range, event_date, instagram_url, description, is_featured)
SELECT c.id,'Fiesta Plop! Open Air','Plop! Club','Montevideo','Parque Rodo','Boliche','+18','2025-08-22 22:00:00','https://www.instagram.com/fiestaplop/','La fiesta mas famosa de Uruguay llega a Parque Rodo. Electro pop y mas.',false FROM clubs c WHERE c.name='Plop! Club';

INSERT INTO events (club_id, title, venue_name, city, neighborhood, category, age_range, event_date, instagram_url, description, is_featured)
SELECT c.id,'Loquito Viernes Social','Loquito Bar','Montevideo','Pocitos','Pub / Bar','+18','2025-08-23 21:00:00','https://www.instagram.com/loquitobar.uy/','El bar de Pocitos que nunca duerme. Tragos, musica y buena gente.',false FROM clubs c WHERE c.name='Loquito Bar';

INSERT INTO events (club_id, title, venue_name, city, neighborhood, category, age_range, event_date, instagram_url, description, is_featured)
SELECT c.id,'La Ronda Palermo Night','La Ronda Palermo','Montevideo','Palermo','Cumbia / RKT','+18','2025-08-29 22:00:00','https://www.instagram.com/larondapalermo/','Cumbia y RKT en Palermo. El barrio de noche con toda la energia.',false FROM clubs c WHERE c.name='La Ronda Palermo';

INSERT INTO events (club_id, title, venue_name, city, neighborhood, category, age_range, event_date, instagram_url, description, is_featured)
SELECT c.id,'Guambia Arte y Musica','Espacio Guambia','Montevideo','Cordón','Pub / Bar','+18','2025-08-30 21:00:00','https://www.instagram.com/espacioguambia/','Espacio cultural con musica en vivo, arte y tragos en el Cordon.',false FROM clubs c WHERE c.name='Espacio Guambia';

INSERT INTO events (club_id, title, venue_name, city, neighborhood, category, age_range, event_date, instagram_url, description, is_featured)
SELECT c.id,'El Pony Friday Rock','El Pony Pisador','Montevideo','Cordón','Rock / En Vivo','+18','2025-09-05 22:00:00','https://www.instagram.com/elponypisador/','Rock nacional y buena cerveza en el clasico del Cordon.',false FROM clubs c WHERE c.name='El Pony Pisador';

INSERT INTO events (club_id, title, venue_name, city, neighborhood, category, age_range, event_date, instagram_url, description, is_featured)
SELECT c.id,'El Canario Sabado Noche','Boliche El Canario','Montevideo','Punta Carretas','Boliche','+18','2025-09-06 23:00:00','https://www.instagram.com/bolichedelcanario/','El boliche de Punta Carretas con cumbia, reggaeton y el mejor ambiente.',false FROM clubs c WHERE c.name='Boliche El Canario';

INSERT INTO events (club_id, title, venue_name, city, neighborhood, category, age_range, event_date, instagram_url, description, is_featured)
SELECT c.id,'Fundador Live Session','Sala del Fundador','Montevideo','Ciudad Vieja','Rock / En Vivo','+18','2025-09-12 21:30:00','https://www.instagram.com/saladelfundador/','Musica en vivo en la sala mas antigua de la Ciudad Vieja.',false FROM clubs c WHERE c.name='Sala del Fundador';

INSERT INTO events (club_id, title, venue_name, city, neighborhood, category, age_range, event_date, instagram_url, description, is_featured)
SELECT c.id,'D-Club Electronic Friday','D-Club Montevideo','Montevideo','Centro','Electrónica','+21','2025-09-13 23:00:00','https://www.instagram.com/dclub.montevideo/','El club electronico del Centro. House, techno y deep house de alto nivel.',false FROM clubs c WHERE c.name='D-Club Montevideo';

INSERT INTO events (club_id, title, venue_name, city, neighborhood, category, age_range, event_date, instagram_url, description, is_featured)
SELECT c.id,'Cocodrilo Pocitos Noche','Bar Cocodrilo','Montevideo','Pocitos','Pub / Bar','+18','2025-09-19 22:00:00','https://www.instagram.com/barcocodrilo.uy/','El bar de Pocitos que lo tiene todo: tragos, musica y buena compania.',false FROM clubs c WHERE c.name='Bar Cocodrilo';

INSERT INTO events (club_id, title, venue_name, city, neighborhood, category, age_range, event_date, instagram_url, description, is_featured)
SELECT c.id,'La Trastienda Gran Show','La Trastienda MVD','Montevideo','Ciudad Vieja','Rock / En Vivo','+18','2025-09-20 21:00:00','https://www.instagram.com/latrastienda.mvd/','Show en vivo en el espacio cultural mas importante de la Ciudad Vieja.',false FROM clubs c WHERE c.name='La Trastienda MVD';

INSERT INTO events (club_id, title, venue_name, city, neighborhood, category, age_range, event_date, instagram_url, description, is_featured)
SELECT c.id,'Coco Beach La Barra','Coco Punta del Este','Punta del Este','La Barra','Electrónica','+18','2025-07-20 22:00:00','https://www.instagram.com/cocobar.pde/','Beach club de La Barra con DJ, piscina y los mejores cocktails de la costa.',false FROM clubs c WHERE c.name='Coco Punta del Este';

INSERT INTO events (club_id, title, venue_name, city, neighborhood, category, age_range, event_date, instagram_url, description, is_featured)
SELECT c.id,'Tequila Sunrise Party','Tequila Sunrise Club','Punta del Este','Punta del Este','Boliche','+18','2025-07-26 23:00:00','https://www.instagram.com/tequilasunrisepde/','La fiesta del amanecer en Punta. Reggaeton, electronica y tragos hasta el sol.',false FROM clubs c WHERE c.name='Tequila Sunrise Club';

INSERT INTO events (club_id, title, venue_name, city, neighborhood, category, age_range, event_date, instagram_url, description, is_featured)
SELECT c.id,'Illusion Playa Brava Night','Illusion Club PDE','Punta del Este','Punta del Este','Electrónica','+21','2025-08-02 23:30:00','https://www.instagram.com/illusionclubpde/','El club mas exclusivo de Punta. Ilusion de noche, musica y magia.',false FROM clubs c WHERE c.name='Illusion Club PDE';

INSERT INTO events (club_id, title, venue_name, city, neighborhood, category, age_range, event_date, instagram_url, description, is_featured)
SELECT c.id,'Stradivarius Puerto Session','Stradivarius Bar','Punta del Este','Puerto','Pub / Bar','+18','2025-08-09 21:00:00','https://www.instagram.com/stradivariuspde/','Vinos, cocteleria y jazz frente al puerto de Punta del Este.',false FROM clubs c WHERE c.name='Stradivarius Bar';

INSERT INTO events (club_id, title, venue_name, city, neighborhood, category, age_range, event_date, instagram_url, description, is_featured)
SELECT c.id,'Sotano Underground Friday','Sotano Beat Club','Punta del Este','Punta del Este','Electrónica','+18','2025-08-16 23:30:00','https://www.instagram.com/sotanobeatclub/','El underground de Gorlero. Techno y house para los que saben.',false FROM clubs c WHERE c.name='Sotano Beat Club';

INSERT INTO events (club_id, title, venue_name, city, neighborhood, category, age_range, event_date, instagram_url, description, is_featured)
SELECT c.id,'Alquimia La Barra Opening','Alquimia Club','Maldonado','La Barra','Electrónica','+18','2025-08-23 23:00:00','https://www.instagram.com/alquimiaclub.uy/','La apertura mas esperada de La Barra. Electronica, luces y buena vibra.',false FROM clubs c WHERE c.name='Alquimia Club';

INSERT INTO events (club_id, title, venue_name, city, neighborhood, category, age_range, event_date, instagram_url, description, is_featured)
SELECT c.id,'Buenos Dias Jose Ignacio','Buenos Dias Bar','Maldonado','Jose Ignacio','Pub / Bar','+18','2025-08-30 19:00:00','https://www.instagram.com/buenosdiasji/','El lugar mas exclusivo de JI. Vinos, tapas y el atardecer mas bello del pais.',false FROM clubs c WHERE c.name='Buenos Dias Bar';

INSERT INTO events (club_id, title, venue_name, city, neighborhood, category, age_range, event_date, instagram_url, description, is_featured)
SELECT c.id,'Parador Bravo Sunset Party','Parador Bravo','Maldonado','Manantiales','Electrónica','+18','2025-09-06 17:00:00','https://www.instagram.com/paradorbravopde/','Sunset en la playa Brava de Manantiales. DJs, cocktails y arena.',false FROM clubs c WHERE c.name='Parador Bravo';

INSERT INTO events (club_id, title, venue_name, city, neighborhood, category, age_range, event_date, instagram_url, description, is_featured)
SELECT c.id,'Valizas Beach Party','Valizas Surf Club','Rocha','Valizas','Pub / Bar','+18','2025-07-19 21:00:00','https://www.instagram.com/valizassurfclub/','La fiesta costera de Valizas. Surf, musica y el ambiente mas libre de Uruguay.',false FROM clubs c WHERE c.name='Valizas Surf Club';

INSERT INTO events (club_id, title, venue_name, city, neighborhood, category, age_range, event_date, instagram_url, description, is_featured)
SELECT c.id,'PDD Hostel Night','Punta del Diablo Hostel Bar','Rocha','Punta del Diablo','Boliche','+18','2025-07-26 22:30:00','https://www.instagram.com/pddiablo.bar/','El hostel bar mas conocido de Punta del Diablo. Viajeros, musica y buena onda.',false FROM clubs c WHERE c.name='Punta del Diablo Hostel Bar';

INSERT INTO events (club_id, title, venue_name, city, neighborhood, category, age_range, event_date, instagram_url, description, is_featured)
SELECT c.id,'El Aguila La Paloma Rock','El Aguila La Paloma','Rocha','La Paloma','Rock / En Vivo','+18','2025-08-08 21:30:00','https://www.instagram.com/elaguila.lapaloma/','Rock en vivo en La Paloma. Bandas locales y la brisa del oceano.',false FROM clubs c WHERE c.name='El Aguila La Paloma';

INSERT INTO events (club_id, title, venue_name, city, neighborhood, category, age_range, event_date, instagram_url, description, is_featured)
SELECT c.id,'Polonio Puerto Sunset','Bar del Puerto Polonio','Rocha','Cabo Polonio','Pub / Bar','+18','2025-08-22 19:00:00','https://www.instagram.com/bardelpuerto.polonio/','El bar del fin del mundo. Atardecer en Cabo Polonio con musica y magia.',false FROM clubs c WHERE c.name='Bar del Puerto Polonio';

INSERT INTO events (club_id, title, venue_name, city, neighborhood, category, age_range, event_date, instagram_url, description, is_featured)
SELECT c.id,'Punta Colorada Beach Party','Punta Colorada Beach Club','Canelones','Punta Colorada','Electrónica','+18','2025-08-01 19:00:00','https://www.instagram.com/puntacolorada.bc/','Beach party en Punta Colorada con DJ, playa y el mejor verano de Canelones.',false FROM clubs c WHERE c.name='Punta Colorada Beach Club';

INSERT INTO events (club_id, title, venue_name, city, neighborhood, category, age_range, event_date, instagram_url, description, is_featured)
SELECT c.id,'La Floresta Verano Noche','La Floresta Club','Canelones','La Floresta','Boliche','+18','2025-08-09 23:00:00','https://www.instagram.com/laflorestaclub/','La noche de La Floresta con cumbia y reggaeton. El clasico de la costa canaria.',false FROM clubs c WHERE c.name='La Floresta Club';

INSERT INTO events (club_id, title, venue_name, city, neighborhood, category, age_range, event_date, instagram_url, description, is_featured)
SELECT c.id,'Salinas Sunset y Fiesta','Salinas Bar y Playa','Canelones','Salinas','Electrónica','+18','2025-08-16 18:00:00','https://www.instagram.com/salinasbar.uy/','Sunset en Salinas con DJ y cocktails frente al mar.',false FROM clubs c WHERE c.name='Salinas Bar y Playa';

INSERT INTO events (club_id, title, venue_name, city, neighborhood, category, age_range, event_date, instagram_url, description, is_featured)
SELECT c.id,'Atlantis Club Noche Grande','Atlantis Club Atlantida','Canelones','Atlantida','Boliche','+18','2025-08-23 23:00:00','https://www.instagram.com/atlantisclub.uy/','La noche mas grande de Atlantida. Boliche, musica y toda la energia del verano.',false FROM clubs c WHERE c.name='Atlantis Club Atlantida';

INSERT INTO events (club_id, title, venue_name, city, neighborhood, category, age_range, event_date, instagram_url, description, is_featured)
SELECT c.id,'Drugstore Barrio Historico Night','El Drugstore Colonia','Colonia del Sacramento','Barrio Historico','Pub / Bar','+18','2025-08-02 21:00:00','https://www.instagram.com/eldrugstorecolonia/','El bar emblema de Colonia del Sacramento. Cocteleria, musica y buena onda.',false FROM clubs c WHERE c.name='El Drugstore Colonia';

INSERT INTO events (club_id, title, venue_name, city, neighborhood, category, age_range, event_date, instagram_url, description, is_featured)
SELECT c.id,'Bodeguita Vinos y Musica','La Bodeguita Colonia','Colonia del Sacramento','Barrio Historico','Pub / Bar','+18','2025-08-09 20:00:00','https://www.instagram.com/labodeguita.colonia/','Vinos uruguayos y musica en vivo en el barrio historico de Colonia.',false FROM clubs c WHERE c.name='La Bodeguita Colonia';

INSERT INTO events (club_id, title, venue_name, city, neighborhood, category, age_range, event_date, instagram_url, description, is_featured)
SELECT c.id,'Yacht Club Sunset Party','Yacht Club Colonia','Colonia del Sacramento','Puerto','Electrónica','+18','2025-08-16 18:30:00','https://www.instagram.com/yachtclubcolonia/','Sunset sobre el Rio de la Plata en el Yacht Club de Colonia. DJ y cocktails.',false FROM clubs c WHERE c.name='Yacht Club Colonia';

INSERT INTO events (club_id, title, venue_name, city, neighborhood, category, age_range, event_date, instagram_url, description, is_featured)
SELECT c.id,'Pulperia Noche de Faroles','Pulperia de los Faroles','Colonia del Sacramento','Barrio Historico','Pub / Bar','+18','2025-09-13 21:00:00','https://www.instagram.com/pulperiafaroles/','La pulperia mas pintoresca de Colonia con musica criolla y vinos de la region.',false FROM clubs c WHERE c.name='Pulperia de los Faroles';

INSERT INTO events (club_id, title, venue_name, city, neighborhood, category, age_range, event_date, instagram_url, description, is_featured)
SELECT c.id,'Salto Gran Baile Social','Club Social Salto','Salto','Centro','Cumbia / RKT','+18','2025-08-23 22:00:00','https://www.instagram.com/clubsocialsalto/','El gran baile social de Salto. Cumbia, folklore y el sabor del norte uruguayo.',false FROM clubs c WHERE c.name='Club Social Salto';

INSERT INTO events (club_id, title, venue_name, city, neighborhood, category, age_range, event_date, instagram_url, description, is_featured)
SELECT c.id,'Termas Dayman Noche','Termas del Dayman Club','Salto','Termas del Dayman','Boliche','+18','2025-09-06 22:00:00','https://www.instagram.com/termasdayman.club/','Noche de fiesta en las termas. Musica, piscinas termales y buena vibra del norte.',false FROM clubs c WHERE c.name='Termas del Dayman Club';

INSERT INTO events (club_id, title, venue_name, city, neighborhood, category, age_range, event_date, instagram_url, description, is_featured)
SELECT c.id,'El Muelle Costanera Night','El Muelle Bar Salto','Salto','Costanera','Pub / Bar','+18','2025-09-20 21:00:00','https://www.instagram.com/elmuellebar.salto/','Bar frente al Rio Uruguay en Salto. Musica en vivo y los mejores atardeceres del norte.',false FROM clubs c WHERE c.name='El Muelle Bar Salto';

INSERT INTO events (club_id, title, venue_name, city, neighborhood, category, age_range, event_date, instagram_url, description, is_featured)
SELECT c.id,'Noche Fronteriza Rivera','Club Fronterizo Rivera','Rivera','Centro','Boliche','+18','2025-09-05 23:00:00','https://www.instagram.com/clubfronterizo.rivera/','La fiesta fronteriza mas grande del norte. Rivera y Livramento se unen en una sola noche.',false FROM clubs c WHERE c.name='Club Fronterizo Rivera';

INSERT INTO events (club_id, title, venue_name, city, neighborhood, category, age_range, event_date, instagram_url, description, is_featured)
SELECT c.id,'El Norte Sabado Grande','Boliche El Norte','Rivera','Centro','Cumbia / RKT','+18','2025-09-12 23:00:00','https://www.instagram.com/bolichelnorte.rivera/','El boliche del norte uruguayo. Cumbia, reggaeton y toda la energia fronteriza.',false FROM clubs c WHERE c.name='Boliche El Norte';

INSERT INTO events (club_id, title, venue_name, city, neighborhood, category, age_range, event_date, instagram_url, description, is_featured)
SELECT c.id,'Artigas Social Night','Club Artigas Social','Artigas','Centro','Cumbia / RKT','+18','2025-09-26 22:00:00','https://www.instagram.com/clubartigassocial/','El encuentro social de Artigas con cumbia y musica del norte.',false FROM clubs c WHERE c.name='Club Artigas Social';

INSERT INTO events (club_id, title, venue_name, city, neighborhood, category, age_range, event_date, instagram_url, description, is_featured)
SELECT c.id,'El Puerto Noche de Rio','El Puerto Bar Mercedes','Mercedes','Puerto','Pub / Bar','+18','2025-08-30 21:00:00','https://www.instagram.com/elpuerto.mercedes/','Bar frente al Rio Negro en Mercedes. Musica, tragos y el ambiente del interior.',false FROM clubs c WHERE c.name='El Puerto Bar Mercedes';

INSERT INTO events (club_id, title, venue_name, city, neighborhood, category, age_range, event_date, instagram_url, description, is_featured)
SELECT c.id,'Nautico Sunset Mercedes','Club Nautico Mercedes','Mercedes','Costanera','Electrónica','+18','2025-09-13 18:30:00','https://www.instagram.com/nautico.mercedes/','Sunset sobre el Rio Negro con DJ y cocktails. El mejor plan de Soriano.',false FROM clubs c WHERE c.name='Club Nautico Mercedes';

INSERT INTO events (club_id, title, venue_name, city, neighborhood, category, age_range, event_date, instagram_url, description, is_featured)
SELECT c.id,'El Parnaso Noche de Minas','El Parnaso Bar','Minas','Centro','Rock / En Vivo','+18','2025-09-19 21:30:00','https://www.instagram.com/elparnaso.minas/','Rock y buena cerveza en el centro de Minas. La noche mas autentica de Lavalleja.',false FROM clubs c WHERE c.name='El Parnaso Bar';

INSERT INTO events (club_id, title, venue_name, city, neighborhood, category, age_range, event_date, instagram_url, description, is_featured)
SELECT c.id,'El Olimar Noche de Rio','El Olimar Bar','Treinta y Tres','Centro','Pub / Bar','+18','2025-09-26 21:00:00','https://www.instagram.com/elolimarbar/','El bar del Olimar. Musica en vivo y el mejor ambiente de Treinta y Tres.',false FROM clubs c WHERE c.name='El Olimar Bar';

INSERT INTO events (club_id, title, venue_name, city, neighborhood, category, age_range, event_date, instagram_url, description, is_featured)
SELECT c.id,'Fray Bentos Gran Social','Club Fray Bentos Social','Fray Bentos','Centro','Cumbia / RKT','+18','2025-09-27 22:00:00','https://www.instagram.com/clubfb.social/','La noche social de Fray Bentos. Cumbia, folklore y la vibra del litoral.',false FROM clubs c WHERE c.name='Club Fray Bentos Social';
