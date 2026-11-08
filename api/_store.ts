import fs from 'fs';
import path from 'path';

export interface DatabaseState {
  version: number;
  lastModified: string;
  dossiers: any[];
  cheques: any[];
  settings: any;
  users: any[];
  auditLogs: any[];
}

const TMP_FILE = path.join('/tmp', 'transit_database.json');
let memoryState: DatabaseState | null = null;

export function getDatabaseState(): DatabaseState {
  if (memoryState) return memoryState;

  // Try reading from /tmp on serverless runtime
  try {
    if (fs.existsSync(TMP_FILE)) {
      const content = fs.readFileSync(TMP_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.dossiers)) {
        memoryState = parsed;
        return memoryState!;
      }
    }
  } catch {
    // ignore
  }

  // Try reading initial database from project data folder
  try {
    const projectDbPath = path.resolve(process.cwd(), 'data', 'database.json');
    if (fs.existsSync(projectDbPath)) {
      const content = fs.readFileSync(projectDbPath, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.dossiers)) {
        memoryState = parsed;
        return memoryState!;
      }
    }
  } catch {
    // ignore
  }

  // Fallback default state
  memoryState = {
    version: 1,
    lastModified: new Date().toISOString(),
    dossiers: [],
    cheques: [],
    settings: {
      defaultCurrency: 'DA',
      companyName: 'TRANSIT SCHB',
      agencyCity: 'Constantine / Hamma Bouziane & Ports',
      agencyPhone: '+213 (0) 31 88 99 00',
      defaultBankName: 'BEA (Banque Extérieure d\'Algérie)'
    },
    users: [],
    auditLogs: []
  };

  return memoryState;
}

export function saveDatabaseState(state: Partial<DatabaseState>, actor?: string): DatabaseState {
  const current = getDatabaseState();
  const updated: DatabaseState = {
    ...current,
    ...state,
    version: (current.version || 0) + 1,
    lastModified: new Date().toISOString()
  };

  if (actor) {
    updated.auditLogs = [
      { timestamp: new Date().toISOString(), action: 'Mise à jour synchronisation', user: actor },
      ...(updated.auditLogs || []).slice(0, 50)
    ];
  }

  memoryState = updated;

  try {
    fs.writeFileSync(TMP_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch {
    // /tmp write error ignore on readonly environments
  }

  return updated;
}

export function setCorsHeaders(res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cache-Control, Pragma');
}
