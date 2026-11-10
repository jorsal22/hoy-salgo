/**
 * HOY SALGO — Carga masiva de boliches y eventos
 * node scripts/seed_full.js
 */

const { createClient } = require('@supabase/supabase-js');

const client = createClient(
  'https://zdhwazbuuvugyylrisun.supabase.co',
  'sb_publishable_9Weogm4YbgH1TEN-HN3Nbw_PiqgV2aB'
);

// ─── NUEVOS BOLICHES ──────────────────────────────────────────────────────────

const NEW_CLUBS = [
  // ── MONTEVIDEO ──────────────────────────────────────────────────────────────
  { name: 'Sala Zitarrosa', city: 'Montevideo', neighborhood: 'Centro', address: '18 de Julio 1012', phone: '+598 2901 7303', instagram_url: 'https://www.instagram.com/salazitarrosa/' },
  { name: 'Teatro de Verano', city: 'Montevideo', neighborhood: 'Parque Rodo', address: 'Rambla Wilson s/n', phone: '+598 2711 5555', instagram_url: 'https://www.instagram.com/teatrodeverano_mvd/' },
  { name: 'Club Misterio', city: 'Montevideo', neighborhood: 'Cordón', address: 'Canelones 1544', phone: '+598 2410 2020', instagram_url: 'https://www.instagram.com/clubmisterio.mvd/' },
  { name: 'Shannon Irish Pub', city: 'Montevideo', neighborhood: 'Pocitos', address: 'Bulevar España 2690', phone: '+598 2711 8899', instagram_url: 'https://www.instagram.com/shannonpub.uy/' },
  { name: 'Bar Rivero', city: 'Montevideo', neighborhood: 'Ciudad Vieja', address: 'Rincón 487', phone: '+598 2915 7788', instagram_url: 'https://www.instagram.com/barrivero.mvd/' },
  { name: 'Clandestino Bar', city: 'Montevideo', neighborhood: 'Cordón', address: 'Durazno 1660', phone: '+598 2409 3344', instagram_url: 'https://www.instagram.com/clandestino.bar.mvd/' },
  { name: 'El Milongon', city: 'Montevideo', neighborhood: 'Palermo', address: 'Gabriel Pereira 2996', phone: '+598 2711 4455', instagram_url: 'https://www.instagram.com/elmilongon.uy/' },
  { name: 'Club Fusion', city: 'Montevideo', neighborhood: 'Tres Cruces', address: 'Rivera 2567', phone: '+598 2480 6677', instagram_url: 'https://www.instagram.com/clubfusion.mvd/' },
  { name: 'Paullier Club', city: 'Montevideo', neighborhood: 'Cordón', address: 'Paullier 1050', phone: '+598 2409 1122', instagram_url: 'https://www.instagram.com/paullierclub/' },
  { name: 'El Farolito Bar', city: 'Montevideo', neighborhood: 'Palermo', address: 'Yaguaron 1456', phone: '+598 2900 5566', instagram_url: 'https://www.instagram.com/elfarolito.bar/' },
  { name: 'Plop! Club', city: 'Montevideo', neighborhood: 'Parque Rodo', address: 'Rambla Wilson 1234', phone: '+598 2711 2345', instagram_url: 'https://www.instagram.com/fiestaplop/' },
  { name: 'Loquito Bar', city: 'Montevideo', neighborhood: 'Pocitos', address: 'Ellauri 644', phone: '+598 2710 7788', instagram_url: 'https://www.instagram.com/loquitobar.uy/' },
  { name: 'La Ronda Palermo', city: 'Montevideo', neighborhood: 'Palermo', address: '21 de Setiembre 2855', phone: '+598 2711 3300', instagram_url: 'https://www.instagram.com/larondapalermo/' },
  { name: 'Espacio Guambia', city: 'Montevideo', neighborhood: 'Cordón', address: 'Guambia 1980', phone: '+598 2409 8899', instagram_url: 'https://www.instagram.com/espacioguambia/' },
  { name: 'El Pony Pisador', city: 'Montevideo', neighborhood: 'Cordón', address: 'Francisco Muñoz 2558', phone: '+598 2410 4455', instagram_url: 'https://www.instagram.com/elponypisador/' },
  { name: 'Boliche El Canario', city: 'Montevideo', neighborhood: 'Punta Carretas', address: 'Solano Garcia 2500', phone: '+598 2711 6677', instagram_url: 'https://www.instagram.com/bolichedelcanario/' },
  { name: 'Sala del Fundador', city: 'Montevideo', neighborhood: 'Ciudad Vieja', address: 'Soriano 1234', phone: '+598 2916 4455', instagram_url: 'https://www.instagram.com/saladelfundador/' },
  { name: 'D-Club Montevideo', city: 'Montevideo', neighborhood: 'Centro', address: 'Soriano 980', phone: '+598 2900 1122', instagram_url: 'https://www.instagram.com/dclub.montevideo/' },
  { name: 'Bar Cocodrilo', city: 'Montevideo', neighborhood: 'Pocitos', address: 'Pagola 3100', phone: '+598 2710 2244', instagram_url: 'https://www.instagram.com/barcocodrilo.uy/' },
  { name: 'La Trastienda MVD', city: 'Montevideo', neighborhood: 'Ciudad Vieja', address: 'Buenos Aires 652', phone: '+598 2916 7788', instagram_url: 'https://www.instagram.com/latrastienda.mvd/' },

  // ── PUNTA DEL ESTE / MALDONADO ─────────────────────────────────────────────
  { name: 'Cocó Punta del Este', city: 'Punta del Este', neighborhood: 'La Barra', address: 'Ruta 10 km 162', phone: '+598 42 771 100', instagram_url: 'https://www.instagram.com/cocobar.pde/' },
  { name: 'Tequila Sunrise Club', city: 'Punta del Este', neighborhood: 'Punta del Este', address: 'Parada 1 Playa Mansa', phone: '+598 42 445 500', instagram_url: 'https://www.instagram.com/tequilasunrisepde/' },
  { name: 'Illusion Club PDE', city: 'Punta del Este', neighborhood: 'Punta del Este', address: 'Parada 3 Playa Brava', phone: '+598 42 449 900', instagram_url: 'https://www.instagram.com/illusionclubpde/' },
  { name: 'Stradivarius Bar', city: 'Punta del Este', neighborhood: 'Puerto', address: 'Puerto de Punta del Este L-23', phone: '+598 42 441 234', instagram_url: 'https://www.instagram.com/stradivariuspde/' },
  { name: 'Sótano Beat Club', city: 'Punta del Este', neighborhood: 'Punta del Este', address: 'Gorlero y 24', phone: '+598 42 440 088', instagram_url: 'https://www.instagram.com/sotanobeatclub/' },
  { name: 'Alquimia Club', city: 'Maldonado', neighborhood: 'La Barra', address: 'Ruta 10 km 164', phone: '+598 42 772 200', instagram_url: 'https://www.instagram.com/alquimiaclub.uy/' },
  { name: 'Buenos Dias Bar', city: 'Maldonado', neighborhood: 'Jose Ignacio', address: 'Los Teros y Las Garzas', phone: '+598 94 500 100', instagram_url: 'https://www.instagram.com/buenosdiasji/' },
  { name: 'Parador Bravo', city: 'Maldonado', neighborhood: 'Manantiales', address: 'Parada 42 Playa Brava', phone: '+598 42 775 500', instagram_url: 'https://www.instagram.com/paradorbravopde/' },

  // ── ROCHA ──────────────────────────────────────────────────────────────────
  { name: 'Valizas Surf Club', city: 'Rocha', neighborhood: 'Valizas', address: 'Calle Principal s/n, Valizas', phone: '+598 94 300 200', instagram_url: 'https://www.instagram.com/valizassurfclub/' },
  { name: 'Punta del Diablo Hostel Bar', city: 'Rocha', neighborhood: 'Punta del Diablo', address: 'Calle de los Pescadores s/n', phone: '+598 94 400 300', instagram_url: 'https://www.instagram.com/pddiablo.bar/' },
  { name: 'El Aguila La Paloma', city: 'Rocha', neighborhood: 'La Paloma', address: 'Av. Nicolas Sola 68', phone: '+598 4479 6100', instagram_url: 'https://www.instagram.com/elaguila.lapaloma/' },
  { name: 'Bar del Puerto Polonio', city: 'Rocha', neighborhood: 'Cabo Polonio', address: 'Farol de Cabo Polonio s/n', phone: '+598 94 500 400', instagram_url: 'https://www.instagram.com/bardelpuerto.polonio/' },

  // ── CANELONES / COSTA ──────────────────────────────────────────────────────
  { name: 'Punta Colorada Beach Club', city: 'Canelones', neighborhood: 'Punta Colorada', address: 'Rambla Punta Colorada s/n', phone: '+598 2228 1122', instagram_url: 'https://www.instagram.com/puntacolorada.bc/' },
  { name: 'La Floresta Club', city: 'Canelones', neighborhood: 'La Floresta', address: 'Av. Rivera s/n, La Floresta', phone: '+598 2225 3344', instagram_url: 'https://www.instagram.com/laflorestaclub/' },
  { name: 'Salinas Bar & Playa', city: 'Canelones', neighborhood: 'Salinas', address: 'Rambla de Salinas s/n', phone: '+598 2228 5566', instagram_url: 'https://www.instagram.com/salinasbar.uy/' },
  { name: 'Atlantis Club Atlantida', city: 'Canelones', neighborhood: 'Atlantida', address: 'Rambla Tomás Berreta 1200', phone: '+598 2372 7788', instagram_url: 'https://www.instagram.com/atlantisclub.uy/' },

  // ── COLONIA ────────────────────────────────────────────────────────────────
  { name: 'El Drugstore Colonia', city: 'Colonia del Sacramento', neighborhood: 'Barrio Historico', address: 'Washington Barbot 160', phone: '+598 4522 5241', instagram_url: 'https://www.instagram.com/eldrugstorecolonia/' },
  { name: 'La Bodeguita Colonia', city: 'Colonia del Sacramento', neighborhood: 'Barrio Historico', address: 'De la Playa 174', phone: '+598 4522 3344', instagram_url: 'https://www.instagram.com/labodeguita.colonia/' },
  { name: 'Yacht Club Colonia', city: 'Colonia del Sacramento', neighborhood: 'Puerto', address: 'Rambla de Colonia s/n', phone: '+598 4522 1234', instagram_url: 'https://www.instagram.com/yachtclubcolonia/' },
  { name: 'Pulperia de los Faroles', city: 'Colonia del Sacramento', neighborhood: 'Barrio Historico', address: 'Misiones de los Tapes 101', phone: '+598 4522 2255', instagram_url: 'https://www.instagram.com/pulperiafaroles/' },

  // ── SALTO ──────────────────────────────────────────────────────────────────
  { name: 'Club Social Salto', city: 'Salto', neighborhood: 'Centro', address: 'Uruguay 23', phone: '+598 4732 5500', instagram_url: 'https://www.instagram.com/clubsocialsalto/' },
  { name: 'Termas del Dayman Club', city: 'Salto', neighborhood: 'Termas del Dayman', address: 'Ruta 3 km 487', phone: '+598 4736 2200', instagram_url: 'https://www.instagram.com/termasdayman.club/' },
  { name: 'El Muelle Bar Salto', city: 'Salto', neighborhood: 'Costanera', address: 'Rambla Costanera 320', phone: '+598 4732 6677', instagram_url: 'https://www.instagram.com/elmuellebar.salto/' },

  // ── RIVERA ────────────────────────────────────────────────────────────────
  { name: 'Club Fronterizo Rivera', city: 'Rivera', neighborhood: 'Centro', address: 'Agraciada 500', phone: '+598 4622 3300', instagram_url: 'https://www.instagram.com/clubfronterizo.rivera/' },
  { name: 'Boliche El Norte', city: 'Rivera', neighborhood: 'Centro', address: 'Treinta y Tres 1200', phone: '+598 4622 4455', instagram_url: 'https://www.instagram.com/bolichelnorte.rivera/' },

  // ── ARTIGAS ────────────────────────────────────────────────────────────────
  { name: 'Club Artigas Social', city: 'Artigas', neighborhood: 'Centro', address: 'Lecueder 400', phone: '+598 4772 2200', instagram_url: 'https://www.instagram.com/clubartigassocial/' },

  // ── MERCEDES / SORIANO ────────────────────────────────────────────────────
  { name: 'El Puerto Bar Mercedes', city: 'Mercedes', neighborhood: 'Puerto', address: 'Roosevelt 100', phone: '+598 4532 1100', instagram_url: 'https://www.instagram.com/elpuerto.mercedes/' },
  { name: 'Club Nautico Mercedes', city: 'Mercedes', neighborhood: 'Costanera', address: 'Rambla Costanera s/n', phone: '+598 4532 2200', instagram_url: 'https://www.instagram.com/nautico.mercedes/' },

  // ── MINAS / LAVALLEJA ─────────────────────────────────────────────────────
  { name: 'El Parnaso Bar', city: 'Minas', neighborhood: 'Centro', address: '18 de Julio 450', phone: '+598 4442 3300', instagram_url: 'https://www.instagram.com/elparnaso.minas/' },

  // ── TREINTA Y TRES ────────────────────────────────────────────────────────
  { name: 'El Olimar Bar', city: 'Treinta y Tres', neighborhood: 'Centro', address: 'General Enrique Martinez 650', phone: '+598 4452 1100', instagram_url: 'https://www.instagram.com/elolimarbar/' },

  // ── FRAY BENTOS ───────────────────────────────────────────────────────────
  { name: 'Club Fray Bentos Social', city: 'Fray Bentos', neighborhood: 'Centro', address: '25 de Mayo 3350', phone: '+598 4562 2200', instagram_url: 'https://www.instagram.com/clubfb.social/' },
];

