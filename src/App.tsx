/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { ChequesTableView } from './components/ChequesTableView';
import { ContainerDepositsView } from './components/ContainerDepositsView';
import { DossiersView } from './components/DossiersView';
import { BordereauModal } from './components/BordereauModal';
import { ChequeFormModal } from './components/ChequeFormModal';
import { DossierFormModal } from './components/DossierFormModal';
import { DossierPrintModal } from './components/DossierPrintModal';
import { ChequeDetailModal } from './components/ChequeDetailModal';
import { SettingsModal } from './components/SettingsModal';
import { LoginView } from './components/LoginView';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { UserManagementModal } from './components/UserManagementModal';
import { AuthSession } from './types/auth';
import { getCurrentSession, clearSession } from './utils/authStorage';
import { TransitCheque, TransitDossier, ChequeStatus, DossierStatus } from './types/transit';
import { 
  loadStoredCheques, 
  saveStoredCheques, 
  loadStoredDossiers, 
  saveStoredDossiers,
  loadAppSettings,
  saveAppSettings,
  resetAllDataToDemo,
  exportChequesToCSV,
  exportBackupJSON,
  fetchServerDatabase,
  pushServerDatabase,
  saveServerDossier,
  deleteServerDossier,
  saveServerCheque,
  deleteServerCheque
} from './utils/storage';

