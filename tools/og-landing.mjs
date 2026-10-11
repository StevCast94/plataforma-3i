// Genera las tarjetas de vista previa de las páginas de aterrizaje (/l/:slug), ES y EN.
// Datos reales de grupo3i.com. Volver a correr si cambian precios o disponibilidad.
import puppeteer from 'puppeteer-core';
// Uso: npm i -g puppeteer-core (o en una carpeta temporal) y: node tools/og-landing.mjs
const OUT = new URL('../frontend/public/images/og/l/', import.meta.url).pathname.replace(/^/([A-Z]:)/, '$1');
const API = 'https://grupo3i.com/api';
const usd = (n) => '$' + Math.round(n).toLocaleString('en-US');
const projects = (await fetch(API + '/projects').then((r) => r.json()));
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const p = await b.newPage(); await p.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
for (const pr of projects) {
  const lots = await fetch(`${API}/projects/${pr.slug}/lots`).then((r) => r.json()).catch(() => []);
  const av = lots.filter((l) => l.status === 'AVAILABLE' && (l.kind ?? 'LOT') === 'LOT');
  const prices = av.map((l) => l.price).filter(Boolean);
  const min = prices.length ? Math.min(...prices) : pr.priceFrom;
  const area = av.map((l) => l.areaM2).filter(Boolean);
  for (const lang of ['es', 'en']) {
    const T = lang === 'en'
      ? { head: av.length ? 'Get prices and the lot plan' : 'Get prices and payment options', from: 'From', pay: '24 payments of', avail: 'Lots available', size: 'From', cta: 'Leave your WhatsApp →', units: pr.slug.includes('ibiza') ? 'Fractions from' : 'From' }
      : { head: av.length ? 'Recibe precios y el plano de solares' : 'Recibe precios y formas de pago', from: 'Desde', pay: '24 cuotas de', avail: 'Solares disponibles', size: 'Desde', cta: 'Déjanos tu WhatsApp →', units: pr.slug.includes('ibiza') ? 'Fracciones desde' : 'Desde' };
    const chips = [[T.units, usd(min), true]];
    if (av.length) chips.push([T.pay, usd(min * 0.7 / 24)], [T.avail, String(av.length)], [T.size, Math.round(Math.min(...area)) + ' m²']);
    const html = `<!doctype html><html><head><link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;600&display=swap" rel="stylesheet">
<style>*{margin:0;box-sizing:border-box}body{width:1200px;height:630px;font-family:Inter,sans-serif;color:#fff;position:relative;overflow:hidden;background:#1a1a1a}
.bg{position:absolute;inset:0;background:url('${pr.coverImage.replace('/upload/', '/upload/w_1400,q_auto/')}') center/cover}
.sh{position:absolute;inset:0;background:linear-gradient(90deg,rgba(26,26,26,.96) 0%,rgba(26,26,26,.85) 45%,rgba(26,26,26,.25) 100%)}
.c{position:absolute;left:64px;top:56px;right:64px;bottom:56px;display:flex;flex-direction:column}
.logo{height:34px;width:auto;align-self:flex-start}.k{margin-top:46px;font-size:15px;letter-spacing:.3em;text-transform:uppercase;color:#c9a96e;font-weight:600}
h1{font-family:'Playfair Display',serif;font-size:76px;line-height:1.02;margin-top:10px}.h{font-size:28px;margin-top:14px;color:rgba(255,255,255,.9)}
.chips{display:flex;gap:12px;margin-top:auto}.ch{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);border-radius:14px;padding:12px 18px}
.ch p{font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.65)}.ch b{display:block;font-family:'Playfair Display',serif;font-size:32px;margin-top:2px}.gold b{color:#c9a96e}
.cta{position:absolute;right:64px;bottom:64px;background:#c9a96e;color:#1a1a1a;font-weight:600;font-size:22px;padding:16px 26px;border-radius:999px}
.iso{position:absolute;right:64px;top:52px;width:46px;height:46px}</style></head><body>
<div class="bg"></div><div class="sh"></div>
<div class="c"><img class="logo" src="https://grupo3i.com/images/logotipo-light.svg"><p class="k">${pr.location ?? ''}</p><h1>${pr.name}</h1><p class="h">${T.head}</p>
<div class="chips">${chips.map(([l, v, g]) => `<div class="ch ${g ? 'gold' : ''}"><p>${l}</p><b>${v}</b></div>`).join('')}</div></div>
<div class="cta">${T.cta}</div><img class="iso" src="https://grupo3i.com/images/isotipo-light.svg"></body></html>`;
    await p.setContent(html, { waitUntil: 'load', timeout: 60000 }); await new Promise((r) => setTimeout(r, 1500));
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: `${OUT}/${pr.slug}-${lang}.jpg`, type: 'jpeg', quality: 85 });
    console.log('✓', pr.slug, lang);
  }
}
await b.close();