// ─── EVENTOS PARA BOLICHES EXISTENTES SIN EVENTOS ────────────────────────────

const EVENTS_EXISTING = [
  // Montevideo
  { club_id: '2663e0bf-c3b4-4a45-af8a-47ad113f3a26', title: 'Mandarine Rooftop Night', venue_name: 'Mandarine Club', city: 'Montevideo', neighborhood: 'Pocitos', category: 'Electrónica', age_range: '+18', event_date: '2025-07-18 23:00:00', instagram_url: 'https://www.instagram.com/mandarineclub/', description: 'Noche de house y techno en la terraza de Pocitos con DJs nacionales e internacionales.' },
  { club_id: '313018ed-2fa9-4190-8da6-5557a25f2611', title: 'Cain After Dark', venue_name: 'Cain Club', city: 'Montevideo', neighborhood: 'Centro', category: 'Boliche', age_range: '+18', event_date: '2025-07-19 23:30:00', instagram_url: 'https://www.instagram.com/cainclub/', description: 'La noche del Centro con cumbia, reggaeton y electronica hasta el amanecer.' },
  { club_id: '43bd4746-4636-4b6e-89b9-e985acc9ff25', title: 'Tazu Music Fridays', venue_name: 'Tazu Music Club', city: 'Montevideo', neighborhood: 'Centro', category: 'Variado', age_range: '+18', event_date: '2025-07-25 22:30:00', instagram_url: 'https://www.instagram.com/tazumusicclub/', description: 'Viernes de musica en vivo y DJs en el corazon del Centro.' },
  { club_id: 'f145382a-615e-400e-8e59-1a5712239cf8', title: 'El Poncho en Vivo', venue_name: 'El Poncho Pub', city: 'Montevideo', neighborhood: 'Pocitos', category: 'Rock / En Vivo', age_range: '+18', event_date: '2025-07-26 21:00:00', instagram_url: 'https://www.instagram.com/elponchopub/', description: 'Bandas de rock uruguayo en vivo, tragos artesanales y buena energia en Pocitos.' },
  { club_id: '5b88fbdf-4f18-486d-a47d-185bba4ed861', title: 'Mastra Craft Beer Night', venue_name: 'Cerveceria Mastra Cordon', city: 'Montevideo', neighborhood: 'Cordón', category: 'Pub / Bar', age_range: '+18', event_date: '2025-08-01 20:00:00', instagram_url: 'https://www.instagram.com/mastra_uy/', description: 'Noche de cervezas artesanales con musica en vivo y picadas en el Cordon.' },
  { club_id: 'b90bcfad-eae9-40e3-8461-03f7f4b01ffb', title: 'Kibon Sunset Rambla', venue_name: 'Kibon Avanza', city: 'Montevideo', neighborhood: 'Pocitos', category: 'Electrónica', age_range: '+18', event_date: '2025-08-02 18:00:00', instagram_url: 'https://www.instagram.com/kibonavanza/', description: 'El mejor sunset sobre la rambla con DJ sets de electronica y cocktails.' },
  { club_id: '421a673d-ef3f-4986-ac96-5c6ce2dc9fdb', title: 'Chantilly Sabado Social', venue_name: 'Chantilly Bar', city: 'Montevideo', neighborhood: 'Pocitos', category: 'Cumbia / RKT', age_range: '+18', event_date: '2025-08-02 23:00:00', instagram_url: 'https://www.instagram.com/chantillybar/', description: 'Sabados de cumbia, cachengue y tragos 2x1 hasta la madrugada en Pocitos.' },
  { club_id: '0db0f3be-a2f0-4da3-8933-2485598e045e', title: 'Ronda Sessions Jazz', venue_name: 'Ronda Bar', city: 'Montevideo', neighborhood: 'Ciudad Vieja', category: 'Pub / Bar', age_range: '+18', event_date: '2025-08-08 21:00:00', instagram_url: 'https://www.instagram.com/rondabar.mvd/', description: 'Sesiones de jazz y blues en la Ciudad Vieja con tragos de autor.' },
  { club_id: '0207f149-eaa8-4e97-bf5d-41232e60cdff', title: 'La Terraza Open Air', venue_name: 'La Terraza MVD', city: 'Montevideo', neighborhood: 'Parque Rodó', category: 'Electrónica', age_range: '+18', event_date: '2025-08-09 22:00:00', instagram_url: 'https://www.instagram.com/laterraza_mvd/', description: 'Noche al aire libre con vista a Parque Rodo, house music y cocktails premium.' },
  { club_id: 'cadb17a8-add8-49e2-8fff-b9c813760f09', title: 'Socio Club Saturday', venue_name: 'Socio Club', city: 'Montevideo', neighborhood: 'Centro', category: 'Boliche', age_range: '+18', event_date: '2025-08-09 23:30:00', instagram_url: 'https://www.instagram.com/socioclub.mvd/', description: 'El club social del Centro, musica variada y el mejor ambiente de Montevideo.' },
  { club_id: '12ac22f6-c7b9-484e-b5c5-9791561e7f54', title: 'El Gran Pez en Vivo', venue_name: 'El Gran Pez', city: 'Montevideo', neighborhood: 'Parque Rodó', category: 'Rock / En Vivo', age_range: '+18', event_date: '2025-08-15 21:30:00', instagram_url: 'https://www.instagram.com/elgranpezbar/', description: 'Noche de rock en vivo a metros de la rambla. Bandas locales y buena cerveza.' },
  { club_id: '1bb1aba3-f182-4eaf-a028-40e2b547adb7', title: 'Basquiat Art and Music Night', venue_name: 'Basquiat Bar', city: 'Montevideo', neighborhood: 'Pocitos', category: 'Pub / Bar', age_range: '+18', event_date: '2025-08-15 22:00:00', instagram_url: 'https://www.instagram.com/basquiatbar/', description: 'Arte, musica y cocktails en el bar mas cultural de Pocitos.' },
  { club_id: 'f23b90a3-3f2e-42ec-92c1-fa3226d5c011', title: 'Tibet Electronic Night', venue_name: 'Tibet Club', city: 'Montevideo', neighborhood: 'Cordón SoHo', category: 'Electrónica', age_range: '+18', event_date: '2025-08-16 23:00:00', instagram_url: 'https://www.instagram.com/tibetclubuy/', description: 'Underground electronico en el Cordon SoHo. House, techno y deep house.' },
  { club_id: '4a97ee5c-6541-4fad-8caa-19ce1d64df66', title: 'Bar Tito Viernes de Rock', venue_name: 'Bar Tito', city: 'Montevideo', neighborhood: 'Cordón', category: 'Rock / En Vivo', age_range: '+18', event_date: '2025-08-22 21:00:00', instagram_url: 'https://www.instagram.com/bartitocordon/', description: 'El clasico de Cordon: rock nacional en vivo, birra fria y buena gente.' },
  { club_id: 'e80922f4-ecc6-4e4a-b4a6-5d41268abd60', title: 'Cantaros Live Music', venue_name: 'Bar de Cantaros', city: 'Montevideo', neighborhood: 'Cordón', category: 'Pub / Bar', age_range: '+18', event_date: '2025-08-23 21:30:00', instagram_url: 'https://www.instagram.com/bardecantaros/', description: 'Musica en vivo, vinos y el ambiente mas calido del Cordon.' },
  { club_id: '40e2fefd-588f-47b6-9912-d079ddec323d', title: 'Chanteclair Gran Noche', venue_name: 'Chanteclair Club', city: 'Montevideo', neighborhood: 'Cordón', category: 'Boliche', age_range: '+18', event_date: '2025-08-29 23:00:00', instagram_url: 'https://www.instagram.com/chanteclairclub/', description: 'El historico Chanteclair con toda su energia. Reggaeton, cumbia y mas.' },
  { club_id: '00f2ac80-80f9-4112-984d-19fd5557a583', title: 'Blast Outdoor Party', venue_name: 'Blast Mvd', city: 'Montevideo', neighborhood: 'Parque Rodó', category: 'Electrónica', age_range: '+18', event_date: '2025-08-30 22:00:00', instagram_url: 'https://www.instagram.com/blast.mvd/', description: 'Fiesta al aire libre en Parque Rodo. Electronica, trap y lo mejor del verano.' },
  { club_id: '09f9582f-d406-468e-a5c2-991bddbbf0e8', title: 'Tazu Bar Noche de Cocktails', venue_name: 'Tazu Bar Club', city: 'Montevideo', neighborhood: 'Ciudad Vieja', category: 'Pub / Bar', age_range: '+18', event_date: '2025-09-05 22:00:00', instagram_url: 'https://www.instagram.com/tazubarclub/', description: 'Cocktails de autor, DJ en vivo y la mejor energia de la Ciudad Vieja.' },
  { club_id: 'f256c81b-77c5-4991-9700-655a5286f2d6', title: 'La China Open Air', venue_name: 'La China Club', city: 'Montevideo', neighborhood: 'Parque Rodó', category: 'Electrónica', age_range: '+18', event_date: '2025-09-06 23:00:00', instagram_url: 'https://www.instagram.com/lachinaclub_mvd/', description: 'El clasico open air de Montevideo con los mejores DJs nacionales.' },
  { club_id: '1b8d7b4f-79e9-4322-aa69-625fa1f26d5e', title: 'Gallaghers Irish Night', venue_name: "Gallagher's Pub", city: 'Montevideo', neighborhood: 'Pocitos', category: 'Pub / Bar', age_range: '+18', event_date: '2025-09-12 21:00:00', instagram_url: 'https://www.instagram.com/gallagherspub.mvd/', description: 'Noche irlandesa con musica en vivo, Guinness y el mejor ambiente de Pocitos.' },
  { club_id: 'e8db4f0a-b583-4c64-ba25-d0f261343d43', title: 'Burlesque Cabaret Night', venue_name: 'Burlesque Bar', city: 'Montevideo', neighborhood: 'Pocitos', category: 'Pub / Bar', age_range: '+18', event_date: '2025-09-13 22:30:00', instagram_url: 'https://www.instagram.com/burlesquebar/', description: 'Show de cabaret, musica jazz y cocktails en el corazon de Pocitos.' },
  { club_id: 'd4614803-a8f6-4c83-8065-55c9f19186aa', title: 'Volstead Speakeasy Night', venue_name: 'Volstead Bar', city: 'Montevideo', neighborhood: 'Cordón', category: 'Pub / Bar', age_range: '+18', event_date: '2025-09-19 21:30:00', instagram_url: 'https://www.instagram.com/volstead.bar/', description: 'Noche de speakeasy con jazz, bourbon y la elegancia del Cordon.' },
  { club_id: 'e9174be7-6506-4614-b0f7-1ac4e52d932e', title: 'MUTE Underground', venue_name: 'MUTE Montevideo', city: 'Montevideo', neighborhood: 'Ciudad Vieja', category: 'Electrónica', age_range: '+18', event_date: '2025-09-20 23:30:00', instagram_url: 'https://www.instagram.com/mutemontevideo/', description: 'El underground mas oscuro de Montevideo. Techno, industrial y dark electro.' },
  // Maldonado
  { club_id: 'e1107fc8-111d-45af-a777-169e11bf262d', title: 'Ocean Club Playa Brava', venue_name: 'Ocean Club', city: 'Maldonado', neighborhood: 'Punta del Este', category: 'Electrónica', age_range: '+18', event_date: '2025-07-19 23:00:00', instagram_url: 'https://www.instagram.com/oceanclubpde/', description: 'La fiesta mas exclusiva de Punta frente al mar. DJs internacionales y open bar.' },
  { club_id: 'f3abbeca-ac14-4881-9049-d46bc941fa7e', title: 'Babaloo Summer Opening', venue_name: 'Babaloo Punta del Este', city: 'Maldonado', neighborhood: 'Punta del Este', category: 'Boliche', age_range: '+18', event_date: '2025-07-25 23:30:00', instagram_url: 'https://www.instagram.com/babaloopde/', description: 'El historico Babaloo abre la temporada con reggaeton, cumbia y los mejores DJs.' },
  { club_id: '000a8940-bc74-49f7-8ae2-6c6c1afe42f4', title: 'Tequila Club La Barra', venue_name: 'Tequila Club', city: 'Maldonado', neighborhood: 'La Barra', category: 'Boliche', age_range: '+18', event_date: '2025-08-01 23:00:00', instagram_url: 'https://www.instagram.com/tequilapde/', description: 'La Barra se prende: reggaeton, electronica y los mejores tequilas de la noche.' },
  { club_id: 'fdf44dd8-c458-421a-8dde-c9ce0066681c', title: 'Bagatelle Beach Party', venue_name: 'Bagatelle Beach', city: 'Maldonado', neighborhood: 'Manantiales', category: 'Electrónica', age_range: '+18', event_date: '2025-08-02 20:00:00', instagram_url: 'https://www.instagram.com/bagatellerivera/', description: 'Beach party de dia y noche en Manantiales. DJ sets, piscina y cocktails.' },
  { club_id: '904ad013-bc96-4452-bcbb-b49d3302a18b', title: 'Ferona Weekend Vibes', venue_name: 'Ferona Club Social', city: 'Maldonado', neighborhood: 'La Barra', category: 'Pub / Bar', age_range: '+18', event_date: '2025-08-08 22:00:00', instagram_url: 'https://www.instagram.com/feronabar/', description: 'Fin de semana en La Barra con musica variada, drinks y el mejor ambiente.' },
  { club_id: 'ddaa10ed-e9d6-49ec-8ecd-0011b5f73e80', title: 'Imayele Sunset Session', venue_name: 'Imayele Beach Club', city: 'Maldonado', neighborhood: 'Punta del Este', category: 'Electrónica', age_range: '+18', event_date: '2025-08-09 18:30:00', instagram_url: 'https://www.instagram.com/imayelepde/', description: 'Sunset session frente al mar con house music y los mejores cocktails de PDE.' },
  { club_id: '3d2789d1-4e7a-4e27-abff-b717bc440055', title: "I'm In La Barra Party", venue_name: "I'm In Club", city: 'Maldonado', neighborhood: 'La Barra', category: 'Boliche', age_range: '+18', event_date: '2025-08-15 23:00:00', instagram_url: 'https://www.instagram.com/iminlabarra/', description: 'La fiesta mas grande de La Barra: electronica, reggaeton y open bar VIP.' },
  { club_id: 'f5c30099-1d7b-4204-98e7-9ea9dd0e3466', title: 'Cova Bar Puerto Night', venue_name: 'Cova Bar', city: 'Maldonado', neighborhood: 'Punta del Este', category: 'Pub / Bar', age_range: '+18', event_date: '2025-08-16 21:00:00', instagram_url: 'https://www.instagram.com/covapde/', description: 'Noche frente al puerto de PDE con jazz en vivo y los mejores vinos uruguayos.' },
  { club_id: '4346ef0c-21ef-4b82-8aaf-a3c5e03528a1', title: 'No Me Olvides Manantiales', venue_name: 'No Me Olvides', city: 'Maldonado', neighborhood: 'Manantiales', category: 'Electrónica', age_range: '+18', event_date: '2025-08-22 22:00:00', instagram_url: 'https://www.instagram.com/nomeolvidesmanantiales/', description: 'El favorito de Manantiales regresa con una noche especial de house y techno.' },
  // Punta del Este
  { club_id: '9d3cae1c-8306-45d3-aa8d-389695a53f94', title: 'Bikini Beach Day and Night', venue_name: 'Bikini Beach Parador', city: 'Punta del Este', neighborhood: 'Manantiales', category: 'Electrónica', age_range: '+18', event_date: '2025-07-20 17:00:00', instagram_url: 'https://www.instagram.com/bikinibeachoficial/', description: 'De dia en la playa y de noche en la pista. El parador de Manantiales en su mejor momento.' },
  { club_id: '30853163-34e4-46df-a41c-3535b632918f', title: 'Bagatelle La Barra Season', venue_name: 'Bagatelle Beach Punta del Este', city: 'Punta del Este', neighborhood: 'La Barra', category: 'Electrónica', age_range: '+18', event_date: '2025-08-01 22:00:00', instagram_url: 'https://www.instagram.com/bagatellepuntadeleste/', description: 'La apertura de temporada mas esperada de La Barra con DJs internacionales.' },
  { club_id: 'a64e820e-40f6-48f2-b395-2a691e0c21ff', title: 'Solera Wine Sunset JI', venue_name: 'Solera Wine Bar y Tapas', city: 'Punta del Este', neighborhood: 'José Ignacio', category: 'Pub / Bar', age_range: '+18', event_date: '2025-08-08 19:00:00', instagram_url: 'https://www.instagram.com/solerajoseignacio/', description: 'Vinos uruguayos, tapas y jazz en el rincon mas exclusivo de Jose Ignacio.' },
  // Rocha
  { club_id: '6e1b7b82-e124-422a-b883-94f1e0834fa5', title: 'Club La Paloma Sabado', venue_name: 'Club La Paloma', city: 'Rocha', neighborhood: 'La Paloma', category: 'Boliche', age_range: '+18', event_date: '2025-07-26 22:00:00', instagram_url: 'https://www.instagram.com/clublapaloma/', description: 'El encuentro social de La Paloma con musica en vivo y el mejor ambiente costero.' },
  { club_id: 'd925e7bd-83fe-4dea-bc09-73288b9d16ee', title: 'Bitacora Mar y Musica', venue_name: 'Bitacora Bar', city: 'Rocha', neighborhood: 'La Paloma', category: 'Rock / En Vivo', age_range: '+18', event_date: '2025-08-01 21:00:00', instagram_url: 'https://www.instagram.com/bitacorabar/', description: 'Frente al mar en La Paloma con bandas en vivo y el mejor ambiente del litoral.' },
  { club_id: '247391c8-aae7-40ab-8e6e-483afa52caa9', title: 'El Club del Diablo Noche', venue_name: 'El Club del Diablo', city: 'Rocha', neighborhood: 'Punta del Diablo', category: 'Boliche', age_range: '+18', event_date: '2025-08-08 23:00:00', instagram_url: 'https://www.instagram.com/elclubdeldiablo/', description: 'La noche mas salvaje de Punta del Diablo. Reggaeton y cumbia hasta el amanecer.' },
  { club_id: '469f1f13-552a-45cb-a40d-3d76a04ca911', title: 'La Perla Cabo Polonio', venue_name: 'La Perla del Cabo', city: 'Rocha', neighborhood: 'Cabo Polonio', category: 'Pub / Bar', age_range: '+18', event_date: '2025-08-15 20:00:00', instagram_url: 'https://www.instagram.com/laperladelcabo/', description: 'En el fin del mundo: musica al ritmo de las olas en Cabo Polonio.' },
  // Canelones
  { club_id: 'e181daf8-e7a9-48ac-a3dc-aab62cef8065', title: 'Teatro Amarra en Vivo', venue_name: 'Teatro Amarra', city: 'Canelones', neighborhood: 'Ciudad de la Costa', category: 'Rock / En Vivo', age_range: '+18', event_date: '2025-08-09 21:00:00', instagram_url: 'https://www.instagram.com/teatroamarra/', description: 'Shows en vivo, teatro y musica en el corazon de Ciudad de la Costa.' },
  { club_id: 'd1fdf7dc-7d99-46f4-8215-61c3efba8130', title: 'El Descanso Fin de Semana', venue_name: 'El Descanso Pub', city: 'Canelones', neighborhood: 'Lagomar', category: 'Rock / En Vivo', age_range: '+18', event_date: '2025-08-16 22:00:00', instagram_url: 'https://www.instagram.com/eldescansopub/', description: 'El pub de Lagomar con musica en vivo y los mejores tragos de la Costa de Oro.' },
  { club_id: '3226dcd4-db6a-4fd4-bbe7-5d1dbeb3c7b2', title: 'Costanera Club Solymar', venue_name: 'Costanera Club', city: 'Canelones', neighborhood: 'Solymar', category: 'Boliche', age_range: '+18', event_date: '2025-08-22 23:00:00', instagram_url: 'https://www.instagram.com/costaneraclub/', description: 'El boliche de Solymar con toda la energia del verano en la costa.' },
  // Interior
  { club_id: 'd88fa13e-a1b7-4ad9-b6ce-1903a78c1232', title: 'El Galpon Noche de Folklore', venue_name: 'El Galpon Tacuarembo', city: 'Tacuarembó', neighborhood: 'Centro', category: 'Pub / Bar', age_range: '+18', event_date: '2025-08-23 21:00:00', instagram_url: 'https://www.instagram.com/elgalpontacuarembo/', description: 'Noche de folklore, candombe y musica nacional en el corazon de Tacuarembo.' },
  // Costa
  { club_id: '8593ed39-f3cb-4cbf-bf0d-7de44f61f73c', title: 'El Pinar Sunset Costa de Oro', venue_name: 'El Pinar Sunset Club', city: 'El Pinar', neighborhood: 'Costa de Oro', category: 'Electrónica', age_range: '+18', event_date: '2025-08-30 18:30:00', instagram_url: 'https://www.instagram.com/elpinar.sunsets/', description: 'El sunset mas bello de la Costa de Oro con DJ y cocktails frente al mar.' },
  { club_id: '48f03c1a-ec94-4a48-a6d3-6448e53621db', title: 'La Huella Atlantida Summer', venue_name: 'La Huella Atlantida', city: 'Atlántida', neighborhood: 'Centro', category: 'Pub / Bar', age_range: '+18', event_date: '2025-09-05 21:30:00', instagram_url: 'https://www.instagram.com/lahuella_atlantida/', description: 'La temporada en Atlantida arranca con musica en vivo y los mejores tragos.' },
  { club_id: 'e4976602-375b-4e0b-8dc0-fc0c02080b41', title: 'Valdez Parador Sunset', venue_name: 'Valdez Parador y Bar', city: 'Costa Azul', neighborhood: 'Playa', category: 'Electrónica', age_range: '+18', event_date: '2025-09-06 18:00:00', instagram_url: 'https://www.instagram.com/valdezparador/', description: 'Sunset y after en Costa Azul con DJ sets y el mejor ambiente de playa.' },
  { club_id: 'ce17a469-793a-43a5-9631-ce3ceeac4276', title: "I'm In Piriapolis Noche", venue_name: "I'm In Piriapolis", city: 'Piriápolis', neighborhood: 'Playa Hermosa', category: 'Boliche', age_range: '+18', event_date: '2025-09-13 23:00:00', instagram_url: 'https://www.instagram.com/imin_piriapolis/', description: 'Piriapolis de noche: reggaeton, electronica y las mejores vistas del rio.' },
  // La Pedrera / La Paloma / Cabo Polonio
  { club_id: '687c193e-93a3-42d6-b069-05911c331f26', title: 'La Negra Noche de Verano', venue_name: 'La Negra Bar y Night', city: 'La Pedrera', neighborhood: 'Principal', category: 'Boliche', age_range: '+18', event_date: '2025-08-22 23:00:00', instagram_url: 'https://www.instagram.com/lanegralapedrera/', description: 'La Pedrera se mueve: cumbia, reggaeton y la mejor vibra costera de Rocha.' },
  { club_id: '777f8b82-59c5-4e26-8e8b-b68c7f5bbca6', title: 'Club Social La Pedrera Noche', venue_name: 'Club Social La Pedrera', city: 'La Pedrera', neighborhood: 'Centro', category: 'Pub / Bar', age_range: '+18', event_date: '2025-09-05 21:00:00', instagram_url: 'https://www.instagram.com/cslapedrera/', description: 'El encuentro social de La Pedrera con musica en vivo y la comunidad local.' },
  { club_id: '172fcfb1-2159-4de6-a659-c9ee3427e175', title: 'La Balconada Sunset', venue_name: 'Parador La Balconada', city: 'La Paloma', neighborhood: 'La Balconada', category: 'Electrónica', age_range: '+18', event_date: '2025-09-12 18:00:00', instagram_url: 'https://www.instagram.com/labalconadaparador/', description: 'El parador mas exclusivo de La Paloma con DJ, piscina y vistas al mar.' },
  { club_id: 'ffb58fcc-f8c5-4529-8398-58b8a3a767cc', title: 'El Timon Noche de Puerto', venue_name: 'El Timon Pub', city: 'La Paloma', neighborhood: 'Puerto', category: 'Rock / En Vivo', age_range: '+18', event_date: '2025-09-13 21:30:00', instagram_url: 'https://www.instagram.com/eltimon_lapaloma/', description: 'Rock y blues frente al puerto de La Paloma. La noche mas autentica de Rocha.' },
  { club_id: '7e126539-1013-40e3-a778-babd7f32ee6c', title: 'Cabo Bar Atardecer', venue_name: 'Cabo Bar y Sunsets', city: 'Cabo Polonio', neighborhood: 'Playa Sur', category: 'Pub / Bar', age_range: '+18', event_date: '2025-09-19 18:00:00', instagram_url: 'https://www.instagram.com/cabobar_polonio/', description: 'El fin del mundo mas bello: atardecer en Cabo Polonio con DJ acustico y tragos.' },
];

