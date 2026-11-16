// Revisa las ticketeras de Uruguay y lista los eventos que todavia NO estan en la base.
// Uso: node tools/scan-events/scan.mjs   (desde la raiz del proyecto)
// Solo lee: no escribe nada en la base. Los candidatos se verifican a mano antes de cargarlos.
import { chromium } from 'playwright-core';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const config = readFileSync(join(root, 'src', 'config', 'supabase.js'), 'utf8');
const supabaseUrl = config.match(/https:\/\/[\w-]+\.supabase\.co/)[0];
const key = config.match(/eyJ[\w.-]+|sb_publishable_[\w-]+/)[0];

const SOURCES = [
  { name: 'RedTickets', url: 'https://redtickets.uy/', link: /redtickets\.uy\/evento\/[^/]+\/\d+\/?$/ },
  { name: 'Tickantel', url: 'https://tickantel.com.uy/inicio/', link: /tickantel\.com\.uy\/ng\/espectaculo\/\d+/i },
  // Entraste no usa <a>: la cartelera viene embebida como JSON en la pagina.
  { name: 'Entraste', url: 'https://app.entraste.com/', embedded: true },
  { name: 'MiEntrada', url: 'https://www.mientrada.com.uy/', link: /mientrada\.com\.uy\/evento\//i },
  { name: 'CobraTicket', url: 'https://cobraticket.uy/', link: /cobraticket\.uy\/.*(evento|event)/i },
];
// Passline no se escanea: su listado de Uruguay esta detras de una verificacion anti-bots.
// Se revisa a mano en https://www.passline.com/ (filtrar por Uruguay).

// Lo que no es salida nocturna ni show (se puede ajustar).
const NOISE = /teatro|tour\b|visita|paseo|carrera|trail|torneo|campus|curso|taller|yoga|pesca|bus tur|reserva natural|cata de vinos|abono|obra\b|infantil/i;

const keyOf = (url) => {
  const clean = url.split('#')[0].split('?')[0].replace(/\/+$/, '').toLowerCase();
  const red = clean.match(/redtickets\.uy\/evento\/.*\/(\d+)$/);
  const tick = clean.match(/tickantel\.com\.uy\/ng\/espectaculo\/(\d+)/);
  const mie = clean.match(/mientrada\.com\.uy\/evento\/.*-(\d+)$/);
  const ent = clean.match(/entraste\.com\/(?:events|evento)\/([^/]+)$/);
  if (red) return `red:${red[1]}`;
  if (tick) return `tick:${tick[1]}`;
  if (mie) return `mie:${mie[1]}`;
  if (ent) return `ent:${ent[1]}`;
  return clean.replace(/^https?:\/\/(www\.)?/, '');
};

const titleFromUrl = (url) => decodeURIComponent(url.split('?')[0].replace(/\/+$/, '').split('/').filter((p) => !/^\d+$/.test(p)).pop() || '').replace(/-+/g, ' ');

const fetchKnown = async () => {
  const response = await fetch(`${supabaseUrl}/rest/v1/events?select=ticket_url&limit=2000`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!response.ok) throw new Error(`Supabase respondio ${response.status}`);
  const rows = await response.json();
  return new Set(rows.map((row) => row.ticket_url).filter(Boolean).map(keyOf));
};

const collect = async (context, source) => {
  const page = await context.newPage();
  try {
    await page.goto(source.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);
    for (let i = 0; i < 6; i += 1) {
      await page.mouse.wheel(0, 3000);
      await page.waitForTimeout(700);
    }
    if (source.embedded) {
      const html = (await page.content()).replace(/\\"/g, '"').replace(/\\u0026/g, '&');
      const items = [...html.matchAll(/"name":"([^"]+)","producer_name":"([^"]*)","producer_slug":"[^"]*","hide_producer_byline":(?:true|false),"name_seo":"([^"]+)"/g)];
      return items.map((m) => {
        const href = `https://app.entraste.com/events/${m[3]}`;
        return { href, text: `${m[1]} (${m[2]})`, key: keyOf(href) };
      });
    }
    const anchors = await page.evaluate(() => [...document.querySelectorAll('a[href]')].map((a) => ({
      href: a.href,
      text: (a.innerText || a.getAttribute('aria-label') || a.title || '').replace(/\s+/g, ' ').trim(),
    })));
    const seen = new Map();
    for (const anchor of anchors) {
      if (!source.link.test(anchor.href)) continue;
      const k = keyOf(anchor.href);
      const existing = seen.get(k);
      if (!existing || anchor.text.length > existing.text.length) seen.set(k, { ...anchor, key: k });
    }
    return [...seen.values()];
  } catch (error) {
    console.error(`  ! ${source.name}: ${error.message.split('\n')[0]}`);
    return [];
  } finally {
    await page.close();
  }
};

const seenPath = join(dirname(fileURLToPath(import.meta.url)), 'seen.json');
const seen = new Set(existsSync(seenPath) ? JSON.parse(readFileSync(seenPath, 'utf8')) : []);
// --baseline marca todo lo que hay hoy como ya revisado (sin listarlo la proxima vez).
// --baseline=RedTickets lo hace solo para una ticketera.
const baselineArg = process.argv.find((arg) => arg.startsWith('--baseline'));
const baselineOnly = baselineArg?.split('=')[1]?.toLowerCase();

const known = await fetchKnown();
console.log(`Eventos en la base: ${known.size}\n`);

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext({ locale: 'es-UY' });
let total = 0;
for (const source of SOURCES) {
  const found = await collect(context, source);
  const fresh = found.filter((item) => !known.has(item.key) && !seen.has(item.key));
  const relevant = fresh.filter((item) => !NOISE.test(item.text) && !NOISE.test(item.href));
  console.log(`== ${source.name}: ${found.length} en cartelera, ${fresh.length} nuevos, ${relevant.length} candidatos`);
  for (const item of relevant) console.log(`  - ${(item.text || titleFromUrl(item.href)).slice(0, 90)}\n    ${item.href}`);
  const baseline = baselineArg && (!baselineOnly || baselineOnly === source.name.toLowerCase());
  if (baseline) found.forEach((item) => seen.add(item.key));
  else fresh.forEach((item) => seen.add(item.key));
  total += relevant.length;
}
await browser.close();
writeFileSync(seenPath, JSON.stringify([...seen].sort(), null, 0));
console.log(`\nTotal de candidatos nuevos: ${total}`);


