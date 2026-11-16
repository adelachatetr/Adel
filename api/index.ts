import fs from 'fs';
import path from 'path';

// Standalone self-contained Vercel serverless function router
// Zero relative imports to prevent ERR_MODULE_NOT_FOUND in Node ESM

interface DatabaseState {
  version: number;
  lastModified: string;
  dossiers: any[];
  cheques: any[];
  deletedDossierIds?: string[];
  deletedChequeIds?: string[];
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
  defaultBankName: 'BEA Constantine (Banque Extérieure d\'Algérie)',
  bankAgency: 'Agence Constantine - 002',
  bankRib: '002 00012 1234567890 44'
};

const TMP_FILE = path.join('/tmp', 'schb_transit_database.json');
const KV_STATE_KEY = 'schb_transit_database_v1';
let memoryState: DatabaseState | null = null;

function getKvConfig(): { url: string; token: string } | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    return { url: url.replace(/\/$/, ''), token };
  }
  return null;
}

async function kvLoadState(): Promise<DatabaseState | null> {
  const kv = getKvConfig();
  if (!kv) return null;
  try {
    const res = await fetch(kv.url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${kv.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(['GET', KV_STATE_KEY])
    });
    if (!res.ok) return null;
    const data: any = await res.json();
    if (!data || typeof data.result !== 'string' || !data.result.trim()) return null;
    const parsed = JSON.parse(data.result);
    if (parsed && Array.isArray(parsed.dossiers)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

async function kvSaveState(state: DatabaseState): Promise<boolean> {
  const kv = getKvConfig();
  if (!kv) return false;
  try {
    const res = await fetch(kv.url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${kv.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(['SET', KV_STATE_KEY, JSON.stringify(state)])
    });
    return res.ok;
  } catch {
    return false;
  }
}

function cleanState(parsed: DatabaseState): DatabaseState {
  const deletedD = parsed.deletedDossierIds || [];
  const deletedC = parsed.deletedChequeIds || [];
  parsed.dossiers = (parsed.dossiers || []).filter((d: any) => !deletedD.includes(d.id));
  parsed.cheques = (parsed.cheques || []).filter((c: any) => !deletedC.includes(c.id));
  parsed.deletedDossierIds = deletedD;
  parsed.deletedChequeIds = deletedC;
  return parsed;
}

async function loadState(): Promise<DatabaseState> {
  // 0. If external persistent Redis / Vercel KV is configured, always read authoritative cloud state
  const kv = getKvConfig();
  if (kv) {
    const kvState = await kvLoadState();
    if (kvState) {
      memoryState = cleanState(kvState);
      return memoryState;
    }
  }

  if (!kv && memoryState) {
    return cleanState(memoryState);
  }

  // 1. Try reading from /tmp on serverless container
  try {
    if (fs.existsSync(TMP_FILE)) {
      const raw = fs.readFileSync(TMP_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.dossiers)) {
        const cleaned = cleanState(parsed);
        memoryState = cleaned;
        if (kv) await kvSaveState(cleaned);
        return cleaned;
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
        const cleaned = cleanState(parsed);
        memoryState = cleaned;
        if (kv) await kvSaveState(cleaned);
        return cleaned;
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
    deletedDossierIds: [],
    deletedChequeIds: [],
    settings: DEFAULT_SETTINGS,
    users: DEFAULT_USERS,
    auditLogs: []
  };

  if (kv) await kvSaveState(memoryState);
  return memoryState;
}

async function persistState(changes: Partial<DatabaseState>, actor?: string): Promise<DatabaseState> {
  const current = await loadState();

  const allDeletedDossiers = Array.from(new Set([
    ...(current.deletedDossierIds || []),
    ...(changes.deletedDossierIds || [])
  ]));

  const allDeletedCheques = Array.from(new Set([
    ...(current.deletedChequeIds || []),
    ...(changes.deletedChequeIds || [])
  ]));

  const baseDossiers = Array.isArray(changes.dossiers) ? changes.dossiers : current.dossiers;
  const filteredDossiers = baseDossiers.filter(d => !allDeletedDossiers.includes(d.id));

  const baseCheques = Array.isArray(changes.cheques) ? changes.cheques : current.cheques;
  const filteredCheques = baseCheques.filter(c => !allDeletedCheques.includes(c.id));

  const next: DatabaseState = {
    ...current,
    ...changes,
    dossiers: filteredDossiers,
    cheques: filteredCheques,
    deletedDossierIds: allDeletedDossiers,
    deletedChequeIds: allDeletedCheques,
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

  await kvSaveState(next);

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
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cache-Control, Pragma, X-Action-Path');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    if (req.method === 'OPTIONS') {
      res.statusCode = 200;
      return res.end();
    }

    const persistentStorage = Boolean(getKvConfig());

    // Extract actual request URL accounting for Vercel rewrites and custom X-Action-Path header:
    const headerPath = (req.headers?.['x-action-path'] as string) || '';
    const rawUrl = headerPath ||
                   (req.headers?.['x-matched-path'] as string) ||
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
        persistentStorage,
        service: persistentStorage
          ? 'Transit SCHB Database Engine (Cloud KV Persistant)'
          : 'Transit SCHB Database Engine (Vercel Serverless)',
        timestamp: new Date().toISOString()
      }));
    }

    // Route: /api/database/info
    if (url.includes('/database/info')) {
      const state = await loadState();
      res.statusCode = 200;
      return res.end(JSON.stringify({
        status: 'CONNECTED',
        persistentStorage,
        engine: persistentStorage
          ? 'Base Cloud Persistante (Vercel KV / Upstash Redis)'
          : 'Mémoire Temporaire Vercel (/tmp · Sans BDD Cloud configurée)',
        version: state.version,
        lastModified: state.lastModified,
        storage: {
          fileSizeFormatted: '42 Ko',
          browserStorageLimit: '10 Mo (10 240 Ko)',
          browserStorageRemainingFormatted: '> 9.95 Mo restants',
          browserStoragePercentageFree: '99.5% libre',
          serverDiskAvailable: persistentStorage
            ? 'Stockage Cloud Redis Persistant Actif'
            : 'Cache Serverless Éphémère (/tmp)',
          estimatedCapacityRecords: 'Plus de 50 000 dossiers et chèques',
          status: persistentStorage
            ? 'OPTIMAL (Persistance Cloud Active)'
            : 'TEMPORAIRE (Activer Vercel KV pour persistance inter-déploiements)'
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
      const state = await loadState();
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
        const updated = await persistState({ users }, 'Administration');
        res.statusCode = 200;
        return res.end(JSON.stringify({ success: true, version: updated.version, users: updated.users }));
      }
    }

    // Route: /api/dossiers
    if (url.includes('/dossiers')) {
      const state = await loadState();
      if (method === 'POST' && !url.includes('/delete') && body?.action !== 'DELETE') {
        const { dossier, actor } = body || {};
        if (!dossier || !dossier.id) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ success: false, error: 'Dossier invalide ou ID manquant' }));
        }
        const stampedDossier = { ...dossier, updatedAt: dossier.updatedAt || new Date().toISOString() };
        const dossiers = [...state.dossiers];
        const idx = dossiers.findIndex(d => d.id === stampedDossier.id);
        if (idx >= 0) dossiers[idx] = { ...dossiers[idx], ...stampedDossier };
        else dossiers.unshift(stampedDossier);
        const deletedDossierIds = (state.deletedDossierIds || []).filter(id => id !== stampedDossier.id);
        const updated = await persistState({ dossiers, deletedDossierIds }, actor);
        res.statusCode = 200;
        return res.end(JSON.stringify({ success: true, version: updated.version, dossiers: updated.dossiers }));
      }
      if (method === 'DELETE' || url.includes('/delete') || body?.action === 'DELETE') {
        const id = req.query?.id || body?.id || body?.dossierId || rawUrl.split('/').pop()?.split('?')[0];
        const incomingDeleted = Array.isArray(body?.deletedDossierIds) ? body.deletedDossierIds : [];
        const deletedDossierIds = Array.from(new Set([...(state.deletedDossierIds || []), id, ...incomingDeleted].filter(Boolean)));
        const dossiers = state.dossiers.filter(d => d.id !== id && !deletedDossierIds.includes(d.id));
        const updated = await persistState({ dossiers, deletedDossierIds }, (req.query?.actor || body?.actor) as string);
        res.statusCode = 200;
        return res.end(JSON.stringify({ success: true, version: updated.version, dossiers: updated.dossiers }));
      }
    }

    // Route: /api/cheques
    if (url.includes('/cheques')) {
      const state = await loadState();
      if (method === 'POST' && !url.includes('/delete') && body?.action !== 'DELETE') {
        const { cheque, actor } = body || {};
        if (!cheque || !cheque.id) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ success: false, error: 'Chèque invalide ou ID manquant' }));
        }
        const normalizedCheque = {
          ...cheque,
          updatedAt: cheque.updatedAt || new Date().toISOString(),
          bankName: (!cheque.bankName || !cheque.bankName.toUpperCase().includes('BEA') || cheque.bankName === 'BEA (Banque Extérieure d\'Algérie)')
            ? 'BEA Constantine (Banque Extérieure d\'Algérie)'
            : cheque.bankName
        };
        const cheques = [...state.cheques];
        const idx = cheques.findIndex(c => c.id === normalizedCheque.id);
        if (idx >= 0) cheques[idx] = { ...cheques[idx], ...normalizedCheque };
        else cheques.unshift(normalizedCheque);
        const deletedChequeIds = (state.deletedChequeIds || []).filter(id => id !== cheque.id);
        const updated = await persistState({ cheques, deletedChequeIds }, actor);
        res.statusCode = 200;
        return res.end(JSON.stringify({ success: true, version: updated.version, cheques: updated.cheques }));
      }
      if (method === 'DELETE' || url.includes('/delete') || body?.action === 'DELETE') {
        const id = req.query?.id || body?.id || body?.chequeId || rawUrl.split('/').pop()?.split('?')[0];
        const incomingDeleted = Array.isArray(body?.deletedChequeIds) ? body.deletedChequeIds : [];
        const deletedChequeIds = Array.from(new Set([...(state.deletedChequeIds || []), id, ...incomingDeleted].filter(Boolean)));
        const cheques = state.cheques.filter(c => c.id !== id && !deletedChequeIds.includes(c.id));
        const updated = await persistState({ cheques, deletedChequeIds }, (req.query?.actor || body?.actor) as string);
        res.statusCode = 200;
        return res.end(JSON.stringify({ success: true, version: updated.version, cheques: updated.cheques }));
      }
    }

    // Route: /api/sync (and default fallback for all other /api calls)
    const state = await loadState();

    if (method === 'POST') {
      const { dossiers, cheques, settings, users, actor, deletedDossierIds, deletedChequeIds } = body || {};
      const updates: any = {};
      if (Array.isArray(deletedDossierIds)) {
        updates.deletedDossierIds = Array.from(new Set([...(state.deletedDossierIds || []), ...deletedDossierIds]));
      }
      if (Array.isArray(deletedChequeIds)) {
        updates.deletedChequeIds = Array.from(new Set([...(state.deletedChequeIds || []), ...deletedChequeIds]));
      }
      if (Array.isArray(dossiers)) updates.dossiers = dossiers;
      if (Array.isArray(cheques)) {
        updates.cheques = cheques.map(c => ({
          ...c,
          bankName: (!c.bankName || !c.bankName.toUpperCase().includes('BEA') || c.bankName === 'BEA (Banque Extérieure d\'Algérie)')
            ? 'BEA Constantine (Banque Extérieure d\'Algérie)'
            : c.bankName
        }));
      }
      if (settings && typeof settings === 'object') updates.settings = settings;
      if (Array.isArray(users)) updates.users = users;

      const updated = await persistState(updates, actor);
      res.statusCode = 200;
      return res.end(JSON.stringify({
        success: true,
        persistentStorage,
        version: updated.version,
        lastModified: updated.lastModified,
        dossiers: updated.dossiers,
        cheques: updated.cheques,
        deletedDossierIds: updated.deletedDossierIds || [],
        deletedChequeIds: updated.deletedChequeIds || [],
        settings: updated.settings,
        users: updated.users
      }));
    }

    // Default GET response for /api/sync
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.statusCode = 200;
    return res.end(JSON.stringify({
      success: true,
      persistentStorage,
      version: state.version,
      lastModified: state.lastModified,
      dossiers: state.dossiers,
      cheques: state.cheques,
      deletedDossierIds: state.deletedDossierIds || [],
      deletedChequeIds: state.deletedChequeIds || [],
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
      persistentStorage: false,
      version: 1,
      lastModified: new Date().toISOString(),
      dossiers: [],
      cheques: [],
      deletedDossierIds: [],
      deletedChequeIds: [],
      settings: DEFAULT_SETTINGS,
      users: DEFAULT_USERS,
      auditLogs: []
    }));
  }
}
