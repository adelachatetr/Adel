import React, { useState } from 'react';
import { 
  Building2, 
  Save, 
  Upload, 
  Download, 
  ShieldCheck, 
  FileCheck2,
  Check,
  Landmark,
  RefreshCw
} from 'lucide-react';
import { AppSettings, exportBackupJSON } from '../utils/storage';
import { TransitCheque, TransitDossier } from '../types/transit';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  cheques: TransitCheque[];
  dossiers: TransitDossier[];
  onImportBackup: (importedData: { cheques: TransitCheque[]; dossiers: TransitDossier[] }) => void;
  onUpdateAllChequesBank?: (newBankName: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  cheques,
  dossiers,
  onImportBackup,
  onUpdateAllChequesBank
}) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [bankUpdateSuccess, setBankUpdateSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 800);
  };

  const handleApplyBankToAll = () => {
    if (onUpdateAllChequesBank && formData.defaultBankName) {
      onUpdateAllChequesBank(formData.defaultBankName);
      setBankUpdateSuccess(true);
      setTimeout(() => setBankUpdateSuccess(false), 3000);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.cheques && Array.isArray(json.cheques)) {
          onImportBackup({
            cheques: json.cheques,
            dossiers: json.dossiers || []
          });
          alert(`Restauration réussie ! ${json.cheques.length} chèques et ${(json.dossiers || []).length} dossiers chargés.`);
          onClose();
        } else {
          alert('Fichier JSON invalide: aucune clé "cheques" détectée.');
        }
      } catch (err) {
        alert('Erreur lors de la lecture du fichier JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-5 overflow-y-auto backdrop-blur-xs">
      <div className="bg-white border border-slate-300 rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-cyan-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Paramètres de l'Agence Transit SCHB</h2>
              <p className="text-xs text-slate-500 font-medium">Coordonnées sur bordereaux, sauvegarde et devises</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* Logo & Author Card */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img 
                src="/gica_logo.png" 
                alt="Logo GICA SCHB" 
                className="h-10 w-auto object-contain bg-white p-1 rounded-lg border border-slate-200 shadow-2xs" 
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
              <span className="text-[10px] font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200 inline-block">
                Réalisé par : <strong>Noui Adel</strong>
              </span>
            </div>
          </div>

          {/* Identité de l'agence pour les bordereaux */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-cyan-800 uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck2 className="h-4 w-4" />
              <span>En-tête des Bordereaux & Documents Officiels</span>
            </h3>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Raison Sociale de l'Agence :</label>
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold focus:outline-none focus:border-cyan-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Ports & Villes d'Implantation :</label>
                <input
                  type="text"
                  value={formData.agencyCity}
                  onChange={e => setFormData({ ...formData, agencyCity: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-cyan-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Téléphone & Contact Opérations :</label>
                <input
                  type="text"
                  value={formData.agencyPhone}
                  onChange={e => setFormData({ ...formData, agencyPhone: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono font-medium focus:outline-none focus:border-cyan-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Devise du Système :</label>
              <div className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono font-bold flex items-center justify-between text-xs">
                <span>Dinar Algérien (DA)</span>
                <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
                  Devise unique
                </span>
              </div>
            </div>
          </div>

          {/* Configuration Banque BEA */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                <Landmark className="h-4 w-4 text-blue-700" />
                <span>Banque Principale & Domiciliation (BEA)</span>
              </h3>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setFormData({ 
                    ...formData, 
                    defaultBankName: "BEA (Banque Extérieure d'Algérie)",
                    bankAgency: "Agence Constantine - 002" 
                  })}
                  className="text-[10px] bg-blue-50 text-blue-800 hover:bg-blue-100 px-2 py-0.5 rounded font-bold border border-blue-200 cursor-pointer"
                >
                  Définir BEA par défaut
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Nom officiel de la Banque (BEA) :
              </label>
              <input
                type="text"
                required
                value={formData.defaultBankName || "BEA (Banque Extérieure d'Algérie)"}
                onChange={e => setFormData({ ...formData, defaultBankName: e.target.value })}
                placeholder="BEA (Banque Extérieure d'Algérie)"
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold focus:outline-none focus:border-cyan-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Agence / Guichet Bancaire :</label>
                <input
                  type="text"
                  value={formData.bankAgency || ""}
                  onChange={e => setFormData({ ...formData, bankAgency: e.target.value })}
                  placeholder="ex: Agence Constantine - 002"
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-cyan-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">N° de Compte / RIB Bancaire :</label>
                <input
                  type="text"
                  value={formData.bankRib || ""}
                  onChange={e => setFormData({ ...formData, bankRib: e.target.value })}
                  placeholder="ex: 002 00012 1234567890 44"
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono font-medium focus:outline-none focus:border-cyan-600"
                />
              </div>
            </div>

            {onUpdateAllChequesBank && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleApplyBankToAll}
                  className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xl font-semibold flex items-center gap-2 transition-colors cursor-pointer w-full sm:w-auto"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-blue-700" />
                  <span>Appliquer ce nom de banque à tous les chèques existants ({cheques.length})</span>
                </button>

                {bankUpdateSuccess && (
                  <p className="text-xs text-emerald-700 font-bold mt-1.5 flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" />
                    Tous les chèques ont été mis à jour avec le nom : {formData.defaultBankName} !
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Sauvegarde & Restauration */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-amber-700" />
              <span>Sauvegarde & Sécurité des Données</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => exportBackupJSON(cheques, dossiers)}
                className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-left hover:border-cyan-600 transition-colors group flex items-start gap-3 cursor-pointer"
              >
                <Download className="h-5 w-5 text-cyan-600 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900 group-hover:text-cyan-700">Exporter Sauvegarde JSON</div>
                  <div className="text-xs text-slate-500 mt-0.5">Télécharger l'historique complet</div>
                </div>
              </button>

              <label className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-left hover:border-amber-600 transition-colors group flex items-start gap-3 cursor-pointer">
                <Upload className="h-5 w-5 text-amber-700 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900 group-hover:text-amber-800">Restaurer Sauvegarde</div>
                  <div className="text-xs text-slate-500 mt-0.5">Importer un fichier JSON</div>
                </div>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-cyan-600/30 cursor-pointer"
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
          </div>
        </form>
      </div>
    </div>
  );
};
