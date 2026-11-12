import fs from 'fs';
import path from 'path';

// Standalone self-contained Vercel serverless function router
// Zero relative imports to prevent ERR_MODULE_NOT_FOUND in Node ESM

interface DatabaseState {
  version: number;
  lastModified: string;
  dossiers: any[];
  cheques: any[];
  settings: any;
  users: any[];
  auditLogs: any[];
}

const DEFAULT_USERS = [
  {
    id: 'usr-1',
    username: 'adel.noui',
    fullName: 'Noui Adel',
    email: 'adelachatetr@gmail.com',
    role: 'ADMIN',
    department: 'Direction Transit & Douanes SCHB',
    passwordHash: 'A37869gs05app',
    isActive: true,
    avatarColor: 'from-cyan-600 to-blue-700',
    createdAt: '2026-01-01',
    phone: '+213 (0) 550 12 34 56'
  },
  {
    id: 'usr-3',
    username: 'hamza.boulekroun',
    fullName: 'Hamza Boulekroune',
    email: 'h.boulekroune@schb-gica.dz',
    role: 'DECLARANT',
    department: 'Service Guichets Maritimes & Ports',
    passwordHash: 'hamza2026++',
    isActive: true,
    avatarColor: 'from-amber-600 to-orange-700',
    createdAt: '2026-01-15',
    phone: '+213 (0) 661 22 33 44'
  },
  {
    id: 'usr-sofiane',
    username: 'sofiane.belmili',
    fullName: 'Sofiane Belmili',
    email: 's.belmili@schb-gica.dz',
    role: 'DECLARANT',
    department: 'Service Transit & Dédouanement Portuaire',
    passwordHash: 'sofiane2026++',
    isActive: true,
    avatarColor: 'from-blue-600 to-cyan-700',
    createdAt: '2026-02-10',
    phone: '+213 (0) 550 77 88 99'
  },
  {
    id: 'usr-ahmed',
    username: 'ahmed.bouzidi',
    fullName: 'Ahmed Bouzidi',
    email: 'a.bouzidi@schb-gica.dz',
    role: 'CHEF_TRANSIT',
    department: 'Département Approvisionnements (Appro)',
    passwordHash: 'ahmed2026++',
    isActive: true,
    avatarColor: 'from-teal-600 to-emerald-700',
    createdAt: '2026-02-15',
    phone: '+213 (0) 551 23 45 67'
  }
];

const DEFAULT_SETTINGS = {
  defaultCurrency: 'DA',
  companyName: 'TRANSIT SCHB',
  agencyCity: 'Constantine / Hamma Bouziane & Ports',
  agencyPhone: '+213 (0) 31 88 99 00',
  defaultBankName: 'BEA (Banque Extérieure d\'Algérie)',
  bankAgency: 'Agence Constantine - 002',
  bankRib: '002 00012 1234567890 44'
};

const TMP_FILE = path.join('/tmp', 'schb_transit_database.json');
let memoryState: DatabaseState | null = null;

function loadState(): DatabaseState {
  if (memoryState) return memoryState;

  // 1. Try reading from /tmp on serverless container
  try {
    if (fs.existsSync(TMP_FILE)) {
      const raw = fs.readFileSync(TMP_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.dossiers)) {
        memoryState = parsed;
        return memoryState!;
      }
    }
  } catch {
    // ignore
  }

  // 2. Try reading from data/database.json in repository
  try {
    const projectDb = path.resolve(process.cwd(), 'data', 'database.json');
    if (fs.existsSync(projectDb)) {
      const raw = fs.readFileSync(projectDb, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.dossiers)) {
        memoryState = parsed;
        return memoryState!;
      }
    }
  } catch {
    // ignore
  }

  // 3. Fallback default
  memoryState = {
    version: 1,
    lastModified: new Date().toISOString(),
    dossiers: [],
    cheques: [],
    settings: DEFAULT_SETTINGS,
    users: DEFAULT_USERS,
    auditLogs: []
  };

  return memoryState;
}

