import React, { useState } from 'react';
import { 
  FolderArchive, 
  Plus, 
  Search, 
  FileText,
  Filter,
  Trash2,
  Printer
} from 'lucide-react';
import { TransitDossier, TransitCheque, DossierStatus } from '../types/transit';
import { formatAmount, formatShortDate, CATEGORY_LABELS, STATUS_CONFIG, DOSSIER_STATUS_CONFIG } from '../utils/storage';

interface DossiersViewProps {
  dossiers: TransitDossier[];
  cheques: TransitCheque[];
  selectedCurrency: string;
  onOpenNewDossier: () => void;
  onEditDossier: (dossier: TransitDossier) => void;
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
  onDeleteDossier,
  onPrintDossier,
  onAddChequeToDossier,
  onOpenChequeDetail,
  onDeleteCheque
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | DossierStatus>('ALL');
  const [selectedDossierId, setSelectedDossierId] = useState<string | null>(dossiers[0]?.id || null);

  const filteredDossiers = dossiers.filter(d => {
    if (statusFilter !== 'ALL' && d.status !== statusFilter) return false;
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      d.dossierNumber.toLowerCase().includes(q) ||
      d.clientName.toLowerCase().includes(q) ||
      d.blNumber.toLowerCase().includes(q) ||
      (d.declarationNumber || '').toLowerCase().includes(q) ||
      (d.vesselName || '').toLowerCase().includes(q)
    );
  });

  const selectedDossier = dossiers.find(d => d.id === selectedDossierId) || filteredDossiers[0];

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
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Chercher dossier, B/L, client..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-600 font-medium"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-cyan-600 cursor-pointer shrink-0"
              title="Filtrer par statut dossier"
            >
              <option value="ALL">Tous ({dossiers.length})</option>
              <option value="RECEPTIONNE">Réceptionné</option>
              <option value="OUVERT">Ouvert</option>
              <option value="EN_DEDOUANEMENT">En Dédouanement</option>
              <option value="BON_A_DELIVRER">BAD</option>
              <option value="SORTI_PORT">Sorti Port</option>
              <option value="SOLDE_ARCHIVE">Soldé</option>
            </select>
          </div>

          <div className="space-y-2 max-h-[650px] overflow-y-auto pr-1">
            {filteredDossiers.map(dossier => {
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
                    <span className="font-mono text-xs font-bold text-cyan-700">
                      {dossier.dossierNumber}
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${statusCfg.bgClass} ${statusCfg.textClass} ${statusCfg.borderClass}`}>
                        {statusCfg.label}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                        {dossier.regime.replace('_', ' ')}
                      </span>
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
                          const count = dossierCheques.length;
                          const confirmMsg = count > 0
                            ? `Êtes-vous sûr de vouloir supprimer définitivement le dossier ${dossier.dossierNumber} (${dossier.clientName}) ?\n\nAttention : ce dossier contient ${count} chèque(s) rattaché(s). Cette action est irréversible.`
                            : `Êtes-vous sûr de vouloir supprimer définitivement le dossier ${dossier.dossierNumber} (${dossier.clientName}) ?\n\nCette action est irréversible.`;
                          if (window.confirm(confirmMsg)) {
                            onDeleteDossier(dossier.id);
                          }
                        }}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Supprimer ce dossier"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-xs font-bold text-slate-900 mt-1.5 truncate" title={dossier.clientName}>
                    {dossier.clientName}
                  </div>

                  <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5 font-mono font-medium">
                    <span>B/L: {dossier.blNumber}</span>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-500 font-medium">{dossierCheques.length} chèque(s)</span>
                    <span className="font-mono text-slate-900 font-bold">
                      {formatAmount(debours, selectedCurrency)}
                    </span>
                  </div>
                </div>
              );
            })}
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
                    <span className="text-base font-bold font-mono text-slate-900">
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
                        <span className={`text-xs px-2.5 py-0.5 rounded-lg font-bold border ${selStatusCfg.bgClass} ${selStatusCfg.textClass} ${selStatusCfg.borderClass}`}>
                          {selStatusCfg.label}
                        </span>
                      );
                    })()}
                    <span className="text-xs text-cyan-700 font-mono font-bold">
                      · B/L {selectedDossier.blNumber}
                    </span>
                    {selectedDossier.declarationNumber && (
                      <span className="text-xs text-emerald-700 font-mono font-bold">
                        · Douane {selectedDossier.declarationNumber}
                      </span>
                    )}
                  </div>
                  <h2 className="text-sm font-bold text-slate-800 mt-1">
                    Client : {selectedDossier.clientName}
                  </h2>
                  <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 font-medium">
                    <span>Port : {selectedDossier.portOfDischarge}</span>
                    {selectedDossier.vesselName && <span>Navire : {selectedDossier.vesselName}</span>}
                    <span>Marchandise : {selectedDossier.goodsDescription}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start">
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
                    onClick={() => {
                      const count = attachedCheques.length;
                      const confirmMsg = count > 0
                        ? `Êtes-vous sûr de vouloir supprimer définitivement le dossier ${selectedDossier.dossierNumber} (${selectedDossier.clientName}) ?\n\nAttention : ce dossier contient ${count} chèque(s) rattaché(s). Cette action est irréversible.`
                        : `Êtes-vous sûr de vouloir supprimer définitivement le dossier ${selectedDossier.dossierNumber} (${selectedDossier.clientName}) ?\n\nCette action est irréversible.`;
                      if (window.confirm(confirmMsg)) {
                        onDeleteDossier(selectedDossier.id);
                      }
                    }}
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

                    return (
                      <div
                        key={chq.id}
                        onClick={() => onOpenChequeDetail(chq)}
                        className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold text-slate-900">
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
                            <div className="text-sm font-mono font-bold text-slate-900">
                              {formatAmount(chq.amount, chq.currency)}
                            </div>
                            <div className="text-[11px] text-slate-400 font-medium">
                              {chq.coursierName ? `Coursier: ${chq.coursierName}` : 'Non remis'}
                            </div>
                          </div>

                          {/* Bouton Supprimer en cas d'erreur */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Supprimer le chèque n° ${chq.chequeNumber} (${formatAmount(chq.amount, chq.currency)}) du dossier ${selectedDossier.dossierNumber} ?\n\nCette action est irréversible (à utiliser en cas d'erreur de saisie).`)) {
                                onDeleteCheque(chq.id);
                              }
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
            Sélectionnez un dossier à gauche pour consulter son historique complet.
          </div>
        )}
      </div>
    </div>
  );
};
