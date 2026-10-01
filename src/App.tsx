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
import { TransitCheque, TransitDossier, ChequeStatus } from './types/transit';
import { 
  loadStoredCheques, 
  saveStoredCheques, 
  loadStoredDossiers, 
  saveStoredDossiers,
  loadAppSettings,
  saveAppSettings,
  resetAllDataToDemo,
  exportChequesToCSV,
  exportBackupJSON
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

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const [selectedChequeDetail, setSelectedChequeDetail] = useState<TransitCheque | null>(null);

  // Cross-view filters
  const [activeFilter, setActiveFilter] = useState<{ type: string; value: string } | null>(null);

  // Pre-fill parameters when creating a cheque from a specific dossier
  const [prefillDossier, setPrefillDossier] = useState<{ number: string; client: string } | undefined>(undefined);

  // Save changes to localStorage
  useEffect(() => {
    saveStoredCheques(cheques);
  }, [cheques]);

  useEffect(() => {
    saveStoredDossiers(dossiers);
  }, [dossiers]);

  useEffect(() => {
    saveAppSettings(settings);
  }, [settings]);

  // Urgent cautions count (conteneur rendu mais chèque bloqué chez l'armateur)
  const urgentCautionsCount = cheques.filter(c => c.status === 'A_RECUPERER').length;

  // Currency handler
  const handleCurrencyChange = (curr: string) => {
    setSettings(prev => ({ ...prev, defaultCurrency: curr }));
  };

  // Cheque actions
  const handleSaveCheque = (data: Partial<TransitCheque>) => {
    const nowStr = new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });

    if (editingCheque) {
      // Update existing
      setCheques(prev => prev.map(item => {
        if (item.id === editingCheque.id) {
          const updated: TransitCheque = {
            ...item,
            ...data,
            auditTrail: [
              {
                id: `log-${Date.now()}`,
                date: nowStr,
                action: 'Modification des détails du chèque',
                actor: 'Responsable Transit',
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
      }));
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
            actor: 'Caisse Service Transit'
          }
        ]
      };

      setCheques(prev => [newCheque, ...prev]);
    }

    setIsChequeFormOpen(false);
    setEditingCheque(null);
    setPrefillDossier(undefined);
  };

  const handleDeleteCheque = (id: string) => {
    setCheques(prev => prev.filter(c => c.id !== id));
    if (selectedChequeDetail?.id === id) {
      setSelectedChequeDetail(null);
    }
  };

  const handleUpdateStatus = (id: string, newStatus: ChequeStatus, comment?: string) => {
    const nowStr = new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
    setCheques(prev => prev.map(c => {
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
              actor: 'Service Transit',
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
    }));
  };

  const handleSaveContainerRestitution = (
    chequeId: string, 
    actualReturnDate: string, 
    interchangeNumber: string,
    notes?: string
  ) => {
    const nowStr = new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
    setCheques(prev => prev.map(c => {
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
    }));
  };

  // Dossier actions
  const handleSaveDossier = (data: Partial<TransitDossier>) => {
    if (editingDossier) {
      setDossiers(prev => prev.map(d => d.id === editingDossier.id ? { ...d, ...data } as TransitDossier : d));
    } else {
      const newDossier: TransitDossier = {
        id: `dossier-${Date.now()}`,
        dossierNumber: data.dossierNumber || `TR-2026-${Math.floor(100 + Math.random() * 900)}`,
        clientName: data.clientName || 'Nouveau Client',
        clientContact: data.clientContact,
        regime: data.regime || 'IMPORT_DIRECT',
        blNumber: data.blNumber || 'BL-AUTO',
        declarationNumber: data.declarationNumber,
        vesselName: data.vesselName,
        eta: data.eta,
        portOfDischarge: data.portOfDischarge || 'Port',
        goodsDescription: data.goodsDescription || 'Marchandises',
        containerCount: data.containerCount || 1,
        status: data.status || 'OUVERT',
        openedDate: new Date().toISOString().slice(0, 10),
        totalProvisionsReceived: 0
      };
      setDossiers(prev => [newDossier, ...prev]);
    }
    setIsDossierFormOpen(false);
    setEditingDossier(null);
  };

  const handleAddChequeToDossier = (dossierNumber: string, clientName: string) => {
    setPrefillDossier({ number: dossierNumber, client: clientName });
    setEditingCheque(null);
    setIsChequeFormOpen(true);
  };

  const handleDeleteDossier = (dossierId: string) => {
    setDossiers(prev => prev.filter(d => d.id !== dossierId));
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
  };

  const handleResetDemoData = () => {
    if (confirm('Voulez-vous réinitialiser toutes les données avec les exemples réalistes de transit ?')) {
      const { cheques: initialC, dossiers: initialD } = resetAllDataToDemo();
      setCheques(initialC);
      setDossiers(initialD);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
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
          setPreSelectedForBordereau([]);
          setIsBordereauModalOpen(true);
        }}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onExportCSV={() => exportChequesToCSV(cheques)}
        onResetDemo={handleResetDemoData}
        selectedCurrency={settings.defaultCurrency}
        onCurrencyChange={handleCurrencyChange}
        urgentCautionsCount={urgentCautionsCount}
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
            <div className="text-[11px] font-bold text-slate-900 bg-slate-100/80 px-3 py-1 rounded-lg border border-slate-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-600"></span>
              <span>Réalisé par : <strong className="text-cyan-700 font-extrabold">Noui Adel</strong></span>
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
        onImportBackup={({ cheques: newC, dossiers: newD }) => {
          setCheques(newC);
          setDossiers(newD);
        }}
        onUpdateAllChequesBank={handleUpdateAllChequesBank}
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
    </div>
  );
}