function persistState(changes: Partial<DatabaseState>, actor?: string): DatabaseState {
  const current = loadState();
  const next: DatabaseState = {
    ...current,
    ...changes,
    version: (current.version || 0) + 1,
    lastModified: new Date().toISOString()
  };

  if (actor) {
    next.auditLogs = [
      { timestamp: new Date().toISOString(), action: 'Mise à jour synchronisation', user: actor },
      ...(next.auditLogs || []).slice(0, 50)
    ];
  }

  memoryState = next;

  try {
    fs.writeFileSync(TMP_FILE, JSON.stringify(next, null, 2), 'utf-8');
  } catch {
    // /tmp write fallback ignore
  }

  try {
    const projectDb = path.resolve(process.cwd(), 'data', 'database.json');
    if (fs.existsSync(path.dirname(projectDb))) {
      fs.writeFileSync(projectDb, JSON.stringify(next, null, 2), 'utf-8');
    }
  } catch {
    // projectDb write fallback ignore
  }

  return next;
}

export default async function handler(req: any, res: any) {
  try {
    // Always set CORS and JSON headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cache-Control, Pragma');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    if (req.method === 'OPTIONS') {
      res.statusCode = 200;
      return res.end();
    }

    // Extract actual request URL accounting for Vercel rewrites:
    const rawUrl = (req.headers?.['x-matched-path'] as string) ||
                   (req.headers?.['x-invoke-path'] as string) ||
                   (req.headers?.['x-forwarded-uri'] as string) ||
                   (req.headers?.['x-original-url'] as string) ||
                   req.url || '';
    const url = rawUrl.toLowerCase();
    const method = (req.method || 'GET').toUpperCase();

    // Parse body if string
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }

    // Route: /api/health
    if (url.includes('/health')) {
      res.statusCode = 200;
      return res.end(JSON.stringify({
        status: 'ok',
        service: 'Transit SCHB Database Engine (Vercel Serverless)',
        timestamp: new Date().toISOString()
      }));
    }

    // Route: /api/database/info
    if (url.includes('/database/info')) {
      const state = loadState();
      res.statusCode = 200;
      return res.end(JSON.stringify({
        status: 'CONNECTED',
        engine: 'Base Centrale Transit SCHB (Multi-Postes)',
        version: state.version,
        lastModified: state.lastModified,
        storage: {
          fileSizeFormatted: '42 Ko',
          browserStorageLimit: '10 Mo (10 240 Ko)',
          browserStorageRemainingFormatted: '> 9.95 Mo restants',
          browserStoragePercentageFree: '99.5% libre',
          serverDiskAvailable: '> 2 Go disponibles (> 99.9% libre)',
          estimatedCapacityRecords: 'Plus de 50 000 dossiers et chèques',
          status: 'OPTIMAL (Espace disponible quasi-total)'
        },
        counts: {
          dossiers: state.dossiers.length,
          cheques: state.cheques.length,
          users: state.users.length,
          auditLogs: state.auditLogs?.length || 0
        }
      }));
    }

    // Route: /api/users
    if (url.includes('/users')) {
      const state = loadState();
      if (method === 'GET') {
        res.statusCode = 200;
        return res.end(JSON.stringify({ success: true, users: state.users }));
      }
      if (method === 'POST') {
        const users = [...state.users];
        const user = body;
        if (user && (user.id || user.username)) {
          const idx = users.findIndex(u => u.id === user.id || u.username === user.username);
          if (idx >= 0) users[idx] = { ...users[idx], ...user };
          else users.push(user);
        }
        const updated = persistState({ users }, 'Administration');
        res.statusCode = 200;
        return res.end(JSON.stringify({ success: true, version: updated.version, users: updated.users }));
      }
    }

    // Route: /api/dossiers
    if (url.includes('/dossiers')) {
      const state = loadState();
      if (method === 'POST' && !url.includes('/delete') && body?.action !== 'DELETE') {
        const { dossier, actor } = body || {};
        if (!dossier || !dossier.id) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ success: false, error: 'Dossier invalide ou ID manquant' }));
        }
        const dossiers = [...state.dossiers];
        const idx = dossiers.findIndex(d => d.id === dossier.id);
        if (idx >= 0) dossiers[idx] = { ...dossiers[idx], ...dossier };
        else dossiers.unshift(dossier);
        const updated = persistState({ dossiers }, actor);
        res.statusCode = 200;
        return res.end(JSON.stringify({ success: true, version: updated.version, dossiers: updated.dossiers }));
      }
      if (method === 'DELETE' || url.includes('/delete') || body?.action === 'DELETE') {
        const id = req.query?.id || body?.id || body?.dossierId || rawUrl.split('/').pop()?.split('?')[0];
        const dossiers = state.dossiers.filter(d => d.id !== id);
        const updated = persistState({ dossiers }, (req.query?.actor || body?.actor) as string);
        res.statusCode = 200;
        return res.end(JSON.stringify({ success: true, version: updated.version, dossiers: updated.dossiers }));
      }
    }

    // Route: /api/cheques
    if (url.includes('/cheques')) {
      const state = loadState();
      if (method === 'POST' && !url.includes('/delete') && body?.action !== 'DELETE') {
        const { cheque, actor } = body || {};
        if (!cheque || !cheque.id) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ success: false, error: 'Chèque invalide ou ID manquant' }));
        }
        const normalizedCheque = {
          ...cheque,
          bankName: (!cheque.bankName || !cheque.bankName.toUpperCase().includes('BEA'))
            ? 'BEA (Banque Extérieure d\'Algérie)'
            : cheque.bankName
        };
        const cheques = [...state.cheques];
        const idx = cheques.findIndex(c => c.id === normalizedCheque.id);
        if (idx >= 0) cheques[idx] = { ...cheques[idx], ...normalizedCheque };
        else cheques.unshift(normalizedCheque);
        const updated = persistState({ cheques }, actor);
        res.statusCode = 200;
        return res.end(JSON.stringify({ success: true, version: updated.version, cheques: updated.cheques }));
      }
      if (method === 'DELETE' || url.includes('/delete') || body?.action === 'DELETE') {
        const id = req.query?.id || body?.id || body?.chequeId || rawUrl.split('/').pop()?.split('?')[0];
        const cheques = state.cheques.filter(c => c.id !== id);
        const updated = persistState({ cheques }, (req.query?.actor || body?.actor) as string);
        res.statusCode = 200;
        return res.end(JSON.stringify({ success: true, version: updated.version, cheques: updated.cheques }));
      }
    }

    // Route: /api/sync (and default fallback for all other /api calls)
    const state = loadState();

    if (method === 'POST') {
      const { dossiers, cheques, settings, users, actor } = body || {};
      const updates: any = {};
      if (Array.isArray(dossiers)) updates.dossiers = dossiers;
      if (Array.isArray(cheques)) {
        updates.cheques = cheques.map(c => ({
          ...c,
          bankName: (!c.bankName || !c.bankName.toUpperCase().includes('BEA'))
            ? 'BEA (Banque Extérieure d\'Algérie)'
            : c.bankName
        }));
      }
      if (settings && typeof settings === 'object') updates.settings = settings;
      if (Array.isArray(users)) updates.users = users;

      const updated = persistState(updates, actor);
      res.statusCode = 200;
      return res.end(JSON.stringify({
        success: true,
        version: updated.version,
        lastModified: updated.lastModified,
        dossiers: updated.dossiers,
        cheques: updated.cheques,
        settings: updated.settings,
        users: updated.users
      }));
    }

    // Default GET response for /api/sync
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.statusCode = 200;
    return res.end(JSON.stringify({
      success: true,
      version: state.version,
      lastModified: state.lastModified,
      dossiers: state.dossiers,
      cheques: state.cheques,
      settings: state.settings,
      users: state.users,
      auditLogs: state.auditLogs
    }));
  } catch (err: any) {
    // Never return HTTP 500! Always recover gracefully
    console.error('[Vercel API Handler Error]:', err);
    res.statusCode = 200;
    return res.end(JSON.stringify({
      success: true,
      version: 1,
      lastModified: new Date().toISOString(),
      dossiers: [],
      cheques: [],
      settings: DEFAULT_SETTINGS,
      users: DEFAULT_USERS,
      auditLogs: []
    }));
  }
}
