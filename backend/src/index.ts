import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { contentRoutes } from './routes/content';
import { contactRoutes } from './routes/contact';
import { projectRoutes } from './routes/projects';
import { productRoutes } from './routes/products';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

// Health check (útil para Railway)
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// API routes
app.use('/api/content', contentRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/products', productRoutes);

// Cualquier /api/* no encontrada -> 404 JSON (no cae al SPA fallback)
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

// Servir el frontend estático (build de Vite commiteado en frontend/dist)
const frontendPath = path.join(__dirname, '../../frontend/dist');
const hasBuild = fs.existsSync(path.join(frontendPath, 'index.html'));

if (hasBuild) {
  app.use(express.static(frontendPath));

  // SPA fallback -> todas las rutas no-API devuelven index.html
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
} else {
  console.warn(
    '⚠️  frontend/dist no encontrado. Ejecuta "cd frontend && npm run build".',
  );
}

app.listen(PORT, () => {
  console.log(`🚀 Plataforma 3i corriendo en puerto ${PORT}`);
});
