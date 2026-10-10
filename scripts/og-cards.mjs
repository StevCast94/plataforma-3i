// Genera las tarjetas de vista previa (og:image) de grupo3i.com con la estética del hero.
// Uso: node make.mjs <carpeta de salida>
import puppeteer from 'puppeteer-core';
import fs from 'fs';

const OUT = process.argv[2];
const PUB = 'file:///C:/Users/Admin/Desktop/plataforma-3i/frontend/public';
const cld = (u, w = 1600) => u.replace('/upload/', `/upload/f_jpg,q_80,w_${w}/`);

const MV = cld('https://res.cloudinary.com/db3t73yas/image/upload/v1782175132/grupo3i/yufkwt3egbepie1jjfbx.jpg');
const IBIZA = cld('https://res.cloudinary.com/db3t73yas/image/upload/v1780476604/grupo3i/t8kifhi161qvh6vkjpxh.png');
const BOSQUE = cld('https://res.cloudinary.com/db3t73yas/image/upload/v1787623457/grupo3i/szzat1etcxe280jdtabj.jpg');

const cards = [
  {
    file: 'og-montanita-view.jpg', bg: MV, eyebrow: 'Manglaralto, Santa Elena', title: 'Montañita View',
    sub: 'Lotes con vista al mar · elige tu solar en el mapa interactivo',
    stats: [['Inversión desde', '$41,721', true], ['Tipo', 'Lotización'], ['Financiamiento', '0% · 24 meses']],
  },
  {
    file: 'og-ibiza.jpg', bg: IBIZA, eyebrow: 'Costa ecuatoriana', logo: `${PUB}/images/proyectos/ibiza/logo-light.svg`, title: 'Ibiza Condohotel',
    sub: 'Propiedad fraccionada a 300 m del mar: disfruta, gana plusvalía y hereda',
    stats: [['Inversión desde', '$12,000', true], ['Tipo', 'Condohotel'], ['Unidades', '17']],
  },
  {
    file: 'og-propuesta-montanita.jpg', bg: MV, eyebrow: 'Propuesta exclusiva de inversión', title: 'Montañita View',
    sub: 'Compra de la lotización, del Lobby o de ambos proyectos completos',
    stats: [['Modalidades', 'Lotización · Lobby · Ambos', true], ['Ubicación', 'Manglaralto, Santa Elena']],
  },
  {
    file: 'og-home.jpg', bg: `${PUB}/images/secciones/hero-home.jpg`, eyebrow: 'Grupo 3i · costa ecuatoriana', title: 'Invierte en un paraíso',
    sub: 'Propiedad fraccionada, lotes con vista al mar y experiencias premium',
    stats: [['Ibiza Condohotel desde', '$12,000', true], ['Montañita View desde', '$41,721', true]],
  },
  {
    file: 'og-proyectos.jpg', bg: MV, eyebrow: 'Grupo 3i', title: 'Nuestros proyectos',
    sub: 'Condohotel junto al mar y lotización con vista al mar en Santa Elena',
    stats: [['Ibiza Condohotel desde', '$12,000', true], ['Montañita View desde', '$41,721', true]],
  },
  {
    file: 'og-club.jpg', bg: `${PUB}/images/secciones/hero-club.jpg`, eyebrow: 'Grupo 3i', title: 'Club 3i',
    sub: 'Membresía de viajes, beneficios exclusivos y una comunidad de inversionistas',
    stats: [['Hoteles', 'hasta 70% de descuento', true], ['Membresía', 'Club de Viajes 3i']],
  },
  {
    file: 'og-viajes-club.jpg', bg: `${PUB}/images/secciones/hero-viajes.jpg`, eyebrow: 'Club de Viajes 3i', title: 'Viaja más, paga menos',
    sub: 'Descuentos en hoteles y experiencias en todo el mundo',
    stats: [['Hoteles', 'hasta 70% de descuento', true], ['Destinos', '120+ en el certificado anual']],
  },
  {
    file: 'og-refiere.jpg', bg: `${PUB}/images/secciones/hero-referidos.jpg`, eyebrow: 'Programa de referidos', title: 'Refiere y gana',
    sub: 'Gana comisiones recomendando los proyectos de Grupo 3i',
    stats: [['Ingreso', 'sin costo', true], ['Comisiones', 'en 2 niveles']],
  },
  {
    file: 'og-bosque.jpg', bg: BOSQUE, eyebrow: 'Manglaralto, Santa Elena', title: 'Bosque Montañita',
    sub: 'Adopta un árbol con tu nombre en un bosque que nunca se va a talar',
    stats: [['Adopción desde', '$25', true], ['Primera etapa', '520 árboles'], ['Cuidado incluido', '3 años']],
    green: true,
  },
];

