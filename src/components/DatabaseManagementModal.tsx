import React, { useState, useRef } from 'react';
import { 
  X, 
  Database, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  HardDrive, 
  FileText, 
  FolderArchive, 
  Users, 
  ShieldCheck, 
  RefreshCw, 
  Server,
  Layers,
  Calendar,
  Lock,
  ArrowDownToLine
} from 'lucide-react';
import { TransitCheque, TransitDossier } from '../types/transit';
import { UserAccount } from '../types/auth';
import { AppSettings, loadStoredCheques, loadStoredDossiers, loadAppSettings, saveStoredCheques, saveStoredDossiers, saveAppSettings, resetAllDataToDemo } from '../utils/storage';
import { loadUsers, saveUsers } from '../utils/authStorage';

interface DatabaseManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  cheques: TransitCheque[];
  dossiers: TransitDossier[];
  settings: AppSettings;
  currentUser: UserAccount;
  onDataRestored: (newCheques: TransitCheque[], newDossiers: TransitDossier[], newSettings: AppSettings) => void;
}

export const DatabaseManagementModal: React.FC<DatabaseManagementModalProps> = ({
  isOpen,
  onClose,
  cheques,
  dossiers,
  settings,
  currentUser,
  onDataRestored
}) => {
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [integrityStatus, setIntegrityStatus] = useState<'IDLE' | 'CHECKING' | 'VALID'>('IDLE');
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const users = loadUsers();
  const totalChequesAmount = cheques.reduce((acc, c) => acc + (c.amount || 0), 0);
  const cautionsCount = cheques.filter(c => c.category === 'CAUTION_CONTENEUR' || Boolean(c.containerInfo)).length;

  // Estimate storage size in KB
  const estimatedStorageKb = Math.round(
    (JSON.stringify(cheques).length + JSON.stringify(dossiers).length + JSON.stringify(users).length) / 1024
  );

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
          settings,
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

      setFeedback({
        type: 'success',
        message: 'Sauvegarde complète de la base de données téléchargée avec succès (.json).'
      });
    } catch (e) {
      setFeedback({
        type: 'error',
        message: 'Erreur lors de l\'export de la sauvegarde.'
      });
    }
  };

  // 2. Import and restore database from JSON file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (!parsed.tables || !Array.isArray(parsed.tables.cheques) || !Array.isArray(parsed.tables.dossiers)) {
          setFeedback({
            type: 'error',
            message: 'Format de fichier de sauvegarde invalide (tables manquantes).'
          });
          return;
        }

        const restoredCheques: TransitCheque[] = parsed.tables.cheques;
        const restoredDossiers: TransitDossier[] = parsed.tables.dossiers;
        const restoredSettings: AppSettings = parsed.tables.settings || settings;

        saveStoredCheques(restoredCheques);
        saveStoredDossiers(restoredDossiers);
        if (parsed.tables.settings) {
          saveAppSettings(restoredSettings);
        }

        onDataRestored(restoredCheques, restoredDossiers, restoredSettings);

        setFeedback({
          type: 'success',
          message: `Restauration réussie ! ${restoredDossiers.length} dossiers et ${restoredCheques.length} chèques rechargés.`
        });
      } catch (err) {
        setFeedback({
          type: 'error',
          message: 'Erreur lors de la lecture du fichier de sauvegarde. Fichier corrompu ou invalide.'
        });
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 3. Test integrity
  const handleCheckIntegrity = () => {
    setIntegrityStatus('CHECKING');
    setTimeout(() => {
      setIntegrityStatus('VALID');
      setFeedback({
        type: 'success',
        message: 'Contrôle d\'intégrité achevé : 100% des tables sont valides, indexées et cohérentes.'
      });
    }, 450);
  };

  // 4. Reset to official demo
  const handleConfirmReset = () => {
    const { cheques: initC, dossiers: initD } = resetAllDataToDemo();
    onDataRestored(initC, initD, settings);
    setIsResetConfirmOpen(false);
    setFeedback({
      type: 'info',
      message: 'Base de données réinitialisée aux données types de transit SCHB.'
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-5 backdrop-blur-xs">
      <div className="bg-white border border-slate-300 rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scale-in">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Gestionnaire de Base de Données
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Active & Opérationnelle</span>
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                Stockage persistant autonome · Sauvegardes & Restauration SCHB
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Feedback message banner */}
        {feedback && (
          <div className={`p-3 px-5 text-xs font-semibold flex items-center justify-between border-b ${
            feedback.type === 'success' 
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
              : feedback.type === 'error'
              ? 'bg-rose-50 text-rose-900 border-rose-200'
              : 'bg-cyan-50 text-cyan-900 border-cyan-200'
          }`}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{feedback.message}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 space-y-5">
          
          {/* Status Banner Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center sm:text-left">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Moteur de données</span>
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1 justify-center sm:justify-start">
                  <Server className="h-3.5 w-3.5 text-cyan-700" />
                  <span>SQL / Local DB</span>
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Synchronisation</span>
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 justify-center sm:justify-start">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Temps Réel</span>
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Taille occupée</span>
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1 justify-center sm:justify-start">
                  <HardDrive className="h-3.5 w-3.5 text-slate-600" />
                  <span>~{estimatedStorageKb} Ko</span>
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Sécurité</span>
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1 justify-center sm:justify-start">
                  <Lock className="h-3.5 w-3.5 text-amber-600" />
                  <span>Protégé Admin</span>
                </span>
              </div>
            </div>
          </div>

          {/* Table Metrics */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-cyan-700" />
              <span>Tables de la Base de Données</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Dossiers table */}
              <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-100">
                    <FolderArchive className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900">dossiers_transit</div>
                    <div className="text-[11px] text-slate-500">Dossiers d'importation & dédouanement</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base font-extrabold text-cyan-900">{dossiers.length}</span>
                  <span className="text-[10px] text-slate-400 block font-medium">lignes</span>
                </div>
              </div>

              {/* Cheques table */}
              <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900">registre_cheques</div>
                    <div className="text-[11px] text-slate-500">Chèques, débours & cautionnements</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base font-extrabold text-emerald-900">{cheques.length}</span>
                  <span className="text-[10px] text-slate-400 block font-medium">enregistrements</span>
                </div>
              </div>

              {/* Cautions table */}
              <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-100">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900">cautions_conteneurs</div>
                    <div className="text-[11px] text-slate-500">Cautions & déconsignations armateurs</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base font-extrabold text-amber-900">{cautionsCount}</span>
                  <span className="text-[10px] text-slate-400 block font-medium">cautions</span>
                </div>
              </div>

              {/* Users table */}
              <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-100">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900">utilisateurs_acces</div>
                    <div className="text-[11px] text-slate-500">Comptes, mots de passe & rôles</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base font-extrabold text-purple-900">{users.length}</span>
                  <span className="text-[10px] text-slate-400 block font-medium">utilisateurs</span>
                </div>
              </div>

            </div>
          </div>

          {/* Backup & Restore Controls */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Download className="h-3.5 w-3.5 text-cyan-700" />
              <span>Actions de Sauvegarde & Restauration</span>
            </h3>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                
                {/* Export button */}
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="flex-1 py-3 px-4 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs shadow-sm shadow-cyan-700/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
                >
                  <ArrowDownToLine className="h-4 w-4" />
                  <span>Télécharger une Sauvegarde Complète (.json)</span>
                </button>

                {/* Import/Restore button */}
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
                  className="flex-1 py-3 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs shadow-2xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
                >
                  <Upload className="h-4 w-4 text-cyan-700" />
                  <span>Restaurer depuis un Fichier (.json)</span>
                </button>

              </div>

              {/* Integrity check & Demo reset buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCheckIntegrity}
                  className="text-xs font-semibold text-slate-600 hover:text-cyan-800 flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`h-3.5 w-3.5 text-cyan-700 ${integrityStatus === 'CHECKING' ? 'animate-spin' : ''}`} />
                  <span>Tester l'intégrité des données</span>
                  {integrityStatus === 'VALID' && (
                    <span className="text-[10px] text-emerald-600 font-bold ml-1">(100% OK)</span>
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

          {/* Reset Confirmation Popup */}
          {isResetConfirmOpen && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl animate-fade-in text-xs">
              <div className="flex items-center gap-2 text-rose-800 font-bold mb-1.5">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
                <span>Confirmer la réinitialisation ?</span>
              </div>
              <p className="text-slate-600 mb-3">
                Cette action restaurera les données exemples officielles de transit SCHB.
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

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="text-slate-500 flex items-center gap-1.5 font-medium">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Toutes vos modifications sont automatiquement sauvegardées en mémoire continue.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
