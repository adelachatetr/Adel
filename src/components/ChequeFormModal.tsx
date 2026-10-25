import React, { useState, useEffect } from 'react';
import { X, Check, Container, FileText } from 'lucide-react';
import { TransitCheque, TransitDossier, ChequeDirection, ChequeCategory, ChequeStatus } from '../types/transit';
import { SHIPPING_LINES, MAJOR_BANKS, TRANSIT_AGENTS } from '../data/mockTransitData';

interface ChequeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (chequeData: Partial<TransitCheque>) => void;
  editingCheque?: TransitCheque | null;
  dossiers: TransitDossier[];
  defaultCurrency: string;
  defaultBankName?: string;
  preselectedDossierNumber?: string;
  preselectedClientName?: string;
}

export const ChequeFormModal: React.FC<ChequeFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingCheque,
  dossiers,
  defaultCurrency,
  defaultBankName,
  preselectedDossierNumber,
  preselectedClientName
}) => {
  const [chequeNumber, setChequeNumber] = useState('');
  const [bankName, setBankName] = useState(defaultBankName || MAJOR_BANKS[0]);
  const [direction, setDirection] = useState<ChequeDirection>('EMIS');
  const [category, setCategory] = useState<ChequeCategory>('CAUTION_CONTENEUR');
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState(defaultCurrency);
  const [dossierNumber, setDossierNumber] = useState(preselectedDossierNumber || '');
  const [clientName, setClientName] = useState(preselectedClientName || '');
  const [beneficiary, setBeneficiary] = useState('');
  const [dateEmission, setDateEmission] = useState(new Date().toISOString().slice(0, 10));
  const [dateEcheance, setDateEcheance] = useState('');
  const [coursierName, setCoursierName] = useState(TRANSIT_AGENTS[0]);
  const [status, setStatus] = useState<ChequeStatus>('EMIS');
  const [observations, setObservations] = useState('');

  // Container specific fields
  const [isContainerCaution, setIsContainerCaution] = useState(true);
  const [containerNumbersStr, setContainerNumbersStr] = useState('');
  const [containerType, setContainerType] = useState<'20_DRY' | '40_DRY' | '40_HC' | 'REEFER' | 'OPEN_TOP' | 'AUTRE'>('40_HC');
  const [shippingLine, setShippingLine] = useState(SHIPPING_LINES[0]);
  const [franchiseDays, setFranchiseDays] = useState(14);
  const [restitutionDeadline, setRestitutionDeadline] = useState('');
  const [depotLocation, setDepotLocation] = useState('');

  useEffect(() => {
    if (editingCheque) {
      setChequeNumber(editingCheque.chequeNumber);
      setBankName(editingCheque.bankName);
      setDirection(editingCheque.direction);
      setCategory(editingCheque.category);
      setAmount(editingCheque.amount.toString());
      setCurrency(editingCheque.currency || defaultCurrency);
      setDossierNumber(editingCheque.dossierNumber);
      setClientName(editingCheque.clientName);
      setBeneficiary(editingCheque.beneficiary);
      setDateEmission(editingCheque.dateEmission);
      setDateEcheance(editingCheque.dateEcheance || '');
      setCoursierName(editingCheque.coursierName || TRANSIT_AGENTS[0]);
      setStatus(editingCheque.status);
      setObservations(editingCheque.observations || '');

      const isCaution = editingCheque.category === 'CAUTION_CONTENEUR';
      setIsContainerCaution(isCaution);
      if (isCaution && editingCheque.containerInfo) {
        setContainerNumbersStr(editingCheque.containerInfo.containerNumbers.join(', '));
        setContainerType(editingCheque.containerInfo.containerType || '40_HC');
        setShippingLine(editingCheque.containerInfo.shippingLine || SHIPPING_LINES[0]);
        setFranchiseDays(editingCheque.containerInfo.franchiseDays || 14);
        setRestitutionDeadline(editingCheque.containerInfo.restitutionDeadline || '');
        setDepotLocation(editingCheque.containerInfo.depotLocation || '');
      }
    } else {
      // New form reset
      setChequeNumber(`CHQ-${Math.floor(100000 + Math.random() * 900000)}`);
      setBankName(MAJOR_BANKS[0]);
      setDirection('EMIS');
      setCategory('CAUTION_CONTENEUR');
      setAmount('');
      setCurrency(defaultCurrency);
      setDossierNumber(preselectedDossierNumber || (dossiers[0]?.dossierNumber || ''));
      setClientName(preselectedClientName || (dossiers[0]?.clientName || ''));
      setBeneficiary('MSC Mediterranean Shipping Company');
      setDateEmission(new Date().toISOString().slice(0, 10));
      
      const defaultExp = new Date();
      defaultExp.setMonth(defaultExp.getMonth() + 1);
      setDateEcheance(defaultExp.toISOString().slice(0, 10));

      const defaultDead = new Date();
      defaultDead.setDate(defaultDead.getDate() + 14);
      setRestitutionDeadline(defaultDead.toISOString().slice(0, 10));

      setCoursierName(TRANSIT_AGENTS[0]);
      setStatus('EMIS');
      setObservations('');
      setIsContainerCaution(true);
      setContainerNumbersStr('MSCU9182301, MSCU9182302');
      setContainerType('40_HC');
      setShippingLine(SHIPPING_LINES[0]);
      setFranchiseDays(14);
      setDepotLocation('Terminal à Conteneurs Port');
    }
  }, [editingCheque, isOpen, preselectedDossierNumber, preselectedClientName, defaultCurrency, dossiers]);

  // When dossier changes, auto-fill client
  const handleDossierChange = (dossierNum: string) => {
    setDossierNumber(dossierNum);
    const found = dossiers.find(d => d.dossierNumber.toLowerCase() === dossierNum.toLowerCase());
    if (found) {
      setClientName(found.clientName);
    }
  };

  // When category changes, adjust suggestions
  const handleCategoryChange = (cat: ChequeCategory) => {
    setCategory(cat);
    const isCaution = cat === 'CAUTION_CONTENEUR';
    setIsContainerCaution(isCaution);

    if (cat === 'DROITS_DOUANE') {
      setBeneficiary('Receveur des Douanes (Trésor Public)');
    } else if (cat === 'CAUTION_CONTENEUR') {
      setBeneficiary(shippingLine ? `${shippingLine} - Caution Consignation` : 'MSC Mediterranean Shipping Company');
    } else if (cat === 'FRAIS_MARITIMES') {
      setBeneficiary('Compagnie Maritime (Frais BAD / THC / Surestaries)');
    } else if (cat === 'MANUTENTION_PORT') {
      setBeneficiary('Entreprise Portuaire / Marsa / DP World');
    } else if (cat === 'TRANSPORT_TRACTION') {
      setBeneficiary('Transporteur Routier Agréé');
    } else if (cat === 'AVANCE_PROVISION') {
      setDirection('RECU');
      setBeneficiary('Notre Agence de Transit');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Veuillez saisir un montant valide');
      return;
    }

    const payload: Partial<TransitCheque> = {
      chequeNumber: chequeNumber.trim(),
      bankName: bankName.trim(),
      direction,
      category,
      amount: parsedAmount,
      currency,
      dossierNumber: dossierNumber.trim(),
      clientName: clientName.trim(),
      beneficiary: beneficiary.trim(),
      dateEmission,
      dateEcheance: dateEcheance || undefined,
      coursierName: coursierName || undefined,
      status,
      observations: observations.trim() || undefined,
    };

    if (category === 'CAUTION_CONTENEUR') {
      const containerNumbers = containerNumbersStr
        .split(',')
        .map(s => s.trim().toUpperCase())
        .filter(Boolean);

      payload.containerInfo = {
        containerNumbers: containerNumbers.length > 0 ? containerNumbers : ['CNTR-AUTO-01'],
        containerType,
        shippingLine,
        franchiseDays: Number(franchiseDays) || 14,
        restitutionDeadline: restitutionDeadline || dateEmission,
        depotLocation: depotLocation || undefined,
        restitutionStatus: editingCheque?.containerInfo?.restitutionStatus || 'CHEZ_CLIENT',
        actualReturnDate: editingCheque?.containerInfo?.actualReturnDate,
        interchangeNumber: editingCheque?.containerInfo?.interchangeNumber
      };
    }

    onSave(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-5 overflow-y-auto backdrop-blur-xs">
      <div className="bg-white border border-slate-300 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-100 text-cyan-800 border border-cyan-200">
              <FileText className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">
              {editingCheque ? 'Modifier le Chèque de Transit' : 'Émettre un Nouveau Chèque de Transit'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          
          {/* Section 1: Identification du chèque & flux */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                N° de Chèque <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={chequeNumber}
                onChange={e => setChequeNumber(e.target.value)}
                placeholder="ex: CHQ-804192"
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono font-bold focus:outline-none focus:border-cyan-600"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-700 font-semibold text-xs">
                  Banque Tirée <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setBankName('BEA (Banque Extérieure d\'Algérie)')}
                    className="text-[10px] bg-blue-50 text-blue-800 hover:bg-blue-100 px-1.5 py-0.5 rounded font-bold border border-blue-200 cursor-pointer"
                  >
                    BEA
                  </button>
                  <button
                    type="button"
                    onClick={() => setBankName('BEA - Agence Constantine (002)')}
                    className="text-[10px] bg-slate-100 text-slate-700 hover:bg-slate-200 px-1.5 py-0.5 rounded font-medium border border-slate-200 cursor-pointer"
                  >
                    BEA 002
                  </button>
                </div>
              </div>
              <input
                type="text"
                required
                list="banks-list"
                value={bankName}
                onChange={e => setBankName(e.target.value)}
                placeholder="ex: BEA (Banque Extérieure d'Algérie)"
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-cyan-600"
              />
              <datalist id="banks-list">
                {MAJOR_BANKS.map(b => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Flux de Trésorerie
              </label>
              <select
                value={direction}
                onChange={e => setDirection(e.target.value as ChequeDirection)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-cyan-600"
              >
                <option value="EMIS">Émis (Débours / Paiement)</option>
                <option value="RECU">Reçu (Avance / Client)</option>
              </select>
            </div>
          </div>

          {/* Section 2: Montant & Nature de la dépense */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1">
                Montant du Chèque <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="flex-1 bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono font-bold text-sm focus:outline-none focus:border-cyan-600"
                />
                <div className="w-24 bg-slate-100 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-mono font-extrabold flex items-center justify-center text-center text-xs select-none">
                  DA
                </div>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Nature / Catégorie
              </label>
              <select
                value={category}
                onChange={e => handleCategoryChange(e.target.value as ChequeCategory)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-cyan-600"
              >
                <option value="CAUTION_CONTENEUR">Caution Conteneur (Consignation)</option>
                <option value="DROITS_DOUANE">Droits & Taxes Douane</option>
                <option value="FRAIS_MARITIMES">Frais Maritimes & BAD</option>
                <option value="MANUTENTION_PORT">Manutention & Acconage Port</option>
                <option value="TRANSPORT_TRACTION">Transport Terrestre</option>
                <option value="AVANCE_PROVISION">Avance / Provision Client</option>
                <option value="HONORAIRES_TRANSIT">Honoraires Transit</option>
                <option value="AUTRE_DEBOURS">Autre Débours</option>
              </select>
            </div>
          </div>

          {/* Section 3: Fournisseur & N° Bon de Commande & Bénéficiaire */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Nom Fournisseur <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                list="dossiers-list"
                value={dossierNumber}
                onChange={e => handleDossierChange(e.target.value)}
                placeholder="ex: FLSMIDTH, SINOMA..."
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold focus:outline-none focus:border-cyan-600"
              />
              <datalist id="dossiers-list">
                {dossiers.map(d => (
                  <option key={d.id} value={d.dossierNumber}>
                    BC: {d.clientName} (B/L {d.blNumber})
                  </option>
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                N° DE BON DE COMMANDE <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                placeholder="ex: BC-2026-04192 / BON DE COMMANDE SCHB"
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold font-mono focus:outline-none focus:border-cyan-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Bénéficiaire du chèque <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={beneficiary}
                onChange={e => setBeneficiary(e.target.value)}
                placeholder="ex: CMA CGM, Douane, Port..."
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-semibold focus:outline-none focus:border-cyan-600"
              />
            </div>
          </div>

          {/* Specific container caution box */}
          {isContainerCaution && (
            <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <Container className="h-4 w-4 text-amber-700" />
                <span>Détails de la Consignation & Cautions Conteneurs</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">
                    Numéros des conteneurs (séparés par des virgules) :
                  </label>
                  <input
                    type="text"
                    value={containerNumbersStr}
                    onChange={e => setContainerNumbersStr(e.target.value)}
                    placeholder="MSCU8129031, MSCU8129047..."
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Armateur / Compagnie :
                  </label>
                  <select
                    value={shippingLine}
                    onChange={e => {
                      setShippingLine(e.target.value);
                      if (!beneficiary || beneficiary.includes('Maritime')) {
                        setBeneficiary(`${e.target.value} - Consignation`);
                      }
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-semibold focus:outline-none focus:border-amber-500"
                  >
                    {SHIPPING_LINES.map(line => (
                      <option key={line} value={line}>{line}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Type de conteneurs :
                  </label>
                  <select
                    value={containerType}
                    onChange={e => setContainerType(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-amber-500"
                  >
                    <option value="40_HC">40' High Cube</option>
                    <option value="20_DRY">20' Dry Standard</option>
                    <option value="40_DRY">40' Dry Standard</option>
                    <option value="REEFER">Reefer (Frigorifique)</option>
                    <option value="OPEN_TOP">Open Top</option>
                    <option value="AUTRE">Autre équipement</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Franchise (jours) :
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={franchiseDays}
                    onChange={e => {
                      const val = parseInt(e.target.value) || 14;
                      setFranchiseDays(val);
                      const d = new Date(dateEmission || Date.now());
                      d.setDate(d.getDate() + val);
                      setRestitutionDeadline(d.toISOString().slice(0, 10));
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Date limite retour vide :
                  </label>
                  <input
                    type="date"
                    value={restitutionDeadline}
                    onChange={e => setRestitutionDeadline(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Suivi logistique & coursier */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Date d'Émission
              </label>
              <input
                type="date"
                required
                value={dateEmission}
                onChange={e => setDateEmission(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-cyan-600"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-700 font-semibold">
                  Déclarant / Coursier Assigné <span className="text-cyan-700 font-normal text-xs">(2 choix)</span>
                </label>
                <span className="text-[10px] text-cyan-800 font-bold bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200">
                  2 Déclarants
                </span>
              </div>
              <select
                value={coursierName}
                onChange={e => setCoursierName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold focus:outline-none focus:border-cyan-600 cursor-pointer"
              >
                {TRANSIT_AGENTS.map(agent => (
                  <option key={agent} value={agent}>{agent}</option>
                ))}
              </select>

              {/* 2 choix directs cliquables */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {TRANSIT_AGENTS.map(agent => (
                  <button
                    key={agent}
                    type="button"
                    onClick={() => setCoursierName(agent)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      coursierName === agent
                        ? 'bg-cyan-100 text-cyan-950 border-cyan-400 ring-1 ring-cyan-500 font-bold shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {agent}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Statut du Chèque
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as ChequeStatus)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-semibold focus:outline-none focus:border-cyan-600"
              >
                <option value="EMIS">Émis (En caisse)</option>
                <option value="REMIS_COURSIER">Remis au coursier</option>
                <option value="DEPOSE">Déposé (Au guichet)</option>
                <option value="DECAISSE">Décaissé (Débité)</option>
                <option value="ENCAISSE">Encaissé (Si reçu)</option>
                <option value="A_RECUPERER">À Récupérer (Vide rendu)</option>
                <option value="RECUPERE">Caution Récupérée</option>
                <option value="LITIGE">En Litige / Surestarie</option>
                <option value="ANNULE">Annulé</option>
              </select>
            </div>
          </div>

          {/* Observations */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Observations, références & notes de transit :
            </label>
            <textarea
              rows={2}
              value={observations}
              onChange={e => setObservations(e.target.value)}
              placeholder="ex: Conteneur destiné à l'usine d'Oran, déconsignation prioritaire..."
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-600"
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors text-xs cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-md shadow-cyan-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="h-4 w-4" />
              <span>{editingCheque ? 'Enregistrer les Modifications' : 'Créer le Chèque'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