// Tarjetas cuadradas para los mensajes de referido (WhatsApp las muestra más grandes).
const squares = [
  { file: 'og-camp-montanita.jpg', bg: MV, eyebrow: 'Manglaralto, Santa Elena', title: 'Montañita View', sub: 'Elige tu solar con vista al mar en el mapa interactivo', stats: [['Desde', '$41,721', true], ['Financiamiento', '24 cuotas sin intereses']] },
  { file: 'og-camp-ibiza.jpg', bg: IBIZA, eyebrow: 'Costa ecuatoriana', logo: `${PUB}/images/proyectos/ibiza/logo-light.svg`, title: 'Ibiza Condohotel', sub: 'Tu fracción a 300 m del mar: disfruta, gana plusvalía y hereda', stats: [['Desde', '$12,000', true], ['Tipo', 'Condohotel']] },
];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function html(c, w, h) {
  const square = w === h;
  const gold = c.green ? '#e3a81b' : '#c9a96e';
  const statHtml = c.stats
    .map(([l, v, hi], i) => `<div class="stat ${i ? 'sep' : ''}"><p class="l">${esc(l)}</p><p class="v ${hi ? 'hi' : ''}">${esc(v)}</p></div>`)
    .join('');
  return `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
*{margin:0;box-sizing:border-box}
body{width:${w}px;height:${h}px;overflow:hidden;font-family:Inter,sans-serif;color:#fff;background:#111}
.bg{position:absolute;inset:0;background:url('${c.bg}') center/cover}
.shade{position:absolute;inset:0;background:${square
    ? 'linear-gradient(180deg,rgba(0,0,0,.25) 0%,rgba(0,0,0,.55) 45%,rgba(0,0,0,.85) 100%)'
    : 'linear-gradient(90deg,rgba(0,0,0,.86) 0%,rgba(0,0,0,.62) 48%,rgba(0,0,0,.2) 100%)'}}
.brand{position:absolute;top:${square ? 56 : 40}px;right:${square ? 56 : 52}px;height:${square ? 40 : 34}px;opacity:.95}
.box{position:absolute;left:${square ? 70 : 64}px;${square ? 'right:70px;bottom:90px' : 'top:50%;transform:translateY(-50%);width:760px'};border-left:3px solid ${gold};padding-left:${square ? 36 : 34}px}
.eye{display:flex;align-items:center;gap:14px;font-size:${square ? 22 : 18}px;font-weight:600;letter-spacing:.3em;text-transform:uppercase;color:${gold}}
.eye:before{content:'';width:38px;height:2px;background:${gold}}
h1{font-family:'Playfair Display',serif;font-weight:700;font-size:${square ? 104 : 88}px;line-height:.98;margin-top:18px;text-shadow:0 2px 24px rgba(0,0,0,.5)}
.logo{height:${square ? 170 : 150}px;margin-top:18px;display:block}
.sub{font-size:${square ? 30 : 25}px;line-height:1.35;color:rgba(255,255,255,.88);margin-top:18px;max-width:${square ? 900 : 700}px}
.stats{display:flex;margin-top:${square ? 44 : 34}px}
.stat{padding-right:30px}.stat.sep{border-left:1px solid rgba(255,255,255,.25);padding-left:30px}
.l{font-size:${square ? 17 : 14}px;font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:rgba(255,255,255,.6)}
.v{font-family:'Playfair Display',serif;font-weight:700;font-size:${square ? 38 : 32}px;margin-top:6px}
.v.hi{color:${gold};font-size:${square ? 50 : 42}px}
</style></head><body>
<div class="bg"></div><div class="shade"></div>
<img class="brand" src="${PUB}/images/logotipo-light.svg">
<div class="box">
  <p class="eye">${esc(c.eyebrow)}</p>
  ${c.logo ? `<img class="logo" src="${c.logo}" alt="">` : `<h1>${esc(c.title)}</h1>`}
  <p class="sub">${esc(c.sub)}</p>
  <div class="stats">${statHtml}</div>
</div>
</body></html>`;
}

const b = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  args: ['--allow-file-access-from-files'],
});
fs.mkdirSync(OUT, { recursive: true });
for (const [list, w, h] of [[cards, 1200, 630], [squares, 1080, 1080]]) {
  for (const c of list) {
    const p = await b.newPage();
    await p.setViewport({ width: w, height: h });
    const tmp = `${OUT}/_${c.file}.html`;
    fs.writeFileSync(tmp, html(c, w, h));
    await p.goto('file:///' + tmp.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: `${OUT}/${c.file}`, type: 'jpeg', quality: 80 });
    fs.unlinkSync(tmp);
    console.log(c.file, fs.statSync(`${OUT}/${c.file}`).size);
    await p.close();
  }
}
await b.close();
