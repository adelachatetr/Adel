import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Container, 
  FileText, 
  UserCheck, 
  History,
  Send,
  Edit3,
  Trash2
} from 'lucide-react';
import { TransitCheque, ChequeStatus } from '../types/transit';
import { formatAmount, formatShortDate, STATUS_CONFIG, CATEGORY_LABELS } from '../utils/storage';

interface ChequeDetailModalProps {
  cheque: TransitCheque | null;
  onClose: () => void;
  onUpdateStatus: (id: string, newStatus: ChequeStatus, comment?: string) => void;
  onEdit: (cheque: TransitCheque) => void;
  onPrintSingleDischarge: (cheque: TransitCheque) => void;
  onDeleteCheque?: (id: string) => void;
}

export const ChequeDetailModal: React.FC<ChequeDetailModalProps> = ({
  cheque,
  onClose,
  onUpdateStatus,
  onEdit,
  onPrintSingleDischarge,
  onDeleteCheque
}) => {
  const [newComment, setNewComment] = useState('');

  if (!cheque) return null;

  const statusCfg = STATUS_CONFIG[cheque.status] || STATUS_CONFIG.BROUILLON;
  const catCfg = CATEGORY_LABELS[cheque.category];
  const container = cheque.containerInfo;

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    onUpdateStatus(cheque.id, cheque.status, newComment.trim());
    setNewComment('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-5 overflow-y-auto backdrop-blur-xs">
      <div className="bg-white border border-slate-300 rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-100 text-cyan-800 border border-cyan-200">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-bold text-slate-900">
                  {cheque.chequeNumber}
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded-md border font-medium ${statusCfg.bgClass} ${statusCfg.textClass} ${statusCfg.borderClass}`}>
                  {statusCfg.label}
                </span>
                {cheque.direction === 'RECU' && (
                  <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded-md border border-teal-300 font-bold">
                    Avance Client Reçue
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Fournisseur : <strong className="text-cyan-800 font-bold">{cheque.dossierNumber}</strong> · N° BC : <strong className="text-slate-800 font-mono font-bold">{cheque.clientName}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPrintSingleDischarge(cheque)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors border border-slate-300 shadow-2xs cursor-pointer"
              title="Imprimer décharge ou récépissé de ce chèque"
            >
              <Printer className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                onClose();
                onEdit(cheque);
              }}
              className="p-2 text-slate-600 hover:text-amber-700 rounded-lg hover:bg-slate-100 transition-colors border border-slate-300 shadow-2xs cursor-pointer"
              title="Modifier les informations"
            >
              <Edit3 className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          
          {/* Main Info Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 font-semibold">Montant du Titre</span>
              <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                {formatAmount(cheque.amount, cheque.currency)}
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 font-semibold">Nature de la Dépense</span>
              <div className="text-xs font-bold text-slate-800 mt-1 truncate">
                {catCfg?.label || cheque.category}
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 font-semibold">Banque Tirée</span>
              <div className="text-xs font-bold text-slate-800 mt-1 truncate" title={cheque.bankName}>
                {cheque.bankName}
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 font-semibold">Bénéficiaire</span>
              <div className="text-xs font-bold text-slate-800 mt-1 truncate" title={cheque.beneficiary}>
                {cheque.beneficiary}
              </div>
            </div>
          </div>

          {/* Logistics & Coursier Track */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-slate-800 font-bold">
              <span className="flex items-center gap-1.5">
                <UserCheck className="h-4 w-4 text-cyan-600" />
                <span>Chaîne de Transmission & Dates de Valeur</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-slate-500 font-medium">Date d'Émission en Caisse :</span>
                <div className="font-bold text-slate-900 mt-0.5">{formatShortDate(cheque.dateEmission)}</div>
              </div>

              <div>
                <span className="text-slate-500 font-medium">Déclarant / Coursier Assigné :</span>
                <div className="font-bold text-cyan-800 mt-0.5">{cheque.coursierName || 'Non assigné'}</div>
              </div>

              <div>
                <span className="text-slate-500 font-medium">Date de Dépôt / Débit :</span>
                <div className="font-bold text-slate-900 mt-0.5">
                  {cheque.dateEncaissement ? formatShortDate(cheque.dateEncaissement) : 'En attente de relevé bancaire'}
                </div>
              </div>
            </div>

            {cheque.observations && (
              <div className="mt-2 pt-2 border-t border-slate-200 text-slate-700">
                <span className="text-slate-500 block mb-0.5 font-medium">Observations enregistrées :</span>
                <p className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs text-slate-700 italic">{cheque.observations}</p>
              </div>
            )}
          </div>

          {/* Container Caution Details (if applicable) */}
          {container && (
            <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-amber-200 text-amber-900 font-bold">
                <span className="flex items-center gap-1.5">
                  <Container className="h-4 w-4 text-amber-700" />
                  <span>Consignation Maritime Conteneurs & Franchise</span>
                </span>
                <span className="font-mono text-xs bg-amber-100 text-amber-950 px-2 py-0.5 rounded-md border border-amber-300 font-bold">
                  {container.shippingLine}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-slate-500 font-medium">N° Conteneurs sous caution :</span>
                  <div className="font-mono font-bold text-slate-900 mt-0.5">
                    {container.containerNumbers.join(', ')}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Type: {container.containerType}</div>
                </div>

                <div>
                  <span className="text-slate-500 font-medium">Délai Franchise / Limite Retour :</span>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {formatShortDate(container.restitutionDeadline)} ({container.franchiseDays} jours)
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 font-medium">Restitution Effective & Bon EIR :</span>
                  {container.interchangeNumber ? (
                    <div className="text-emerald-800 font-mono font-bold mt-0.5">
                      EIR: {container.interchangeNumber} (le {formatShortDate(container.actualReturnDate)})
                    </div>
                  ) : (
                    <div className="text-amber-800 italic mt-0.5 font-semibold">
                      Conteneur pas encore restitué au parc
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Workflow Action Bar */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <span className="text-xs font-bold text-slate-800 block">
              Transitions d'État Opérationnelles (Service Transit) :
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onUpdateStatus(cheque.id, 'REMIS_COURSIER', 'Remis au déclarant / coursier pour dépôt au guichet')}
                className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
              >
                1. Remettre au Coursier
              </button>

              <button
                onClick={() => onUpdateStatus(cheque.id, 'DEPOSE', 'Déposé au guichet maritime / douane')}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
              >
                2. Déposé au Guichet (En circulation)
              </button>

              <button
                onClick={() => onUpdateStatus(cheque.id, 'DECAISSE', 'Débit bancaire effectif confirmé sur relevé')}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
              >
                3. Marquer Décaissé (Débité)
              </button>

              {cheque.category === 'CAUTION_CONTENEUR' && (
                <>
                  <button
                    onClick={() => onUpdateStatus(cheque.id, 'A_RECUPERER', 'Conteneur vide rendu avec EIR - Demande de déconsignation en cours')}
                    className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                  >
                    4. Passer à "À Récupérer"
                  </button>

                  <button
                    onClick={() => onUpdateStatus(cheque.id, 'RECUPERE', 'Chèque original de caution récupéré physiquement intact')}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                  >
                    5. Caution Récupérée & Clôturée !
                  </button>
                </>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => onUpdateStatus(cheque.id, 'ANNULE', 'Annulation du chèque')}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs border border-slate-300 transition-colors font-semibold cursor-pointer"
                >
                  Annuler le chèque
                </button>

                {onDeleteCheque && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Supprimer définitivement le chèque ${cheque.chequeNumber} (${formatAmount(cheque.amount, cheque.currency)}) ?\n\nÀ utiliser en cas d'erreur de saisie. Cette action est irréversible.`)) {
                        onDeleteCheque(cheque.id);
                        onClose();
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title="Supprimer ce chèque en cas d'erreur"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                    <span>Supprimer (Erreur)</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Audit Trail & History */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
              <History className="h-4 w-4 text-cyan-600" />
              <span>Journal d'Audit & Historique des Événements ({cheque.auditTrail?.length || 0})</span>
            </h3>

            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {(cheque.auditTrail || []).map(log => (
                <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-900">{log.action}</span>
                    {log.comment && <p className="text-slate-600 italic mt-0.5">{log.comment}</p>}
                    <span className="text-[11px] text-cyan-700 font-semibold block mt-0.5">Par: {log.actor}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono whitespace-nowrap">
                    {log.date}
                  </span>
                </div>
              ))}
            </div>

            {/* Quick comment add */}
            <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
              <input
                type="text"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Ajouter une observation ou note d'intervention sur ce chèque..."
                className="flex-1 bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 text-xs focus:outline-none focus:border-cyan-600 font-medium"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-cyan-800 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-300 cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Ajouter</span>
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};
