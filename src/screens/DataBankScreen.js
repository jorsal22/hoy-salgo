import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Clipboard,
  FlatList,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Emojis por categoría
const CATEGORY_EMOJI = {
  'Boliche': '🪩',
  'Electrónica': '🎛️',
  'Cumbia / RKT': '🎺',
  'Pub / Bar': '🍺',
  'Fiesta Retro': '📼',
  'Rock / En Vivo': '🎸',
};
const getEmoji = (category) => CATEGORY_EMOJI[category] || '✦';

const shareWhatsApp = async (text) => {
  const url = `whatsapp://send?text=${encodeURIComponent(text)}`;
  try {
    if (await Linking.canOpenURL(url)) {
      await Linking.openURL(url);
    } else {
      Alert.alert('WhatsApp no está instalado', 'Instalá WhatsApp para compartir.');
    }
  } catch {
    Alert.alert('Error', 'No se pudo abrir WhatsApp.');
  }
};

// ─── BANCO DE DATOS ──────────────────────────────────────────────────────────

const CLUBS_DATA = [
  // ── MONTEVIDEO ──
  {
    id: 'c1',
    name: 'Lola Mora',
    city: 'Montevideo',
    neighborhood: 'Ciudad Vieja',
    address: 'Pérez Castellano 1518',
    phone: '+59899123456',
    instagram: '@lolamorabar',
    category: 'Boliche',
    description: 'Boliche emblemático en Ciudad Vieja. Música electrónica y cocktails.',
  },
  {
    id: 'c2',
    name: 'Club Chocolate',
    city: 'Montevideo',
    neighborhood: 'Palermo',
    address: 'Wilson Ferreira Aldunate 1234',
    phone: '+59898234567',
    instagram: '@clubchocolatemvd',
    category: 'Electrónica',
    description: 'Dance music, DJs internacionales, pista enorme con sonido Funktion-One.',
  },
  {
    id: 'c3',
    name: 'Pony Pisador',
    city: 'Montevideo',
    neighborhood: 'Palermo',
    address: 'Juan Paullier 1182',
    phone: '+59898345678',
    instagram: '@ponypísador',
    category: 'Pub / Bar',
    description: 'Bar de culto montevideano. Rock nacional, birras artesanales y buena onda.',
  },
  {
    id: 'c4',
    name: 'Shannon Irish Pub',
    city: 'Montevideo',
    neighborhood: 'Pocitos',
    address: 'Benito Blanco 640',
    phone: '+59899456789',
    instagram: '@shannonmvd',
    category: 'Pub / Bar',
    description: 'Pub irlandés clásico. Música en vivo los viernes y sábados.',
  },
  {
    id: 'c5',
    name: 'Club Muta',
    city: 'Montevideo',
    neighborhood: 'Aguada',
    address: 'Canelones 1337',
    phone: '+59898567890',
    instagram: '@clubmuta',
    category: 'Electrónica',
    description: 'Espacio underground de electrónica y arte. Fiestas temáticas semanales.',
  },
  {
    id: 'c6',
    name: 'La Ronda',
    city: 'Montevideo',
    neighborhood: 'Cordón',
    address: '18 de Julio 1878',
    phone: '+59899678901',
    instagram: '@larondamvd',
    category: 'Boliche',
    description: 'Boliche multisala con cumbia, reggaeton y electrónica.',
  },
  {
    id: 'c7',
    name: 'Kitsch',
    city: 'Montevideo',
    neighborhood: 'Palermo',
    address: 'Juan Paullier 1198',
    phone: '+59898789012',
    instagram: '@kitschmvd',
    category: 'Boliche',
    description: 'Boliche LGBTQ+ friendly. Estética pop, dragqueens y música variada.',
  },
  {
    id: 'c8',
    name: 'Club Brava',
    city: 'Montevideo',
    neighborhood: 'Buceo',
    address: 'Rambla Rep. de México 5100',
    phone: '+59899890123',
    instagram: '@clubbravamvd',
    category: 'Boliche',
    description: 'Boliche frente al mar. Reguetón, RKT y cumbia toda la noche.',
  },
  {
    id: 'c9',
    name: 'Opus Boite',
    city: 'Montevideo',
    neighborhood: 'Punta Carretas',
    address: 'Solís 1456',
    phone: '+59898901234',
    instagram: '@opusboite',
    category: 'Boliche',
    description: 'Boliche premium. Dress code estricto, cócteles y música house.',
  },
  {
    id: 'c10',
    name: 'Cine Universitario',
    city: 'Montevideo',
    neighborhood: 'Cordón',
    address: 'San Salvador 1958',
    phone: '+59899012345',
    instagram: '@cineuniversitario',
    category: 'Rock / En Vivo',
    description: 'Sala de conciertos histórica. Rock, folk y eventos culturales.',
  },
  {
    id: 'c11',
    name: 'Sala del Museo',
    city: 'Montevideo',
    neighborhood: 'Centro',
    address: '25 de Mayo 568',
    phone: '+59898023456',
    instagram: '@saladelmuseo',
    category: 'Rock / En Vivo',
    description: 'Sala íntima para bandas emergentes y jazz.',
  },
  {
    id: 'c12',
    name: 'Aguanta Bar',
    city: 'Montevideo',
    neighborhood: 'Tres Cruces',
    address: 'Bulevar Artigas 1902',
    phone: '+59899134567',
    instagram: '@aguantabar',
    category: 'Cumbia / RKT',
    description: 'El templo de la cumbia y el RKT en Montevideo.',
  },
  {
    id: 'c13',
    name: 'Café Misterio',
    city: 'Montevideo',
    neighborhood: 'Ciudad Vieja',
    address: 'Costa Rica 1700',
    phone: '+59898245678',
    instagram: '@cafemisterio',
    category: 'Pub / Bar',
    description: 'Bar literario con noches de DJ y tragos de autor.',
  },
  {
    id: 'c14',
    name: 'Flamingo',
    city: 'Montevideo',
    neighborhood: 'Pocitos',
    address: 'Av. Brasil 2820',
    phone: '+59899356789',
    instagram: '@flamingomvd',
    category: 'Boliche',
    description: 'Boliche trendy en Pocitos. Pop, electro y fiesta retro los jueves.',
  },
  {
    id: 'c15',
    name: 'Palacio Peñarol',
    city: 'Montevideo',
    neighborhood: 'La Blanqueada',
    address: 'Gral. Eugenio Garzón 2068',
    phone: '+59898467890',
    instagram: '@palaciopeñarol',
    category: 'Rock / En Vivo',
    description: 'Sala grande para bandas y espectáculos en vivo.',
  },

  // ── PUNTA DEL ESTE ──
  {
    id: 'c16',
    name: 'OVO Beach Club',
    city: 'Punta del Este',
    neighborhood: 'Playa Brava',
    address: 'Rambla Lorenzo Batlle Pacheco s/n',
    phone: '+59899567890',
    instagram: '@ovobeachclub',
    category: 'Boliche',
    description: 'Beach club de temporada. Los mejores DJs internacionales en la arena.',
  },
  {
    id: 'c17',
    name: 'Moby Dick',
    city: 'Punta del Este',
    neighborhood: 'La Barra',
    address: 'Ruta 10 km 161',
    phone: '+59898678901',
    instagram: '@mobydickpde',
    category: 'Pub / Bar',
    description: 'Bar de playa en La Barra. Atardeceres épicos y música electrónica.',
  },
  {
    id: 'c18',
    name: 'Tequila Club',
    city: 'Punta del Este',
    neighborhood: 'Mansa',
    address: 'Av. Roosevelt 345',
    phone: '+59899789012',
    instagram: '@tequilaclubpde',
    category: 'Boliche',
    description: 'Club nocturno clásico de Punta. Reggaeton y house music.',
  },
  {
    id: 'c19',
    name: 'Club del Lago',
    city: 'Punta del Este',
    neighborhood: 'Punta del Este Centro',
    address: 'Rambla Williman s/n',
    phone: '+59898890123',
    instagram: '@clubdellago',
    category: 'Electrónica',
    description: 'Boliche a orillas del lago. Electrónica y deep house toda la temporada.',
  },
  {
    id: 'c20',
    name: 'Nirvana Club',
    city: 'Punta del Este',
    neighborhood: 'Punta del Este Centro',
    address: '20 y Gorlero',
    phone: '+59899901234',
    instagram: '@nirvanacpde',
    category: 'Boliche',
    description: 'Dos plantas, dos ambientes: electrónica arriba y reggaeton abajo.',
  },
  {
    id: 'c21',
    name: 'Jackie O',
    city: 'Punta del Este',
    neighborhood: 'Punta del Este Centro',
    address: 'El Foque 850',
    phone: '+59898012345',
    instagram: '@jackieopde',
    category: 'Boliche',
    description: 'Uno de los boliches más antiguos de Punta. Clásico infaltable.',
  },
  {
    id: 'c22',
    name: 'Pacha Punta del Este',
    city: 'Punta del Este',
    neighborhood: 'Playa Mansa',
    address: 'Rambla Williman 11',
    phone: '+59899123450',
    instagram: '@pachapde',
    category: 'Electrónica',
    description: 'Franquicia internacional de electrónica. DJs de clase mundial.',
  },

  // ── CANELONES ──
  {
    id: 'c23',
    name: 'Splash Beach',
    city: 'Canelones',
    neighborhood: 'Atlántida',
    address: 'Av. Giannattasio km 45',
    phone: '+59898234560',
    instagram: '@splashbeachuruguay',
    category: 'Boliche',
    description: 'Beach club en Atlántida. Electrónica y reggaeton con vista al mar.',
  },
  {
    id: 'c24',
    name: 'Club Náutico Atlántida',
    city: 'Canelones',
    neighborhood: 'Atlántida',
    address: 'Rambla costanera s/n',
    phone: '+59899345670',
    instagram: '@nauticoatlantida',
    category: 'Boliche',
    description: 'Fiestas de verano con vista a la costa.',
  },
  {
    id: 'c25',
    name: 'El Cambalache',
    city: 'Canelones',
    neighborhood: 'Las Piedras',
    address: 'Av. Artigas 1234',
    phone: '+59898456780',
    instagram: '@elcambalache',
    category: 'Cumbia / RKT',
    description: 'Boliche cumbia en Las Piedras. Fiestas temáticas los fines de semana.',
  },

  // ── MALDONADO ──
  {
    id: 'c26',
    name: 'Point Bar',
    city: 'Maldonado',
    neighborhood: 'Maldonado Centro',
    address: '18 de Julio 890',
    phone: '+59899567800',
    instagram: '@pointbarmdo',
    category: 'Pub / Bar',
    description: 'Bar referente de Maldonado. Rock en vivo y música variada.',
  },
  {
    id: 'c27',
    name: 'Club Tropical',
    city: 'Maldonado',
    neighborhood: 'Piriápolis',
    address: 'Rambla de los Argentinos 2200',
    phone: '+59898678900',
    instagram: '@clubtropicalpiri',
    category: 'Boliche',
    description: 'Boliche de verano en Piriápolis. Cumbia y reggaeton.',
  },
];

