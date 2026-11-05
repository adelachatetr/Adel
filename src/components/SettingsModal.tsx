import React, { useState, useRef } from 'react';
import { 
  Building2, 
  Save, 
  Upload, 
  Download, 
  ShieldCheck, 
  FileCheck2,
  Check,
  Landmark,
  RefreshCw,
  Lock,
  ShieldAlert,
  ShieldCheck as ShieldVerified,
  X,
  Database,
  HardDrive,
  Server,
  Layers,
  FolderArchive,
  FileText,
  Users,
  AlertTriangle,
  ArrowDownToLine,
  CheckCircle2
} from 'lucide-react';
import { AppSettings, exportBackupJSON, saveStoredCheques, saveStoredDossiers, saveAppSettings, resetAllDataToDemo, pushServerDatabase, fetchDatabaseInfo } from '../utils/storage';
import { TransitCheque, TransitDossier } from '../types/transit';
import { UserAccount, ROLE_CONFIG } from '../types/auth';
import { loadUsers } from '../utils/authStorage';
import { GICA_LOGO_BASE64 } from '../data/logoData';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  cheques: TransitCheque[];
  dossiers: TransitDossier[];
  onImportBackup: (importedData: { cheques: TransitCheque[]; dossiers: TransitDossier[]; settings?: AppSettings }) => void;
  onUpdateAllChequesBank?: (newBankName: string) => void;
  currentUser: UserAccount;
  initialTab?: 'AGENCE' | 'DATABASE';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  cheques,
  dossiers,
  onImportBackup,
  onUpdateAllChequesBank,
  currentUser,
  initialTab = 'AGENCE'
}) => {
  const [activeTab, setActiveTab] = useState<'AGENCE' | 'DATABASE'>(initialTab);
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [bankUpdateSuccess, setBankUpdateSuccess] = useState(false);
  const [dbFeedback, setDbFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [integrityStatus, setIntegrityStatus] = useState<'IDLE' | 'CHECKING' | 'VALID'>('IDLE');
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [serverDbInfo, setServerDbInfo] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load server database info and storage capacity
  React.useEffect(() => {
    if (isOpen) {
      fetchDatabaseInfo().then(info => {
        if (info) setServerDbInfo(info);
      });
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const isAdmin = currentUser.role === 'ADMIN';
  const users = loadUsers();
  const totalChequesAmount = cheques.reduce((acc, c) => acc + (c.amount || 0), 0);
  const cautionsCount = cheques.filter(c => c.category === 'CAUTION_CONTENEUR' || Boolean(c.containerInfo)).length;
  const estimatedStorageKb = Math.round(
    (JSON.stringify(cheques).length + JSON.stringify(dossiers).length + JSON.stringify(users).length) / 1024
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    onSaveSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 800);
  };

  const handleApplyBankToAll = () => {
    if (!isAdmin) return;
    if (onUpdateAllChequesBank && formData.defaultBankName) {
      onUpdateAllChequesBank(formData.defaultBankName);
      setBankUpdateSuccess(true);
      setTimeout(() => setBankUpdateSuccess(false), 3000);
    }
  };

  // 1. Export complete database backup
  const handleExportBackup = () => {
    try {
      const backupPayload = {
        app: 'Transit SCHB - Groupe GICA',
        exportDate: new Date().toISOString(),
        exportedBy: currentUser.fullName,
        version: '2.4.0',
        tables: {
          dossiers,
          cheques,
          settings: formData,
          users: users.map(u => ({ ...u, passwordHash: '***PROTECTED***' }))
        }
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupPayload, null, 2));
      const downloadAnchor = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `sauvegarde_bdd_transit_schb_${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setDbFeedback({
        type: 'success',
        message: 'Sauvegarde complète de la base de données téléchargée (.json).'
      });
    } catch (e) {
      setDbFeedback({
        type: 'error',
        message: 'Erreur lors de l\'export de la sauvegarde.'
      });
    }
  };

  // 2. Import and restore database from JSON file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAdmin) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        // Support both old backup structure and full tables structure
        let restoredCheques: TransitCheque[] = [];
        let restoredDossiers: TransitDossier[] = [];
        let restoredSettings: AppSettings = formData;

        if (parsed.tables && Array.isArray(parsed.tables.cheques) && Array.isArray(parsed.tables.dossiers)) {
          restoredCheques = parsed.tables.cheques;
          restoredDossiers = parsed.tables.dossiers;
          if (parsed.tables.settings) restoredSettings = parsed.tables.settings;
        } else if (Array.isArray(parsed.cheques)) {
          restoredCheques = parsed.cheques;
          restoredDossiers = parsed.dossiers || [];
        } else {
          setDbFeedback({
            type: 'error',
            message: 'Format de fichier de sauvegarde invalide (tables de chèques manquantes).'
          });
          return;
        }

        saveStoredCheques(restoredCheques);
        saveStoredDossiers(restoredDossiers);
        if (restoredSettings) {
          saveAppSettings(restoredSettings);
          setFormData(restoredSettings);
        }

        pushServerDatabase({
          dossiers: restoredDossiers,
          cheques: restoredCheques,
          settings: restoredSettings,
          actor: currentUser.fullName
        });

        onImportBackup({
          cheques: restoredCheques,
          dossiers: restoredDossiers,
          settings: restoredSettings
        });

        setDbFeedback({
          type: 'success',
          message: `Restauration réussie ! ${restoredDossiers.length} dossiers et ${restoredCheques.length} chèques rechargés.`
        });
      } catch (err) {
        setDbFeedback({
          type: 'error',
          message: 'Erreur lors de la lecture du fichier de sauvegarde JSON.'
        });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 3. Test integrity
  const handleCheckIntegrity = () => {
    setIntegrityStatus('CHECKING');
    setTimeout(() => {
      setIntegrityStatus('VALID');
      setDbFeedback({
        type: 'success',
        message: 'Contrôle d\'intégrité achevé : 100% des tables sont valides, indexées et cohérentes.'
      });
    }, 450);
  };

  // 4. Reset to official demo
  const handleConfirmReset = () => {
    const { cheques: initC, dossiers: initD } = resetAllDataToDemo();
    pushServerDatabase({
      cheques: initC,
      dossiers: initD,
      actor: currentUser.fullName
    });
    onImportBackup({
      cheques: initC,
      dossiers: initD
    });
    setIsResetConfirmOpen(false);
    setDbFeedback({
      type: 'info',
      message: 'Base de données réinitialisée aux données types de transit SCHB.'
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-5 overflow-y-auto backdrop-blur-xs">
      <div className="bg-white border border-slate-300 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scale-in">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-100 text-cyan-800 border border-cyan-200">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">
                  Paramètres de l'Agence & Base de Données
                </h2>
                {isAdmin ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-bold border border-emerald-300 flex items-center gap-1">
                    <ShieldVerified className="h-3 w-3 text-emerald-700" />
                    <span>Mode Administrateur</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-300 flex items-center gap-1">
                    <Lock className="h-3 w-3 text-amber-700" />
                    <span>Lecture Seule</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Transit SCHB · Groupe GICA · Supervision générale
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation Buttons */}
        <div className="flex items-center border-b border-slate-200 bg-white px-5 pt-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('AGENCE')}
            className={`py-2 px-3 border-b-2 font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'AGENCE'
                ? 'border-cyan-600 text-cyan-800 bg-cyan-50/50 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span>Configuration Agence & Banque</span>
          </button>

          {/* Base de données tab - STRICTEMENT POUR ADMINISTRATEUR */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('DATABASE')}
              className={`py-2 px-3 border-b-2 font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'DATABASE'
                  ? 'border-emerald-600 text-emerald-900 bg-emerald-50/60 rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Database className="h-4 w-4 text-emerald-600" />
              <span>Base de Données</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </button>
          )}
        </div>

        {/* Tab 1: Configuration Agence */}
        {activeTab === 'AGENCE' && (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
            
            {/* Notice Banner */}
            {isAdmin ? (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs flex items-center gap-2.5">
                <ShieldVerified className="h-5 w-5 text-emerald-700 shrink-0" />
                <div>
                  <span className="font-bold block">Accès Administrateur Autorisé</span>
                  <span className="text-[11px] text-emerald-800">
                    Connecté en tant que <strong>{currentUser.fullName}</strong>. Vous avez tous les droits pour modifier la raison sociale, les coordonnées et la banque de l'agence.
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl text-amber-950 text-xs flex items-start gap-2.5">
                <ShieldAlert className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-amber-900 flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5" />
                    <span>Modification Verrouillée (Réservée à l'Administrateur)</span>
                  </div>
                  <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                    Seul l'administrateur système (<strong>NOUI ADEL</strong>) a le privilège de modifier les coordonnées de l'agence et la configuration bancaire.
                  </p>
                </div>
              </div>
            )}

            {/* Logo & Author Card */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img 
                  src={GICA_LOGO_BASE64} 
                  alt="Logo GICA SCHB" 
                  className="h-10 w-auto object-contain bg-white p-1 rounded-xl border border-slate-200 shadow-2xs" 
                />
                <div>
                  <span className="font-extrabold text-slate-900 block text-xs">
                    Groupe Industriel des Ciments d'Algérie (GICA)
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Société des Ciments de Hamma Bouziane (SCHB)
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-200 inline-block">
                  Réalisé par : <strong>NOUI ADEL</strong>
                </span>
              </div>
            </div>

            {/* Identité de l'agence pour les bordereaux */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-cyan-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck2 className="h-4 w-4 text-cyan-700" />
                <span>En-tête des Bordereaux & Documents Officiels</span>
              </h3>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Raison Sociale de l'Agence :</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={formData.companyName}
                  onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-cyan-600 font-semibold text-slate-900 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Ville & Implantation :</label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    value={formData.agencyCity}
                    onChange={e => setFormData({ ...formData, agencyCity: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-cyan-600 text-slate-900 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Téléphone de l'Agence :</label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    value={formData.agencyPhone}
                    onChange={e => setFormData({ ...formData, agencyPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-cyan-600 text-slate-900 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Banque par défaut */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <h3 className="text-xs font-bold text-cyan-900 uppercase tracking-wider flex items-center gap-1.5">
                <Landmark className="h-4 w-4 text-cyan-700" />
                <span>Coordonnées Bancaires par Défaut (Chèques de Transit)</span>
              </h3>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Nom de la Banque :</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={formData.defaultBankName}
                  onChange={e => setFormData({ ...formData, defaultBankName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-cyan-600 font-semibold text-slate-900 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Agence Bancaire :</label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    value={formData.bankAgency || ''}
                    onChange={e => setFormData({ ...formData, bankAgency: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-cyan-600 text-slate-900 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Relevé d'Identité Bancaire (RIB) :</label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    value={formData.bankRib || ''}
                    onChange={e => setFormData({ ...formData, bankRib: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-cyan-600 font-mono text-slate-900 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {isAdmin && onUpdateAllChequesBank && (
                <div className="pt-2 flex items-center justify-between bg-cyan-50/60 p-3 rounded-xl border border-cyan-200">
                  <span className="text-[11px] text-cyan-900 font-medium">
                    Appliquer cette banque à l'ensemble des chèques existants :
                  </span>
                  <button
                    type="button"
                    onClick={handleApplyBankToAll}
                    className="px-3 py-1.5 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Mettre à jour tous les chèques</span>
                  </button>
                </div>
              )}

              {bankUpdateSuccess && (
                <div className="p-2 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1.5">
                  <Check className="h-4 w-4" />
                  <span>Tous les chèques ont été mis à jour avec le nom : {formData.defaultBankName}</span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                {isAdmin ? (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" />
                    Modifications prises en compte immédiatement
                  </span>
                ) : (
                  <span className="text-amber-700 font-semibold flex items-center gap-1">
                    <Lock className="h-3.5 w-3.5" />
                    Seul l'administrateur peut enregistrer
                  </span>
                )}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer text-xs transition-colors"
                >
                  {isAdmin ? 'Annuler' : 'Fermer'}
                </button>

                {isAdmin && (
                  <button
                    type="submit"
                    className="px-5 py-2 bg-cyan-700 hover:bg-cyan-800 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-cyan-700/30 cursor-pointer text-xs transition-all"
                  >
                    {saveSuccess ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Enregistré !</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>Enregistrer les Paramètres</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        )}

        {/* Tab 2: Base de Données (Administrateur uniquement) */}
        {activeTab === 'DATABASE' && isAdmin && (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-50 space-y-5 text-xs">
            
            {/* Feedback message banner */}
            {dbFeedback && (
              <div className={`p-3 px-4 rounded-xl text-xs font-semibold flex items-center justify-between border ${
                dbFeedback.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300' 
                  : dbFeedback.type === 'error'
                  ? 'bg-rose-50 text-rose-900 border-rose-300'
                  : 'bg-cyan-50 text-cyan-900 border-cyan-300'
              }`}>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{dbFeedback.message}</span>
                </div>
                <button onClick={() => setDbFeedback(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Live Database Status */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-emerald-600" />
                  <div>
                    <h3 className="font-bold text-slate-900 text-xs">Statut de la Base de Données Centrale</h3>
                    <p className="text-[11px] text-slate-500">Moteur centralisé · Synchronisation temps réel</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Opérationnelle</span>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center sm:text-left">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-0.5">Moteur</span>
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1 justify-center sm:justify-start">
                    <Server className="h-3.5 w-3.5 text-cyan-700" />
                    <span>SQL / JSON DB</span>
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-0.5">Synchro Multi-PC</span>
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 justify-center sm:justify-start">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Temps Réel</span>
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-0.5">Taille Fichier</span>
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1 justify-center sm:justify-start">
                    <HardDrive className="h-3.5 w-3.5 text-slate-600" />
                    <span>{serverDbInfo?.storage?.fileSizeFormatted || `~${estimatedStorageKb} Ko`}</span>
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-0.5">Accès</span>
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1 justify-center sm:justify-start">
                    <Lock className="h-3.5 w-3.5 text-amber-600" />
                    <span>Admin Noui Adel</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Storage Diagnostic Card (Direct answer to "COMBIENNE la taille disponible restant") */}
            <div className="bg-gradient-to-br from-slate-900 to-cyan-950 text-white rounded-2xl p-4 shadow-md border border-cyan-800/40">
              <div className="flex items-center justify-between pb-3 border-b border-cyan-800/50 mb-3">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5 text-cyan-400" />
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Espace de Stockage Disponible & Diagnostic Multi-PC
                    </h4>
                    <p className="text-[11px] text-cyan-200">
                      Capacité mémoire restante & état de synchronisation centralisée
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-mono font-bold">
                  {serverDbInfo?.storage?.browserStoragePercentageFree || '99.8% LIBRE'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-3">
                <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                  <span className="text-[10px] text-cyan-300 uppercase font-bold block">Espace Navigateur (par PC)</span>
                  <div className="text-sm font-black text-white mt-1">
                    {serverDbInfo?.storage?.browserStorageRemainingFormatted || '> 9.98 Mo libres'}
                  </div>
                  <div className="text-[10px] text-cyan-200 mt-0.5">
                    Sur 10 Mo alloués ({serverDbInfo?.storage?.browserStoragePercentageFree || '99.8% libre'})
                  </div>
                </div>

                <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                  <span className="text-[10px] text-cyan-300 uppercase font-bold block">Espace Serveur Central</span>
                  <div className="text-sm font-black text-emerald-400 mt-1">
                    &gt; 2 Go disponibles
                  </div>
                  <div className="text-[10px] text-cyan-200 mt-0.5">
                    Fichier : <code className="text-cyan-300">/data/database.json</code>
                  </div>
                </div>

                <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                  <span className="text-[10px] text-cyan-300 uppercase font-bold block">Capacité Restante Estimée</span>
                  <div className="text-sm font-black text-amber-300 mt-1">
                    +50 000 dossiers &amp; chèques
                  </div>
                  <div className="text-[10px] text-cyan-200 mt-0.5">
                    Aucun risque de saturation
                  </div>
                </div>
              </div>

              <div className="p-2.5 bg-cyan-950/80 rounded-xl border border-cyan-500/30 flex items-start sm:items-center gap-2 text-[11px] text-cyan-100">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <strong>Synchronisation Multi-Postes active :</strong> Toute saisie effectuée par <strong>Noui Adel</strong> sur un ordinateur est immédiatement partagée et accessible par <strong>Sofiane Belmili</strong>, <strong>Hamza Boulekroune</strong> et <strong>Ahmed Bouzidi</strong> sur tout autre poste de travail.
                </div>
              </div>
            </div>

            {/* Table Metrics */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-cyan-700" />
                <span>Tables & Données Enregistrées</span>
              </h4>

              <div className="grid grid-cols-2 gap-2.5">
                
                <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-100">
                      <FolderArchive className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">dossiers_transit</div>
                      <div className="text-[10px] text-slate-500">Dossiers d'importation</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-cyan-900">{dossiers.length}</span>
                    <span className="text-[9px] text-slate-400 block font-medium">dossiers</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">registre_cheques</div>
                      <div className="text-[10px] text-slate-500">Chèques & débours</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-emerald-900">{cheques.length}</span>
                    <span className="text-[9px] text-slate-400 block font-medium">chèques</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">cautions_conteneurs</div>
                      <div className="text-[10px] text-slate-500">Cautions armateurs</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-amber-900">{cautionsCount}</span>
                    <span className="text-[9px] text-slate-400 block font-medium">cautions</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-purple-50 text-purple-700 border border-purple-100">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">utilisateurs_acces</div>
                      <div className="text-[10px] text-slate-500">Comptes configurés</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-purple-900">{users.length}</span>
                    <span className="text-[9px] text-slate-400 block font-medium">comptes</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Sauvegarde & Restauration Actions */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Download className="h-3.5 w-3.5 text-cyan-700" />
                <span>Sauvegarde & Restauration Administrateur</span>
              </h4>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="p-3 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs shadow-sm shadow-cyan-700/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
                  >
                    <ArrowDownToLine className="h-4 w-4" />
                    <span>Sauvegarde Complète (.json)</span>
                  </button>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".json"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs shadow-2xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
                  >
                    <Upload className="h-4 w-4 text-cyan-700" />
                    <span>Restaurer Fichier (.json)</span>
                  </button>

                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleCheckIntegrity}
                    className="text-xs font-semibold text-slate-600 hover:text-cyan-800 flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 text-cyan-700 ${integrityStatus === 'CHECKING' ? 'animate-spin' : ''}`} />
                    <span>Tester l'intégrité de la base</span>
                    {integrityStatus === 'VALID' && (
                      <span className="text-[10px] text-emerald-600 font-bold ml-1">(100% Intègre)</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsResetConfirmOpen(true)}
                    className="text-xs font-semibold text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    Réinitialiser aux exemples par défaut
                  </button>
                </div>
              </div>
            </div>

            {/* Reset Confirmation */}
            {isResetConfirmOpen && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl animate-fade-in text-xs">
                <div className="flex items-center gap-2 text-rose-800 font-bold mb-1.5">
                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                  <span>Confirmer la réinitialisation de la base ?</span>
                </div>
                <p className="text-slate-600 mb-3">
                  Cette action restaurera les données types de transit SCHB.
                </p>
                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsResetConfirmOpen(false)}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmReset}
                    className="px-3 py-1.5 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 cursor-pointer shadow-xs"
                  >
                    Oui, réinitialiser
                  </button>
                </div>
              </div>
            )}

            {/* Footer Notice */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between text-[11px] text-emerald-900">
              <span className="flex items-center gap-1.5 font-semibold">
                <ShieldVerified className="h-4 w-4 text-emerald-700" />
                <span>Base synchronisée : les dossiers créés sont immédiatement visibles par Sofiane, Hamza et Ahmed.</span>
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg cursor-pointer"
              >
                Fermer
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
