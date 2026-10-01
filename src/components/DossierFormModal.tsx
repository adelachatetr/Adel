import React, { useState, useEffect } from 'react';
import { X, FolderPlus, Check, Trash2, Printer } from 'lucide-react';
import { TransitDossier, DossierStatus } from '../types/transit';

interface DossierFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dossierData: Partial<TransitDossier>) => void;
  editingDossier?: TransitDossier | null;
  onDelete?: (dossierId: string) => void;
  onPrint?: (dossier: TransitDossier) => void;
}

export const DossierFormModal: React.FC<DossierFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingDossier,
  onDelete,
  onPrint
}) => {
  const [dossierNumber, setDossierNumber] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [regime, setRegime] = useState<TransitDossier['regime']>('IMPORT_DIRECT');
  const [blNumber, setBlNumber] = useState('');
  const [declarationNumber, setDeclarationNumber] = useState('');
  const [vesselName, setVesselName] = useState('');
  const [eta, setEta] = useState('');
  const [portOfDischarge, setPortOfDischarge] = useState('Port d\'Alger');
  const [goodsDescription, setGoodsDescription] = useState('');
  const [containerCount, setContainerCount] = useState<number>(1);
  const [status, setStatus] = useState<DossierStatus>('OUVERT');

  useEffect(() => {
    if (editingDossier) {
      setDossierNumber(editingDossier.dossierNumber);
      setClientName(editingDossier.clientName);
      setClientContact(editingDossier.clientContact || '');
      setRegime(editingDossier.regime);
      setBlNumber(editingDossier.blNumber);
      setDeclarationNumber(editingDossier.declarationNumber || '');
      setVesselName(editingDossier.vesselName || '');
      setEta(editingDossier.eta || '');
      setPortOfDischarge(editingDossier.portOfDischarge);
      setGoodsDescription(editingDossier.goodsDescription);
      setContainerCount(editingDossier.containerCount);
      setStatus(editingDossier.status);
    } else {
      setDossierNumber(`TR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
      setClientName('');
      setClientContact('');
      setRegime('IMPORT_DIRECT');
      setBlNumber('');
      setDeclarationNumber('');
      setVesselName('');
      setEta('');
      setPortOfDischarge('Port Maritime');
      setGoodsDescription('');
      setContainerCount(1);
      setStatus('OUVERT');
    }
  }, [editingDossier, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dossierNumber.trim() || !clientName.trim() || !blNumber.trim()) {
      alert('Veuillez renseigner au moins le N° de dossier, le client et le N° de B/L.');
      return;
    }

    onSave({
      dossierNumber: dossierNumber.trim(),
      clientName: clientName.trim(),
      clientContact: clientContact.trim() || undefined,
      regime,
      blNumber: blNumber.trim(),
      declarationNumber: declarationNumber.trim() || undefined,
      vesselName: vesselName.trim() || undefined,
      eta: eta || undefined,
      portOfDischarge: portOfDischarge.trim(),
      goodsDescription: goodsDescription.trim() || 'Marchandises diverses',
      containerCount: Number(containerCount) || 1,
      status
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white border border-slate-300 rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5 text-cyan-600" />
            <h2 className="text-sm font-bold text-slate-900">
              {editingDossier ? 'Modifier le Dossier de Transit' : 'Ouvrir un Nouveau Dossier de Transit'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                N° Dossier Transit <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={dossierNumber}
                onChange={e => setDossierNumber(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono font-bold focus:border-cyan-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Régime Douanier
              </label>
              <select
                value={regime}
                onChange={e => setRegime(e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:border-cyan-600"
              >
                <option value="IMPORT_DIRECT">Importation Directe (Mise à la consommation)</option>
                <option value="EXPORT">Exportation Définitive</option>
                <option value="TRANSIT_SOUS_DOUANE">Transit sous douane (Acquit D15/Passavant)</option>
                <option value="ADMISSION_TEMPORAIRE">Admission Temporaire (AT)</option>
                <option value="ENTREPOT">Entrepôt sous douane</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Client Importateur / Donneur d'Ordre <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              placeholder="ex: Maghreb Agro Industries SARL"
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:border-cyan-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                N° B/L Connaissement ou LTA <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={blNumber}
                onChange={e => setBlNumber(e.target.value)}
                placeholder="ex: MEDU83910283"
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono font-bold focus:border-cyan-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                N° Déclaration en Douane (DUM/DAU)
              </label>
              <input
                type="text"
                value={declarationNumber}
                onChange={e => setDeclarationNumber(e.target.value)}
                placeholder="ex: DUM-2026-04192"
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono font-bold focus:border-cyan-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Navire / Compagnie Maritime
              </label>
              <input
                type="text"
                value={vesselName}
                onChange={e => setVesselName(e.target.value)}
                placeholder="ex: MSC LEANNE V.402"
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:border-cyan-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Port / Aéroport de Débarquement
              </label>
              <input
                type="text"
                value={portOfDischarge}
                onChange={e => setPortOfDischarge(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:border-cyan-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Nombre de conteneurs (EVP)
              </label>
              <input
                type="number"
                min="0"
                value={containerCount}
                onChange={e => setContainerCount(parseInt(e.target.value) || 0)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono font-bold focus:border-cyan-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Statut du Dossier
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as DossierStatus)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:border-cyan-600"
              >
                <option value="RECEPTIONNE">Réceptionné</option>
                <option value="OUVERT">Ouvert / Préparation</option>
                <option value="EN_DEDOUANEMENT">En Dédouanement</option>
                <option value="BON_A_DELIVRER">Bon à Délivrer (BAD) Obtenu</option>
                <option value="SORTI_PORT">Sorti Port / Livré</option>
                <option value="SOLDE_ARCHIVE">Soldé & Archivé</option>
              </select>

              <div className="flex flex-wrap gap-1.5 mt-2">
                <button
                  type="button"
                  onClick={() => setStatus('RECEPTIONNE')}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                    status === 'RECEPTIONNE'
                      ? 'bg-indigo-100 text-indigo-900 border-indigo-300 ring-1 ring-indigo-400 font-bold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Réceptionné
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('OUVERT')}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                    status === 'OUVERT'
                      ? 'bg-slate-200 text-slate-900 border-slate-400 ring-1 ring-slate-400 font-bold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Ouvert
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('EN_DEDOUANEMENT')}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                    status === 'EN_DEDOUANEMENT'
                      ? 'bg-amber-100 text-amber-900 border-amber-300 ring-1 ring-amber-400 font-bold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  En Dédouanement
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('BON_A_DELIVRER')}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                    status === 'BON_A_DELIVRER'
                      ? 'bg-cyan-100 text-cyan-900 border-cyan-300 ring-1 ring-cyan-400 font-bold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  BAD
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Désignation Marchandises :
            </label>
            <input
              type="text"
              value={goodsDescription}
              onChange={e => setGoodsDescription(e.target.value)}
              placeholder="ex: Matières premières industrielles, pièces de rechange..."
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:border-cyan-600"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {editingDossier && onPrint && (
                <button
                  type="button"
                  onClick={() => {
                    onPrint(editingDossier);
                    onClose();
                  }}
                  className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  title="Imprimer la fiche de ce dossier"
                >
                  <Printer className="h-4 w-4 text-cyan-600" />
                  <span>Imprimer</span>
                </button>
              )}

              {editingDossier && onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Supprimer définitivement le dossier ${editingDossier.dossierNumber} (${editingDossier.clientName}) ?\n\nCette action est irréversible.`)) {
                      onDelete(editingDossier.id);
                      onClose();
                    }
                  }}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Supprimer ce dossier"
                >
                  <Trash2 className="h-4 w-4 text-rose-600" />
                  <span>Supprimer</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md shadow-cyan-600/30 cursor-pointer"
              >
                <Check className="h-4 w-4" />
                <span>{editingDossier ? 'Mettre à jour le Dossier' : 'Créer le Dossier'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
