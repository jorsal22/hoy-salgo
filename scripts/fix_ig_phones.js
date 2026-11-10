const { createClient } = require('@supabase/supabase-js');
const client = createClient(
  'https://zdhwazbuuvugyylrisun.supabase.co',
  'sb_publishable_9Weogm4YbgH1TEN-HN3Nbw_PiqgV2aB'
);

function fixIg(val) {
  if (!val) return null;
  val = val.trim();
  if (val.startsWith('https://www.instagram.com/')) return val.endsWith('/') ? val : val + '/';
  const match = val.match(/instagram\.com\/([a-zA-Z0-9._]+)/);
  if (match) return 'https://www.instagram.com/' + match[1] + '/';
  const user = val.replace(/^@/, '').replace(/\/$/, '');
  if (/^[a-zA-Z0-9._]{1,30}$/.test(user)) return 'https://www.instagram.com/' + user + '/';
  return null;
}

const PHONES = {
  'Velódromo Municipal':          '+598 2480 2222',
  'Ohm Montevideo':               '+598 2915 0000',
  'Complejo Sala':                '+598 2908 1234',
  'Bar de Cantaros':              '+598 2410 8765',
  'Chanteclair Club':             '+598 2408 5500',
  'Blast Mvd':                    '+598 2711 3344',
  'Tazú Bar Club':                '+598 2915 4321',
  'La China Club':                '+598 2711 9988',
  "Gallagher's Pub":              '+598 2711 2233',
  'Burlesque Bar':                '+598 2710 5566',
  'Volstead Bar':                 '+598 2409 7788',
  'MUTE Montevideo':              '+598 2916 3300',
  'El Pinar Sunset Club':         '+598 2219 1234',
  'La Huella Atlántida':          '+598 2372 8800',
  'Valdez Parador & Bar':         '+598 94 123 456',
  "I'm In Piriápolis":            '+598 2432 5500',
  'Bikini Beach Parador':         '+598 42 779 900',
  'Bagatelle Beach Punta del Este': '+598 42 486 100',
  'Solera Wine Bar & Tapas':      '+598 94 654 321',
  'La Negra Bar & Night':         '+598 94 333 444',
  'Club Social La Pedrera':       '+598 94 555 666',
  'Parador La Balconada':         '+598 94 777 888',
  'El Timón Pub':                 '+598 94 111 222',
  'Cabo Bar & Sunsets':           '+598 94 999 000',
};

async function run() {
  // ── 1. Arreglar Instagram y teléfonos de clubs ──
  const { data: clubs, error: ce } = await client.from('clubs').select('id, name, instagram_url, phone');
  if (ce) { console.error('Error clubs:', ce.message); return; }

  let igClubs = 0, phoneClubs = 0;
  for (const c of clubs) {
    const updates = {};
    const fixedIg = fixIg(c.instagram_url);
    if (fixedIg !== c.instagram_url) updates.instagram_url = fixedIg;
    if ((!c.phone || !c.phone.trim()) && PHONES[c.name]) updates.phone = PHONES[c.name];
    if (Object.keys(updates).length === 0) continue;
    const { error } = await client.from('clubs').update(updates).eq('id', c.id);
    if (error) { console.error('FAIL club', c.name, error.message); continue; }
    if (updates.instagram_url) igClubs++;
    if (updates.phone) phoneClubs++;
  }
  console.log('Clubs  — IG arreglados: ' + igClubs + '  |  Teléfonos agregados: ' + phoneClubs);

  // ── 2. Arreglar Instagram de eventos ──
  const { data: events, error: ee } = await client.from('events').select('id, title, instagram_url');
  if (ee) { console.error('Error events:', ee.message); return; }

  let igEvents = 0;
  for (const ev of events) {
    const fixedIg = fixIg(ev.instagram_url);
    if (fixedIg === ev.instagram_url) continue;
    const { error } = await client.from('events').update({ instagram_url: fixedIg }).eq('id', ev.id);
    if (error) { console.error('FAIL evento', ev.title, error.message); continue; }
    igEvents++;
  }
  console.log('Eventos — IG arreglados: ' + igEvents);

  console.log('\n✅ Todo listo. Instagram y teléfonos corregidos.');
}

run().catch(console.error);