// ─── EVENTOS PARA NUEVOS BOLICHES (se insertan despues de crear los clubs) ───

const EVENTS_FOR_NEW_CLUBS = [
  // fechas escalonadas para no pisar
  { name_key: 'Sala Zitarrosa', title: 'Noche de Tango y Candombe', category: 'Pub / Bar', age_range: '+18', event_date: '2025-07-18 21:00:00', description: 'Una noche unica de tango y candombe en la sala mas iconica de Montevideo.' },
  { name_key: 'Teatro de Verano', title: 'Gran Fiesta de Verano', category: 'Boliche', age_range: '+18', event_date: '2025-07-19 21:00:00', description: 'El Teatro de Verano abre sus puertas con la gran fiesta de la temporada.' },
  { name_key: 'Club Misterio', title: 'Misterio Friday Night', category: 'Electrónica', age_range: '+18', event_date: '2025-07-25 23:00:00', description: 'Viernes de electronica y misterio en el Cordon. House, techno y mas.' },
  { name_key: 'Shannon Irish Pub', title: 'Shannon Irish Night', category: 'Pub / Bar', age_range: '+18', event_date: '2025-07-26 21:00:00', description: 'La noche mas irlandesa de Montevideo. Guinness, whisky y musica en vivo.' },
  { name_key: 'Bar Rivero', title: 'Rivero Ciudad Vieja Session', category: 'Pub / Bar', age_range: '+18', event_date: '2025-08-01 21:30:00', description: 'Cocteleria de autor y musica en vivo en el corazon de la Ciudad Vieja.' },
  { name_key: 'Clandestino Bar', title: 'Noche Clandestina', category: 'Electrónica', age_range: '+18', event_date: '2025-08-02 23:30:00', description: 'La fiesta secreta del Cordon. Solo los que saben, saben.' },
  { name_key: 'El Milongon', title: 'Milonga Social Sabado', category: 'Pub / Bar', age_range: '+18', event_date: '2025-08-08 21:00:00', description: 'Milonga social en Palermo. Tango, candombe y el mejor ambiente de barrio.' },
  { name_key: 'Club Fusion', title: 'Fusion Electronic Night', category: 'Electrónica', age_range: '+18', event_date: '2025-08-09 23:00:00', description: 'Electronica de alto nivel en Tres Cruces. DJs nacionales e internacionales.' },
  { name_key: 'Paullier Club', title: 'Paullier Saturday Vibes', category: 'Boliche', age_range: '+18', event_date: '2025-08-15 23:30:00', description: 'Sabados de cachengue y reggaeton en el Cordon. Tragos y buena onda.' },
  { name_key: 'El Farolito Bar', title: 'El Farolito en Vivo', category: 'Rock / En Vivo', age_range: '+18', event_date: '2025-08-16 21:30:00', description: 'Bandas en vivo y tragos artesanales en Palermo. La noche mas autentica del barrio.' },
  { name_key: 'Plop! Club', title: 'Fiesta Plop! Open Air', category: 'Boliche', age_range: '+18', event_date: '2025-08-22 22:00:00', description: 'La fiesta mas famosa de Uruguay llega a Parque Rodo. Electro pop y mas.' },
  { name_key: 'Loquito Bar', title: 'Loquito Viernes Social', category: 'Pub / Bar', age_range: '+18', event_date: '2025-08-23 21:00:00', description: 'El bar de Pocitos que nunca duerme. Tragos, musica y buena gente.' },
  { name_key: 'La Ronda Palermo', title: 'La Ronda Palermo Night', category: 'Cumbia / RKT', age_range: '+18', event_date: '2025-08-29 22:00:00', description: 'Cumbia y RKT en Palermo. El barrio de noche con toda la energia.' },
  { name_key: 'Espacio Guambia', title: 'Guambia Arte y Musica', category: 'Pub / Bar', age_range: '+18', event_date: '2025-08-30 21:00:00', description: 'Espacio cultural con musica en vivo, arte y tragos en el Cordon.' },
  { name_key: 'El Pony Pisador', title: 'El Pony Friday Rock', category: 'Rock / En Vivo', age_range: '+18', event_date: '2025-09-05 22:00:00', description: 'Rock nacional y buena cerveza en el clasico del Cordon.' },
  { name_key: 'Boliche El Canario', title: 'El Canario Sabado Noche', category: 'Boliche', age_range: '+18', event_date: '2025-09-06 23:00:00', description: 'El boliche de Punta Carretas con cumbia, reggaeton y el mejor ambiente.' },
  { name_key: 'Sala del Fundador', title: 'Fundador Live Session', category: 'Rock / En Vivo', age_range: '+18', event_date: '2025-09-12 21:30:00', description: 'Musica en vivo en la sala mas antigua de la Ciudad Vieja.' },
  { name_key: 'D-Club Montevideo', title: 'D-Club Electronic Friday', category: 'Electrónica', age_range: '+21', event_date: '2025-09-13 23:00:00', description: 'El club electronico del Centro. House, techno y deep house de alto nivel.' },
  { name_key: 'Bar Cocodrilo', title: 'Cocodrilo Pocitos Noche', category: 'Pub / Bar', age_range: '+18', event_date: '2025-09-19 22:00:00', description: 'El bar de Pocitos que lo tiene todo: tragos, musica y buena compania.' },
  { name_key: 'La Trastienda MVD', title: 'La Trastienda Gran Show', category: 'Rock / En Vivo', age_range: '+18', event_date: '2025-09-20 21:00:00', description: 'Show en vivo en el espacio cultural mas importante de la Ciudad Vieja.' },
  // Punta del Este nuevos
  { name_key: 'Cocó Punta del Este', title: 'Coco Beach La Barra', category: 'Electrónica', age_range: '+18', event_date: '2025-07-20 22:00:00', description: 'Beach club de La Barra con DJ, piscina y los mejores cocktails de la costa.' },
  { name_key: 'Tequila Sunrise Club', title: 'Tequila Sunrise Party', category: 'Boliche', age_range: '+18', event_date: '2025-07-26 23:00:00', description: 'La fiesta del amanecer en Punta. Reggaeton, electronica y tragos hasta el sol.' },
  { name_key: 'Illusion Club PDE', title: 'Illusion Playa Brava Night', category: 'Electrónica', age_range: '+21', event_date: '2025-08-02 23:30:00', description: 'El club mas exclusivo de Punta. Ilusion de noche, musica y magia.' },
  { name_key: 'Stradivarius Bar', title: 'Stradivarius Puerto Session', category: 'Pub / Bar', age_range: '+18', event_date: '2025-08-09 21:00:00', description: 'Vinos, cocteleria y jazz frente al puerto de Punta del Este.' },
  { name_key: 'Sótano Beat Club', title: 'Sotano Underground Friday', category: 'Electrónica', age_range: '+18', event_date: '2025-08-16 23:30:00', description: 'El underground de Gorlero. Techno y house para los que saben.' },
  { name_key: 'Alquimia Club', title: 'Alquimia La Barra Opening', category: 'Electrónica', age_range: '+18', event_date: '2025-08-23 23:00:00', description: 'La apertura mas esperada de La Barra. Electronica, luces y buena vibra.' },
  { name_key: 'Buenos Dias Bar', title: 'Buenos Dias Jose Ignacio', category: 'Pub / Bar', age_range: '+18', event_date: '2025-08-30 19:00:00', description: 'El lugar mas exclusivo de JI. Vinos, tapas y el atardecer mas bello del pais.' },
  { name_key: 'Parador Bravo', title: 'Parador Bravo Sunset Party', category: 'Electrónica', age_range: '+18', event_date: '2025-09-06 17:00:00', description: 'Sunset en la playa Brava de Manantiales. DJs, cocktails y arena.' },
  // Rocha nuevos
  { name_key: 'Valizas Surf Club', title: 'Valizas Beach Party', category: 'Pub / Bar', age_range: '+18', event_date: '2025-07-19 21:00:00', description: 'La fiesta costera de Valizas. Surf, musica y el ambiente mas libre de Uruguay.' },
  { name_key: 'Punta del Diablo Hostel Bar', title: 'PDD Hostel Night', category: 'Boliche', age_range: '+18', event_date: '2025-07-26 22:30:00', description: 'El hostel bar mas conocido de Punta del Diablo. Viajeros, musica y buena onda.' },
  { name_key: 'El Aguila La Paloma', title: 'El Aguila La Paloma Rock', category: 'Rock / En Vivo', age_range: '+18', event_date: '2025-08-08 21:30:00', description: 'Rock en vivo en La Paloma. Bandas locales y la brisa del oceano.' },
  { name_key: 'Bar del Puerto Polonio', title: 'Polonio Puerto Sunset', category: 'Pub / Bar', age_range: '+18', event_date: '2025-08-22 19:00:00', description: 'El bar del fin del mundo. Atardecer en Cabo Polonio con musica y magia.' },
  // Canelones nuevos
  { name_key: 'Punta Colorada Beach Club', title: 'Punta Colorada Beach Party', category: 'Electrónica', age_range: '+18', event_date: '2025-08-01 19:00:00', description: 'Beach party en Punta Colorada con DJ, playa y el mejor verano de Canelones.' },
  { name_key: 'La Floresta Club', title: 'La Floresta Verano Noche', category: 'Boliche', age_range: '+18', event_date: '2025-08-09 23:00:00', description: 'La noche de La Floresta con cumbia y reggaeton. El clasico de la costa canaria.' },
  { name_key: 'Salinas Bar y Playa', title: 'Salinas Sunset y Fiesta', category: 'Electrónica', age_range: '+18', event_date: '2025-08-16 18:00:00', description: 'Sunset en Salinas con DJ y cocktails frente al mar. El verano en su punto.' },
  { name_key: 'Atlantis Club Atlantida', title: 'Atlantis Club Noche Grande', category: 'Boliche', age_range: '+18', event_date: '2025-08-23 23:00:00', description: 'La noche mas grande de Atlantida. Boliche, musica y toda la energia del verano.' },
  // Colonia
  { name_key: 'El Drugstore Colonia', title: 'Drugstore Barrio Historico Night', category: 'Pub / Bar', age_range: '+18', event_date: '2025-08-02 21:00:00', description: 'El bar emblema de Colonia del Sacramento. Cocteleria, musica y buena onda.' },
  { name_key: 'La Bodeguita Colonia', title: 'Bodeguita Vinos y Musica', category: 'Pub / Bar', age_range: '+18', event_date: '2025-08-09 20:00:00', description: 'Vinos uruguayos y musica en vivo en el barrio historico de Colonia.' },
  { name_key: 'Yacht Club Colonia', title: 'Yacht Club Sunset Party', category: 'Electrónica', age_range: '+18', event_date: '2025-08-16 18:30:00', description: 'Sunset sobre el Rio de la Plata en el Yacht Club de Colonia. DJ y cocktails.' },
  { name_key: 'Pulperia de los Faroles', title: 'Pulperia Noche de Faroles', category: 'Pub / Bar', age_range: '+18', event_date: '2025-09-13 21:00:00', description: 'La pulperia mas pintoresca de Colonia con musica criolla y vinos de la region.' },
  // Salto
  { name_key: 'Club Social Salto', title: 'Salto Gran Baile Social', category: 'Cumbia / RKT', age_range: '+18', event_date: '2025-08-23 22:00:00', description: 'El gran baile social de Salto. Cumbia, folklore y el sabor del norte uruguayo.' },
  { name_key: 'Termas del Dayman Club', title: 'Termas Dayman Noche', category: 'Boliche', age_range: '+18', event_date: '2025-09-06 22:00:00', description: 'Noche de fiesta en las termas. Musica, piscinas termales y buena vibra del norte.' },
  { name_key: 'El Muelle Bar Salto', title: 'El Muelle Costanera Night', category: 'Pub / Bar', age_range: '+18', event_date: '2025-09-20 21:00:00', description: 'Bar frente al Rio Uruguay en Salto. Musica en vivo y los mejores atardeceres del norte.' },
  // Rivera
  { name_key: 'Club Fronterizo Rivera', title: 'Noche Fronteriza Rivera', category: 'Boliche', age_range: '+18', event_date: '2025-09-05 23:00:00', description: 'La fiesta fronteriza mas grande del norte. Rivera y Livramento se unen en una sola noche.' },
  { name_key: 'Boliche El Norte', title: 'El Norte Sabado Grande', category: 'Cumbia / RKT', age_range: '+18', event_date: '2025-09-12 23:00:00', description: 'El boliche del norte uruguayo. Cumbia, reggaeton y toda la energia fronteriza.' },
  // Artigas
  { name_key: 'Club Artigas Social', title: 'Artigas Social Night', category: 'Cumbia / RKT', age_range: '+18', event_date: '2025-09-26 22:00:00', description: 'El encuentro social de Artigas con cumbia y musica del norte.' },
  // Mercedes
  { name_key: 'El Puerto Bar Mercedes', title: 'El Puerto Noche de Rio', category: 'Pub / Bar', age_range: '+18', event_date: '2025-08-30 21:00:00', description: 'Bar frente al Rio Negro en Mercedes. Musica, tragos y el ambiente del interior.' },
  { name_key: 'Club Nautico Mercedes', title: 'Nautico Sunset Mercedes', category: 'Electrónica', age_range: '+18', event_date: '2025-09-13 18:30:00', description: 'Sunset sobre el Rio Negro con DJ y cocktails. El mejor plan de Soriano.' },
  // Minas
  { name_key: 'El Parnaso Bar', title: 'El Parnaso Noche de Minas', category: 'Rock / En Vivo', age_range: '+18', event_date: '2025-09-19 21:30:00', description: 'Rock y buena cerveza en el centro de Minas. La noche mas autentica de Lavalleja.' },
  // Treinta y Tres
  { name_key: 'El Olimar Bar', title: 'El Olimar Noche de Rio', category: 'Pub / Bar', age_range: '+18', event_date: '2025-09-26 21:00:00', description: 'El bar del Olimar. Musica en vivo y el mejor ambiente de Treinta y Tres.' },
  // Fray Bentos
  { name_key: 'Club Fray Bentos Social', title: 'Fray Bentos Gran Social', category: 'Cumbia / RKT', age_range: '+18', event_date: '2025-09-27 22:00:00', description: 'La noche social de Fray Bentos. Cumbia, folklore y la vibra del litoral.' },
];

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function run() {
  let clubsOk = 0, clubsFail = 0;
  let evOk = 0, evFail = 0;

  // 1. Insertar nuevos boliches
  console.log('\n=== INSERTANDO BOLICHES ===');
  const clubIdsByName = {};

  for (const club of NEW_CLUBS) {
    const { data, error } = await client
      .from('clubs')
      .insert([club])
      .select('id, name')
      .single();

    if (error) {
      console.error('FAIL club ' + club.name + ': ' + error.message);
      clubsFail++;
    } else {
      console.log('OK ' + data.name + ' (' + club.city + ')');
      clubIdsByName[club.name] = data.id;
      clubsOk++;
    }
  }

  // 2. Insertar eventos para boliches existentes
  console.log('\n=== INSERTANDO EVENTOS (boliches existentes) ===');
  for (const ev of EVENTS_EXISTING) {
    const { error } = await client.from('events').insert([{
      ...ev,
      is_featured: false,
      created_by: null,
    }]);
    if (error) {
      console.error('FAIL evento ' + ev.title + ': ' + error.message);
      evFail++;
    } else {
      console.log('OK ' + ev.title + ' (' + ev.city + ')');
      evOk++;
    }
  }

  // 3. Insertar eventos para los nuevos boliches
  console.log('\n=== INSERTANDO EVENTOS (boliches nuevos) ===');

  // Tambien buscar IDs de clubs recien insertados por nombre
  const { data: allClubs } = await client.from('clubs').select('id, name');
  const allById = {};
  (allClubs || []).forEach(c => { allById[c.name] = c.id; });

  for (const ev of EVENTS_FOR_NEW_CLUBS) {
    const clubId = clubIdsByName[ev.name_key] || allById[ev.name_key];
    if (!clubId) {
      console.error('SIN ID para: ' + ev.name_key);
      evFail++;
      continue;
    }

    const { data: clubData } = await client.from('clubs').select('name, city, neighborhood, instagram_url').eq('id', clubId).single();
    if (!clubData) { evFail++; continue; }

    const { error } = await client.from('events').insert([{
      club_id: clubId,
      title: ev.title,
      venue_name: clubData.name,
      city: clubData.city,
      neighborhood: clubData.neighborhood,
      category: ev.category,
      age_range: ev.age_range,
      event_date: ev.event_date,
      instagram_url: clubData.instagram_url,
      description: ev.description,
      is_featured: false,
      created_by: null,
    }]);

    if (error) {
      console.error('FAIL evento ' + ev.title + ': ' + error.message);
      evFail++;
    } else {
      console.log('OK ' + ev.title + ' (' + clubData.city + ')');
      evOk++;
    }
  }

  console.log('\n=============================');
  console.log('BOLICHES: ' + clubsOk + ' OK, ' + clubsFail + ' errores');
  console.log('EVENTOS:  ' + evOk + ' OK, ' + evFail + ' errores');
  console.log('TOTAL EVENTOS NUEVOS: ' + evOk);
}

run().catch(console.error);
