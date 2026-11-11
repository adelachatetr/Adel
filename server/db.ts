import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface DatabaseState {
  version: number;
  lastModified: string;
  dossiers: any[];
  cheques: any[];
  settings: any;
  users: any[];
  auditLogs: { timestamp: string; action: string; user?: string; details?: string }[];
}

const DATA_DIR = path.resolve(__dirname, '..', 'data');
const DB_PATH = path.resolve(DATA_DIR, 'database.json');
const BACKUP_PATH = path.resolve(DATA_DIR, 'database.backup.json');

// Default initial settings
const DEFAULT_SETTINGS = {
  defaultCurrency: 'DA',
  companyName: 'TRANSIT SCHB',
  agencyCity: 'Constantine / Hamma Bouziane & Ports',
  agencyPhone: '+213 (0) 31 88 99 00',
  defaultBankName: 'BEA (Banque Extérieure d\'Algérie)',
  bankAgency: 'Agence Constantine - 002',
  bankRib: '002 00012 1234567890 44'
};

// Default official 4 accounts
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

class DatabaseManager {
  private state: DatabaseState;
  private dbPath: string;

  constructor() {
    this.dbPath = DB_PATH;
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    this.state = this.loadFromDisk();
  }

  private loadFromDisk(): DatabaseState {
    try {
      if (fs.existsSync(this.dbPath)) {
        const raw = fs.readFileSync(this.dbPath, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.dossiers) && Array.isArray(parsed.cheques)) {
          console.log(`[Database] Loaded from ${this.dbPath} (${parsed.dossiers.length} dossiers, ${parsed.cheques.length} cheques)`);
          parsed.cheques = parsed.cheques.map((c: any) => ({
            ...c,
            bankName: (!c.bankName || !c.bankName.toUpperCase().includes('BEA'))
              ? 'BEA (Banque Extérieure d\'Algérie)'
              : c.bankName
          }));
          return parsed;
        }
      }
    } catch (e) {
      console.error(`[Database] Failed reading ${this.dbPath}, attempting backup`, e);
      try {
        if (fs.existsSync(BACKUP_PATH)) {
          const rawBackup = fs.readFileSync(BACKUP_PATH, 'utf8');
          return JSON.parse(rawBackup);
        }
      } catch (be) {
        console.error(`[Database] Backup read failed too`, be);
      }
    }

