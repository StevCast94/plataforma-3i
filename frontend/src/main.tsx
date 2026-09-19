import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Enlaces antiguos con HashRouter (grupo3i.com/#/ruta?x=1) siguen circulando en
// WhatsApp, redes y comprobantes: se convierten a la URL limpia (grupo3i.com/ruta?x=1)
// antes de montar el router. Los anclas internas (#solar) no empiezan con "#/".
if (window.location.hash.startsWith('#/')) {
  window.history.replaceState(null, '', window.location.hash.slice(1));
}

// IMPORTANTE: el Router vive solo en App.tsx (BrowserRouter).
// No envolver aquí para evitar el bug de doble Router con React 19.
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Retira el splash de index.html una vez React ya pintó el primer frame.
// requestAnimationFrame x2 asegura que el DOM real (no solo el commit de React)
// ya esté pintado antes de empezar el fade-out.
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    document.getElementById('g3i-splash')?.setAttribute('data-hide', '');
    document.body.classList.add('g3i-ready');
  });
});

// PWA: registra el service worker mínimo (requerido para instalabilidad).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(() => {
      /* si falla, la app sigue funcionando normal, solo sin poder instalarse */
    });
  });
}
