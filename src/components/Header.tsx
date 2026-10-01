import React from 'react';
import { 
  PlusCircle, 
  FolderPlus, 
  Download, 
  RotateCcw, 
  Layers,
  Container,
  FolderArchive,
  Printer,
  Settings,
  FileText
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'dashboard' | 'cheques' | 'cautions' | 'dossiers' | 'bordereaux';
  onTabChange: (tab: 'dashboard' | 'cheques' | 'cautions' | 'dossiers' | 'bordereaux') => void;
  onOpenNewChequeModal: () => void;
  onOpenNewDossierModal: () => void;
  onOpenBordereauModal: () => void;
  onOpenSettingsModal: () => void;
  onExportCSV: () => void;
  onResetDemo: () => void;
  selectedCurrency: string;
  onCurrencyChange: (curr: string) => void;
  urgentCautionsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenNewChequeModal,
  onOpenNewDossierModal,
  onOpenBordereauModal,
  onOpenSettingsModal,
  onExportCSV,
  onResetDemo,
  selectedCurrency,
  onCurrencyChange,
  urgentCautionsCount
}) => {
  return (
    <header className="border-b border-slate-200 bg-white/95 sticky top-0 z-30 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar with branding & primary controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-3 border-b border-slate-200/80">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center shadow-md shadow-cyan-600/20 text-white">
              <Container className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900 font-['Plus_Jakarta_Sans']">
                  Transit <span className="text-cyan-600">SCHB</span>
                </span>
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                  Service Transit & Douane
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Suivi des chèques de débours, cautions maritimes & liquidations douanières
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Devise unique DA */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs shadow-2xs">
              <span className="text-slate-500 font-medium">Devise :</span>
              <span className="font-mono font-extrabold text-cyan-800 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                DA
              </span>
            </div>

            {/* Quick action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenNewChequeModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold transition-all shadow-sm shadow-cyan-600/30 active:scale-98 cursor-pointer"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Nouveau Chèque</span>
              </button>

              <button
                onClick={onOpenNewDossierModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 transition-colors shadow-2xs cursor-pointer"
                title="Créer un nouveau dossier de transit"
              >
                <FolderPlus className="h-4 w-4 text-cyan-600" />
                <span className="hidden sm:inline">Dossier</span>
              </button>

              <button
                onClick={onOpenBordereauModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 transition-colors shadow-2xs cursor-pointer"
                title="Générer un bordereau de remise ou décharge"
              >
                <Printer className="h-4 w-4 text-amber-600" />
                <span className="hidden md:inline">Bordereau</span>
              </button>

              <button
                onClick={onExportCSV}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors border border-slate-300 shadow-2xs cursor-pointer"
                title="Exporter toutes les données en CSV"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">CSV</span>
              </button>

              <button
                onClick={onOpenSettingsModal}
                className="inline-flex items-center justify-center p-1.5 rounded-lg text-slate-600 hover:text-cyan-700 hover:bg-slate-100 transition-colors border border-slate-300 shadow-2xs cursor-pointer"
                title="Paramètres de l'agence et sauvegarde"
              >
                <Settings className="h-4 w-4" />
              </button>

              <button
                onClick={onResetDemo}
                className="inline-flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Réinitialiser avec les données démo"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Logo Société Groupe GICA & Mention Réalisé par Noui Adel */}
            <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-slate-200 ml-1">
              <div className="hidden sm:flex flex-col items-end text-right">
                <span className="text-[11px] font-extrabold text-slate-900 tracking-tight leading-tight">
                  GROUPE GICA · SCHB
                </span>
                <span className="text-[10px] font-medium text-slate-500 leading-tight">
                  المجمع الصناعي لإسمنت الجزائر
                </span>
                <span className="text-[10px] font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-200 mt-0.5 inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-600"></span>
                  Réalisé par : <strong className="text-slate-900 font-extrabold">Noui Adel</strong>
                </span>
              </div>
              <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-center">
                <img
                  src="/gica_logo.png"
                  alt="Logo Groupe GICA - SCHB"
                  className="h-10 sm:h-11 w-auto object-contain"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-1.5 scrollbar-none text-xs">
          <button
            onClick={() => onTabChange('dashboard')}
            className={`flex items-center gap-2 py-2 px-3 border-b-2 font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'dashboard'
                ? 'border-cyan-600 text-cyan-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Tableau de Bord</span>
          </button>

          <button
            onClick={() => onTabChange('cheques')}
            className={`flex items-center gap-2 py-2 px-3 border-b-2 font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'cheques'
                ? 'border-cyan-600 text-cyan-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Registre des Chèques</span>
          </button>

          <button
            onClick={() => onTabChange('cautions')}
            className={`flex items-center gap-2 py-2 px-3 border-b-2 font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'cautions'
                ? 'border-cyan-600 text-cyan-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Container className="h-4 w-4 text-amber-600" />
            <span>Cautions & Déconsignation</span>
            {urgentCautionsCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300 rounded-md">
                {urgentCautionsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onTabChange('dossiers')}
            className={`flex items-center gap-2 py-2 px-3 border-b-2 font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'dossiers'
                ? 'border-cyan-600 text-cyan-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderArchive className="h-4 w-4" />
            <span>Dossiers de Transit</span>
          </button>

          <button
            onClick={() => onTabChange('bordereaux')}
            className={`flex items-center gap-2 py-2 px-3 border-b-2 font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'bordereaux'
                ? 'border-cyan-600 text-cyan-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Printer className="h-4 w-4" />
            <span>Bordereaux & Décharges</span>
          </button>
        </div>
      </div>
    </header>
  );
};