    // Default initial seed
    console.log(`[Database] Initializing new database at ${this.dbPath}`);
    const initial: DatabaseState = {
      version: 1,
      lastModified: new Date().toISOString(),
      dossiers: [],
      cheques: [],
      settings: DEFAULT_SETTINGS,
      users: DEFAULT_USERS,
      auditLogs: [
        {
          timestamp: new Date().toISOString(),
          action: 'INITIALISATION_BASE_DE_DONNEES',
          details: 'Base de données Transit SCHB initialisée avec succès'
        }
      ]
    };
    this.saveToDisk(initial);
    return initial;
  }

  private saveToDisk(state: DatabaseState): void {
    try {
      const serialized = JSON.stringify(state, null, 2);
      const tempPath = `${this.dbPath}.tmp`;
      fs.writeFileSync(tempPath, serialized, 'utf8');
      fs.renameSync(tempPath, this.dbPath);

      // Create backup copy asynchronously
      try {
        fs.copyFileSync(this.dbPath, BACKUP_PATH);
      } catch {}
    } catch (e) {
      console.error(`[Database] Failed saving to ${this.dbPath}`, e);
    }
  }

  public getPath(): string {
    return this.dbPath;
  }

  public getState(): DatabaseState {
    return this.state;
  }

  public updateFullState(newState: Partial<DatabaseState>, actor?: string): DatabaseState {
    const updatedDossiers = Array.isArray(newState.dossiers) ? newState.dossiers : this.state.dossiers;
    const rawCheques = Array.isArray(newState.cheques) ? newState.cheques : this.state.cheques;
    const updatedCheques = rawCheques.map(c => ({
      ...c,
      bankName: (!c.bankName || !c.bankName.toUpperCase().includes('BEA'))
        ? 'BEA (Banque Extérieure d\'Algérie)'
        : c.bankName
    }));
    const updatedSettings = (newState.settings && typeof newState.settings === 'object') ? { ...this.state.settings, ...newState.settings } : this.state.settings;
    
    let updatedUsers = this.state.users;
    if (Array.isArray(newState.users)) {
      const userMap = new Map<string, any>();
      for (const u of this.state.users) {
        if (u && (u.id || u.username)) userMap.set(u.id || u.username.toLowerCase(), u);
      }
      for (const u of newState.users) {
        if (u && (u.id || u.username)) {
          const key = u.id || u.username.toLowerCase();
          userMap.set(key, { ...(userMap.get(key) || {}), ...u });
        }
      }
      updatedUsers = Array.from(userMap.values());
    }

    this.state = {
      ...this.state,
      ...newState,
      dossiers: updatedDossiers,
      cheques: updatedCheques,
      settings: updatedSettings,
      users: updatedUsers,
      version: (this.state.version || 0) + 1,
      lastModified: new Date().toISOString()
    };
    if (actor) {
      this.state.auditLogs = [
        {
          timestamp: new Date().toISOString(),
          action: 'SYNCHRONISATION_GLOBALE',
          user: actor,
          details: `${this.state.dossiers.length} dossiers, ${this.state.cheques.length} chèques`
        },
        ...(this.state.auditLogs || []).slice(0, 99)
      ];
    }
    this.saveToDisk(this.state);
    return this.state;
  }

  // Dossier operations
  public saveDossier(dossier: any, actor?: string): DatabaseState {
    const existingIndex = this.state.dossiers.findIndex(d => d.id === dossier.id);
    let updatedDossiers = [...this.state.dossiers];
    if (existingIndex >= 0) {
      updatedDossiers[existingIndex] = { ...updatedDossiers[existingIndex], ...dossier };
    } else {
      updatedDossiers.unshift(dossier);
    }

    this.state = {
      ...this.state,
      dossiers: updatedDossiers,
      version: (this.state.version || 0) + 1,
      lastModified: new Date().toISOString(),
      auditLogs: [
        {
          timestamp: new Date().toISOString(),
          action: existingIndex >= 0 ? 'MODIFICATION_DOSSIER' : 'CREATION_DOSSIER',
          user: actor || 'Système',
          details: `Dossier: ${dossier.dossierNumber || dossier.id}`
        },
        ...(this.state.auditLogs || []).slice(0, 99)
      ]
    };
    this.saveToDisk(this.state);
    return this.state;
  }

  public deleteDossier(dossierId: string, actor?: string): DatabaseState {
    this.state = {
      ...this.state,
      dossiers: this.state.dossiers.filter(d => d.id !== dossierId),
      version: (this.state.version || 0) + 1,
      lastModified: new Date().toISOString(),
      auditLogs: [
        {
          timestamp: new Date().toISOString(),
          action: 'SUPPRESSION_DOSSIER',
          user: actor || 'Système',
          details: `ID Dossier: ${dossierId}`
        },
        ...(this.state.auditLogs || []).slice(0, 99)
      ]
    };
    this.saveToDisk(this.state);
    return this.state;
  }

  public saveCheque(cheque: any, actor?: string): DatabaseState {
    const normalizedCheque = {
      ...cheque,
      bankName: (!cheque.bankName || !cheque.bankName.toUpperCase().includes('BEA'))
        ? 'BEA (Banque Extérieure d\'Algérie)'
        : cheque.bankName
    };
    const existingIndex = this.state.cheques.findIndex(c => c.id === normalizedCheque.id);
    let updatedCheques = [...this.state.cheques];
    if (existingIndex >= 0) {
      updatedCheques[existingIndex] = { ...updatedCheques[existingIndex], ...normalizedCheque };
    } else {
      updatedCheques.unshift(normalizedCheque);
    }

    this.state = {
      ...this.state,
      cheques: updatedCheques,
      version: (this.state.version || 0) + 1,
      lastModified: new Date().toISOString(),
      auditLogs: [
        {
          timestamp: new Date().toISOString(),
          action: existingIndex >= 0 ? 'MODIFICATION_CHEQUE' : 'CREATION_CHEQUE',
          user: actor || 'Système',
          details: `Chèque: ${cheque.chequeNumber || cheque.id}`
        },
        ...(this.state.auditLogs || []).slice(0, 99)
      ]
    };
    this.saveToDisk(this.state);
    return this.state;
  }

  public deleteCheque(chequeId: string, actor?: string): DatabaseState {
    this.state = {
      ...this.state,
      cheques: this.state.cheques.filter(c => c.id !== chequeId),
      version: (this.state.version || 0) + 1,
      lastModified: new Date().toISOString(),
      auditLogs: [
        {
          timestamp: new Date().toISOString(),
          action: 'SUPPRESSION_CHEQUE',
          user: actor || 'Système',
          details: `ID Chèque: ${chequeId}`
        },
        ...(this.state.auditLogs || []).slice(0, 99)
      ]
    };
    this.saveToDisk(this.state);
    return this.state;
  }

  // Settings operations
  public saveSettings(newSettings: any): DatabaseState {
    this.state = {
      ...this.state,
      settings: { ...this.state.settings, ...newSettings },
      version: (this.state.version || 0) + 1,
      lastModified: new Date().toISOString()
    };
    this.saveToDisk(this.state);
    return this.state;
  }

  // Users operations
  public saveUser(user: any): DatabaseState {
    const existingIndex = this.state.users.findIndex(u => u.id === user.id || u.username.toLowerCase() === user.username.toLowerCase());
    let updatedUsers = [...this.state.users];
    if (existingIndex >= 0) {
      updatedUsers[existingIndex] = { ...updatedUsers[existingIndex], ...user };
    } else {
      updatedUsers.push(user);
    }

    this.state = {
      ...this.state,
      users: updatedUsers,
      version: (this.state.version || 0) + 1,
      lastModified: new Date().toISOString()
    };
    this.saveToDisk(this.state);
    return this.state;
  }

  public deleteUser(userId: string): DatabaseState {
    this.state = {
      ...this.state,
      users: this.state.users.filter(u => u.id !== userId),
      version: (this.state.version || 0) + 1,
      lastModified: new Date().toISOString()
    };
    this.saveToDisk(this.state);
    return this.state;
  }
}

export const db = new DatabaseManager();
