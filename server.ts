import express from 'express';
import path from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { initDatabase } from './src/server/db.ts';
import { authenticate } from './src/server/auth.ts';
import authRoutes from './src/server/routes/authRoutes.ts';
import userRoutes from './src/server/routes/userRoutes.ts';
import adminRoutes from './src/server/routes/adminRoutes.ts';
import publicRoutes from './src/server/routes/publicRoutes.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Initialize SQLite Database schema & seeds
  initDatabase();

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // Attach auth user context to request if token present
  app.use(authenticate as express.RequestHandler);

  // Serve static assets from src/assets
  const assetsPath = fs.existsSync(path.resolve(process.cwd(), 'src', 'assets'))
    ? path.resolve(process.cwd(), 'src', 'assets')
    : path.resolve(__dirname, 'src', 'assets');
  app.use('/src/assets', express.static(assetsPath));

  // API Route registrations
  app.use('/api/auth', authRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/public', publicRoutes);

  // Healthcheck endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // In dev: mount Vite middleware onto Express
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production: serve built client assets
    const clientPath = fs.existsSync(path.resolve(process.cwd(), 'dist', 'index.html'))
      ? path.resolve(process.cwd(), 'dist')
      : path.resolve(__dirname);

    if (fs.existsSync(clientPath)) {
      app.use(express.static(clientPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.resolve(clientPath, 'index.html'));
      });
    } else {
      console.warn('Production build dist folder not found. Run npm run build.');
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Noorani Poultry Farm Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
