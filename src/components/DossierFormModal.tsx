import React, { useState, useEffect } from 'react';
import { X, FolderPlus, Check, Trash2, Printer, Anchor, Landmark, FileCheck, Send, CalendarCheck, AlertCircle } from 'lucide-react';
import { TransitDossier, DossierStatus, DeliveryMode, DemandNature, PackagingUnit } from '../types/transit';

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
  const [bcAmountEur, setBcAmountEur] = useState<string>('');
  const [blNumber, setBlNumber] = useState('');
  const [demandNature, setDemandNature] = useState<DemandNature>('B/C');
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('CFR');
  const [eta, setEta] = useState('');
  const [berthingDate, setBerthingDate] = useState('');
  const [bankReceptionDate, setBankReceptionDate] = useState('');
  const [forwarderDeclarationDate, setForwarderDeclarationDate] = useState('');
  const [forwarderHandoverDate, setForwarderHandoverDate] = useState('');
  const [portOfDischarge, setPortOfDischarge] = useState('Port de Skikda');
  const [goodsDescription, setGoodsDescription] = useState('');
  const [containerCount, setContainerCount] = useState<number>(1);
  const [containerUnit, setContainerUnit] = useState<PackagingUnit>('CONTENEURS');
  const [status, setStatus] = useState<DossierStatus>('OUVERT');
  const [receptionDate, setReceptionDate] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    setConfirmingDelete(false);
    if (editingDossier) {
      setDossierNumber(editingDossier.dossierNumber);
      setClientName(editingDossier.clientName);
      setClientContact(editingDossier.clientContact || '');
      setBcAmountEur(
        editingDossier.bcAmountEur !== undefined && editingDossier.bcAmountEur !== null
          ? editingDossier.bcAmountEur.toString()
          : ''
      );
      setBlNumber((editingDossier.blNumber || '').toUpperCase());
      setDemandNature(editingDossier.demandNature || 'B/C');
      const rawMode = (editingDossier.deliveryMode || editingDossier.vesselName || '').toUpperCase();
      const existingMode: DeliveryMode = rawMode === 'FOB' ? 'FOB' : 'CFR';
      setDeliveryMode(existingMode);
      setEta(editingDossier.eta || '');
      setBerthingDate(editingDossier.berthingDate || '');
      setBankReceptionDate(editingDossier.bankReceptionDate || '');
      setForwarderDeclarationDate(editingDossier.forwarderDeclarationDate || '');
      setForwarderHandoverDate(editingDossier.forwarderHandoverDate || '');
      setPortOfDischarge(editingDossier.portOfDischarge);
      setGoodsDescription(editingDossier.goodsDescription);
      setContainerCount(editingDossier.containerCount);
      setContainerUnit(editingDossier.containerUnit || 'CONTENEURS');
      setStatus(editingDossier.status);
      setReceptionDate(editingDossier.receptionDate || '');
      setFormError(null);
    } else {
      setDossierNumber('');
      setClientName('');
      setClientContact('');
      setBcAmountEur('');
      setBlNumber('');
      setDemandNature('B/C');
      setDeliveryMode('CFR');
      setEta('');
      setBerthingDate('');
      setBankReceptionDate('');
      setForwarderDeclarationDate('');
      setForwarderHandoverDate('');
      setPortOfDischarge('Port de Skikda');
      setGoodsDescription('');
      setContainerCount(1);
      setContainerUnit('CONTENEURS');
      setStatus('OUVERT');
      setReceptionDate('');
      setFormError(null);
    }
  }, [editingDossier, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!dossierNumber.trim() || !clientName.trim() || !blNumber.trim()) {
      setFormError('Veuillez renseigner au moins le Nom Fournisseur, le N° BC/CNT et le N° de Facture Commerciale.');
      return;
    }

    const rawEuro = bcAmountEur.trim().replace(',', '.');
    const parsedEuro = rawEuro === '' ? undefined : parseFloat(rawEuro);
    if (parsedEuro !== undefined && (isNaN(parsedEuro) || parsedEuro < 0)) {
      setFormError('Veuillez saisir un Montant BC EURO valide.');
      return;
    }

    onSave({
      dossierNumber: dossierNumber.trim(),
      clientName: clientName.trim(),
      clientContact: clientContact.trim() || undefined,
      bcAmountEur: parsedEuro,
      blNumber: blNumber.trim().toUpperCase(),
      demandNature,
      deliveryMode,
      vesselName: deliveryMode,
      eta: eta || undefined,
      berthingDate: berthingDate || undefined,
      bankReceptionDate: bankReceptionDate || undefined,
      forwarderDeclarationDate: forwarderDeclarationDate || undefined,
      forwarderHandoverDate: forwarderHandoverDate || undefined,
      portOfDischarge: portOfDischarge.trim(),
      goodsDescription: goodsDescription.trim() || 'Marchandises diverses',
      containerCount: Number(containerCount) || 1,
      containerUnit,
      status,
      receptionDate: receptionDate || undefined
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white border border-slate-300 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
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
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Nom Fournisseur <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={dossierNumber}
                onChange={e => setDossierNumber(e.target.value)}
                placeholder="ex: FLSMIDTH, SINOMA, LAFARGE..."
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold focus:border-cyan-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Montant BC EURO
              </label>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={bcAmountEur}
                  onChange={e => setBcAmountEur(e.target.value)}
                  placeholder="0.00"
                  className="w-full min-w-0 bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono font-bold focus:border-cyan-600"
                />
                <div className="px-2.5 bg-slate-100 border border-slate-300 rounded-xl text-slate-800 font-mono font-extrabold flex items-center justify-center text-xs select-none shrink-0">
                  EUR
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1">
                N° BC/CNT <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                placeholder="ex: BC-2026-04192 / CNT-2026-015"
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold font-mono focus:border-cyan-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Nature De Demande
              </label>
              <select
                value={demandNature}
                onChange={e => setDemandNature(e.target.value as DemandNature)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold focus:border-cyan-600 cursor-pointer"
              >
                <option value="B/C">B/C</option>
                <option value="Contrat">Contrat</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Facture Commerciale N° <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={blNumber}
              onChange={e => setBlNumber(e.target.value.toUpperCase())}
              placeholder="EX: FC-2026-00418 / INV-88392"
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono font-bold uppercase focus:border-cyan-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Mode de livraison
              </label>
              <select
                value={deliveryMode}
                onChange={e => setDeliveryMode(e.target.value as DeliveryMode)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold focus:border-cyan-600 cursor-pointer"
              >
                <option value="CFR">CFR</option>
                <option value="FOB">FOB</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Port et Aéroport de Débarquement
              </label>
              <select
                value={portOfDischarge}
                onChange={e => setPortOfDischarge(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:border-cyan-600 cursor-pointer"
              >
                <optgroup label="Ports d'Algérie">
                  <option value="Port de Skikda">Port de Skikda</option>
                  <option value="Port de Djendjen">Port de Djendjen</option>
                  <option value="Port d'Annaba">Port d'Annaba</option>
                  <option value="Port de Béjaïa">Port de Béjaïa</option>
                  <option value="Port d'Alger">Port d'Alger</option>
                  <option value="Port d'Oran">Port d'Oran</option>
                  <option value="Port d'Arzew">Port d'Arzew</option>
                  <option value="Port de Mostaganem">Port de Mostaganem</option>
                  <option value="Port de Ghazaouet">Port de Ghazaouet</option>
                  <option value="Port de Ténès">Port de Ténès</option>
                  <option value="Port de Dellys">Port de Dellys</option>
                </optgroup>
                <optgroup label="Aéroports d'Algérie">
                  <option value="Aéroport de Constantine">Aéroport de Constantine</option>
                  <option value="Aéroport d'Annaba">Aéroport d'Annaba</option>
                  <option value="Aéroport d'Alger">Aéroport d'Alger</option>
                </optgroup>
                {portOfDischarge && ![
                  'Port de Skikda',
                  'Port de Djendjen',
                  'Port d\'Annaba',
                  'Port de Béjaïa',
                  'Port d\'Alger',
                  'Port d\'Oran',
                  'Port d\'Arzew',
                  'Port de Mostaganem',
                  'Port de Ghazaouet',
                  'Port de Ténès',
                  'Port de Dellys',
                  'Aéroport de Constantine',
                  'Aéroport d\'Annaba',
                  'Aéroport d\'Alger'
                ].includes(portOfDischarge) && (
                  <option value={portOfDischarge}>{portOfDischarge}</option>
                )}
              </select>
            </div>
          </div>

          {/* Les 4 caisses de suivi des dates : 1-Accostage, 2-Reçu Banque, 3-Déclaration Transitaire, 4-Remise Transitaire */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-cyan-50/70 p-3.5 rounded-2xl border border-cyan-200 shadow-2xs">
            <div>
              <label className="block text-slate-800 font-bold mb-1 text-xs flex items-center gap-1.5">
                <Anchor className="h-4 w-4 text-cyan-700 shrink-0" />
                <span>1. Date Accostage Navire</span>
              </label>
              <input
                type="date"
                value={berthingDate}
                onChange={e => setBerthingDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 shadow-2xs"
              />
              <span className="text-[10px] text-cyan-800 font-medium mt-1 block">
                Date effective d'accostage au port
              </span>
            </div>

            <div>
              <label className="block text-slate-800 font-bold mb-1 text-xs flex items-center gap-1.5">
                <Landmark className="h-4 w-4 text-blue-700 shrink-0" />
                <span>2. Date Reçu Dossier (Banque)</span>
              </label>
              <input
                type="date"
                value={bankReceptionDate}
                onChange={e => setBankReceptionDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 shadow-2xs"
              />
              <span className="text-[10px] text-blue-800 font-medium mt-1 block">
                Date réception dossier par la banque
              </span>
            </div>

            <div>
              <label className="block text-slate-800 font-bold mb-1 text-xs flex items-center gap-1.5">
                <Send className="h-4 w-4 text-amber-700 shrink-0" />
                <span>3. Date Remise Dossier Transitaire</span>
              </label>
              <input
                type="date"
                value={forwarderHandoverDate}
                onChange={e => setForwarderHandoverDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 shadow-2xs"
              />
              <span className="text-[10px] text-amber-800 font-medium mt-1 block">
                Date de remise du dossier au transitaire
              </span>
            </div>

            <div>
              <label className="block text-slate-800 font-bold mb-1 text-xs flex items-center gap-1.5">
                <FileCheck className="h-4 w-4 text-emerald-700 shrink-0" />
                <span>4. Date Déclaration Transitaire</span>
              </label>
              <input
                type="date"
                value={forwarderDeclarationDate}
                onChange={e => setForwarderDeclarationDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 shadow-2xs"
              />
              <span className="text-[10px] text-emerald-800 font-medium mt-1 block">
                Date de déclaration du transitaire
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-5">
              <label className="block text-slate-700 font-semibold mb-1">
                Nombre de conteneurs / Caisses / Palettes
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  value={containerCount}
                  onChange={e => setContainerCount(parseInt(e.target.value) || 0)}
                  className="w-24 shrink-0 bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono font-bold focus:border-cyan-600"
                />
                <select
                  value={containerUnit}
                  onChange={e => setContainerUnit(e.target.value as PackagingUnit)}
                  className="flex-1 min-w-0 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2.5 text-slate-900 font-bold focus:border-cyan-600 cursor-pointer"
                  title="Choisir Conteneurs, Caisse ou Palettes"
                >
                  <option value="CONTENEURS">Conteneurs</option>
                  <option value="CAISSE">Caisse</option>
                  <option value="PALETTES">Palettes</option>
                </select>
              </div>
            </div>

            <div className="sm:col-span-7">
              <label className="block text-slate-700 font-semibold mb-1">
                Statut du Dossier
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as DossierStatus)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:border-cyan-600"
              >
                <option value="EN_ATTENTE_RECEPTION">En attente de réception</option>
                <option value="RECEPTIONNE">Réceptionné</option>
                <option value="OUVERT">Ouvert / Préparation</option>
                <option value="ARRIVEE_PARTIELLE">Arrivée partielle</option>
                <option value="MANQUE_SUR_LIVRAISON">Manque sur livraison</option>
                <option value="EN_DEDOUANEMENT">En Dédouanement</option>
                <option value="BON_A_DELIVRER">Bon à Délivrer (BAD) Obtenu</option>
                <option value="TRANSMIS_POUR_PAIEMENT">Transmis pour paiement</option>
                <option value="SORTI_PORT">Sorti Port / Livré</option>
                <option value="EN_LITIGE">En Litige</option>
                <option value="SOLDE_ARCHIVE">Soldé & Archivé</option>
              </select>

              <div className="flex flex-wrap gap-1.5 mt-2">
                <button
                  type="button"
                  onClick={() => setStatus('EN_ATTENTE_RECEPTION')}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                    status === 'EN_ATTENTE_RECEPTION'
                      ? 'bg-sky-100 text-sky-900 border-sky-300 ring-1 ring-sky-400 font-bold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  En attente de réception
                </button>
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
                  onClick={() => setStatus('ARRIVEE_PARTIELLE')}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                    status === 'ARRIVEE_PARTIELLE'
                      ? 'bg-orange-100 text-orange-900 border-orange-300 ring-1 ring-orange-400 font-bold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Arrivée partielle
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('MANQUE_SUR_LIVRAISON')}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                    status === 'MANQUE_SUR_LIVRAISON'
                      ? 'bg-rose-100 text-rose-900 border-rose-300 ring-1 ring-rose-400 font-bold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Manque sur livraison
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
                <button
                  type="button"
                  onClick={() => setStatus('TRANSMIS_POUR_PAIEMENT')}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                    status === 'TRANSMIS_POUR_PAIEMENT'
                      ? 'bg-emerald-100 text-emerald-950 border-emerald-400 ring-1 ring-emerald-500 font-bold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Transmis pour paiement
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('SORTI_PORT')}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                    status === 'SORTI_PORT'
                      ? 'bg-teal-100 text-teal-900 border-teal-300 ring-1 ring-teal-400 font-bold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Sorti Port
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('EN_LITIGE')}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                    status === 'EN_LITIGE'
                      ? 'bg-red-100 text-red-900 border-red-300 ring-1 ring-red-400 font-bold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-red-50 hover:text-red-700'
                  }`}
                >
                  En Litige
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('SOLDE_ARCHIVE')}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                    status === 'SOLDE_ARCHIVE'
                      ? 'bg-purple-100 text-purple-900 border-purple-300 ring-1 ring-purple-400 font-bold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Soldé
                </button>
              </div>

              {(status === 'RECEPTIONNE' || Boolean(receptionDate)) && (
                <div className="mt-3 p-3 rounded-xl bg-indigo-50/80 border border-indigo-200 flex flex-col sm:flex-row sm:items-center gap-2.5">
                  <label className="text-xs font-bold text-indigo-900 flex items-center gap-1.5 shrink-0">
                    <CalendarCheck className="h-4 w-4 text-indigo-700" />
                    <span>Date de réception du dossier :</span>
                  </label>
                  <input
                    type="date"
                    value={receptionDate}
                    onChange={e => setReceptionDate(e.target.value)}
                    className="flex-1 bg-white border border-indigo-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 shadow-2xs"
                  />
                </div>
              )}
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
                confirmingDelete ? (
                  <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 rounded-xl px-2.5 py-1.5">
                    <span className="text-[11px] font-bold text-rose-800">Confirmer ?</span>
                    <button
                      type="button"
                      onClick={() => {
                        onDelete(editingDossier.id);
                        setConfirmingDelete(false);
                        onClose();
                      }}
                      className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg cursor-pointer"
                    >
                      Supprimer
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingDelete(false)}
                      className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-[11px] font-semibold rounded-lg cursor-pointer"
                    >
                      Annuler
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(true)}
                    className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Supprimer ce dossier"
                  >
                    <Trash2 className="h-4 w-4 text-rose-600" />
                    <span>Supprimer</span>
                  </button>
                )
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
