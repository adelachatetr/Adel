import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  FileText,
  Printer,
  ChevronDown,
  CheckSquare,
  Square,
  UserCheck,
  ExternalLink,
  Edit3,
  Trash2,
  Building2,
  Tag,
  X,
  Landmark
} from 'lucide-react';
import { TransitCheque, ChequeStatus, ChequeCategory, ChequeDirection } from '../types/transit';
import { formatAmount, formatShortDate, STATUS_CONFIG, CATEGORY_LABELS } from '../utils/storage';

interface ChequesTableViewProps {
  cheques: TransitCheque[];
  onOpenNewCheque: () => void;
  onOpenChequeDetail: (cheque: TransitCheque) => void;
  onEditCheque: (cheque: TransitCheque) => void;
  onDeleteCheque: (id: string) => void;
  onUpdateStatus: (id: string, newStatus: ChequeStatus, comment?: string) => void;
  onGenerateBordereauForSelection: (selectedCheques: TransitCheque[]) => void;
  selectedCurrency: string;
  initialFilter?: { type: string; value: string } | null;
}

export const ChequesTableView: React.FC<ChequesTableViewProps> = ({
  cheques,
  onOpenNewCheque,
  onOpenChequeDetail,
  onEditCheque,
  onDeleteCheque,
  onUpdateStatus,
  onGenerateBordereauForSelection,
  selectedCurrency,
  initialFilter
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ChequeStatus | 'ALL' | 'CIRCULATION'>(
    initialFilter?.type === 'status' ? (initialFilter.value as any) : 'ALL'
  );
  const [categoryFilter, setCategoryFilter] = useState<ChequeCategory | 'ALL'>(
    initialFilter?.type === 'category' ? (initialFilter.value as any) : 'ALL'
  );
  const [beneficiaryFilter, setBeneficiaryFilter] = useState<string>(
    initialFilter?.type === 'beneficiary' ? initialFilter.value : 'ALL'
  );
  const [bankFilter, setBankFilter] = useState<string>(
    initialFilter?.type === 'bank' ? initialFilter.value : 'ALL'
  );
  const [directionFilter, setDirectionFilter] = useState<ChequeDirection | 'ALL'>('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [quickStatusMenuId, setQuickStatusMenuId] = useState<string | null>(null);

  // Sync initial filter if changed from external navigation
  useEffect(() => {
    if (initialFilter) {
      if (initialFilter.type === 'status') setStatusFilter(initialFilter.value as any);
      if (initialFilter.type === 'category') setCategoryFilter(initialFilter.value as any);
      if (initialFilter.type === 'beneficiary') setBeneficiaryFilter(initialFilter.value);
      if (initialFilter.type === 'bank') setBankFilter(initialFilter.value);
    }
  }, [initialFilter]);

  // Unique beneficiaries list with cheque count
  const uniqueBeneficiaries = useMemo(() => {
    const map = new Map<string, number>();
    cheques.forEach(c => {
      const b = c.beneficiary?.trim();
      if (b) {
        map.set(b, (map.get(b) || 0) + 1);
      }
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0], 'fr'));
  }, [cheques]);

  // Unique banks list with cheque count
  const uniqueBanks = useMemo(() => {
    const map = new Map<string, number>();
    cheques.forEach(c => {
      const b = c.bankName?.trim();
      if (b) {
        map.set(b, (map.get(b) || 0) + 1);
      }
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0], 'fr'));
  }, [cheques]);

  // Filtered cheques
  const filteredCheques = useMemo(() => {
    return cheques.filter(c => {
      // Text search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchNumber = c.chequeNumber.toLowerCase().includes(q);
        const matchDossier = c.dossierNumber.toLowerCase().includes(q);
        const matchClient = c.clientName.toLowerCase().includes(q);
        const matchBeneficiary = c.beneficiary.toLowerCase().includes(q);
        const matchBank = c.bankName.toLowerCase().includes(q);
        const matchCoursier = (c.coursierName || '').toLowerCase().includes(q);
        const matchContainer = (c.containerInfo?.containerNumbers || []).some(cn => cn.toLowerCase().includes(q));
        const matchEIR = (c.containerInfo?.interchangeNumber || '').toLowerCase().includes(q);

        if (!matchNumber && !matchDossier && !matchClient && !matchBeneficiary && !matchBank && !matchCoursier && !matchContainer && !matchEIR) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'CIRCULATION') {
          if (c.status !== 'REMIS_COURSIER' && c.status !== 'DEPOSE') return false;
        } else if (c.status !== statusFilter) {
          return false;
        }
      }

      // Category / Nature filter
      if (categoryFilter !== 'ALL' && c.category !== categoryFilter) {
        return false;
      }

      // Beneficiary filter
      if (beneficiaryFilter !== 'ALL' && c.beneficiary !== beneficiaryFilter) {
        return false;
      }

      // Bank filter
      if (bankFilter !== 'ALL' && c.bankName !== bankFilter) {
        return false;
      }

      // Direction filter
      if (directionFilter !== 'ALL' && c.direction !== directionFilter) {
        return false;
      }

      return true;
    });
  }, [cheques, searchTerm, statusFilter, categoryFilter, beneficiaryFilter, bankFilter, directionFilter]);

  // Active filters count
  const hasActiveFilters = searchTerm !== '' || 
    statusFilter !== 'ALL' || 
    categoryFilter !== 'ALL' || 
    beneficiaryFilter !== 'ALL' || 
    bankFilter !== 'ALL' || 
    directionFilter !== 'ALL';

  const resetAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setCategoryFilter('ALL');
    setBeneficiaryFilter('ALL');
    setBankFilter('ALL');
    setDirectionFilter('ALL');
  };

  // Bulk selection handling
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredCheques.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCheques.map(c => c.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkPrintBordereau = () => {
    const selected = cheques.filter(c => selectedIds.includes(c.id));
    if (selected.length > 0) {
      onGenerateBordereauForSelection(selected);
    }
  };

  const totalFilteredAmount = filteredCheques
    .filter(c => c.direction === 'EMIS' && c.status !== 'ANNULE')
    .reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="space-y-4">
      {/* Top Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par N° chèque, N° dossier, bénéficiaire, banque (BEA...), client, conteneur..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-600 focus:bg-white transition-all font-medium"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Quick Primary Actions */}
          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <button
                onClick={handleBulkPrintBordereau}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-amber-600/30 transition-all cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Bordereau sélection ({selectedIds.length})</span>
              </button>
            )}

            <button
              onClick={onOpenNewCheque}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-cyan-600/30 transition-all whitespace-nowrap cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Nouveau Chèque</span>
            </button>
          </div>
        </div>

        {/* Primary Dropdown Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100 text-xs">
          {/* 1. Filtre par Nature (Catégorie) */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
              <Tag className="h-3.5 w-3.5 text-cyan-700" />
              <span>Nature de Débours</span>
            </label>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-cyan-600 focus:bg-white"
            >
              <option value="ALL">Toutes les natures ({cheques.length})</option>
              {Object.entries(CATEGORY_LABELS).map(([catKey, catVal]) => {
                const count = cheques.filter(c => c.category === catKey).length;
                return (
                  <option key={catKey} value={catKey}>
                    {catVal.label} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          {/* 2. Filtre par Bénéficiaire */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5 text-cyan-700" />
              <span>Bénéficiaire</span>
            </label>
            <select
              value={beneficiaryFilter}
              onChange={e => setBeneficiaryFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-cyan-600 focus:bg-white truncate"
            >
              <option value="ALL">Tous les bénéficiaires ({uniqueBeneficiaries.length})</option>
              {uniqueBeneficiaries.map(([beneficiaryName, count]) => (
                <option key={beneficiaryName} value={beneficiaryName}>
                  {beneficiaryName} ({count})
                </option>
              ))}
            </select>
          </div>

          {/* 3. Filtre par Banque (BEA, BNA, etc.) */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
              <Landmark className="h-3.5 w-3.5 text-cyan-700" />
              <span>Banque Tirée</span>
            </label>
            <select
              value={bankFilter}
              onChange={e => setBankFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-cyan-600 focus:bg-white truncate"
            >
              <option value="ALL">Toutes les banques ({uniqueBanks.length})</option>
              {uniqueBanks.map(([bName, count]) => (
                <option key={bName} value={bName}>
                  {bName} ({count})
                </option>
              ))}
            </select>
          </div>

          {/* 4. Filtre par Statut */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
              <Filter className="h-3.5 w-3.5 text-cyan-700" />
              <span>Statut du Chèque</span>
            </label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-cyan-600 focus:bg-white"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="CIRCULATION">En circulation (Coursier / Déposé)</option>
              <option value="A_RECUPERER">À Récupérer (Vide rendu)</option>
              <option value="REMIS_COURSIER">Remis au coursier</option>
              <option value="DEPOSE">Déposé au guichet</option>
              <option value="DECAISSE">Décaissé (Débité)</option>
              <option value="RECUPERE">Caution Récupérée</option>
              <option value="EMIS">Émis (En caisse)</option>
              <option value="LITIGE">Litige / Surestarie</option>
              <option value="ANNULE">Annulé</option>
            </select>
          </div>

          {/* 5. Filtre par Flux */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
              <FileText className="h-3.5 w-3.5 text-cyan-700" />
              <span>Flux Trésorerie</span>
            </label>
            <select
              value={directionFilter}
              onChange={e => setDirectionFilter(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-cyan-600 focus:bg-white"
            >
              <option value="ALL">Tous flux (Émis & Reçus)</option>
              <option value="EMIS">Débours émis par SCHB</option>
              <option value="RECU">Avances reçues des clients</option>
            </select>
          </div>
        </div>

        {/* Quick Pills for Nature & Fast BEA Filter */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-500 font-bold uppercase mr-1">Accès rapide :</span>
            
            {/* Quick Bank BEA button */}
            <button
              onClick={() => {
                const beaBank = uniqueBanks.find(([b]) => b.toLowerCase().includes('bea'))?.[0];
                if (beaBank) {
                  setBankFilter(bankFilter === beaBank ? 'ALL' : beaBank);
                } else {
                  setBankFilter(bankFilter === "BEA (Banque Extérieure d'Algérie)" ? 'ALL' : "BEA (Banque Extérieure d'Algérie)");
                }
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                bankFilter.toLowerCase().includes('bea')
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
              }`}
              title="Filtrer uniquement les chèques tirés sur la BEA"
            >
              <Landmark className="h-3 w-3" />
              <span>Banque BEA</span>
              {uniqueBanks.find(([b]) => b.toLowerCase().includes('bea')) && (
                <span className="text-[10px] bg-white/20 px-1 rounded">
                  {uniqueBanks.find(([b]) => b.toLowerCase().includes('bea'))?.[1]}
                </span>
              )}
            </button>

            {/* Nature quick buttons */}
            <button
              onClick={() => setCategoryFilter('ALL')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                categoryFilter === 'ALL'
                  ? 'bg-slate-800 text-white font-bold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Toutes natures
            </button>
            <button
              onClick={() => setCategoryFilter(categoryFilter === 'CAUTION_CONTENEUR' ? 'ALL' : 'CAUTION_CONTENEUR')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                categoryFilter === 'CAUTION_CONTENEUR'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              Cautions Conteneurs
            </button>
            <button
              onClick={() => setCategoryFilter(categoryFilter === 'DROITS_DOUANE' ? 'ALL' : 'DROITS_DOUANE')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                categoryFilter === 'DROITS_DOUANE'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              Droits Douane
            </button>
            <button
              onClick={() => setCategoryFilter(categoryFilter === 'FRAIS_MARITIMES' ? 'ALL' : 'FRAIS_MARITIMES')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                categoryFilter === 'FRAIS_MARITIMES'
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'bg-cyan-50 text-cyan-900 border border-cyan-200 hover:bg-cyan-100'
              }`}
            >
              Frais B/L & BAD
            </button>
            <button
              onClick={() => setCategoryFilter(categoryFilter === 'MANUTENTION_PORT' ? 'ALL' : 'MANUTENTION_PORT')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                categoryFilter === 'MANUTENTION_PORT'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'bg-indigo-50 text-indigo-900 border border-indigo-200 hover:bg-indigo-100'
              }`}
            >
              Port / Magasinage
            </button>
          </div>

          {/* Reset button if any filter is active */}
          {hasActiveFilters && (
            <button
              onClick={resetAllFilters}
              className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 hover:underline cursor-pointer ml-auto"
            >
              <X className="h-3.5 w-3.5" />
              <span>Effacer tous les filtres</span>
            </button>
          )}
        </div>

        {/* Active Filter Badges */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-xs">
            <span className="text-[11px] text-slate-500 font-medium">Filtres actifs :</span>
            
            {categoryFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full text-[11px] font-semibold border border-amber-200">
                Nature: {CATEGORY_LABELS[categoryFilter]?.short || categoryFilter}
                <button onClick={() => setCategoryFilter('ALL')} className="hover:text-black">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {beneficiaryFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 bg-cyan-100 text-cyan-900 px-2 py-0.5 rounded-full text-[11px] font-semibold border border-cyan-200">
                Bénéficiaire: {beneficiaryFilter}
                <button onClick={() => setBeneficiaryFilter('ALL')} className="hover:text-black">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {bankFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-900 px-2 py-0.5 rounded-full text-[11px] font-semibold border border-blue-200">
                Banque: {bankFilter}
                <button onClick={() => setBankFilter('ALL')} className="hover:text-black">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {statusFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full text-[11px] font-semibold border border-slate-300">
                Statut: {statusFilter}
                <button onClick={() => setStatusFilter('ALL')} className="hover:text-black">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {directionFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 bg-teal-100 text-teal-900 px-2 py-0.5 rounded-full text-[11px] font-semibold border border-teal-200">
                Flux: {directionFilter === 'EMIS' ? 'Émis' : 'Reçu'}
                <button onClick={() => setDirectionFilter('ALL')} className="hover:text-black">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {searchTerm && (
              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-[11px] font-semibold border border-slate-200">
                Texte: "{searchTerm}"
                <button onClick={() => setSearchTerm('')} className="hover:text-black">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Summary count and total */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-600 font-medium">
        <div className="flex items-center gap-2">
          <span>{filteredCheques.length} chèque(s) trouvé(s)</span>
          {selectedIds.length > 0 && (
            <span className="text-cyan-700 font-bold">({selectedIds.length} sélectionné(s))</span>
          )}
        </div>
        <div className="font-mono">
          Total débours affichés : <span className="font-bold text-slate-900">{formatAmount(totalFilteredAmount, selectedCurrency)}</span>
        </div>
      </div>

      {/* Cheques Main Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="py-3 px-3 w-8">
                  <button 
                    onClick={toggleSelectAll}
                    className="text-slate-400 hover:text-slate-800 cursor-pointer"
                  >
                    {selectedIds.length > 0 && selectedIds.length === filteredCheques.length ? (
                      <CheckSquare className="h-4 w-4 text-cyan-600" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-3 font-bold text-slate-700">N° Chèque & Banque</th>
                <th className="py-3 px-3 font-bold text-slate-700">Dossier / Client</th>
                <th className="py-3 px-3 font-bold text-slate-700">Bénéficiaire & Nature</th>
                <th className="py-3 px-3 font-bold text-slate-700">Montant</th>
                <th className="py-3 px-3 font-bold text-slate-700">Déclarant / Coursier</th>
                <th className="py-3 px-3 font-bold text-slate-700">Statut</th>
                <th className="py-3 px-3 font-bold text-slate-700">Échéance / Suivi</th>
                <th className="py-3 px-3 text-right font-bold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCheques.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <FileText className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    Aucun chèque de transit ne correspond aux critères de recherche.
                  </td>
                </tr>
              ) : (
                filteredCheques.map(chq => {
                  const statusCfg = STATUS_CONFIG[chq.status] || STATUS_CONFIG.BROUILLON;
                  const catCfg = CATEGORY_LABELS[chq.category];
                  const isSelected = selectedIds.includes(chq.id);

                  return (
                    <tr 
                      key={chq.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isSelected ? 'bg-cyan-50/50' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3">
                        <button
                          onClick={() => toggleSelectOne(chq.id)}
                          className="text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-cyan-600" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </td>

                      {/* Cheque Number & Bank */}
                      <td className="py-3 px-3">
                        <div 
                          onClick={() => onOpenChequeDetail(chq)}
                          className="font-mono font-bold text-slate-900 hover:text-cyan-700 cursor-pointer flex items-center gap-1.5"
                        >
                          <span>{chq.chequeNumber}</span>
                          {chq.direction === 'RECU' && (
                            <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded font-sans border border-teal-300 font-bold">
                              Reçu
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 truncate max-w-[170px] font-medium flex items-center gap-1" title={chq.bankName}>
                          {chq.bankName.toLowerCase().includes('bea') ? (
                            <span className="text-[9px] bg-blue-100 text-blue-900 font-extrabold px-1 py-0.2 rounded border border-blue-200 tracking-wider">
                              BEA
                            </span>
                          ) : null}
                          <span className="truncate">{chq.bankName}</span>
                        </div>
                      </td>

                      {/* Dossier & Client */}
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-cyan-700">
                          {chq.dossierNumber}
                        </div>
                        <div className="text-xs text-slate-700 truncate max-w-[170px] font-semibold" title={chq.clientName}>
                          {chq.clientName}
                        </div>
                      </td>

                      {/* Beneficiary & Category */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 truncate max-w-[200px]" title={chq.beneficiary}>
                          {chq.beneficiary}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                          <span>{catCfg?.short || chq.category}</span>
                          {chq.containerInfo && (
                            <span className="text-amber-800 font-mono text-[11px] font-bold">
                              ({chq.containerInfo.shippingLine})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-slate-900 text-sm">
                          {formatAmount(chq.amount, chq.currency)}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium">
                          Émis le {formatShortDate(chq.dateEmission)}
                        </div>
                      </td>

                      {/* Coursier / Déclarant */}
                      <td className="py-3 px-3">
                        {chq.coursierName ? (
                          <div className="flex items-center gap-1 text-slate-700 font-medium">
                            <UserCheck className="h-3.5 w-3.5 text-cyan-700 flex-shrink-0" />
                            <span className="truncate max-w-[130px]" title={chq.coursierName}>
                              {chq.coursierName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Non assigné</span>
                        )}
                        {chq.dateRemiseCoursier && (
                          <div className="text-[11px] text-slate-400 font-medium">
                            Remis: {formatShortDate(chq.dateRemiseCoursier)}
                          </div>
                        )}
                      </td>

                      {/* Status with quick change menu */}
                      <td className="py-3 px-3 relative">
                        <div className="flex items-center gap-1">
                          <span className={`inline-flex items-center text-xs px-2.5 py-0.5 rounded-md border font-medium ${statusCfg.bgClass} ${statusCfg.textClass} ${statusCfg.borderClass}`}>
                            {statusCfg.label}
                          </span>
                          
                          <button
                            onClick={() => setQuickStatusMenuId(quickStatusMenuId === chq.id ? null : chq.id)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Modifier le statut du chèque"
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Quick status dropdown */}
                        {quickStatusMenuId === chq.id && (
                          <div className="absolute left-0 mt-1 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-20 py-1 text-xs">
                            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                              Passer au statut :
                            </div>
                            <button
                              onClick={() => {
                                onUpdateStatus(chq.id, 'REMIS_COURSIER', 'Chèque remis au déclarant pour dépôt');
                                setQuickStatusMenuId(null);
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-amber-50 text-amber-800 font-medium cursor-pointer"
                            >
                              Remis au coursier
                            </button>
                            <button
                              onClick={() => {
                                onUpdateStatus(chq.id, 'DEPOSE', 'Déposé au guichet du bénéficiaire');
                                setQuickStatusMenuId(null);
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-cyan-50 text-cyan-800 font-medium cursor-pointer"
                            >
                              Déposé (Guichet)
                            </button>
                            <button
                              onClick={() => {
                                onUpdateStatus(chq.id, 'DECAISSE', 'Débit bancaire constaté');
                                setQuickStatusMenuId(null);
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-emerald-50 text-emerald-800 font-medium cursor-pointer"
                            >
                              Décaissé (Débité)
                            </button>
                            {chq.category === 'CAUTION_CONTENEUR' && (
                              <>
                                <button
                                  onClick={() => {
                                    onUpdateStatus(chq.id, 'A_RECUPERER', 'Conteneur vide rendu - Chèque caution en attente');
                                    setQuickStatusMenuId(null);
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-orange-50 text-orange-900 font-bold cursor-pointer"
                                >
                                  À récupérer (Vide rendu)
                                </button>
                                <button
                                  onClick={() => {
                                    onUpdateStatus(chq.id, 'RECUPERE', 'Chèque de caution physique récupéré');
                                    setQuickStatusMenuId(null);
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-purple-50 text-purple-900 font-bold cursor-pointer"
                                >
                                  Caution Récupérée !
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => {
                                onUpdateStatus(chq.id, 'ANNULE', 'Annulation du chèque');
                                setQuickStatusMenuId(null);
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-rose-50 text-rose-800 border-t border-slate-100 font-medium cursor-pointer"
                            >
                              Annulé
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Échéance / Spécifique conteneur */}
                      <td className="py-3 px-3">
                        {chq.category === 'CAUTION_CONTENEUR' && chq.containerInfo ? (
                          <div>
                            <div className="font-mono text-xs font-bold text-amber-900">
                              {chq.containerInfo.containerNumbers.length} conteneur(s)
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium">
                              {chq.containerInfo.restitutionStatus === 'VIDE_RESTITUE' ? (
                                <span className="text-emerald-700 font-bold">EIR validé</span>
                              ) : chq.containerInfo.restitutionStatus === 'SURESTARIE_RISQUE' ? (
                                <span className="text-rose-700 font-bold">Surestarie !</span>
                              ) : (
                                <span>Retour max: {formatShortDate(chq.containerInfo.restitutionDeadline)}</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-slate-600 text-xs font-medium">
                            {chq.dateEcheance ? `Éch: ${formatShortDate(chq.dateEcheance)}` : 'À vue'}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onOpenChequeDetail(chq)}
                            className="p-1.5 text-slate-500 hover:text-cyan-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Consulter l'historique et les détails"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => onEditCheque(chq)}
                            className="p-1.5 text-slate-500 hover:text-amber-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Modifier ce chèque"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`Êtes-vous sûr de vouloir supprimer le chèque ${chq.chequeNumber} ?`)) {
                                onDeleteCheque(chq.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
