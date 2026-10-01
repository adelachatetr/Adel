import React, { useState, useMemo } from 'react';
import { 
  Container, 
  AlertTriangle, 
  CheckCircle, 
  FileCheck, 
  Search,
  ShieldCheck,
  Plus,
  Building2,
  X
} from 'lucide-react';
import { TransitCheque, TransitDossier } from '../types/transit';
import { formatAmount, formatShortDate, STATUS_CONFIG } from '../utils/storage';

interface ContainerDepositsViewProps {
  cheques: TransitCheque[];
  dossiers: TransitDossier[];
  selectedCurrency: string;
  onOpenChequeDetail: (cheque: TransitCheque) => void;
  onUpdateStatus: (id: string, newStatus: any, comment?: string) => void;
  onSaveContainerRestitution: (
    chequeId: string, 
    actualReturnDate: string, 
    interchangeNumber: string,
    notes?: string
  ) => void;
  onOpenNewCheque: () => void;
}

export const ContainerDepositsView: React.FC<ContainerDepositsViewProps> = ({
  cheques,
  dossiers,
  selectedCurrency,
  onOpenChequeDetail,
  onUpdateStatus,
  onSaveContainerRestitution,
  onOpenNewCheque
}) => {
  const [activePipelineTab, setActivePipelineTab] = useState<'A_RECUPERER' | 'CHEZ_CLIENT' | 'TOUTES' | 'RECUPERE'>('A_RECUPERER');
  const [searchTerm, setSearchTerm] = useState('');
  const [beneficiaryFilter, setBeneficiaryFilter] = useState('ALL');

  // Selected cheque for the modal to declare container return / EIR
  const [modalCheque, setModalCheque] = useState<TransitCheque | null>(null);
  const [returnDateInput, setReturnDateInput] = useState(new Date().toISOString().slice(0, 10));
  const [eirInput, setEirInput] = useState('');
  const [notesInput, setNotesInput] = useState('');

  // Only caution conteneur cheques
  const cautionCheques = cheques.filter(c => c.category === 'CAUTION_CONTENEUR');

  // Unique beneficiaries / shipping lines from caution cheques
  const uniqueBeneficiaries = useMemo(() => {
    const map = new Map<string, number>();
    cautionCheques.forEach(c => {
      const b = c.beneficiary?.trim();
      if (b) {
        map.set(b, (map.get(b) || 0) + 1);
      }
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0], 'fr'));
  }, [cautionCheques]);

  const filteredCautions = cautionCheques.filter(c => {
    // Pipeline filter
    if (activePipelineTab === 'A_RECUPERER') {
      if (c.status !== 'A_RECUPERER') return false;
    } else if (activePipelineTab === 'CHEZ_CLIENT') {
      if (c.status === 'RECUPERE' || c.status === 'A_RECUPERER' || c.status === 'ANNULE') return false;
    } else if (activePipelineTab === 'RECUPERE') {
      if (c.status !== 'RECUPERE') return false;
    }

    // Beneficiary filter
    if (beneficiaryFilter !== 'ALL' && c.beneficiary !== beneficiaryFilter) {
      return false;
    }

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchNumber = c.chequeNumber.toLowerCase().includes(q);
      const matchDossier = c.dossierNumber.toLowerCase().includes(q);
      const matchClient = c.clientName.toLowerCase().includes(q);
      const matchBeneficiary = c.beneficiary.toLowerCase().includes(q);
      const matchLine = (c.containerInfo?.shippingLine || '').toLowerCase().includes(q);
      const matchContainer = (c.containerInfo?.containerNumbers || []).some(cn => cn.toLowerCase().includes(q));
      const matchEIR = (c.containerInfo?.interchangeNumber || '').toLowerCase().includes(q);

      if (!matchNumber && !matchDossier && !matchClient && !matchBeneficiary && !matchLine && !matchContainer && !matchEIR) {
        return false;
      }
    }

    return true;
  });

  const countARecuperer = cautionCheques.filter(c => c.status === 'A_RECUPERER').length;
  const countChezClient = cautionCheques.filter(c => c.status !== 'RECUPERE' && c.status !== 'A_RECUPERER' && c.status !== 'ANNULE').length;
  const countRecupere = cautionCheques.filter(c => c.status === 'RECUPERE').length;

  const totalMontantARecuperer = cautionCheques
    .filter(c => c.status === 'A_RECUPERER')
    .reduce((sum, c) => sum + c.amount, 0);

  const totalMontantChezClient = cautionCheques
    .filter(c => c.status !== 'RECUPERE' && c.status !== 'A_RECUPERER' && c.status !== 'ANNULE')
    .reduce((sum, c) => sum + c.amount, 0);

  const handleOpenRestitutionModal = (cheque: TransitCheque) => {
    setModalCheque(cheque);
    setReturnDateInput(new Date().toISOString().slice(0, 10));
    setEirInput(cheque.containerInfo?.interchangeNumber || '');
    setNotesInput('');
  };

  const handleConfirmRestitution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalCheque) return;
    onSaveContainerRestitution(modalCheque.id, returnDateInput, eirInput, notesInput);
    setModalCheque(null);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
                <Container className="h-6 w-6" />
              </span>
              <div>
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                  Suivi des Cautions Conteneurs & Déconsignation Maritime
                </h1>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Gestion du cycle de consignation : franchise, restitution du conteneur vide (bon EIR) et récupération du chèque physique original.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenNewCheque}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-amber-600/30 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Nouvelle Caution</span>
            </button>
          </div>
        </div>

        {/* 2 Big Stat Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-5 border-t border-slate-100">
          <div className="bg-orange-50/70 border border-orange-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-orange-900 uppercase tracking-wider">
                Fonds prêts à être déconsignés (EIR validé)
              </div>
              <div className="text-2xl font-bold font-mono text-orange-950 mt-1">
                {formatAmount(totalMontantARecuperer, selectedCurrency)}
              </div>
              <div className="text-xs text-orange-800 mt-0.5 font-medium">
                {countARecuperer} chèque(s) physique(s) à réclamer aux compagnies
              </div>
            </div>
            <div className="h-12 w-12 rounded-xl bg-orange-100 border border-orange-300 flex items-center justify-center text-orange-700">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                Fonds en consignation active (Conteneurs sortis)
              </div>
              <div className="text-2xl font-bold font-mono text-amber-950 mt-1">
                {formatAmount(totalMontantChezClient, selectedCurrency)}
              </div>
              <div className="text-xs text-amber-800 mt-0.5 font-medium">
                {countChezClient} chèque(s) sous surveillance de franchise
              </div>
            </div>
            <div className="h-12 w-12 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700">
              <Container className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Pipeline & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1 text-xs shadow-2xs">
          <button
            onClick={() => setActivePipelineTab('A_RECUPERER')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
              activePipelineTab === 'A_RECUPERER'
                ? 'bg-orange-100 text-orange-900 border border-orange-300 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>À Récupérer (Vide rendu)</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-orange-200 text-orange-950 font-mono">
              {countARecuperer}
            </span>
          </button>

          <button
            onClick={() => setActivePipelineTab('CHEZ_CLIENT')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
              activePipelineTab === 'CHEZ_CLIENT'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>En Cours / Franchise</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-200 text-slate-800 font-mono">
              {countChezClient}
            </span>
          </button>

          <button
            onClick={() => setActivePipelineTab('RECUPERE')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
              activePipelineTab === 'RECUPERE'
                ? 'bg-purple-100 text-purple-900 border border-purple-300 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Récupérées & Clôturées</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-purple-200 text-purple-950 font-mono">
              {countRecupere}
            </span>
          </button>

          <button
            onClick={() => setActivePipelineTab('TOUTES')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
              activePipelineTab === 'TOUTES'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Toutes ({cautionCheques.length})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Beneficiary selector */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2.5 py-1 text-xs shadow-2xs">
            <Building2 className="h-3.5 w-3.5 text-amber-700 flex-shrink-0" />
            <select
              value={beneficiaryFilter}
              onChange={e => setBeneficiaryFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none max-w-[190px] truncate cursor-pointer"
            >
              <option value="ALL">Tous armateurs ({uniqueBeneficiaries.length})</option>
              {uniqueBeneficiaries.map(([bName, count]) => (
                <option key={bName} value={bName}>
                  {bName} ({count})
                </option>
              ))}
            </select>
            {beneficiaryFilter !== 'ALL' && (
              <button 
                onClick={() => setBeneficiaryFilter('ALL')} 
                className="text-slate-400 hover:text-slate-700 ml-1 cursor-pointer"
                title="Effacer filtre armateur"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="relative">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filtrer conteneur, EIR, armateur..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-600 w-full sm:w-60 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Cautions List Cards */}
      <div className="grid grid-cols-1 gap-4">
        {filteredCautions.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs italic">
            <Container className="h-8 w-8 mx-auto text-slate-300 mb-2" />
            Aucune caution dans cet état pour le moment.
          </div>
        ) : (
          filteredCautions.map(chq => {
            const statusCfg = STATUS_CONFIG[chq.status] || STATUS_CONFIG.BROUILLON;
            const containerInfo = chq.containerInfo;

            return (
              <div 
                key={chq.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 transition-all hover:border-slate-300 shadow-xs"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Cheque details */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold text-slate-900">
                        {chq.chequeNumber}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="font-bold text-amber-800">
                        {containerInfo?.shippingLine || chq.beneficiary}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="font-mono font-bold text-cyan-700">
                        {chq.dossierNumber}
                      </span>
                      <span className={`text-[11px] px-2.5 py-0.5 rounded-md border font-medium ${statusCfg.bgClass} ${statusCfg.textClass} ${statusCfg.borderClass}`}>
                        {statusCfg.label}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 font-medium">
                      Client : <span className="font-bold text-slate-900">{chq.clientName}</span>
                      <span className="text-slate-300 mx-2">|</span>
                      Banque tirée : <span className="text-slate-700">{chq.bankName}</span>
                    </div>

                    {/* Containers List */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-xs text-slate-500 font-semibold">N° Conteneurs :</span>
                      {containerInfo?.containerNumbers?.map(cn => (
                        <span key={cn} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-mono text-xs font-bold border border-slate-200">
                          {cn}
                        </span>
                      ))}
                      <span className="text-xs text-slate-400 font-medium">({containerInfo?.containerType})</span>
                    </div>

                    {/* Observation snippet */}
                    {chq.observations && (
                      <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1">
                        {chq.observations}
                      </p>
                    )}
                  </div>

                  {/* Right Column: Restitution tracking & Action button */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <div className="text-right">
                      <div className="text-lg font-mono font-bold text-slate-900">
                        {formatAmount(chq.amount, chq.currency)}
                      </div>
                      <div className="text-xs text-slate-400 font-medium">
                        Émis le {formatShortDate(chq.dateEmission)}
                      </div>
                    </div>

                    {/* Operational Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      {chq.status !== 'RECUPERE' && chq.status !== 'A_RECUPERER' && (
                        <button
                          onClick={() => handleOpenRestitutionModal(chq)}
                          className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-orange-600/30 transition-all cursor-pointer"
                        >
                          <FileCheck className="h-3.5 w-3.5" />
                          <span>Enregistrer Bon EIR (Vide rendu)</span>
                        </button>
                      )}

                      {chq.status === 'A_RECUPERER' && (
                        <button
                          onClick={() => {
                            if (confirm(`Confirmez-vous avoir physiquement récupéré le chèque de caution ${chq.chequeNumber} de ${formatAmount(chq.amount, chq.currency)} auprès de ${containerInfo?.shippingLine || chq.beneficiary} ?`)) {
                              onUpdateStatus(chq.id, 'RECUPERE', 'Chèque physique de caution récupéré auprès de l\'armateur et classé');
                            }
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-600/30 transition-all cursor-pointer"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          <span>Confirmer Chèque Récupéré</span>
                        </button>
                      )}

                      <button
                        onClick={() => onOpenChequeDetail(chq)}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 transition-colors cursor-pointer shadow-2xs"
                      >
                        Historique
                      </button>
                    </div>

                    {/* EIR status pill */}
                    {containerInfo?.interchangeNumber && (
                      <div className="text-xs text-emerald-700 font-mono font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>EIR : {containerInfo.interchangeNumber} (Restitué le {formatShortDate(containerInfo.actualReturnDate)})</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Enregistrer le retour conteneur & bon EIR */}
      {modalCheque && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-300 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-orange-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Restitution Conteneur Vide (Bon EIR)
                </h3>
              </div>
              <button
                onClick={() => setModalCheque(null)}
                className="text-slate-400 hover:text-slate-700 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmRestitution} className="mt-4 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="font-semibold text-slate-900">
                  Chèque : <span className="font-mono text-cyan-700 font-bold">{modalCheque.chequeNumber}</span> ({formatAmount(modalCheque.amount, modalCheque.currency)})
                </div>
                <div className="text-slate-600">
                  Armateur : <span className="text-amber-800 font-bold">{modalCheque.containerInfo?.shippingLine || modalCheque.beneficiary}</span>
                </div>
                <div className="text-slate-600 font-medium">
                  Conteneurs : <span className="text-slate-900 font-mono font-bold">{modalCheque.containerInfo?.containerNumbers?.join(', ')}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Date effective de restitution au parc :
                </label>
                <input
                  type="date"
                  required
                  value={returnDateInput}
                  onChange={e => setReturnDateInput(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-orange-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  N° Bon d'Interchange / EIR (Equipment Interchange Receipt) :
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: EIR-MSC-2026-9812 ou N° de ticket parc"
                  value={eirInput}
                  onChange={e => setEirInput(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Observations / État du conteneur :
                </label>
                <textarea
                  rows={2}
                  placeholder="ex: Rendu propre sans dommage, ticket de pesage conforme..."
                  value={notesInput}
                  onChange={e => setNotesInput(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalCheque(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-md shadow-orange-600/30 transition-all cursor-pointer"
                >
                  Valider la restitution (EIR)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
