// PDF de la propuesta: una lámina por página, A4 horizontal, desde grupo3i.com.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
// Uso (Chrome instalado + puppeteer-core): node tools/propuesta-pdf.mjs  → luego build y deploy.
const OUT=decodeURIComponent(new URL('../frontend/public/propuesta/', import.meta.url).pathname).replace(/^\/([A-Z]:)/,'$1');
fs.mkdirSync(OUT,{recursive:true});
const W=1280,H=905; // proporción A4 horizontal
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new'});
for (const lang of ['es','en']) {
  const p=await b.newPage(); await p.setViewport({width:W,height:H,deviceScaleFactor:2});
  await p.goto('https://grupo3i.com/',{waitUntil:'domcontentloaded'});
  await p.evaluate(()=>{localStorage.setItem('g3i_consent','necessary');localStorage.setItem('g3i_pwa_install_dismissed_until',String(Date.now()+864e8))});
  await p.goto(`https://grupo3i.com${lang==='en'?'/en':''}/publica-tu-proyecto/propuesta`,{waitUntil:'networkidle2'});
  await p.addStyleTag({content:'.fixed{display:none!important}'});
  await new Promise(r=>setTimeout(r,2500));
  const n=await p.evaluate(()=>document.querySelectorAll('.proposal-slide').length);
  const imgs=[];
  for (let i=0;i<n;i++){
    const el=(await p.$$('.proposal-slide'))[i];
    await el.scrollIntoView(); await new Promise(r=>setTimeout(r,700));
    const buf=await el.screenshot({type:'jpeg',quality:85});
    imgs.push('data:image/jpeg;base64,'+buf.toString('base64'));
  }
  const html=`<html><head><style>@page{size:297mm 210mm;margin:0}body{margin:0}div{width:297mm;height:210mm;page-break-after:always;display:flex;align-items:center;justify-content:center;overflow:hidden}img{width:100%;height:100%;object-fit:cover;object-position:top}</style></head><body>${imgs.map(s=>`<div><img src="${s}"></div>`).join('')}</body></html>`;
  const q=await b.newPage(); await q.setContent(html,{waitUntil:'load'});
  await q.pdf({path:`${OUT}/propuesta-grupo3i-${lang}.pdf`,width:'297mm',height:'210mm',printBackground:true});
  const heights=await p.evaluate(()=>[...document.querySelectorAll('.proposal-slide')].map(s=>Math.round(s.getBoundingClientRect().height)));
  console.log(lang,n,'alturas',heights.join(','));
  await p.close(); await q.close();
}
await b.close();
