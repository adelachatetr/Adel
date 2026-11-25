import React, { useState } from 'react';
import { 
  FolderArchive, 
  Plus, 
  Search, 
  FileText,
  Filter,
  Trash2,
  Printer,
  CheckCircle,
  AlertTriangle,
  X,
  Anchor
} from 'lucide-react';
import { TransitDossier, TransitCheque, DossierStatus } from '../types/transit';
import { formatAmount, formatEuroAmount, formatShortDate, CATEGORY_LABELS, STATUS_CONFIG, DOSSIER_STATUS_CONFIG, CHEQUE_NATURE_LABELS } from '../utils/storage';

interface DossiersViewProps {
  dossiers: TransitDossier[];
  cheques: TransitCheque[];
  selectedCurrency: string;
  onOpenNewDossier: () => void;
  onEditDossier: (dossier: TransitDossier) => void;
  onUpdateDossierStatus?: (dossierId: string, newStatus: DossierStatus) => void;
  onDeleteDossier: (dossierId: string) => void;
  onPrintDossier: (dossier: TransitDossier) => void;
  onAddChequeToDossier: (dossierNumber: string, clientName: string) => void;
  onOpenChequeDetail: (cheque: TransitCheque) => void;
  onDeleteCheque: (id: string) => void;
}

export const DossiersView: React.FC<DossiersViewProps> = ({
  dossiers,
  cheques,
  selectedCurrency,
  onOpenNewDossier,
  onEditDossier,
  onUpdateDossierStatus,
  onDeleteDossier,
  onPrintDossier,
  onAddChequeToDossier,
  onOpenChequeDetail,
  onDeleteCheque
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | DossierStatus>('ALL');
  const [portFilter, setPortFilter] = useState<string>('ALL');
  const [selectedDossierId, setSelectedDossierId] = useState<string | null>(dossiers[0]?.id || null);
  const [dossierPendingDelete, setDossierPendingDelete] = useState<TransitDossier | null>(null);
  const [chequePendingDelete, setChequePendingDelete] = useState<TransitCheque | null>(null);

  const normalizeText = (val?: string) =>
    (val || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  const PORT_OPTIONS = [
    { key: 'skikda', label: 'Port de Skikda', type: 'PORT' as const },
    { key: 'djendjen', label: 'Port de Djendjen', type: 'PORT' as const },
    { key: 'annaba', label: 'Port d\'Annaba', type: 'PORT' as const },
    { key: 'bejaia', label: 'Port de Béjaïa', type: 'PORT' as const },
    { key: 'alger', label: 'Port d\'Alger', type: 'PORT' as const },
    { key: 'oran', label: 'Port d\'Oran', type: 'PORT' as const },
    { key: 'arzew', label: 'Port d\'Arzew', type: 'PORT' as const },
    { key: 'mostaganem', label: 'Port de Mostaganem', type: 'PORT' as const },
    { key: 'ghazaouet', label: 'Port de Ghazaouet', type: 'PORT' as const },
    { key: 'tenes', label: 'Port de Ténès', type: 'PORT' as const },
    { key: 'dellys', label: 'Port de Dellys', type: 'PORT' as const }
  ];

  const AIRPORT_OPTIONS = [
    { key: 'aeroport_constantine', city: 'constantine', label: 'Aéroport de Constantine', type: 'AIRPORT' as const },
    { key: 'aeroport_annaba', city: 'annaba', label: 'Aéroport d\'Annaba', type: 'AIRPORT' as const },
    { key: 'aeroport_alger', city: 'alger', label: 'Aéroport d\'Alger', type: 'AIRPORT' as const }
  ];

  const matchesPort = (portOfDischarge: string | undefined, selectedKey: string) => {
    if (selectedKey === 'ALL') return true;
    const normPort = normalizeText(portOfDischarge);
    if (!normPort) return false;

    const airportMatch = AIRPORT_OPTIONS.find(a => a.key === selectedKey);
    if (airportMatch) {
      return normPort.includes('aeroport') && normPort.includes(airportMatch.city);
    }

    const normSelected = normalizeText(selectedKey);
    return normPort.includes(normSelected) && !normPort.includes('aeroport');
  };

  const filteredDossiers = dossiers.filter(d => {
    if (statusFilter !== 'ALL' && d.status !== statusFilter) return false;
    if (!matchesPort(d.portOfDischarge, portFilter)) return false;
    if (!searchTerm.trim()) return true;
    const q = normalizeText(searchTerm);
    return (
      normalizeText(d.dossierNumber).includes(q) ||
      normalizeText(d.clientName).includes(q) ||
      normalizeText(d.blNumber).includes(q) ||
      normalizeText(d.demandNature).includes(q) ||
      normalizeText(d.declarationNumber).includes(q) ||
      normalizeText(d.deliveryMode).includes(q) ||
      normalizeText(d.vesselName).includes(q) ||
      normalizeText(d.portOfDischarge).includes(q)
    );
  });

  const selectedDossier = filteredDossiers.find(d => d.id === selectedDossierId) || filteredDossiers[0];

  // Cheques attached to the selected dossier
  const attachedCheques = selectedDossier 
    ? cheques.filter(c => c.dossierNumber.toLowerCase() === selectedDossier.dossierNumber.toLowerCase())
    : [];

  const totalDebourseDossier = attachedCheques
    .filter(c => c.direction === 'EMIS' && c.status !== 'ANNULE')
    .reduce((sum, c) => sum + c.amount, 0);

  const totalProvisionsDossier = attachedCheques
    .filter(c => c.direction === 'RECU' && c.status !== 'ANNULE')
    .reduce((sum, c) => sum + c.amount, 0);

  const balanceDossier = totalProvisionsDossier - totalDebourseDossier;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-200">
              <FolderArchive className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                Portefeuille des Dossiers de Transit
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Suivi financier par dossier de dédouanement : balance avances vs débours réels engagés.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenNewDossier}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-cyan-600/30 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Nouveau Dossier</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left side dossiers list, Right side detail of selected dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Dossiers List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-2xs space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Chercher dossier, B/L, BC, port..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-cyan-600 font-medium"
                />
              </div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:bg-white focus:border-cyan-600 cursor-pointer shrink-0"
                title="Filtrer par statut dossier"
              >
                <option value="ALL">Statuts ({dossiers.length})</option>
                <option value="EN_ATTENTE_RECEPTION">En attente de réception</option>
                <option value="RECEPTIONNE">Réceptionné</option>
                <option value="OUVERT">Ouvert</option>
                <option value="ARRIVEE_PARTIELLE">Arrivée partielle</option>
                <option value="MANQUE_SUR_LIVRAISON">Manque sur livraison</option>
                <option value="EN_DEDOUANEMENT">En Dédouanement</option>
                <option value="BON_A_DELIVRER">BAD</option>
                <option value="TRANSMIS_POUR_PAIEMENT">Transmis pour paiement</option>
                <option value="SORTI_PORT">Sorti Port</option>
                <option value="SOLDE_ARCHIVE">Soldé</option>
              </select>
            </div>

            {/* Port et Aéroport de Débarquement Filter */}
            <div className="space-y-1.5 pt-1 border-t border-slate-100">
              <div className="flex items-center justify-between gap-2">
                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <Anchor className="h-3.5 w-3.5 text-cyan-700" />
                  <span>Port et Aéroport de Débarquement</span>
                </label>
                {(portFilter !== 'ALL' || statusFilter !== 'ALL' || searchTerm.trim() !== '') && (
                  <button
                    type="button"
                    onClick={() => {
                      setPortFilter('ALL');
                      setStatusFilter('ALL');
                      setSearchTerm('');
                    }}
                    className="text-[10px] font-bold text-cyan-700 hover:text-cyan-900 underline cursor-pointer"
                  >
                    Réinitialiser ({filteredDossiers.length}/{dossiers.length})
                  </button>
                )}
              </div>

              <select
                value={portFilter}
                onChange={e => setPortFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:bg-white focus:border-cyan-600 cursor-pointer"
                title="Filtrer par Port et Aéroport de Débarquement"
              >
                <option value="ALL">Tous les Ports et Aéroports ({dossiers.length})</option>
                <optgroup label="Ports d'Algérie">
                  {PORT_OPTIONS.map(port => {
                    const count = dossiers.filter(d => matchesPort(d.portOfDischarge, port.key)).length;
                    return (
                      <option key={port.key} value={port.key}>
                        {port.label} ({count})
                      </option>
                    );
                  })}
                </optgroup>
                <optgroup label="Aéroports d'Algérie">
                  {AIRPORT_OPTIONS.map(airport => {
                    const count = dossiers.filter(d => matchesPort(d.portOfDischarge, airport.key)).length;
                    return (
                      <option key={airport.key} value={airport.key}>
                        {airport.label} ({count})
                      </option>
                    );
                  })}
                </optgroup>
              </select>

              {/* Quick clickable port & airport filter buttons */}
              <div className="flex flex-wrap gap-1 pt-0.5">
                {[
                  { key: 'ALL', label: 'Tous' },
                  { key: 'skikda', label: 'Skikda' },
                  { key: 'annaba', label: 'Annaba' },
                  { key: 'bejaia', label: 'Béjaïa' },
                  { key: 'alger', label: 'Alger' },
                  { key: 'oran', label: 'Oran' },
                  { key: 'djendjen', label: 'Djendjen' },
                  { key: 'aeroport_constantine', label: '✈ Constantine' },
                  { key: 'aeroport_annaba', label: '✈ Annaba' },
                  { key: 'aeroport_alger', label: '✈ Alger' }
                ].map(item => {
                  const isActive = portFilter === item.key;
                  const count = item.key === 'ALL'
                    ? dossiers.length
                    : dossiers.filter(d => matchesPort(d.portOfDischarge, item.key)).length;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setPortFilter(item.key)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-cyan-600 text-white border-cyan-600 shadow-2xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-cyan-400 hover:text-cyan-800'
                      }`}
                    >
                      {item.label} <span className={isActive ? 'text-cyan-100' : 'text-slate-400'}>({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-2 max-h-[650px] overflow-y-auto pr-1">
            {filteredDossiers.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-6 text-center space-y-2 shadow-2xs">
                <Anchor className="h-6 w-6 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-600">
                  Aucun dossier trouvé pour ce port ou filtre.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setPortFilter('ALL');
                    setStatusFilter('ALL');
                    setSearchTerm('');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-800 text-xs font-bold border border-cyan-200 cursor-pointer"
                >
                  Afficher tous les dossiers
                </button>
              </div>
            ) : (
              filteredDossiers.map(dossier => {
                const isSelected = selectedDossier?.id === dossier.id;
                const dossierCheques = cheques.filter(c => c.dossierNumber.toLowerCase() === dossier.dossierNumber.toLowerCase());
                const debours = dossierCheques.filter(c => c.direction === 'EMIS').reduce((s, c) => s + c.amount, 0);
                const statusCfg = DOSSIER_STATUS_CONFIG[dossier.status] || {
                  label: dossier.status,
                  textClass: 'text-slate-700 font-semibold',
                  bgClass: 'bg-slate-100',
                  borderClass: 'border-slate-200'
                };

                return (
                  <div
                    key={dossier.id}
                    onClick={() => setSelectedDossierId(dossier.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white border-cyan-600 shadow-md shadow-cyan-600/10 ring-1 ring-cyan-600'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-cyan-800 block">Fournisseur</span>
                        <span className="text-xs font-bold text-slate-900">
                          {dossier.dossierNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${statusCfg.bgClass} ${statusCfg.textClass} ${statusCfg.borderClass}`}>
                          {statusCfg.label}
                        </span>
                        {dossier.bcAmountEur !== undefined && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-900 font-mono font-bold border border-blue-200">
                            {formatEuroAmount(dossier.bcAmountEur)}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPrintDossier(dossier);
                          }}
                          className="p-1 rounded-md text-slate-400 hover:text-cyan-700 hover:bg-cyan-50 transition-colors cursor-pointer"
                          title="Imprimer la fiche de ce dossier"
                        >
                          <Printer className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDossierPendingDelete(dossier);
                          }}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Supprimer ce dossier"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-xs font-bold text-slate-800 mt-2 truncate flex items-center gap-1.5" title={dossier.clientName}>
                      <span className="text-[10px] text-slate-500 font-medium">N° BC/CNT:</span>
                      <span className="font-mono text-cyan-800 font-bold">{dossier.clientName}</span>
                    </div>

                    <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between gap-2 font-medium flex-wrap">
                      <span className="font-mono">
                        {dossier.transportDocType === 'LTA' ? 'LTA' : 'B/L'}: {dossier.blNumber}
                      </span>
                      {dossier.portOfDischarge && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-900 border border-cyan-200 font-semibold truncate max-w-[160px]" title={dossier.portOfDischarge}>
                          {normalizeText(dossier.portOfDischarge).includes('aeroport') ? '✈' : '⚓'} {dossier.portOfDischarge}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
                      <span className="text-slate-500 font-medium">{dossierCheques.length} chèque(s)</span>
                      <span className="font-mono text-slate-900 font-bold">
                        {formatAmount(debours, selectedCurrency)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right column: Selected Dossier Deep Dive (8 cols) */}
        {selectedDossier ? (
          <div className="lg:col-span-8 space-y-4">
            {/* Header of selected dossier */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] uppercase font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                      Fournisseur
                    </span>
                    <span className="text-base font-bold text-slate-900">
                      {selectedDossier.dossierNumber}
                    </span>
                    {(() => {
                      const selStatusCfg = DOSSIER_STATUS_CONFIG[selectedDossier.status] || {
                        label: selectedDossier.status,
                        textClass: 'text-slate-700 font-semibold',
                        bgClass: 'bg-slate-100',
                        borderClass: 'border-slate-200'
                      };
                      return (
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs px-2.5 py-0.5 rounded-lg font-bold border ${selStatusCfg.bgClass} ${selStatusCfg.textClass} ${selStatusCfg.borderClass}`}>
                            {selStatusCfg.label}
                          </span>
                          {onUpdateDossierStatus && (
                            <select
                              value={selectedDossier.status}
                              onChange={e => onUpdateDossierStatus(selectedDossier.id, e.target.value as DossierStatus)}
                              className="text-[11px] font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg px-2 py-0.5 text-slate-700 cursor-pointer focus:outline-none focus:border-cyan-600 transition-colors"
                              title="Changer rapidement le statut du dossier"
                            >
                              <option value="EN_ATTENTE_RECEPTION">En attente de réception</option>
                              <option value="RECEPTIONNE">Réceptionné</option>
                              <option value="OUVERT">Ouvert / Préparation</option>
                              <option value="ARRIVEE_PARTIELLE">Arrivée partielle</option>
                              <option value="MANQUE_SUR_LIVRAISON">Manque sur livraison</option>
                              <option value="EN_DEDOUANEMENT">En Dédouanement</option>
                              <option value="BON_A_DELIVRER">Bon à Délivrer (BAD)</option>
                              <option value="TRANSMIS_POUR_PAIEMENT">Transmis pour paiement</option>
                              <option value="SORTI_PORT">Sorti Port / Livré</option>
                              <option value="SOLDE_ARCHIVE">Soldé & Archivé</option>
                            </select>
                          )}
                        </div>
                      );
                    })()}
                    <span className="text-xs text-cyan-700 font-mono font-bold">
                      · {selectedDossier.transportDocType === 'LTA' ? 'LTA' : 'B/L'} {selectedDossier.blNumber}
                    </span>
                    <span className="text-xs text-emerald-700 font-bold">
                      · Nature De Demande : {selectedDossier.demandNature || 'B/C'}
                    </span>
                  </div>
                  <h2 className="text-sm font-bold text-slate-800 mt-1.5 flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-slate-500 font-semibold uppercase">N° BC/CNT :</span>
                    <span className="font-mono text-cyan-900 font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                      {selectedDossier.clientName}
                    </span>
                    {selectedDossier.bcAmountEur !== undefined && (
                      <span className="font-mono text-blue-900 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs">
                        Montant BC : {formatEuroAmount(selectedDossier.bcAmountEur)}
                      </span>
                    )}
                  </h2>
                  <div className="text-xs text-slate-500 mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 font-medium">
                    <span>
                      {normalizeText(selectedDossier.portOfDischarge).includes('aeroport') ? 'Aéroport' : 'Port'} : <strong>{selectedDossier.portOfDischarge}</strong>
                    </span>
                    {(selectedDossier.deliveryMode || selectedDossier.vesselName) && (
                      <span>
                        Mode de livraison : <strong className="font-mono">{selectedDossier.deliveryMode || selectedDossier.vesselName}</strong>
                      </span>
                    )}
                    <span>Marchandise : {selectedDossier.goodsDescription}</span>
                    {selectedDossier.berthingDate && (
                      <span className="text-cyan-900 font-bold bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-200 flex items-center gap-1">
                        ⚓ Accostage : <strong className="font-mono">{formatShortDate(selectedDossier.berthingDate)}</strong>
                      </span>
                    )}
                    {selectedDossier.bankReceptionDate && (
                      <span className="text-blue-900 font-bold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 flex items-center gap-1">
                        🏦 Reçu Banque : <strong className="font-mono">{formatShortDate(selectedDossier.bankReceptionDate)}</strong>
                      </span>
                    )}
                    {selectedDossier.forwarderDeclarationDate && (
                      <span className="text-emerald-900 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                        📄 Déclaration Transitaire : <strong className="font-mono">{formatShortDate(selectedDossier.forwarderDeclarationDate)}</strong>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start">
                  {selectedDossier.status !== 'TRANSMIS_POUR_PAIEMENT' && onUpdateDossierStatus && (
                    <button
                      type="button"
                      onClick={() => onUpdateDossierStatus(selectedDossier.id, 'TRANSMIS_POUR_PAIEMENT')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                      title="Changer le statut à Transmis pour paiement"
                    >
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Transmis pour paiement</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onPrintDossier(selectedDossier)}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 border border-slate-300 transition-colors shadow-2xs cursor-pointer"
                    title="Imprimer la fiche et le bilan de ce dossier"
                  >
                    <Printer className="h-3.5 w-3.5 text-cyan-600" />
                    <span>Imprimer Dossier</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDossierPendingDelete(selectedDossier)}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 text-xs font-semibold flex items-center gap-1.5 border border-slate-300 hover:border-rose-300 transition-colors shadow-2xs cursor-pointer"
                    title="Supprimer définitivement ce dossier"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                    <span>Supprimer Dossier</span>
                  </button>

                  <button
                    onClick={() => onEditDossier(selectedDossier)}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 border border-slate-300 transition-colors shadow-2xs cursor-pointer"
                  >
                    <span>Modifier</span>
                  </button>

                  <button
                    onClick={() => onAddChequeToDossier(selectedDossier.dossierNumber, selectedDossier.clientName)}
                    className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-cyan-600/30 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Ajouter Chèque</span>
                  </button>
                </div>
              </div>

              {/* Financial Balance Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-100">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 font-semibold">Total Débours Chèques</span>
                  <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                    {formatAmount(totalDebourseDossier, selectedCurrency)}
                  </div>
                </div>

                <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200">
                  <span className="text-xs text-emerald-800 font-semibold">Avances Reçues Client</span>
                  <div className="text-base font-bold font-mono text-emerald-950 mt-0.5">
                    {formatAmount(totalProvisionsDossier, selectedCurrency)}
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 font-semibold">Solde Dossier</span>
                  <div className={`text-base font-bold font-mono mt-0.5 ${
                    balanceDossier >= 0 ? 'text-teal-700 font-bold' : 'text-rose-700 font-bold'
                  }`}>
                    {balanceDossier >= 0 ? '+' : ''}{formatAmount(balanceDossier, selectedCurrency)}
                  </div>
                </div>
              </div>
            </div>

            {/* List of Cheques in this Dossier */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-cyan-600" />
                  <span>Chèques Rattachés à ce Dossier ({attachedCheques.length})</span>
                </h3>
              </div>

              {attachedCheques.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs italic">
                  Aucun chèque n'a encore été émis ou enregistré pour ce dossier.
                </div>
              ) : (
                <div className="space-y-2">
                  {attachedCheques.map(chq => {
                    const statusCfg = STATUS_CONFIG[chq.status] || STATUS_CONFIG.BROUILLON;
                    const catCfg = CATEGORY_LABELS[chq.category];
                    const natureCfg = CHEQUE_NATURE_LABELS[chq.chequeNature || 'ORDINAIRE'];
                    const isBlankPending = chq.chequeNature === 'A_BLANC' && chq.amount === 0;

                    return (
                      <div
                        key={chq.id}
                        onClick={() => onOpenChequeDetail(chq)}
                        className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] px-2 py-0.5 rounded-md border font-bold ${natureCfg.bgClass} ${natureCfg.textClass} ${natureCfg.borderClass}`}>
                              {natureCfg.label}
                            </span>
                            <span className="font-mono text-xs font-bold text-slate-700">
                              {chq.chequeNumber}
                            </span>
                            <span className="text-xs text-slate-600 font-medium">
                              · {chq.beneficiary}
                            </span>
                            <span className={`text-[10px] px-2 py-0.2 rounded-md border font-semibold ${statusCfg.bgClass} ${statusCfg.textClass} ${statusCfg.borderClass}`}>
                              {statusCfg.label}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1 flex items-center gap-3 font-medium flex-wrap">
                            <span>Nature: <strong className="text-slate-800 font-semibold">{catCfg?.label || chq.category}</strong></span>
                            <span>Banque: {chq.bankName}</span>
                            <span>Émis le: {formatShortDate(chq.dateEmission)}</span>
                          </div>
                          {chq.containerInfo && (
                            <div className="text-xs text-amber-800 font-mono font-bold mt-0.5">
                              Conteneurs: {chq.containerInfo.containerNumbers.join(', ')} ({chq.containerInfo.shippingLine})
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center">
                          <div className="text-right">
                            <div className={`text-sm font-mono font-bold ${isBlankPending ? 'text-red-700' : 'text-slate-900'}`}>
                              {isBlankPending ? `0,00\u00A0${chq.currency}` : formatAmount(chq.amount, chq.currency)}
                            </div>
                            <div className={`text-[11px] font-medium ${isBlankPending ? 'text-red-600' : 'text-slate-400'}`}>
                              {isBlankPending
                                ? 'En attente de facture'
                                : (chq.coursierName ? `Coursier: ${chq.coursierName}` : 'Non remis')}
                            </div>
                          </div>

                          {/* Bouton Supprimer en cas d'erreur */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setChequePendingDelete(chq);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                            title="Supprimer ce chèque en cas d'erreur"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                            <span className="text-rose-600 font-medium">Supprimer</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs italic">
            {filteredDossiers.length === 0
              ? 'Aucun dossier ne correspond aux critères de recherche ou de port sélectionnés.'
              : 'Sélectionnez un dossier à gauche pour consulter son historique complet.'}
          </div>
        )}
      </div>

      {/* Modal de confirmation de suppression de dossier */}
      {dossierPendingDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Supprimer le dossier</h3>
                  <p className="text-xs text-slate-500 font-medium">Confirmation requise</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDossierPendingDelete(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              Êtes-vous sûr de vouloir supprimer définitivement le dossier <strong>{dossierPendingDelete.dossierNumber}</strong> (BC: <span className="font-mono font-bold">{dossierPendingDelete.clientName}</span>) ? Cette action est irréversible.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDossierPendingDelete(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteDossier(dossierPendingDelete.id);
                  setDossierPendingDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer shadow-sm"
              >
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression de chèque */}
      {chequePendingDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Supprimer le chèque</h3>
                  <p className="text-xs text-slate-500 font-medium">Confirmation requise</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setChequePendingDelete(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              Êtes-vous sûr de vouloir supprimer définitivement le chèque n° <strong className="font-mono">{chequePendingDelete.chequeNumber}</strong> ({formatAmount(chequePendingDelete.amount, chequePendingDelete.currency)}) ?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setChequePendingDelete(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteCheque(chequePendingDelete.id);
                  setChequePendingDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer shadow-sm"
              >
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
