import { TransitCheque, TransitDossier, ChequeStatus, ChequeCategory, ChequeDirection, DossierStatus } from '../types/transit';
import { INITIAL_CHEQUES, INITIAL_DOSSIERS } from '../data/mockTransitData';

const CHEQUES_STORAGE_KEY = 'transit_cheques_data_v1';
const DOSSIERS_STORAGE_KEY = 'transit_dossiers_data_v1';
const SETTINGS_STORAGE_KEY = 'transit_settings_data_v1';

export interface AppSettings {
  defaultCurrency: string;
  companyName: string;
  agencyCity: string;
  agencyPhone: string;
  defaultBankName: string;
  bankAgency?: string;
  bankRib?: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  defaultCurrency: 'DA',
  companyName: 'TRANSIT SCHB',
  agencyCity: 'Constantine / Hamma Bouziane & Ports',
  agencyPhone: '+213 (0) 31 88 99 00',
  defaultBankName: 'BEA (Banque Extérieure d\'Algérie)',
  bankAgency: 'Agence Constantine - 002',
  bankRib: '002 00012 1234567890 44'
};

export function loadStoredCheques(): TransitCheque[] {
  try {
    const raw = localStorage.getItem(CHEQUES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(CHEQUES_STORAGE_KEY, JSON.stringify(INITIAL_CHEQUES));
      return INITIAL_CHEQUES;
    }
    const parsed: TransitCheque[] = JSON.parse(raw);
    return parsed.map(c => ({
      ...c,
      currency: 'DA',
      coursierName: c.coursierName === 'Noui Adel' ? 'Hamza Boulekroune' : c.coursierName
    }));
  } catch (e) {
    console.error('Failed to load cheques from storage', e);
    return INITIAL_CHEQUES;
  }
}

export function saveStoredCheques(cheques: TransitCheque[]): void {
  try {
    localStorage.setItem(CHEQUES_STORAGE_KEY, JSON.stringify(cheques));
  } catch (e) {
    console.error('Failed to save cheques to storage', e);
  }
}

export function loadStoredDossiers(): TransitDossier[] {
  try {
    const raw = localStorage.getItem(DOSSIERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(DOSSIERS_STORAGE_KEY, JSON.stringify(INITIAL_DOSSIERS));
      return INITIAL_DOSSIERS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load dossiers from storage', e);
    return INITIAL_DOSSIERS;
  }
}

export function saveStoredDossiers(dossiers: TransitDossier[]): void {
  try {
    localStorage.setItem(DOSSIERS_STORAGE_KEY, JSON.stringify(dossiers));
  } catch (e) {
    console.error('Failed to save dossiers to storage', e);
  }
}

export function loadAppSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

export function saveAppSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}

export function resetAllDataToDemo(): { cheques: TransitCheque[]; dossiers: TransitDossier[] } {
  localStorage.setItem(CHEQUES_STORAGE_KEY, JSON.stringify(INITIAL_CHEQUES));
  localStorage.setItem(DOSSIERS_STORAGE_KEY, JSON.stringify(INITIAL_DOSSIERS));
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
  return { cheques: INITIAL_CHEQUES, dossiers: INITIAL_DOSSIERS };
}

