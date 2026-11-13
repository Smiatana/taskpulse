import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

// 100% Offline Local Architecture:
// All NLP parsing, checklist groups, tasks, and timed notifications run locally on the device via client-side storage and Web APIs.
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', mode: 'offline-local', timestamp: new Date().toISOString() });
});

// Setup Vite middleware or static serving
const setupServer = async () => {
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TaskPulse Flutter server running at http://0.0.0.0:${PORT}`);
  });
};

setupServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
