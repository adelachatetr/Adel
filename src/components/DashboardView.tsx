import React, { useState } from 'react';
import { 
  Container, 
  Clock, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ChevronRight,
  ShieldAlert,
  Anchor,
  Printer
} from 'lucide-react';
import { TransitCheque, TransitDossier } from '../types/transit';
import { formatAmount, formatShortDate, STATUS_CONFIG, CATEGORY_LABELS } from '../utils/storage';
import { DeboursBreakdownPrintModal } from './DeboursBreakdownPrintModal';

interface DashboardViewProps {
  cheques: TransitCheque[];
  dossiers: TransitDossier[];
  selectedCurrency: string;
  onNavigateToChequesWithFilter: (filterType: string, value: string) => void;
  onOpenChequeDetail: (cheque: TransitCheque) => void;
  onOpenNewCheque: () => void;
  companyName?: string;
  agencyCity?: string;
  agencyPhone?: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  cheques,
  dossiers,
  selectedCurrency,
  onNavigateToChequesWithFilter,
  onOpenChequeDetail,
  onOpenNewCheque,
  companyName = 'TRANSIT SCHB',
  agencyCity = 'Constantine / Hamma Bouziane & Ports',
  agencyPhone = '+213 (0) 31 88 99 00'
}) => {
  const [isPrintBreakdownOpen, setIsPrintBreakdownOpen] = useState(false);
  // Financial computations
  const totalDeboursEmis = cheques
    .filter(c => c.direction === 'EMIS' && c.status !== 'ANNULE')
    .reduce((sum, c) => sum + c.amount, 0);

  const totalCautionsBloquees = cheques
    .filter(c => c.category === 'CAUTION_CONTENEUR' && (c.status === 'DEPOSE' || c.status === 'REMIS_COURSIER' || c.status === 'A_RECUPERER'))
    .reduce((sum, c) => sum + c.amount, 0);

  const totalCautionsARecuperer = cheques
    .filter(c => c.status === 'A_RECUPERER')
    .reduce((sum, c) => sum + c.amount, 0);

  const cautionsARecupererList = cheques.filter(c => c.status === 'A_RECUPERER');

  const surestarieRisqueList = cheques.filter(c => 
    c.category === 'CAUTION_CONTENEUR' && 
    c.containerInfo?.restitutionStatus === 'SURESTARIE_RISQUE'
  );

  const chequesEnCirculation = cheques.filter(c => 
    c.direction === 'EMIS' && (c.status === 'REMIS_COURSIER' || c.status === 'DEPOSE')
  );
  const totalEnCirculation = chequesEnCirculation.reduce((sum, c) => sum + c.amount, 0);

  const totalAvancesRecues = cheques
    .filter(c => c.direction === 'RECU' && c.status === 'ENCAISSE')
    .reduce((sum, c) => sum + c.amount, 0);

  // Category breakdown for emitted cheques
  const categoryBreakdown = Object.entries(
    cheques
      .filter(c => c.direction === 'EMIS' && c.status !== 'ANNULE')
      .reduce((acc, c) => {
        acc[c.category] = (acc[c.category] || 0) + c.amount;
        return acc;
      }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]);

  // Shipping line caution breakdown
  const shippingLineCautionBreakdown = Object.entries(
    cheques
      .filter(c => c.category === 'CAUTION_CONTENEUR' && c.containerInfo?.shippingLine && c.status !== 'RECUPERE' && c.status !== 'ANNULE')
      .reduce((acc, c) => {
        const line = c.containerInfo?.shippingLine || 'Autre';
        acc[line] = (acc[line] || 0) + c.amount;
        return acc;
      }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Tableau de Bord des Débours & Cautions</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 font-semibold font-mono border border-cyan-200">
              Transit SCHB
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Vision consolidée des liquidations douanières, chèques d'échange BAD et cautions d'armateurs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenNewCheque}
            className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold tracking-wide transition-all shadow-sm shadow-cyan-600/30 flex items-center gap-2 cursor-pointer"
          >
            <span>+ Émettre un Chèque de Transit</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Débours */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs transition-all hover:border-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Débours Émis</span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
              {formatAmount(totalDeboursEmis, selectedCurrency)}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
              <span>{cheques.filter(c => c.direction === 'EMIS').length} chèques de service</span>
            </div>
          </div>
        </div>

        {/* Cautions Bloquées */}
        <div 
          onClick={() => onNavigateToChequesWithFilter('category', 'CAUTION_CONTENEUR')}
          className="bg-amber-50/60 border border-amber-200 rounded-xl p-5 shadow-xs transition-all hover:border-amber-300 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-900">Cautions Consignées</span>
            <div className="h-8 w-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center border border-amber-300 group-hover:scale-105 transition-transform">
              <Container className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-amber-950 font-mono tracking-tight">
              {formatAmount(totalCautionsBloquees, selectedCurrency)}
            </div>
            <div className="text-xs text-amber-800 mt-1 flex items-center justify-between font-medium">
              <span>Immobilisé chez les armateurs</span>
              <ChevronRight className="h-4 w-4 text-amber-700" />
            </div>
          </div>
        </div>

        {/* Chèques en circulation */}
        <div 
          onClick={() => onNavigateToChequesWithFilter('status', 'CIRCULATION')}
          className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs transition-all hover:border-slate-300 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-cyan-800">En Circulation</span>
            <div className="h-8 w-8 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center border border-cyan-200">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
              {formatAmount(totalEnCirculation, selectedCurrency)}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center justify-between font-medium">
              <span>{chequesEnCirculation.length} chèques en cours guichet</span>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Provisions / Avances Reçues */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs transition-all hover:border-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">Avances Reçues (Clients)</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-950 font-mono tracking-tight">
              {formatAmount(totalAvancesRecues, selectedCurrency)}
            </div>
            <div className="text-xs text-slate-500 mt-1 font-medium">
              <span>Encaissé sur provisions débours</span>
            </div>
          </div>
        </div>
      </div>

      {/* Priority Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Urgence 1: Cautions conteneurs à récupérer (Conteneurs déjà rendus !) */}
        <div className="bg-white border border-orange-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-orange-100 text-orange-700 rounded-xl border border-orange-200">
                <ShieldAlert className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Cautions à Récupérer (Déconsignation Urgente)
                </h3>
                <p className="text-xs text-slate-500">
                  Conteneurs rendus avec EIR — chèque physique bloqué chez l'armateur
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-900 border border-orange-200">
              {cautionsARecupererList.length} chèque(s)
            </span>
          </div>

          <div className="mt-3.5 space-y-2.5">
            {cautionsARecupererList.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 italic">
                Aucun chèque en souffrance de déconsignation actuellement.
              </div>
            ) : (
              cautionsARecupererList.map(chq => (
                <div 
                  key={chq.id}
                  onClick={() => onOpenChequeDetail(chq)}
                  className="p-3.5 bg-orange-50/40 border border-orange-200/80 rounded-xl hover:border-orange-400 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-900">{chq.chequeNumber}</span>
                        <span className="text-xs text-slate-600 font-medium">· {chq.beneficiary}</span>
                      </div>
                      <div className="text-xs text-slate-600 mt-1 flex items-center gap-2 font-medium">
                        <span>Dossier: <span className="text-cyan-700 font-mono font-bold">{chq.dossierNumber}</span></span>
                        <span>· Client: <span className="text-slate-800">{chq.clientName}</span></span>
                      </div>
                      {chq.containerInfo && (
                        <div className="text-xs text-amber-800 mt-1 font-mono font-semibold">
                          EIR: {chq.containerInfo.interchangeNumber || 'Attente réf'} · Restitué le {formatShortDate(chq.containerInfo.actualReturnDate)}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-orange-700 font-mono">
                        {formatAmount(chq.amount, chq.currency)}
                      </div>
                      <span className="text-[11px] font-semibold text-orange-900 bg-orange-200/60 px-2 py-0.5 rounded-md border border-orange-300 mt-1 inline-block">
                        À réclamer
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Urgence 2: Risque de surestaries conteneurs */}
        <div className="bg-white border border-rose-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-rose-100 text-rose-700 rounded-xl border border-rose-200">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Alerte Franchises & Surestaries Conteneurs
                </h3>
                <p className="text-xs text-slate-500">
                  Franchise armateur dépassée ou imminente — risque de retenue sur caution
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-200">
              {surestarieRisqueList.length} dossier(s)
            </span>
          </div>

          <div className="mt-3.5 space-y-2.5">
            {surestarieRisqueList.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 italic">
                Aucun conteneur en dépassement critique de franchise.
              </div>
            ) : (
              surestarieRisqueList.map(chq => (
                <div 
                  key={chq.id}
                  onClick={() => onOpenChequeDetail(chq)}
                  className="p-3.5 bg-rose-50/50 border border-rose-200 rounded-xl hover:border-rose-400 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-rose-900">{chq.containerInfo?.shippingLine}</span>
                        <span className="text-xs text-slate-700 font-medium">· {chq.containerInfo?.containerNumbers?.join(', ')}</span>
                      </div>
                      <div className="text-xs text-slate-700 mt-1 font-medium">
                        Client: {chq.clientName} (Dossier: <span className="font-mono text-cyan-700 font-bold">{chq.dossierNumber}</span>)
                      </div>
                      <div className="text-xs text-rose-700 mt-1 font-mono font-bold">
                        Date limite: {formatShortDate(chq.containerInfo?.restitutionDeadline)} (FRANCHISE DÉPASSÉE)
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-rose-700 font-mono">
                        Caution: {formatAmount(chq.amount, chq.currency)}
                      </div>
                      <span className="text-[11px] font-semibold text-rose-900 bg-rose-100 px-2 py-0.5 rounded-md border border-rose-300 mt-1 inline-block">
                        Surestarie active
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Breakdown Charts / Proportions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Répartition par Catégorie de Débours */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Répartition des Débours par Nature de Charge
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Douane, cautions, frais d'échange B/L, acconage et transport
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsPrintBreakdownOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-700 hover:bg-cyan-800 active:bg-cyan-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-cyan-700/25 transition-all cursor-pointer shrink-0"
              title="Imprimer l'état officiel des débours par nature"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Imprimer l'état</span>
            </button>
          </div>

          <div className="space-y-3.5">
            {categoryBreakdown.map(([catKey, amount]) => {
              const info = CATEGORY_LABELS[catKey as keyof typeof CATEGORY_LABELS] || { label: catKey };
              const percent = totalDeboursEmis > 0 ? Math.round((amount / totalDeboursEmis) * 100) : 0;
              return (
                <div key={catKey} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-700">{info.label}</span>
                    <span className="font-mono text-slate-900 font-bold">
                      {formatAmount(amount, selectedCurrency)} <span className="text-slate-400 font-normal">({percent}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${
                        catKey === 'CAUTION_CONTENEUR' ? 'bg-amber-500' :
                        catKey === 'DROITS_DOUANE' ? 'bg-emerald-600' :
                        catKey === 'FRAIS_MARITIMES' ? 'bg-cyan-600' :
                        catKey === 'MANUTENTION_PORT' ? 'bg-indigo-600' : 'bg-purple-600'
                      }`}
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cautions par Compagnie Maritime */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            Cautions Conteneurs par Compagnie Maritime
          </h3>
          <p className="text-xs text-slate-500 mb-4 font-medium">
            Fonds bloqués chez les armateurs en attente de restitution des conteneurs
          </p>

          <div className="space-y-3.5">
            {shippingLineCautionBreakdown.length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center italic">
                Aucune caution conteneur enregistrée.
              </div>
            ) : (
              shippingLineCautionBreakdown.map(([line, amount]) => {
                const percent = totalCautionsBloquees > 0 ? Math.round((amount / totalCautionsBloquees) * 100) : 0;
                return (
                  <div key={line} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-800 font-semibold flex items-center gap-1.5">
                        <Anchor className="h-3.5 w-3.5 text-cyan-600" />
                        {line}
                      </span>
                      <span className="font-mono text-amber-900 font-bold">
                        {formatAmount(amount, selectedCurrency)} <span className="text-slate-400 font-normal">({percent}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-500"
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Derniers chèques enregistrés */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Derniers Chèques de Transit Émis</h3>
            <p className="text-xs text-slate-500 font-medium">Activités et mouvements récents</p>
          </div>
          <button
            onClick={() => onNavigateToChequesWithFilter('status', 'ALL')}
            className="text-xs font-semibold text-cyan-700 hover:text-cyan-800 flex items-center gap-1 cursor-pointer"
          >
            <span>Voir tout le registre</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold pb-2 bg-slate-50/50">
                <th className="py-3 px-3">N° Chèque</th>
                <th className="py-3 px-3">Dossier</th>
                <th className="py-3 px-3">Bénéficiaire / Nature</th>
                <th className="py-3 px-3">Montant</th>
                <th className="py-3 px-3">Statut</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 pl-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cheques.slice(0, 5).map(chq => {
                const statusCfg = STATUS_CONFIG[chq.status] || STATUS_CONFIG.BROUILLON;
                const catCfg = CATEGORY_LABELS[chq.category];
                return (
                  <tr key={chq.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-3 font-mono font-bold text-slate-900">
                      {chq.chequeNumber}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-mono text-cyan-700 font-bold">{chq.dossierNumber}</span>
                      <div className="text-xs text-slate-500 truncate max-w-[140px] font-medium">{chq.clientName}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="text-slate-900 font-semibold">{chq.beneficiary}</div>
                      <div className="text-xs text-slate-500 font-medium">{catCfg?.short || chq.category}</div>
                    </td>
                    <td className="py-3.5 px-3 font-mono font-bold text-slate-900 text-sm">
                      {formatAmount(chq.amount, chq.currency)}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`inline-flex items-center text-xs px-2.5 py-0.5 rounded-md border font-medium ${statusCfg.bgClass} ${statusCfg.textClass} ${statusCfg.borderClass}`}>
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 text-xs font-medium">
                      {formatShortDate(chq.dateEmission)}
                    </td>
                    <td className="py-3.5 pl-3 text-right">
                      <button
                        onClick={() => onOpenChequeDetail(chq)}
                        className="text-xs text-cyan-700 hover:text-cyan-900 font-semibold hover:underline cursor-pointer"
                      >
                        Consulter
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <DeboursBreakdownPrintModal
        isOpen={isPrintBreakdownOpen}
        onClose={() => setIsPrintBreakdownOpen(false)}
        cheques={cheques}
        selectedCurrency={selectedCurrency}
        companyName={companyName}
        agencyCity={agencyCity}
        agencyPhone={agencyPhone}
      />
    </div>
  );
};