const EVENTS_DATA = [
  // ── EVENTOS MONTEVIDEO ──
  {
    id: 'e1',
    title: 'Noche Electrónica — Club Chocolate',
    venue: 'Club Chocolate',
    city: 'Montevideo',
    neighborhood: 'Palermo',
    category: 'Electrónica',
    ageRange: '+18',
    instagram: '@clubchocolatemvd',
    description:
      'Noche de techno y house con DJ residente + invitado sorpresa. Open bar 23h a 00h. Dress code: casual elegante.',
  },
  {
    id: 'e2',
    title: 'Cumbia y RKT — Aguanta Bar',
    venue: 'Aguanta Bar',
    city: 'Montevideo',
    neighborhood: 'Tres Cruces',
    category: 'Cumbia / RKT',
    ageRange: '+18',
    instagram: '@aguantabar',
    description:
      'La mejor cumbia santafesina y RKT de Montevideo. Pista llena, 2x1 en cañas hasta medianoche.',
  },
  {
    id: 'e3',
    title: 'Fiesta Retro 80s & 90s — Flamingo',
    venue: 'Flamingo',
    city: 'Montevideo',
    neighborhood: 'Pocitos',
    category: 'Fiesta Retro',
    ageRange: '+21',
    instagram: '@flamingomvd',
    description:
      'Una noche de pura nostalgia. Michael Jackson, Madonna, Nirvana y los hits que formaron una generación.',
  },
  {
    id: 'e4',
    title: 'Rock Nacional en Vivo — Pony Pisador',
    venue: 'Pony Pisador',
    city: 'Montevideo',
    neighborhood: 'Palermo',
    category: 'Rock / En Vivo',
    ageRange: '+18',
    instagram: '@ponypísador',
    description: 'Tres bandas de rock nacional. Puertas 21h, primer banda 22h. Entrada: $200.',
  },
  {
    id: 'e5',
    title: 'Underground Rave — Club Muta',
    venue: 'Club Muta',
    city: 'Montevideo',
    neighborhood: 'Aguada',
    category: 'Electrónica',
    ageRange: '+18',
    instagram: '@clubmuta',
    description:
      'Rave underground de 24 horas. Techno, industrial y ambient. BYOB permitido. Espacio seguro.',
  },
  {
    id: 'e6',
    title: 'Noche Kitsch — Drag & Pop',
    venue: 'Kitsch',
    city: 'Montevideo',
    neighborhood: 'Palermo',
    category: 'Boliche',
    ageRange: '+18',
    instagram: '@kitschmvd',
    description:
      'Show de drag queens, karaoke pop y DJ con hits del momento. Ambiente inclusivo y sin dress code.',
  },
  {
    id: 'e7',
    title: 'House Music en la Rambla — Club Brava',
    venue: 'Club Brava',
    city: 'Montevideo',
    neighborhood: 'Buceo',
    category: 'Boliche',
    ageRange: '+21',
    instagram: '@clubbravamvd',
    description:
      'Noche house con vista al mar. DJ set de 4 horas. Tragos de autor y botella en mesa.',
  },
  {
    id: 'e8',
    title: 'Black Party — Opus Boite',
    venue: 'Opus Boite',
    city: 'Montevideo',
    neighborhood: 'Punta Carretas',
    category: 'Boliche',
    ageRange: '+25',
    instagram: '@opusboite',
    description:
      'La fiesta más exclusiva del mes. Dress code: todo de negro. Botellas de champagne y atención personalizada.',
  },
  {
    id: 'e9',
    title: 'Noche Tropical — La Ronda',
    venue: 'La Ronda',
    city: 'Montevideo',
    neighborhood: 'Cordón',
    category: 'Cumbia / RKT',
    ageRange: '+18',
    instagram: '@larondamvd',
    description:
      'Tropical, RKT y merengue. Sala 1: cumbia. Sala 2: electrónica. ¡Noche entera con una sola entrada!',
  },
  {
    id: 'e10',
    title: 'Jazz & Vino — Café Misterio',
    venue: 'Café Misterio',
    city: 'Montevideo',
    neighborhood: 'Ciudad Vieja',
    category: 'Rock / En Vivo',
    ageRange: '+21',
    instagram: '@cafemisterio',
    description:
      'Cuarteto de jazz en vivo, maridaje de vinos uruguayos. Reserva anticipada recomendada.',
  },
  {
    id: 'e11',
    title: 'Fiesta de Disfraces Halloween — Lola Mora',
    venue: 'Lola Mora',
    city: 'Montevideo',
    neighborhood: 'Ciudad Vieja',
    category: 'Boliche',
    ageRange: '+18',
    instagram: '@lolamorabar',
    description:
      'La fiesta de Halloween más loca de la ciudad. Premio al mejor disfraz: $5000. Entrada con disfraz: descuento.',
  },
  {
    id: 'e12',
    title: 'Ladies Night — Shannon Irish Pub',
    venue: 'Shannon Irish Pub',
    city: 'Montevideo',
    neighborhood: 'Pocitos',
    category: 'Pub / Bar',
    ageRange: '+18',
    instagram: '@shannonmvd',
    description: 'Miércoles de ladies night. Mujeres: tragos gratis hasta las 23h. DJ pop & hits.',
  },
  {
    id: 'e13',
    title: 'Show En Vivo — Palacio Peñarol',
    venue: 'Palacio Peñarol',
    city: 'Montevideo',
    neighborhood: 'La Blanqueada',
    category: 'Rock / En Vivo',
    ageRange: '+18',
    instagram: '@palaciopeñarol',
    description:
      'Noche de bandas emergentes uruguayas. 4 bandas, 4 géneros. Entrada colaborativa $150.',
  },
  {
    id: 'e14',
    title: 'Fiesta Universitaria — Sala del Museo',
    venue: 'Sala del Museo',
    city: 'Montevideo',
    neighborhood: 'Centro',
    category: 'Boliche',
    ageRange: '+18',
    instagram: '@saladelmuseo',
    description:
      'La fiesta universitaria del semestre. Pulsera incluye: tragos, entrada y sorteo de premios.',
  },
  {
    id: 'e15',
    title: 'Reggaeton Night — Club Brava',
    venue: 'Club Brava',
    city: 'Montevideo',
    neighborhood: 'Buceo',
    category: 'Boliche',
    ageRange: '+18',
    instagram: '@clubbravamvd',
    description:
      'Noche 100% reggaeton con los mejores hits de Bad Bunny, Karol G y Daddy Yankee. DJ invitado especial.',
  },

  // ── EVENTOS PUNTA DEL ESTE ──
  {
    id: 'e16',
    title: 'Opening de Temporada — OVO Beach Club',
    venue: 'OVO Beach Club',
    city: 'Punta del Este',
    neighborhood: 'Playa Brava',
    category: 'Electrónica',
    ageRange: '+18',
    instagram: '@ovobeachclub',
    description:
      'El evento que abre la temporada en Punta. DJ internacional de talla mundial. Dresscode: blanco.',
  },
  {
    id: 'e17',
    title: 'Sunset Sessions — Moby Dick',
    venue: 'Moby Dick',
    city: 'Punta del Este',
    neighborhood: 'La Barra',
    category: 'Electrónica',
    ageRange: '+21',
    instagram: '@mobydickpde',
    description:
      'DJ set al atardecer desde las 18h. House y deep house con vista al océano. Capacidad limitada.',
  },
  {
    id: 'e18',
    title: 'Noche Latina — Tequila Club',
    venue: 'Tequila Club',
    city: 'Punta del Este',
    neighborhood: 'Mansa',
    category: 'Cumbia / RKT',
    ageRange: '+18',
    instagram: '@tequilaclubpde',
    description:
      'Salsa, merengue, bachata y reggaeton toda la noche. Show de bailarines profesionales a medianoche.',
  },
  {
    id: 'e19',
    title: 'Pacha Opening Night',
    venue: 'Pacha Punta del Este',
    city: 'Punta del Este',
    neighborhood: 'Playa Mansa',
    category: 'Electrónica',
    ageRange: '+21',
    instagram: '@pachapde',
    description:
      'La apertura de Pacha Uruguay. DJ residente europeo. VIP table con servicio premium.',
  },
  {
    id: 'e20',
    title: 'Fiesta Blanca — Jackie O',
    venue: 'Jackie O',
    city: 'Punta del Este',
    neighborhood: 'Punta del Este Centro',
    category: 'Boliche',
    ageRange: '+21',
    instagram: '@jackieopde',
    description:
      'La fiesta blanca más esperada del verano. Dresscode obligatorio: todo blanco. Botellas de champagne desde las 23h.',
  },
  {
    id: 'e21',
    title: 'Electro Night — Club del Lago',
    venue: 'Club del Lago',
    city: 'Punta del Este',
    neighborhood: 'Punta del Este Centro',
    category: 'Electrónica',
    ageRange: '+18',
    instagram: '@clubdellago',
    description:
      'Electrónica y techno a orillas del lago. Visualmente impresionante con mapping y luces láser.',
  },
  {
    id: 'e22',
    title: 'Nirvana All Night — Nirvana Club',
    venue: 'Nirvana Club',
    city: 'Punta del Este',
    neighborhood: 'Punta del Este Centro',
    category: 'Boliche',
    ageRange: '+18',
    instagram: '@nirvanacpde',
    description:
      'Dos pisos: electrónica arriba, perreo abajo. DJ invitado de Buenos Aires. Puertas 00h.',
  },

  // ── EVENTOS CANELONES ──
  {
    id: 'e23',
    title: 'Fiesta de Verano — Splash Beach',
    venue: 'Splash Beach',
    city: 'Canelones',
    neighborhood: 'Atlántida',
    category: 'Boliche',
    ageRange: '+18',
    instagram: '@splashbeachuruguay',
    description:
      'Electrónica y reggaeton con pies en la arena. Acceso desde la rambla. Estacionamiento gratuito.',
  },
  {
    id: 'e24',
    title: 'Noche de Cumbia — El Cambalache',
    venue: 'El Cambalache',
    city: 'Canelones',
    neighborhood: 'Las Piedras',
    category: 'Cumbia / RKT',
    ageRange: '+18',
    instagram: '@elcambalache',
    description:
      'Cumbia villera, rancherita y RKT. 3 salas. Combinación desde Montevideo a las 22h.',
  },

  // ── EVENTOS MALDONADO ──
  {
    id: 'e25',
    title: 'Rock Viernes — Point Bar',
    venue: 'Point Bar',
    city: 'Maldonado',
    neighborhood: 'Maldonado Centro',
    category: 'Rock / En Vivo',
    ageRange: '+18',
    instagram: '@pointbarmdo',
    description:
      'Viernes de rock en vivo con bandas locales. Pinta, buena gente y rock uruguayo de calidad.',
  },
  {
    id: 'e26',
    title: 'Fiesta de Piriápolis — Club Tropical',
    venue: 'Club Tropical',
    city: 'Maldonado',
    neighborhood: 'Piriápolis',
    category: 'Boliche',
    ageRange: '+18',
    instagram: '@clubtropicalpiri',
    description:
      'La gran fiesta costera de Piriápolis. Música tropical, electrónica y cumbia. Combo cena + entrada.',
  },

  // ── EVENTOS EXTRA ──
  {
    id: 'e27',
    title: 'Fiesta Neon — Lola Mora',
    venue: 'Lola Mora',
    city: 'Montevideo',
    neighborhood: 'Ciudad Vieja',
    category: 'Boliche',
    ageRange: '+18',
    instagram: '@lolamorabar',
    description:
      'Pintá tu cuerpo con pintura fluorescente y brillá en la pista. Kit de pintura incluido en la entrada.',
  },
  {
    id: 'e28',
    title: 'Jueves Estudiantil — La Ronda',
    venue: 'La Ronda',
    city: 'Montevideo',
    neighborhood: 'Cordón',
    category: 'Boliche',
    ageRange: '+18',
    instagram: '@larondamvd',
    description:
      'El jueves más barato de Montevideo. Entrada $100, trago $80. Promo para estudiantes con credencial.',
  },
  {
    id: 'e29',
    title: 'Apertura de Temporada Punta 2025',
    venue: 'OVO Beach Club',
    city: 'Punta del Este',
    neighborhood: 'Playa Brava',
    category: 'Electrónica',
    ageRange: '+21',
    instagram: '@ovobeachclub',
    description:
      'El evento que todos esperan para inaugurar el verano. Capacidad: 2000 personas. Venta anticipada obligatoria.',
  },
  {
    id: 'e30',
    title: 'Noche de Folklore — Cine Universitario',
    venue: 'Cine Universitario',
    city: 'Montevideo',
    neighborhood: 'Cordón',
    category: 'Rock / En Vivo',
    ageRange: '+18',
    instagram: '@cineuniversitario',
    description:
      'Homenaje al folklore rioplatense. Murga, candombe y milonga. Entrada: $300 anticipada, $400 en puerta.',
  },
];



