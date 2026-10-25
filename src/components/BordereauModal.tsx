import React, { useState, useEffect, useMemo } from 'react';
import { Printer, X, Download, FileText, CheckCircle2, Building2 } from 'lucide-react';
import { TransitCheque } from '../types/transit';
import { formatAmount, formatShortDate, CATEGORY_LABELS } from '../utils/storage';
import { TRANSIT_AGENTS } from '../data/mockTransitData';
import { GICA_LOGO_BASE64 } from '../data/logoData';

interface BordereauModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableCheques: TransitCheque[];
  preSelectedCheques?: TransitCheque[];
  companyName: string;
  agencyCity: string;
  agencyPhone: string;
  selectedCurrency: string;
}

export const BordereauModal: React.FC<BordereauModalProps> = ({
  isOpen,
  onClose,
  availableCheques,
  preSelectedCheques = [],
  companyName,
  agencyCity,
  agencyPhone,
  selectedCurrency
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [documentType, setDocumentType] = useState<'REMISE_COURSIER' | 'DECHARGE_COMPAGNIE' | 'DEMANDE_RESTITUTION_CAUTION'>('REMISE_COURSIER');
  const [bearerName, setBearerName] = useState(TRANSIT_AGENTS[0]);
  const [destinationEntity, setDestinationEntity] = useState('Guichets Maritimes & Recette des Douanes');
  const [bordereauRef, setBordereauRef] = useState(`BR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [bordereauDate, setBordereauDate] = useState(new Date().toISOString().slice(0, 10));

  // Synchronize selected cheques whenever modal opens or preSelectedCheques change
  useEffect(() => {
    if (isOpen) {
      if (preSelectedCheques && preSelectedCheques.length > 0) {
        setSelectedIds(preSelectedCheques.map(c => c.id));
      } else {
        const defaultIds = availableCheques
          .filter(c => c.status === 'EMIS' || c.status === 'REMIS_COURSIER')
          .map(c => c.id);
        setSelectedIds(defaultIds.length > 0 ? defaultIds : availableCheques.slice(0, 5).map(c => c.id));
      }
      setBordereauRef(`BR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
      setBordereauDate(new Date().toISOString().slice(0, 10));
    }
  }, [isOpen, preSelectedCheques, availableCheques]);

  const chequesToPrint = useMemo(() => {
    return availableCheques.filter(c => selectedIds.includes(c.id));
  }, [availableCheques, selectedIds]);

  const totalAmount = useMemo(() => {
    return chequesToPrint.reduce((sum, c) => {
      const val = typeof c.amount === 'number' ? c.amount : parseFloat(String(c.amount).replace(/[^0-9.-]+/g, ''));
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
  }, [chequesToPrint]);

  const toggleCheque = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  if (!isOpen) return null;

  const handlePrint = () => {
    const sheet = document.getElementById('printable-bordereau-sheet');
    if (!sheet) {
      window.print();
      return;
    }

    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.setAttribute('title', 'Impression Bordereau');
      document.body.appendChild(iframe);

      const headStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        .map(el => el.outerHTML)
        .join('\n');

      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Bordereau_${bordereauRef}</title>
  ${headStyles}
  <style>
    @page { margin: 1cm; size: A4 portrait; }
    body { background: white !important; color: #0f172a !important; margin: 0 !important; padding: 0 !important; }
    .printable-document { width: 100% !important; margin: 0 !important; padding: 0 !important; }
  </style>
</head>
<body class="bg-white">
  <div class="printable-document">
    ${sheet.innerHTML}
  </div>
</body>
</html>`);
        doc.close();

        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch (e) {
            window.print();
          } finally {
            setTimeout(() => {
              if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
              }
            }, 1200);
          }
        }, 350);
        return;
      }
    } catch (err) {
      console.warn('Iframe print error, falling back to window.print():', err);
    }

    window.print();
  };

  const handleDownloadStandaloneHTML = () => {
    const sheet = document.getElementById('printable-bordereau-sheet');
    if (!sheet) return;

    const headStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(el => el.outerHTML)
      .join('\n');

    const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bordereau_${bordereauRef}</title>
  ${headStyles}
  <style>
    @page { margin: 1cm; size: A4 portrait; }
    body { background: white !important; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 24px; }
    .printable-document { max-width: 900px; margin: 0 auto; }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body class="bg-white">
  <div class="printable-document">
    ${sheet.innerHTML}
  </div>
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() { window.print(); }, 400);
    });
  </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bordereau_${bordereauRef}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-6 overflow-y-auto backdrop-blur-xs">
      <div className="bg-white border border-slate-300 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl print:bg-white print:border-none print:shadow-none print:max-w-none print:max-h-none print:p-0">
        
        {/* Modal Controls Bar (Hidden when printing) */}
        <div className="print:hidden p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <Printer className="h-5 w-5 text-cyan-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Générateur de Bordereaux & Décharges de Chèques
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Document officiel pour transmission au déclarant, coursier ou guichet portuaire
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-cyan-600/30 transition-all cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimer</span>
            </button>

            <button
              onClick={handleDownloadStandaloneHTML}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 border border-slate-300 shadow-2xs transition-colors cursor-pointer"
              title="Télécharger une version imprimable autonome"
            >
              <Download className="h-4 w-4 text-emerald-600" />
              <span>Télécharger Bordereau (PDF/HTML)</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Configuration Row (Hidden when printing) */}
        <div className="print:hidden p-4 bg-slate-50/60 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Type de Document :</label>
            <select
              value={documentType}
              onChange={e => setDocumentType(e.target.value as any)}
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-cyan-600"
            >
              <option value="REMISE_COURSIER">Bordereau de Remise au Coursier / Déclarant</option>
              <option value="DECHARGE_COMPAGNIE">Accusé de Dépôt / Décharge Guichet Maritime</option>
              <option value="DEMANDE_RESTITUTION_CAUTION">Demande de Déconsignation de Caution</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-700 font-semibold">Porteur / Déclarant assigné :</label>
              <span className="text-[10px] text-cyan-800 font-bold bg-cyan-50 px-1.5 py-0.2 rounded border border-cyan-200">2 choix</span>
            </div>
            <select
              value={bearerName}
              onChange={e => setBearerName(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl p-2 text-slate-900 font-semibold focus:outline-none focus:border-cyan-600 cursor-pointer"
            >
              {TRANSIT_AGENTS.map(agent => (
                <option key={agent} value={agent}>{agent}</option>
              ))}
            </select>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {TRANSIT_AGENTS.map(agent => (
                <button
                  key={agent}
                  type="button"
                  onClick={() => setBearerName(agent)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer ${
                    bearerName === agent
                      ? 'bg-cyan-100 text-cyan-950 border-cyan-400 font-bold'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {agent}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Entité Destinataire :</label>
            <input
              type="text"
              value={destinationEntity}
              onChange={e => setDestinationEntity(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-cyan-600"
            />
          </div>
        </div>

        {/* Cheques Selection pills (Hidden when printing) */}
        <div className="print:hidden p-3 bg-slate-50 border-b border-slate-200 text-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="text-slate-700 text-[11px] font-bold uppercase tracking-wider flex items-center gap-2">
              <span>Chèques inclus dans ce bordereau :</span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-900 font-mono font-bold text-xs">
                {chequesToPrint.length} chèque{chequesToPrint.length > 1 ? 's' : ''} · Total : {formatAmount(totalAmount, selectedCurrency)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setSelectedIds(availableCheques.map(c => c.id))}
                className="text-[11px] text-cyan-700 hover:text-cyan-800 font-semibold underline cursor-pointer"
              >
                Tout sélectionner
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="text-[11px] text-slate-500 hover:text-slate-700 font-medium underline cursor-pointer"
              >
                Tout désélectionner
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
            {availableCheques.map(c => {
              const isSelected = selectedIds.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleCheque(c.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors border cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-100 text-cyan-900 border-cyan-400 font-bold shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-300 hover:text-slate-900 hover:border-slate-400'
                  }`}
                >
                  {isSelected ? '✓ ' : ''}{c.chequeNumber} ({formatAmount(c.amount, c.currency)})
                </button>
              );
            })}
          </div>
        </div>

        {/* PRINTABLE SHEET (White paper A4 styled) */}
        <div 
          id="printable-bordereau-sheet"
          className="printable-document flex-1 overflow-y-auto p-6 sm:p-8 bg-white text-slate-900 font-sans print:p-0 print:overflow-visible"
        >
          
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6">
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-4">
                <img 
                  src={GICA_LOGO_BASE64} 
                  alt="Groupe GICA" 
                  className="h-12 w-auto object-contain border border-slate-200 p-0.5 rounded bg-white"
                  style={{ maxHeight: '48px', width: 'auto', display: 'block' }}
                />
                <div>
                  <h1 className="text-xl font-black uppercase tracking-wider text-slate-900">
                    {companyName}
                  </h1>
                  <p className="text-xs text-slate-700 font-bold">
                    GROUPE INDUSTRIEL DES CIMENTS D'ALGÉRIE (GICA) · FILIALE SCHB
                  </p>
                  <p className="text-xs text-slate-600 font-medium">
                    Service Transit, Douane & Cautions Maritimes
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {agencyCity} · Tél: {agencyPhone}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-mono font-bold uppercase bg-slate-100 px-3 py-1 border border-slate-300 rounded inline-block">
                  Réf: {bordereauRef}
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  Date : <strong>{formatShortDate(bordereauDate)}</strong>
                </div>
                <div className="text-[10px] text-cyan-800 font-semibold mt-1">
                  Réalisé par : Noui Adel
                </div>
              </div>
            </div>
          </div>

          {/* Title of Document */}
          <div className="text-center my-4">
            <h2 className="text-base font-bold uppercase tracking-wide border-y border-slate-300 py-2 bg-slate-50">
              {documentType === 'REMISE_COURSIER' && 'Bordereau de Remise de Chèques de Service Transit'}
              {documentType === 'DECHARGE_COMPAGNIE' && 'Bordereau de Dépôt de Chèques & Décharge Maritime'}
              {documentType === 'DEMANDE_RESTITUTION_CAUTION' && 'Demande de Restitution de Chèque de Caution (Déconsignation)'}
            </h2>
            <div className="text-xs text-slate-600 mt-2 flex justify-center gap-6">
              <span>Porteur / Déclarant : <strong>{bearerName}</strong></span>
              <span>·</span>
              <span>Destinataire : <strong>{destinationEntity}</strong></span>
            </div>
          </div>

          {/* Cheques Table */}
          <div className="mt-4">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-y-2 border-slate-900 bg-slate-100 font-bold text-slate-800">
                  <th className="py-2 px-2 border-r border-slate-200">N°</th>
                  <th className="py-2 px-2 border-r border-slate-200">N° Chèque & Banque</th>
                  <th className="py-2 px-2 border-r border-slate-200">Fournisseur / N° BC</th>
                  <th className="py-2 px-2 border-r border-slate-200">Bénéficiaire & Motif</th>
                  <th className="py-2 px-2 border-r border-slate-200">Réf. Conteneurs / B/L</th>
                  <th className="py-2 px-2 text-right">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {chequesToPrint.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 italic">
                      Aucun chèque sélectionné pour ce bordereau.
                    </td>
                  </tr>
                ) : (
                  chequesToPrint.map((chq, index) => {
                    const cat = CATEGORY_LABELS[chq.category];
                    return (
                      <tr key={chq.id} className="text-slate-800">
                        <td className="py-2 px-2 border-r border-slate-200 font-mono text-[11px]">
                          {index + 1}
                        </td>
                        <td className="py-2 px-2 border-r border-slate-200 font-mono font-bold">
                          {chq.chequeNumber}
                          <div className="text-[10px] font-sans font-normal text-slate-600">{chq.bankName}</div>
                        </td>
                        <td className="py-2 px-2 border-r border-slate-200">
                          <strong className="text-[11px] font-bold text-slate-900">{chq.dossierNumber}</strong>
                          <div className="text-[10px] text-slate-600 truncate max-w-[140px] font-mono">BC: {chq.clientName}</div>
                        </td>
                        <td className="py-2 px-2 border-r border-slate-200">
                          <span className="font-semibold">{chq.beneficiary}</span>
                          <div className="text-[10px] text-slate-600">{cat?.label || chq.category}</div>
                        </td>
                        <td className="py-2 px-2 border-r border-slate-200 font-mono text-[10px]">
                          {chq.containerInfo ? (
                            <div>
                              <span>{chq.containerInfo.containerNumbers.join(', ')}</span>
                              {chq.containerInfo.interchangeNumber && (
                                <div className="text-emerald-700 font-medium">EIR: {chq.containerInfo.interchangeNumber}</div>
                              )}
                            </div>
                          ) : (
                            'Débours ordinaire'
                          )}
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-bold whitespace-nowrap">
                          {formatAmount(chq.amount, chq.currency)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-900 bg-slate-100 font-bold text-xs">
                  <td colSpan={5} className="py-2.5 px-2 text-right uppercase text-slate-900 font-bold">
                    Total Global du Bordereau ({chequesToPrint.length} titre{chequesToPrint.length > 1 ? 's' : ''}) :
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono text-sm font-black text-slate-950 whitespace-nowrap">
                    {formatAmount(totalAmount, selectedCurrency || 'DA')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Certified Total Box */}
          <div className="mt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2">
            <span className="text-slate-700 font-medium">
              Nombre de chèques / décharges : <strong className="text-slate-900 font-bold">{chequesToPrint.length}</strong>
            </span>
            <div className="text-right">
              <span className="text-slate-600 font-medium">Arrêté le présent bordereau à la somme de : </span>
              <strong className="font-mono font-bold text-slate-950 text-sm">
                {formatAmount(totalAmount, selectedCurrency || 'DA')}
              </strong>
            </div>
          </div>

          {/* Legal / Responsability clause */}
          <div className="mt-4 p-2.5 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-600 leading-relaxed">
            <strong>Mention d'émargement :</strong> Le signataire réceptionnaire reconnaît avoir reçu en mains propres les titres de paiement désignés ci-dessus, et s'engage à les remettre exclusivement aux bénéficiaires mentionnés et à rapporter quittance ou récépissé de dépôt au service transit dans un délai de 24 heures.
          </div>

          {/* Signatures & Stamp Blocks */}
          <div className="grid grid-cols-3 gap-6 mt-8 pt-4 border-t border-slate-300 text-xs">
            <div className="space-y-12">
              <span className="font-bold text-slate-800 block">Émetteur / Responsable Caisse :</span>
              <div className="border-b border-dashed border-slate-400 w-3/4"></div>
              <span className="text-[10px] text-slate-500 italic block">Signature & Cachet</span>
            </div>

            <div className="space-y-12">
              <span className="font-bold text-slate-800 block">Le Porteur / Déclarant :</span>
              <div className="border-b border-dashed border-slate-400 w-3/4"></div>
              <span className="text-[10px] text-slate-500 italic block">{bearerName}</span>
            </div>

            <div className="space-y-12">
              <span className="font-bold text-slate-800 block">Accusé Réception Guichet :</span>
              <div className="border-b border-dashed border-slate-400 w-3/4"></div>
              <span className="text-[10px] text-slate-500 italic block">Date, Signature & Tampon Guichet</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
