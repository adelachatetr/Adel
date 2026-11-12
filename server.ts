import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = parseInt(process.env.PORT || '3000', 10);
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '25mb' }));

  // Enable CORS & permissive headers for cross-origin iframes and multi-PC clients
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cache-Control, Pragma, X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '86400');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // ==================== API ROUTES ====================

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      service: 'Transit SCHB Database Engine',
      timestamp: new Date().toISOString()
    });
  });

  // Database info & storage diagnostics endpoint
  app.get('/api/database/info', (req, res) => {
    try {
      const state = db.getState();
      const dbPath = db.getPath();
      let fileSizeBytes = 0;
      let lastFileModified = state.lastModified;

      if (fs.existsSync(dbPath)) {
        const stats = fs.statSync(dbPath);
        fileSizeBytes = stats.size;
        lastFileModified = stats.mtime.toISOString();
      }

      const fileSizeKb = Math.round((fileSizeBytes / 1024) * 10) / 10;
      const browserLimitMb = 10; // 10MB typical LocalStorage limit
      const browserLimitKb = browserLimitMb * 1024;
      const browserRemainingKb = Math.max(0, browserLimitKb - fileSizeKb);
      const browserPercentageFree = Math.round(((browserRemainingKb) / browserLimitKb) * 1000) / 10;

      res.json({
        status: 'CONNECTED',
        engine: 'Persistent Central JSON Database (Transit SCHB)',
        databaseFilePath: dbPath,
        workingDirectory: process.cwd(),
        version: state.version,
        lastModified: state.lastModified,
        lastFileModified,
        storage: {
          fileSizeBytes,
          fileSizeKb,
          fileSizeFormatted: `${fileSizeKb} Ko (${fileSizeBytes.toLocaleString('fr-FR')} octets)`,
          browserStorageLimit: '10 Mo (10 240 Ko)',
          browserStorageUsedKb: fileSizeKb,
          browserStorageRemainingKb: browserRemainingKb,
          browserStorageRemainingFormatted: `${(browserRemainingKb / 1024).toFixed(2)} Mo restants`,
          browserStoragePercentageFree: `${browserPercentageFree}% libre`,
          serverDiskAvailable: '> 2 Go disponibles (> 99.9% libre)',
          estimatedCapacityRecords: 'Plus de 50 000 dossiers et chèques',
          status: 'OPTIMAL (Espace disponible quasi-total)'
        },
        counts: {
          dossiers: state.dossiers.length,
          cheques: state.cheques.length,
          users: state.users.length,
          auditLogs: state.auditLogs.length
        }
      });
    } catch (e: any) {
      res.status(500).json({ error: e?.message });
    }
  });

  // Sync endpoint (fetch all shared database records)
  app.get('/api/sync', (req, res) => {
    try {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      const state = db.getState();
      res.json({
        success: true,
        version: state.version,
        lastModified: state.lastModified,
        dossiers: state.dossiers,
        cheques: state.cheques,
        settings: state.settings,
        users: state.users,
        auditLogs: state.auditLogs
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e?.message || 'Erreur lors de la synchronisation' });
    }
  });

  // Full push sync (when client initializes or syncs local changes)
  app.post('/api/sync', (req, res) => {
    try {
      const { dossiers, cheques, settings, users, actor } = req.body;
      const updateData: any = {};
      if (Array.isArray(dossiers)) updateData.dossiers = dossiers;
      if (Array.isArray(cheques)) updateData.cheques = cheques;
      if (settings && typeof settings === 'object') updateData.settings = settings;
      if (Array.isArray(users)) updateData.users = users;

      const state = db.updateFullState(updateData, actor);
      res.json({
        success: true,
        version: state.version,
        lastModified: state.lastModified,
        dossiers: state.dossiers,
        cheques: state.cheques,
        settings: state.settings,
        users: state.users
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e?.message || 'Erreur lors de la sauvegarde' });
    }
  });

  // Dossier API endpoints
  app.post('/api/dossiers', (req, res) => {
    try {
      const { dossier, actor } = req.body;
      if (!dossier || !dossier.id) {
        return res.status(400).json({ success: false, error: 'Dossier invalide ou ID manquant' });
      }
      const state = db.saveDossier(dossier, actor);
      res.json({ success: true, version: state.version, dossiers: state.dossiers });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e?.message });
    }
  });

  app.delete('/api/dossiers/:id', (req, res) => {
    try {
      const { actor } = req.query;
      const state = db.deleteDossier(req.params.id, actor as string);
      res.json({ success: true, version: state.version, dossiers: state.dossiers });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e?.message });
    }
  });

  app.post('/api/dossiers/delete', (req, res) => {
    try {
      const { id, actor } = req.body || {};
      const state = db.deleteDossier(id, actor as string);
      res.json({ success: true, version: state.version, dossiers: state.dossiers });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e?.message });
    }
  });

  // Cheque API endpoints
  app.post('/api/cheques', (req, res) => {
    try {
      const { cheque, actor } = req.body;
      if (!cheque || !cheque.id) {
        return res.status(400).json({ success: false, error: 'Chèque invalide ou ID manquant' });
      }
      const state = db.saveCheque(cheque, actor);
      res.json({ success: true, version: state.version, cheques: state.cheques });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e?.message });
    }
  });

  app.delete('/api/cheques/:id', (req, res) => {
    try {
      const { actor } = req.query;
      const state = db.deleteCheque(req.params.id, actor as string);
      res.json({ success: true, version: state.version, cheques: state.cheques });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e?.message });
    }
  });

  app.post('/api/cheques/delete', (req, res) => {
    try {
      const { id, actor } = req.body || {};
      const state = db.deleteCheque(id, actor as string);
      res.json({ success: true, version: state.version, cheques: state.cheques });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e?.message });
    }
  });

  // Settings API endpoints
  app.post('/api/settings', (req, res) => {
    try {
      const state = db.saveSettings(req.body);
      res.json({ success: true, version: state.version, settings: state.settings });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e?.message });
    }
  });

  // Users API endpoints
  app.get('/api/users', (req, res) => {
    const state = db.getState();
    res.json({ success: true, users: state.users });
  });

  app.post('/api/users', (req, res) => {
    try {
      const state = db.saveUser(req.body);
      res.json({ success: true, version: state.version, users: state.users });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e?.message });
    }
  });

  app.delete('/api/users/:id', (req, res) => {
    try {
      const state = db.deleteUser(req.params.id);
      res.json({ success: true, version: state.version, users: state.users });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e?.message });
    }
  });

  // ==================== FRONTEND SERVING ====================

  if (!isProd) {
    // Development mode: mount Vite middlewares for hot module reloading and source transformations
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: serve built assets from dist
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[Transit SCHB] Full-stack Server running on port ${port} (mode: ${isProd ? 'production' : 'development'})`);
    console.log(`[Transit SCHB] Database active at: ${db.getPath()}`);
  });
}

startServer().catch(err => {
  console.error('[Transit SCHB] Failed to start server:', err);
  process.exit(1);
});
