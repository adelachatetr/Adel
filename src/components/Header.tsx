import React, { useState, useRef, useEffect } from 'react';
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
  FileText,
  User,
  KeyRound,
  Users,
  UserPlus,
  LogOut,
  ChevronDown,
  ShieldCheck
} from 'lucide-react';
import { GICA_LOGO_BASE64 } from '../data/logoData';
import { UserAccount, ROLE_CONFIG } from '../types/auth';

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
  currentUser: UserAccount;
  onOpenChangePassword: () => void;
  onOpenUserManagement: () => void;
  onOpenCreateUser?: () => void;
  onLogout: () => void;
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
  urgentCautionsCount,
  currentUser,
  onOpenChangePassword,
  onOpenUserManagement,
  onOpenCreateUser,
  onLogout
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const roleCfg = ROLE_CONFIG[currentUser.role];
  const canManageUsers = currentUser.role === 'ADMIN' || currentUser.role === 'CHEF_TRANSIT';

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="border-b border-slate-200 bg-white/95 sticky top-0 z-30 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar with branding & primary controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-2.5 gap-2.5 border-b border-slate-200/80">
          
          {/* Left: Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-center shrink-0">
              <img
                src={GICA_LOGO_BASE64}
                alt="Logo Groupe GICA - SCHB"
                className="h-9 sm:h-10 w-auto object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900">
                  Transit <span className="text-cyan-700">SCHB</span>
                </span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                  GICA · Filiale SCHB
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Suivi des chèques de transit, débours & cautions conteneurs
              </p>
            </div>
          </div>

          {/* Right: Actions, Currency & Logged-in User Account */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Quick action buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={onOpenNewChequeModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-bold transition-all shadow-sm shadow-cyan-700/30 active:scale-98 cursor-pointer"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Nouveau Chèque</span>
              </button>

              <button
                onClick={onOpenNewDossierModal}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 transition-colors shadow-2xs cursor-pointer"
                title="Créer un nouveau dossier de transit"
              >
                <FolderPlus className="h-4 w-4 text-cyan-700" />
                <span className="hidden sm:inline">Dossier</span>
              </button>

              <button
                onClick={onOpenBordereauModal}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 transition-colors shadow-2xs cursor-pointer"
                title="Générer un bordereau de remise ou décharge"
              >
                <Printer className="h-4 w-4 text-amber-600" />
                <span className="hidden md:inline">Bordereau</span>
              </button>

              <button
                onClick={onExportCSV}
                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors border border-slate-300 shadow-2xs cursor-pointer"
                title="Exporter toutes les données en CSV"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">CSV</span>
              </button>

              <button
                onClick={onOpenSettingsModal}
                className={`inline-flex items-center justify-center p-1.5 rounded-xl transition-colors border shadow-2xs cursor-pointer ${
                  currentUser.role === 'ADMIN'
                    ? 'text-slate-600 hover:text-cyan-700 hover:bg-slate-100 border-slate-300'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 border-slate-200'
                }`}
                title={
                  currentUser.role === 'ADMIN'
                    ? "Paramètres du site (Administrateur)"
                    : "Paramètres du site (Lecture seule - Réservé Administrateur)"
                }
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>

            {/* User Profile & Password Menu Pill */}
            <div className="relative pl-2 border-l border-slate-200" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1.5 pr-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-300 transition-all cursor-pointer shadow-2xs"
                title="Mon compte et mot de passe"
              >
                <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${currentUser.avatarColor} text-white flex items-center justify-center font-bold text-xs shadow-xs`}>
                  {currentUser.fullName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-slate-900 leading-tight flex items-center gap-1">
                    <span>{currentUser.fullName}</span>
                    <ChevronDown className="h-3 w-3 text-slate-400" />
                  </div>
                  <div className="text-[10px] text-cyan-800 font-semibold leading-tight">
                    {roleCfg.label}
                  </div>
                </div>
              </button>

              {/* User dropdown menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-scale-in">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">{currentUser.fullName}</p>
                    <p className="text-[10px] text-slate-500 font-mono">@{currentUser.username}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${roleCfg.badgeClass}`}>
                        {roleCfg.label}
                      </span>
                      <span className="text-[10px] text-slate-500 truncate">{currentUser.department}</span>
                    </div>
                  </div>

                  <div className="py-1 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenChangePassword();
                      }}
                      className="w-full text-left px-4 py-2 text-slate-700 hover:bg-cyan-50 hover:text-cyan-900 flex items-center gap-2.5 cursor-pointer font-medium"
                    >
                      <KeyRound className="h-4 w-4 text-cyan-700" />
                      <span>Modifier mon mot de passe</span>
                    </button>

                    {canManageUsers && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenUserManagement();
                        }}
                        className="w-full text-left px-4 py-2 text-slate-700 hover:bg-cyan-50 hover:text-cyan-900 flex items-center gap-2.5 cursor-pointer font-medium"
                      >
                        <Users className="h-4 w-4 text-cyan-700" />
                        <span>Gestion des utilisateurs & MDP</span>
                      </button>
                    )}

                    {canManageUsers && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenCreateUser?.();
                        }}
                        className="w-full text-left px-4 py-2 text-cyan-800 hover:bg-cyan-50 flex items-center gap-2.5 cursor-pointer font-bold"
                      >
                        <UserPlus className="h-4 w-4 text-cyan-700" />
                        <span>+ Créer un nouveau compte</span>
                      </button>
                    )}

                    {currentUser.role === 'ADMIN' && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenSettingsModal();
                        }}
                        className="w-full text-left px-4 py-2 text-slate-700 hover:bg-cyan-50 hover:text-cyan-900 flex items-center gap-2.5 cursor-pointer font-medium"
                      >
                        <Settings className="h-4 w-4 text-cyan-700" />
                        <span>Paramètres du site (Admin)</span>
                      </button>
                    )}

                    <div className="border-t border-slate-100 my-1"></div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full text-left px-4 py-2 text-rose-700 hover:bg-rose-50 flex items-center gap-2.5 cursor-pointer font-bold"
                    >
                      <LogOut className="h-4 w-4 text-rose-600" />
                      <span>Changer d'utilisateur / Déconnexion</span>
                    </button>
                  </div>
                </div>
              )}
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