// Format number with spaces as thousand separators
export function formatAmount(amount: number, currency: string = 'DA'): string {
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${formatted} ${currency}`;
}

export function formatShortDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(d);
  } catch {
    return dateStr;
  }
}

// Helpers for Category info
export const CATEGORY_LABELS: Record<ChequeCategory, { label: string; short: string; color: string }> = {
  CAUTION_CONTENEUR: {
    label: 'Caution Conteneur (Consignation)',
    short: 'Caution Conteneur',
    color: 'amber'
  },
  DROITS_DOUANE: {
    label: 'Droits & Taxes Douane (Trésor)',
    short: 'Droits Douane',
    color: 'emerald'
  },
  FRAIS_MARITIMES: {
    label: 'Frais Maritimes & BAD (Compagnie)',
    short: 'Frais Maritimes',
    color: 'sky'
  },
  MANUTENTION_PORT: {
    label: 'Manutention, Acconage & Port',
    short: 'Manutention Port',
    color: 'indigo'
  },
  TRANSPORT_TRACTION: {
    label: 'Transport Terrestre & Traction',
    short: 'Transport',
    color: 'purple'
  },
  AVANCE_PROVISION: {
    label: 'Avance & Provision Client',
    short: 'Avance Client',
    color: 'teal'
  },
  HONORAIRES_TRANSIT: {
    label: 'Honoraires Transit & Prestation',
    short: 'Honoraires',
    color: 'blue'
  },
  AUTRE_DEBOURS: {
    label: 'Autre Débours / Frais Annexes',
    short: 'Autre Débours',
    color: 'slate'
  }
};

export const STATUS_CONFIG: Record<ChequeStatus, { label: string; textClass: string; bgClass: string; borderClass: string; iconName: string }> = {
  BROUILLON: {
    label: 'Brouillon',
    textClass: 'text-slate-700',
    bgClass: 'bg-slate-100',
    borderClass: 'border-slate-300',
    iconName: 'FileEdit'
  },
  EMIS: {
    label: 'Émis (En caisse)',
    textClass: 'text-blue-700',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200',
    iconName: 'CheckCircle2'
  },
  REMIS_COURSIER: {
    label: 'Remis au coursier',
    textClass: 'text-amber-800',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200',
    iconName: 'Send'
  },
  DEPOSE: {
    label: 'Déposé (En circulation)',
    textClass: 'text-cyan-800',
    bgClass: 'bg-cyan-50',
    borderClass: 'border-cyan-200',
    iconName: 'Building2'
  },
  DECAISSE: {
    label: 'Décaissé (Débité)',
    textClass: 'text-emerald-800',
    bgClass: 'bg-emerald-50',
    borderClass: 'border-emerald-200',
    iconName: 'CheckCheck'
  },
  ENCAISSE: {
    label: 'Encaissé (Crédité)',
    textClass: 'text-teal-800',
    bgClass: 'bg-teal-50',
    borderClass: 'border-teal-200',
    iconName: 'ArrowDownToLine'
  },
  A_RECUPERER: {
    label: 'À Récupérer (Vide rendu)',
    textClass: 'text-orange-900 font-semibold',
    bgClass: 'bg-orange-100',
    borderClass: 'border-orange-300',
    iconName: 'AlertTriangle'
  },
  RECUPERE: {
    label: 'Caution Récupérée',
    textClass: 'text-purple-800',
    bgClass: 'bg-purple-50',
    borderClass: 'border-purple-200',
    iconName: 'ShieldCheck'
  },
  ANNULE: {
    label: 'Annulé / Rejeté',
    textClass: 'text-rose-800',
    bgClass: 'bg-rose-50',
    borderClass: 'border-rose-200',
    iconName: 'XCircle'
  },
  LITIGE: {
    label: 'En Litige / Surestarie',
    textClass: 'text-red-900',
    bgClass: 'bg-red-100',
    borderClass: 'border-red-300',
    iconName: 'Flame'
  }
};

export const DOSSIER_STATUS_CONFIG: Record<DossierStatus, { label: string; textClass: string; bgClass: string; borderClass: string }> = {
  RECEPTIONNE: {
    label: 'Réceptionné',
    textClass: 'text-indigo-800 font-semibold',
    bgClass: 'bg-indigo-50',
    borderClass: 'border-indigo-200'
  },
  OUVERT: {
    label: 'Ouvert / Préparation',
    textClass: 'text-slate-800 font-medium',
    bgClass: 'bg-slate-100',
    borderClass: 'border-slate-300'
  },
  EN_DEDOUANEMENT: {
    label: 'En Dédouanement',
    textClass: 'text-amber-800 font-semibold',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200'
  },
  BON_A_DELIVRER: {
    label: 'Bon à Délivrer (BAD)',
    textClass: 'text-cyan-800 font-semibold',
    bgClass: 'bg-cyan-50',
    borderClass: 'border-cyan-200'
  },
  SORTI_PORT: {
    label: 'Sorti Port / Livré',
    textClass: 'text-emerald-800 font-semibold',
    bgClass: 'bg-emerald-50',
    borderClass: 'border-emerald-200'
  },
  SOLDE_ARCHIVE: {
    label: 'Soldé & Archivé',
    textClass: 'text-purple-800 font-semibold',
    bgClass: 'bg-purple-50',
    borderClass: 'border-purple-200'
  }
};

export function exportChequesToCSV(cheques: TransitCheque[]): void {
  const headers = [
    'N° Chèque',
    'Direction',
    'Statut',
    'Catégorie',
    'N° Dossier Transit',
    'Client',
    'Bénéficiaire',
    'Montant',
    'Devise',
    'Banque',
    'Date Émission',
    'Date Échéance',
    'Coursier / Déclarant',
    'N° Conteneurs',
    'Armateur / Ligne',
    'Date Restitution Conteneur',
    'N° Bon EIR',
    'Observations'
  ];

  const rows = cheques.map(c => [
    `"${c.chequeNumber || ''}"`,
    `"${c.direction === 'EMIS' ? 'Émis (Débours)' : 'Reçu (Client)'}"`,
    `"${STATUS_CONFIG[c.status]?.label || c.status}"`,
    `"${CATEGORY_LABELS[c.category]?.label || c.category}"`,
    `"${c.dossierNumber || ''}"`,
    `"${(c.clientName || '').replace(/"/g, '""')}"`,
    `"${(c.beneficiary || '').replace(/"/g, '""')}"`,
    c.amount,
    `"${c.currency}"`,
    `"${(c.bankName || '').replace(/"/g, '""')}"`,
    `"${c.dateEmission || ''}"`,
    `"${c.dateEcheance || ''}"`,
    `"${(c.coursierName || '').replace(/"/g, '""')}"`,
    `"${(c.containerInfo?.containerNumbers || []).join('; ')}"`,
    `"${(c.containerInfo?.shippingLine || '').replace(/"/g, '""')}"`,
    `"${c.containerInfo?.actualReturnDate || ''}"`,
    `"${c.containerInfo?.interchangeNumber || ''}"`,
    `"${(c.observations || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `TransitCheq_Export_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportBackupJSON(cheques: TransitCheque[], dossiers: TransitDossier[]): void {
  const data = {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    cheques,
    dossiers
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `TransitCheq_Backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