export default function App() {
  const [cheques, setCheques] = useState<TransitCheque[]>(() => loadStoredCheques());
  const [dossiers, setDossiers] = useState<TransitDossier[]>(() => loadStoredDossiers());
  const [settings, setSettings] = useState(() => loadAppSettings());

  const [activeTab, setActiveTab] = useState<'dashboard' | 'cheques' | 'cautions' | 'dossiers' | 'bordereaux'>('dashboard');

  // Modals state
  const [isChequeFormOpen, setIsChequeFormOpen] = useState(false);
  const [editingCheque, setEditingCheque] = useState<TransitCheque | null>(null);

  const [isDossierFormOpen, setIsDossierFormOpen] = useState(false);
  const [editingDossier, setEditingDossier] = useState<TransitDossier | null>(null);
  const [printingDossier, setPrintingDossier] = useState<TransitDossier | null>(null);

  const [isBordereauModalOpen, setIsBordereauModalOpen] = useState(false);
  const [preSelectedForBordereau, setPreSelectedForBordereau] = useState<TransitCheque[]>([]);
  const [activeFilteredCheques, setActiveFilteredCheques] = useState<TransitCheque[]>([]);
  const [hasActiveChequeFilters, setHasActiveChequeFilters] = useState(false);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState(false);

  const [selectedChequeDetail, setSelectedChequeDetail] = useState<TransitCheque | null>(null);

  // Cross-view filters
  const [activeFilter, setActiveFilter] = useState<{ type: string; value: string } | null>(null);

  // User Authentication & Session
  const [session, setSession] = useState<AuthSession | null>(() => getCurrentSession());
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [isCreateUserMode, setIsCreateUserMode] = useState(false);

  // Pre-fill parameters when creating a cheque from a specific dossier
  const [prefillDossier, setPrefillDossier] = useState<{ number: string; client: string } | undefined>(undefined);

  // Multi-PC server sync state
  const [syncStatus, setSyncStatus] = useState<'SYNCED' | 'SYNCING' | 'ERROR'>('SYNCING');
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [serverVersion, setServerVersion] = useState<number>(0);
  const serverVersionRef = React.useRef<number>(0);

  // User feedback toast for synchronization actions
  const [syncToast, setSyncToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showSyncToast = (type: 'success' | 'error' | 'info', message: string) => {
    setSyncToast({ type, message });
    setTimeout(() => setSyncToast(null), 3500);
  };

  // Multi-user shared server database synchronization (READ-ONLY from central server)
  const triggerSync = async (isManual = false) => {
    try {
      if (isManual) setSyncStatus('SYNCING');
      let serverData = await fetchServerDatabase();

      // If initial attempt failed, retry once after 600ms (smoothly handles server restart)
      if (!serverData || !serverData.success) {
        await new Promise(r => setTimeout(r, 600));
        serverData = await fetchServerDatabase();
      }

      if (serverData && serverData.success) {
        const serverDossiers = serverData.dossiers || [];
        const serverCheques = serverData.cheques || [];

        setDossiers(serverDossiers);
        setCheques(serverCheques);
        saveStoredDossiers(serverDossiers);
        saveStoredCheques(serverCheques);

        if (serverData.settings) {
          setSettings(serverData.settings);
          saveAppSettings(serverData.settings);
        }

        if (serverData.version !== undefined) {
          serverVersionRef.current = serverData.version;
          setServerVersion(serverData.version);
        }
        setSyncStatus('SYNCED');
        const timeNow = new Date().toLocaleTimeString('fr-FR');
        setLastSyncTime(timeNow);
        if (isManual) {
          showSyncToast('success', `Base Centrale : Synchronisation réussie (${serverDossiers.length} dossiers, ${serverCheques.length} chèques connectés)`);
        }
      } else {
        setSyncStatus('ERROR');
        if (isManual) {
          showSyncToast('error', serverData?.error || 'Erreur lors de la synchronisation avec le serveur central');
        }
      }
    } catch (err: any) {
      console.error('Sync error:', err);
      setSyncStatus('ERROR');
      if (isManual) {
        showSyncToast('error', `Erreur de connexion : ${err?.message || 'Serveur indisponible'}`);
      }
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Initial sync immediately upon mounting
    triggerSync();

    // Auto-sync polling every 2 seconds: guarantees changes on PC 1 (Adel) appear on PC 2 (Sofiane) in real-time
    const intervalId = setInterval(async () => {
      try {
        const serverData = await fetchServerDatabase();
        if (serverData && serverData.success && isMounted) {
          // As long as the server responds with 200, the app is online and synced
          setSyncStatus('SYNCED');
          setLastSyncTime(new Date().toLocaleTimeString('fr-FR'));

          if (serverData.version !== undefined && serverData.version !== serverVersionRef.current) {
            serverVersionRef.current = serverData.version;
            setServerVersion(serverData.version);
            if (Array.isArray(serverData.dossiers)) {
              setDossiers(serverData.dossiers);
              saveStoredDossiers(serverData.dossiers);
            }
            if (Array.isArray(serverData.cheques)) {
              setCheques(serverData.cheques);
              saveStoredCheques(serverData.cheques);
            }
            if (serverData.settings) {
              setSettings(serverData.settings);
              saveAppSettings(serverData.settings);
            }
          }
        }
      } catch (e) {
        // Silently continue
      }
    }, 2000);

    const handleFocus = () => {
      triggerSync();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Urgent cautions count (conteneur rendu mais chèque bloqué chez l'armateur)
  const urgentCautionsCount = cheques.filter(c => c.status === 'A_RECUPERER').length;

  // Currency handler
  const handleCurrencyChange = (curr: string) => {
    const updated = { ...settings, defaultCurrency: curr };
    setSettings(updated);
    saveAppSettings(updated);
    pushServerDatabase({ settings: updated, actor: session?.user?.fullName || 'Transit SCHB' });
  };

  // Cheque actions
  const handleSaveCheque = (data: Partial<TransitCheque>) => {
    const nowStr = new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
    let updatedCheques: TransitCheque[] = [];

    if (editingCheque) {
      // Update existing
      updatedCheques = cheques.map(item => {
        if (item.id === editingCheque.id) {
          const updated: TransitCheque = {
            ...item,
            ...data,
            auditTrail: [
              {
                id: `log-${Date.now()}`,
                date: nowStr,
                action: 'Modification des détails du chèque',
                actor: session ? `${session.user.fullName} (${session.user.role})` : 'Responsable Transit',
                comment: 'Mise à jour des informations administratives'
              },
              ...(item.auditTrail || [])
            ]
          } as TransitCheque;
          if (selectedChequeDetail?.id === item.id) {
            setSelectedChequeDetail(updated);
          }
          return updated;
        }
        return item;
      });
    } else {
      // Create new
      const newCheque: TransitCheque = {
        id: `chq-${Date.now()}`,
        chequeNumber: data.chequeNumber || `CHQ-${Math.floor(100000 + Math.random() * 900000)}`,
        bankName: data.bankName || settings.defaultBankName || 'BEA (Banque Extérieure d\'Algérie)',
        direction: data.direction || 'EMIS',
        category: data.category || 'CAUTION_CONTENEUR',
        amount: Number(data.amount) || 0,
        currency: data.currency || settings.defaultCurrency,
        dossierNumber: data.dossierNumber || 'TR-2026-000',
        clientName: data.clientName || 'Client Standard',
        beneficiary: data.beneficiary || 'Bénéficiaire',
        dateEmission: data.dateEmission || new Date().toISOString().slice(0, 10),
        dateEcheance: data.dateEcheance,
        dateRemiseCoursier: data.dateRemiseCoursier,
        coursierName: data.coursierName,
        status: data.status || 'EMIS',
        containerInfo: data.containerInfo,
        observations: data.observations,
        attachmentsCount: 1,
        auditTrail: [
          {
            id: `log-${Date.now()}`,
            date: nowStr,
            action: 'Création et enregistrement du chèque',
            actor: session ? `${session.user.fullName} (${session.user.role})` : 'Caisse Service Transit'
          }
        ]
      };

      updatedCheques = [newCheque, ...cheques];
    }

    const savedCheque = editingCheque 
      ? updatedCheques.find(c => c.id === editingCheque.id) || updatedCheques[0]
      : updatedCheques[0];

    setCheques(updatedCheques);
    saveStoredCheques(updatedCheques);
    saveServerCheque(savedCheque, session?.user?.fullName || 'Transit SCHB').then(res => {
      if (res && res.version) {
        serverVersionRef.current = res.version;
        setServerVersion(res.version);
      }
    });

    setIsChequeFormOpen(false);
    setEditingCheque(null);
    setPrefillDossier(undefined);
  };

  const handleDeleteCheque = (id: string) => {
    const updated = cheques.filter(c => c.id !== id);
    setCheques(updated);
    saveStoredCheques(updated);
    deleteServerCheque(id, session?.user?.fullName || 'Transit SCHB').then(res => {
      if (res && res.version) {
        serverVersionRef.current = res.version;
        setServerVersion(res.version);
      }
    });
    if (selectedChequeDetail?.id === id) {
      setSelectedChequeDetail(null);
    }
  };

  const handleUpdateStatus = (id: string, newStatus: ChequeStatus, comment?: string) => {
    const nowStr = new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
    const updatedList = cheques.map(c => {
      if (c.id === id) {
        const extraUpdates: Partial<TransitCheque> = {};
        if (newStatus === 'REMIS_COURSIER' && !c.dateRemiseCoursier) {
          extraUpdates.dateRemiseCoursier = new Date().toISOString().slice(0, 10);
        }
        if ((newStatus === 'DECAISSE' || newStatus === 'ENCAISSE') && !c.dateEncaissement) {
          extraUpdates.dateEncaissement = new Date().toISOString().slice(0, 10);
        }

        const updated: TransitCheque = {
          ...c,
          status: newStatus,
          ...extraUpdates,
          auditTrail: [
            {
              id: `log-${Date.now()}`,
              date: nowStr,
              action: `Changement de statut : ${newStatus}`,
              actor: session ? `${session.user.fullName} (${session.user.role})` : 'Service Transit',
              comment: comment || 'Mise à jour opérationnelle'
            },
            ...(c.auditTrail || [])
          ]
        };

        if (selectedChequeDetail?.id === id) {
          setSelectedChequeDetail(updated);
        }
        return updated;
      }
      return c;
    });

    setCheques(updatedList);
    saveStoredCheques(updatedList);
    const updatedCheque = updatedList.find(c => c.id === id);
    if (updatedCheque) {
      saveServerCheque(updatedCheque, session?.user?.fullName || 'Transit SCHB').then(res => {
        if (res && res.version) {
          serverVersionRef.current = res.version;
          setServerVersion(res.version);
        }
      });
    }
  };

  const handleSaveContainerRestitution = (
    chequeId: string, 
    actualReturnDate: string, 
    interchangeNumber: string,
    notes?: string
  ) => {
    const nowStr = new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
    const updatedList = cheques.map(c => {
      if (c.id === chequeId && c.containerInfo) {
        const updated: TransitCheque = {
          ...c,
          status: 'A_RECUPERER',
          containerInfo: {
            ...c.containerInfo,
            actualReturnDate,
            interchangeNumber,
            restitutionStatus: 'VIDE_RESTITUE',
            deconsignationRequestDate: new Date().toISOString().slice(0, 10)
          },
          observations: notes ? `${c.observations ? c.observations + ' | ' : ''}${notes}` : c.observations,
          auditTrail: [
            {
              id: `log-${Date.now()}`,
              date: nowStr,
              action: `Restitution conteneur vide confirmée (EIR: ${interchangeNumber})`,
              actor: 'Logistique / Parc',
              comment: 'Chèque passé en attente de déconsignation / récupération armateur'
            },
            ...(c.auditTrail || [])
          ]
        };
        return updated;
      }
      return c;
    });

    setCheques(updatedList);
    saveStoredCheques(updatedList);
    const updatedCheque = updatedList.find(c => c.id === chequeId);
    if (updatedCheque) {
      saveServerCheque(updatedCheque, session?.user?.fullName || 'Transit SCHB').then(res => {
        if (res && res.version) {
          serverVersionRef.current = res.version;
          setServerVersion(res.version);
        }
      });
    }
  };

  // Dossier actions
  const handleSaveDossier = (data: Partial<TransitDossier>) => {
    let updatedList: TransitDossier[] = [];
    let savedDossier: TransitDossier;
    if (editingDossier) {
      savedDossier = { ...editingDossier, ...data } as TransitDossier;
      updatedList = dossiers.map(d => d.id === editingDossier.id ? savedDossier : d);
    } else {
      savedDossier = {
        id: `dossier-${Date.now()}`,
        dossierNumber: data.dossierNumber || 'Fournisseur',
        clientName: data.clientName || 'BC-SCHB',
        clientContact: data.clientContact,
        regime: data.regime || 'IMPORT_DIRECT',
        blNumber: data.blNumber || 'BL-AUTO',
        declarationNumber: data.declarationNumber,
        vesselName: data.vesselName,
        eta: data.eta,
        berthingDate: data.berthingDate,
        bankReceptionDate: data.bankReceptionDate,
        portOfDischarge: data.portOfDischarge || 'Port',
        goodsDescription: data.goodsDescription || 'Marchandises',
        containerCount: data.containerCount || 1,
        status: data.status || 'OUVERT',
        openedDate: new Date().toISOString().slice(0, 10),
        totalProvisionsReceived: 0
      };
      updatedList = [savedDossier, ...dossiers];
    }
    setDossiers(updatedList);
    saveStoredDossiers(updatedList);
    saveServerDossier(savedDossier, session?.user?.fullName || 'Transit SCHB').then(res => {
      if (res && res.version) {
        serverVersionRef.current = res.version;
        setServerVersion(res.version);
      }
    });
    setIsDossierFormOpen(false);
    setEditingDossier(null);
  };

  const handleUpdateDossierStatus = (dossierId: string, newStatus: DossierStatus) => {
    const target = dossiers.find(d => d.id === dossierId);
    if (!target) return;
    const updated: TransitDossier = { ...target, status: newStatus };
    const updatedList = dossiers.map(d => d.id === dossierId ? updated : d);
    setDossiers(updatedList);
    saveStoredDossiers(updatedList);
    saveServerDossier(updated, session?.user?.fullName || 'Transit SCHB').then(res => {
      if (res && res.version) {
        serverVersionRef.current = res.version;
        setServerVersion(res.version);
      }
    });
  };

  const handleAddChequeToDossier = (dossierNumber: string, clientName: string) => {
    setPrefillDossier({ number: dossierNumber, client: clientName });
    setEditingCheque(null);
    setIsChequeFormOpen(true);
  };

  const handleDeleteDossier = (dossierId: string) => {
    const updated = dossiers.filter(d => d.id !== dossierId);
    setDossiers(updated);
    saveStoredDossiers(updated);
    deleteServerDossier(dossierId, session?.user?.fullName || 'Transit SCHB').then(res => {
      if (res && res.version) {
        serverVersionRef.current = res.version;
        setServerVersion(res.version);
      }
    });
  };

  // Cross navigation from dashboard
  const handleNavigateToChequesWithFilter = (filterType: string, value: string) => {
    setActiveFilter({ type: filterType, value });
    setActiveTab('cheques');
  };

  // Bulk bank update handler from settings
  const handleUpdateAllChequesBank = (newBankName: string) => {
    const updated = cheques.map(c => ({
      ...c,
      bankName: newBankName
    }));
    setCheques(updated);
    saveStoredCheques(updated);
    pushServerDatabase({
      cheques: updated,
      actor: session?.user?.fullName || 'Transit SCHB'
    });
  };

  const handleResetDemoData = () => {
    if (confirm('Voulez-vous réinitialiser toutes les données avec les exemples réalistes de transit ?')) {
      const { cheques: initialC, dossiers: initialD } = resetAllDataToDemo();
      setCheques(initialC);
      setDossiers(initialD);
      pushServerDatabase({
        cheques: initialC,
        dossiers: initialD,
        actor: session?.user?.fullName || 'Admin'
      });
    }
  };

  if (!session) {
    return (
      <LoginView
        companyName={settings.companyName}
        onLoginSuccess={() => {
          setSession(getCurrentSession());
          triggerSync();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Real-time sync feedback notification */}
      {syncToast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2 rounded-xl shadow-xl border text-xs font-bold transition-all backdrop-blur-md ${
          syncToast.type === 'error'
            ? 'bg-rose-50/95 text-rose-900 border-rose-300'
            : syncToast.type === 'success'
            ? 'bg-emerald-50/95 text-emerald-950 border-emerald-300'
            : 'bg-cyan-50/95 text-cyan-950 border-cyan-300'
        }`}>
          <span className={`w-2.5 h-2.5 rounded-full ${
            syncToast.type === 'error' ? 'bg-rose-600' : syncToast.type === 'success' ? 'bg-emerald-600' : 'bg-cyan-600'
          }`} />
          <span>{syncToast.message}</span>
        </div>
      )}

      {/* Top Application Header */}
      <Header
        activeTab={activeTab}
        onTabChange={tab => {
          if (tab === 'bordereaux') {
            setIsBordereauModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        onOpenNewChequeModal={() => {
          setEditingCheque(null);
          setPrefillDossier(undefined);
          setIsChequeFormOpen(true);
        }}
        onOpenNewDossierModal={() => {
          setEditingDossier(null);
          setIsDossierFormOpen(true);
        }}
        onOpenBordereauModal={() => {
          if (activeTab === 'cheques' && hasActiveChequeFilters && activeFilteredCheques.length > 0) {
            setPreSelectedForBordereau(activeFilteredCheques);
          } else {
            setPreSelectedForBordereau([]);
          }
          setIsBordereauModalOpen(true);
        }}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onOpenDatabaseModal={() => setIsDatabaseModalOpen(true)}
        onExportCSV={() => exportChequesToCSV(cheques)}
        onResetDemo={handleResetDemoData}
        selectedCurrency={settings.defaultCurrency}
        onCurrencyChange={handleCurrencyChange}
        urgentCautionsCount={urgentCautionsCount}
        currentUser={session.user}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
        onOpenUserManagement={() => {
          setIsCreateUserMode(false);
          setIsUserManagementOpen(true);
        }}
        onOpenCreateUser={() => {
          setIsCreateUserMode(true);
          setIsUserManagementOpen(true);
        }}
        onLogout={() => {
          clearSession();
          setSession(null);
        }}
        syncStatus={syncStatus}
        lastSyncTime={lastSyncTime}
        onForceSync={() => triggerSync(true)}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            cheques={cheques}
            dossiers={dossiers}
            selectedCurrency={settings.defaultCurrency}
            onNavigateToChequesWithFilter={handleNavigateToChequesWithFilter}
            onOpenChequeDetail={cheque => setSelectedChequeDetail(cheque)}
            onOpenNewCheque={() => {
              setEditingCheque(null);
              setPrefillDossier(undefined);
              setIsChequeFormOpen(true);
            }}
            companyName={settings.companyName}
            agencyCity={settings.agencyCity}
            agencyPhone={settings.agencyPhone}
          />
        )}

        {activeTab === 'cheques' && (
          <ChequesTableView
            cheques={cheques}
            onOpenNewCheque={() => {
              setEditingCheque(null);
              setPrefillDossier(undefined);
              setIsChequeFormOpen(true);
            }}
            onOpenChequeDetail={cheque => setSelectedChequeDetail(cheque)}
            onEditCheque={cheque => {
              setEditingCheque(cheque);
              setIsChequeFormOpen(true);
            }}
            onDeleteCheque={handleDeleteCheque}
            onUpdateStatus={handleUpdateStatus}
            onGenerateBordereauForSelection={selected => {
              setPreSelectedForBordereau(selected);
              setIsBordereauModalOpen(true);
            }}
            onFilteredChequesChange={(filtered, hasFilters) => {
              setActiveFilteredCheques(filtered);
              setHasActiveChequeFilters(hasFilters);
            }}
            selectedCurrency={settings.defaultCurrency}
            initialFilter={activeFilter}
          />
        )}

        {activeTab === 'cautions' && (
          <ContainerDepositsView
            cheques={cheques}
            dossiers={dossiers}
            selectedCurrency={settings.defaultCurrency}
            onOpenChequeDetail={cheque => setSelectedChequeDetail(cheque)}
            onUpdateStatus={handleUpdateStatus}
            onSaveContainerRestitution={handleSaveContainerRestitution}
            onOpenNewCheque={() => {
              setEditingCheque(null);
              setPrefillDossier(undefined);
              setIsChequeFormOpen(true);
            }}
          />
        )}

        {activeTab === 'dossiers' && (
          <DossiersView
            dossiers={dossiers}
            cheques={cheques}
            selectedCurrency={settings.defaultCurrency}
            onOpenNewDossier={() => {
              setEditingDossier(null);
              setIsDossierFormOpen(true);
            }}
            onEditDossier={dossier => {
              setEditingDossier(dossier);
              setIsDossierFormOpen(true);
            }}
            onUpdateDossierStatus={handleUpdateDossierStatus}
            onAddChequeToDossier={handleAddChequeToDossier}
            onOpenChequeDetail={cheque => setSelectedChequeDetail(cheque)}
            onDeleteCheque={handleDeleteCheque}
            onDeleteDossier={handleDeleteDossier}
            onPrintDossier={dossier => setPrintingDossier(dossier)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-xs text-slate-500 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img 
              src="/gica_logo.png" 
              alt="Groupe GICA" 
              className="h-8 w-auto object-contain bg-white p-0.5 rounded border border-slate-200"
            />
            <div>
              <div className="font-bold text-slate-800 flex items-center gap-2">
                <span>TRANSIT SCHB</span>
                <span className="text-[10px] text-cyan-800 bg-cyan-50 px-1.5 py-0.2 rounded border border-cyan-200 font-semibold">
                  GROUPE GICA
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Société des Ciments de Hamma Bouziane · Gestion des débours douaniers & cautions conteneurs
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <span className="font-mono text-[11px] font-semibold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
              {cheques.length} chèques · {dossiers.length} dossiers actifs
            </span>
            <div className="text-[11px] font-bold text-slate-900 bg-slate-100/80 px-3 py-1 rounded-lg border border-slate-200 flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-cyan-600"></span>
              <span>Réalisé par : <strong className="text-cyan-800 font-black tracking-wide">NOUI ADEL</strong></span>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ChequeFormModal
        isOpen={isChequeFormOpen}
        onClose={() => {
          setIsChequeFormOpen(false);
          setEditingCheque(null);
          setPrefillDossier(undefined);
        }}
        onSave={handleSaveCheque}
        editingCheque={editingCheque}
        dossiers={dossiers}
        defaultCurrency={settings.defaultCurrency}
        defaultBankName={settings.defaultBankName}
        preselectedDossierNumber={prefillDossier?.number}
        preselectedClientName={prefillDossier?.client}
      />

      <DossierFormModal
        isOpen={isDossierFormOpen}
        onClose={() => {
          setIsDossierFormOpen(false);
          setEditingDossier(null);
        }}
        onSave={handleSaveDossier}
        editingDossier={editingDossier}
        onDelete={handleDeleteDossier}
        onPrint={dossier => setPrintingDossier(dossier)}
      />

      <DossierPrintModal
        isOpen={!!printingDossier}
        onClose={() => setPrintingDossier(null)}
        dossier={printingDossier}
        cheques={cheques}
        companyName={settings.companyName}
        agencyCity={settings.agencyCity}
        agencyPhone={settings.agencyPhone}
        selectedCurrency={settings.defaultCurrency}
      />

      <BordereauModal
        isOpen={isBordereauModalOpen}
        onClose={() => {
          setIsBordereauModalOpen(false);
          setPreSelectedForBordereau([]);
        }}
        availableCheques={cheques}
        preSelectedCheques={preSelectedForBordereau}
        companyName={settings.companyName}
        agencyCity={settings.agencyCity}
        agencyPhone={settings.agencyPhone}
        selectedCurrency={settings.defaultCurrency}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSaveSettings={setSettings}
        cheques={cheques}
        dossiers={dossiers}
        onImportBackup={({ cheques: newC, dossiers: newD, settings: newS }) => {
          setCheques(newC);
          setDossiers(newD);
          if (newS) setSettings(newS);
        }}
        onUpdateAllChequesBank={handleUpdateAllChequesBank}
        currentUser={session.user}
        onForceSync={() => triggerSync(true)}
        syncStatus={syncStatus}
        lastSyncTime={lastSyncTime}
      />

      <ChequeDetailModal
        cheque={selectedChequeDetail}
        onClose={() => setSelectedChequeDetail(null)}
        onUpdateStatus={handleUpdateStatus}
        onEdit={cheque => {
          setSelectedChequeDetail(null);
          setEditingCheque(cheque);
          setIsChequeFormOpen(true);
        }}
        onPrintSingleDischarge={cheque => {
          setPreSelectedForBordereau([cheque]);
          setIsBordereauModalOpen(true);
        }}
        onDeleteCheque={handleDeleteCheque}
      />

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        currentUser={session.user}
        onPasswordChanged={() => {
          setSession(getCurrentSession());
        }}
      />

      <UserManagementModal
        isOpen={isUserManagementOpen}
        onClose={() => {
          setIsUserManagementOpen(false);
          setIsCreateUserMode(false);
        }}
        currentUser={session.user}
        onUsersUpdated={() => {
          setSession(getCurrentSession());
        }}
        initialAddMode={isCreateUserMode}
      />
    </div>
  );
}