// ─── COMPONENTE COPIADOR ─────────────────────────────────────────────────────

function CopyButton({ value, label = '' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    Clipboard.setString(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [value]);

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`Copiar ${label}`}
      onPress={handleCopy}
      style={[styles.copyButton, copied && styles.copyButtonDone]}
    >
      <Text style={[styles.copyButtonText, copied && styles.copyButtonTextDone]}>
        {copied ? '✓ Copiado' : 'Copiar'}
      </Text>
    </TouchableOpacity>
  );
}

// ─── CAMPO COPIABLE ──────────────────────────────────────────────────────────

function CopyField({ label, value }) {
  if (!value) return null;
  return (
    <View style={styles.fieldRow}>
      <View style={styles.fieldMeta}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>{value}</Text>
      </View>
      <CopyButton value={value} label={label} />
    </View>
  );
}

// ─── TARJETA DE BOLICHE ───────────────────────────────────────────────────────

function ClubCard({ item, onUseForEvent }) {
  const [expanded, setExpanded] = useState(false);

  const fullText = [
    `🏠 ${item.name}`,
    `Ciudad: ${item.city}`,
    item.neighborhood && `Barrio: ${item.neighborhood}`,
    item.address && `Dirección: ${item.address}`,
    item.phone && `Teléfono: ${item.phone}`,
    item.instagram && `Instagram: ${item.instagram}`,
    item.description && `Descripción: ${item.description}`,
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <View style={styles.card}>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => setExpanded((v) => !v)}
        style={styles.cardHeader}
        activeOpacity={0.75}
      >
        <View style={styles.cardIcon}>
          <Text style={styles.cardIconEmoji}>{getEmoji(item.category)}</Text>
        </View>
        <View style={styles.cardTitleBlock}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardSub}>{[item.neighborhood, item.city].filter(Boolean).join(' · ')}</Text>
          <Text style={styles.cardCategory}>{item.category}</Text>
        </View>
        <View style={styles.cardHeaderRight}>
          <CopyButton value={fullText} label={`datos de ${item.name}`} />
          <Text style={styles.cardChevron}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {expanded ? (
        <View style={styles.cardBody}>
          <CopyField label="Nombre" value={item.name} />
          <CopyField label="Ciudad" value={item.city} />
          <CopyField label="Barrio" value={item.neighborhood} />
          <CopyField label="Dirección" value={item.address} />
          <CopyField label="Teléfono" value={item.phone} />
          <CopyField label="Instagram" value={item.instagram} />
          <CopyField label="Categoría" value={item.category} />
          <CopyField label="Descripción" value={item.description} />
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={() => shareWhatsApp(fullText)}
              accessibilityRole="button"
            >
              <Text style={styles.quickActionText}>📤 WhatsApp</Text>
            </TouchableOpacity>
            {onUseForEvent ? (
              <TouchableOpacity
                style={[styles.quickActionBtn, styles.quickActionPrimary]}
                onPress={() => onUseForEvent({
                  venue: item.name,
                  city: item.city,
                  neighborhood: item.neighborhood,
                  category: item.category,
                  instagram: item.instagram,
                })}
                accessibilityRole="button"
              >
                <Text style={styles.quickActionPrimaryText}>⚡ Usar para evento</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

// ─── TARJETA DE EVENTO ────────────────────────────────────────────────────────

function EventCard({ item, onUseForEvent }) {
  const [expanded, setExpanded] = useState(false);

  const fullText = [
    `🎉 ${item.title}`,
    `Boliche / Local: ${item.venue}`,
    `Ciudad: ${item.city}`,
    item.neighborhood && `Barrio: ${item.neighborhood}`,
    `Categoría: ${item.category}`,
    `Edad mínima: ${item.ageRange}`,
    item.instagram && `Instagram: ${item.instagram}`,
    item.description && `Descripción: ${item.description}`,
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <View style={styles.card}>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => setExpanded((v) => !v)}
        style={styles.cardHeader}
        activeOpacity={0.75}
      >
        <View style={[styles.cardIcon, styles.cardIconEvent]}>
          <Text style={styles.cardIconEmoji}>{getEmoji(item.category)}</Text>
        </View>
        <View style={styles.cardTitleBlock}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardSub}>{item.venue} · {item.city}</Text>
          <Text style={styles.cardCategory}>{item.ageRange} · {item.category}</Text>
        </View>
        <View style={styles.cardHeaderRight}>
          <CopyButton value={fullText} label={`datos de ${item.title}`} />
          <Text style={styles.cardChevron}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {expanded ? (
        <View style={styles.cardBody}>
          <CopyField label="Nombre del evento" value={item.title} />
          <CopyField label="Boliche / Local" value={item.venue} />
          <CopyField label="Ciudad" value={item.city} />
          <CopyField label="Barrio" value={item.neighborhood} />
          <CopyField label="Categoría" value={item.category} />
          <CopyField label="Edad mínima" value={item.ageRange} />
          <CopyField label="Instagram" value={item.instagram} />
          <CopyField label="Descripción" value={item.description} />
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={() => shareWhatsApp(fullText)}
              accessibilityRole="button"
            >
              <Text style={styles.quickActionText}>📤 WhatsApp</Text>
            </TouchableOpacity>
            {onUseForEvent ? (
              <TouchableOpacity
                style={[styles.quickActionBtn, styles.quickActionPrimary]}
                onPress={() => onUseForEvent({
                  title: item.title,
                  venue: item.venue,
                  city: item.city,
                  neighborhood: item.neighborhood,
                  category: item.category,
                  instagram: item.instagram,
                  description: item.description,
                })}
                accessibilityRole="button"
              >
                <Text style={styles.quickActionPrimaryText}>⚡ Usar este evento</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

// ─── PANTALLA PRINCIPAL ───────────────────────────────────────────────────────

export default function DataBankScreen({ onBack, isAdmin, isAuthenticated, onUseForEvent, onSignIn }) {
  const [activeTab, setActiveTab] = useState('Boliches');
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('Todas');

  const cities = useMemo(() => {
    const src = activeTab === 'Boliches' ? CLUBS_DATA : EVENTS_DATA;
    return ['Todas', ...new Set(src.map((item) => item.city))];
  }, [activeTab]);

  const filtered = useMemo(() => {
    const src = activeTab === 'Boliches' ? CLUBS_DATA : EVENTS_DATA;
    const q = search.trim().toLowerCase();
    return src.filter((item) => {
      const matchCity = cityFilter === 'Todas' || item.city === cityFilter;
      if (!q) return matchCity;
      const haystack = [
        item.name || item.title,
        item.city,
        item.neighborhood,
        item.category,
        item.description,
        item.venue,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return matchCity && haystack.includes(q);
    });
  }, [activeTab, search, cityFilter]);

  const copyAll = useCallback(() => {
    const src = activeTab === 'Boliches' ? CLUBS_DATA : EVENTS_DATA;
    const text = src
      .map((item) =>
        activeTab === 'Boliches'
          ? [
              `── ${item.name} ──`,
              `Ciudad: ${item.city}`,
              item.neighborhood && `Barrio: ${item.neighborhood}`,
              item.address && `Dirección: ${item.address}`,
              item.phone && `Teléfono: ${item.phone}`,
              item.instagram && `Instagram: ${item.instagram}`,
              item.description && `Descripción: ${item.description}`,
            ]
              .filter(Boolean)
              .join('\n')
          : [
              `── ${item.title} ──`,
              `Boliche: ${item.venue}`,
              `Ciudad: ${item.city}`,
              item.neighborhood && `Barrio: ${item.neighborhood}`,
              `Categoría: ${item.category}`,
              `Edad: ${item.ageRange}`,
              item.instagram && `Instagram: ${item.instagram}`,
              item.description && `Descripción: ${item.description}`,
            ]
              .filter(Boolean)
              .join('\n')
      )
      .join('\n\n');

    Clipboard.setString(text);
    Alert.alert('¡Copiado!', `Se copiaron todos los ${src.length} ${activeTab.toLowerCase()} al portapapeles.`);
  }, [activeTab]);

  const renderItem = useCallback(
    ({ item }) =>
      activeTab === 'Boliches'
        ? <ClubCard item={item} onUseForEvent={onUseForEvent} />
        : <EventCard item={item} onUseForEvent={onUseForEvent} />,
    [activeTab, onUseForEvent]
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={onBack}
          style={styles.backButton}
        >
          <Text style={styles.backText}>‹  Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Banco de Datos</Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Copiar todos"
          onPress={copyAll}
          style={styles.copyAllButton}
        >
          <Text style={styles.copyAllText}>Copiar todo</Text>
        </TouchableOpacity>
      </View>

      {/* Banner admin */}
      {isAuthenticated && onUseForEvent ? (
        <View style={styles.adminBanner}>
          <Text style={styles.adminBannerText}>{'⚡ Expandí una tarjeta y tocá "Usar para evento" para pre-cargar el formulario'}</Text>
        </View>
      ) : !isAuthenticated ? (
        <TouchableOpacity style={styles.loginBanner} onPress={onSignIn}>
          <Text style={styles.loginBannerText}>🔒 Iniciá sesión para usar los datos en el formulario</Text>
        </TouchableOpacity>
      ) : null}

      {/* Tabs */}
      <View style={styles.tabRow}>
        {['Boliches', 'Eventos'].map((tab) => (
          <TouchableOpacity
            key={tab}
            accessibilityRole="button"
            accessibilityState={{ selected: activeTab === tab }}
            onPress={() => {
              setActiveTab(tab);
              setSearch('');
              setCityFilter('Todas');
            }}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'Boliches' ? '♫ Boliches' : '✦ Eventos'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Buscador */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre, barrio, categoría…"
          placeholderTextColor="#64748B"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {/* Filtro por ciudad */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cityChips}
        keyboardShouldPersistTaps="handled"
      >
        {cities.map((c) => (
          <TouchableOpacity
            key={c}
            accessibilityRole="button"
            accessibilityState={{ selected: cityFilter === c }}
            onPress={() => setCityFilter(c)}
            style={[styles.cityChip, cityFilter === c && styles.cityChipActive]}
          >
            <Text style={[styles.cityChipText, cityFilter === c && styles.cityChipTextActive]}>
              {c}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Contador */}
      <Text style={styles.counter}>
        {filtered.length} {activeTab.toLowerCase()}
        {search ? ` para "${search}"` : ''}
      </Text>

      {/* Lista */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✦</Text>
            <Text style={styles.emptyText}>No encontramos resultados.</Text>
            <Text style={styles.emptyHint}>Probá otro término o limpiá el buscador.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

// ─── ESTILOS ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1020' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomColor: '#1E2D44',
    borderBottomWidth: 1,
  },
  backButton: { minWidth: 60, minHeight: 44, justifyContent: 'center' },
  backText: { color: '#FDA4B3', fontSize: 14, fontWeight: '700' },
  headerTitle: { color: '#F8FAFC', fontSize: 17, fontWeight: '900', letterSpacing: 0.5 },
  copyAllButton: {
    minHeight: 36,
    justifyContent: 'center',
    backgroundColor: '#FF5573',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  copyAllText: { color: '#FFF', fontSize: 12, fontWeight: '800' },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 10,
  },
  tab: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#131A2B',
    borderColor: '#202B40',
    borderWidth: 1,
    borderRadius: 12,
  },
  tabActive: { backgroundColor: '#FF5573', borderColor: '#FF5573' },
  tabText: { color: '#94A3B8', fontSize: 14, fontWeight: '700' },
  tabTextActive: { color: '#FFF', fontWeight: '900' },

  // Search
  searchRow: { paddingHorizontal: 16, paddingTop: 12 },
  searchInput: {
    minHeight: 46,
    backgroundColor: '#131A2B',
    borderColor: '#2A3850',
    borderWidth: 1,
    borderRadius: 14,
    color: '#FFF',
    fontSize: 14,
    paddingHorizontal: 14,
  },

  // City chips
  cityChips: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  cityChip: {
    minHeight: 34,
    justifyContent: 'center',
    backgroundColor: '#1C2639',
    borderColor: '#2A3850',
    borderWidth: 1,
    borderRadius: 17,
    paddingHorizontal: 13,
  },
  cityChipActive: { backgroundColor: '#FF5573', borderColor: '#FF5573' },
  cityChipText: { color: '#CFD6E4', fontSize: 12, fontWeight: '600' },
  cityChipTextActive: { color: '#FFF', fontWeight: '800' },

  // Counter
  counter: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 18,
    marginBottom: 6,
  },

  // List
  listContent: { paddingHorizontal: 16, paddingBottom: 32 },

  // Admin banners
  adminBanner: {
    marginHorizontal: 16, marginTop: 10,
    backgroundColor: '#1A2D1A', borderColor: '#2A5A2A', borderWidth: 1,
    borderRadius: 10, padding: 10,
  },
  adminBannerText: { color: '#86EFAC', fontSize: 11, fontWeight: '700', lineHeight: 16 },
  loginBanner: {
    marginHorizontal: 16, marginTop: 10,
    backgroundColor: '#1A1A2D', borderColor: '#2A2A5A', borderWidth: 1,
    borderRadius: 10, padding: 10,
  },
  loginBannerText: { color: '#A5B4FC', fontSize: 11, fontWeight: '700', lineHeight: 16 },

  // Card
  card: {
    backgroundColor: '#131A2B',
    borderColor: '#202B40',
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 10,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  cardIcon: {
    width: 44, height: 44,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#211B37', borderRadius: 13,
  },
  cardIconEvent: { backgroundColor: '#1A2B1A' },
  cardIconEmoji: { fontSize: 22 },
  cardTitleBlock: { flex: 1 },
  cardTitle: { color: '#F8FAFC', fontSize: 14, fontWeight: '800' },
  cardSub: { color: '#94A3B8', fontSize: 11, marginTop: 2 },
  cardCategory: { color: '#FF9AAB', fontSize: 10, fontWeight: '700', marginTop: 3 },
  cardHeaderRight: { alignItems: 'center', gap: 4 },
  cardChevron: { color: '#64748B', fontSize: 10, marginTop: 2 },

  // Quick actions
  quickActions: {
    flexDirection: 'row', gap: 8,
    marginTop: 12, paddingTop: 10,
    borderTopColor: '#1A2338', borderTopWidth: 1,
  },
  quickActionBtn: {
    flex: 1, minHeight: 38,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1A2D44', borderColor: '#2A4260',
    borderWidth: 1, borderRadius: 10,
  },
  quickActionPrimary: { backgroundColor: '#FF5573', borderColor: '#FF5573' },
  quickActionText: { color: '#7DD3FC', fontSize: 12, fontWeight: '800' },
  quickActionPrimaryText: { color: '#FFF', fontSize: 12, fontWeight: '900' },

  // Card body (expanded)
  cardBody: {
    borderTopColor: '#202B40',
    borderTopWidth: 1,
    paddingHorizontal: 14,
    paddingBottom: 12,
    paddingTop: 4,
  },

  // Field row
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomColor: '#1A2338',
    borderBottomWidth: 1,
    gap: 8,
  },
  fieldMeta: { flex: 1 },
  fieldLabel: { color: '#64748B', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldValue: { color: '#E2E8F0', fontSize: 13, marginTop: 2, lineHeight: 18 },

  // Copy button
  copyButton: {
    minHeight: 30,
    justifyContent: 'center',
    backgroundColor: '#1C2D44',
    borderColor: '#2A4260',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  copyButtonDone: { backgroundColor: '#1A3A2A', borderColor: '#2A6040' },
  copyButtonText: { color: '#7DD3FC', fontSize: 11, fontWeight: '800' },
  copyButtonTextDone: { color: '#86EFAC' },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { color: '#FF9AAB', fontSize: 28, marginBottom: 10 },
  emptyText: { color: '#F8FAFC', fontSize: 15, fontWeight: '800' },
  emptyHint: { color: '#94A3B8', fontSize: 12, marginTop: 6 },
});
