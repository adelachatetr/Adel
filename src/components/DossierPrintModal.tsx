import React, { useState } from 'react';
import { Printer, X, Download } from 'lucide-react';
import { TransitDossier, TransitCheque } from '../types/transit';
import { formatAmount, formatShortDate, CATEGORY_LABELS, STATUS_CONFIG, DOSSIER_STATUS_CONFIG } from '../utils/storage';
import { GICA_LOGO_BASE64 } from '../data/logoData';

interface DossierPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  dossier: TransitDossier | null;
  cheques: TransitCheque[];
  companyName: string;
  agencyCity: string;
  agencyPhone: string;
  selectedCurrency: string;
}

export const DossierPrintModal: React.FC<DossierPrintModalProps> = ({
  isOpen,
  onClose,
  dossier,
  cheques,
  companyName,
  agencyCity,
  agencyPhone,
  selectedCurrency
}) => {
  const [printDate, setPrintDate] = useState(new Date().toISOString().slice(0, 10));
  const [customNotes, setCustomNotes] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen || !dossier) return null;

  // Attached cheques for this specific dossier
  const attachedCheques = cheques.filter(
    c => c.dossierNumber.toLowerCase() === dossier.dossierNumber.toLowerCase()
  );

  const totalDebourseDossier = attachedCheques
    .filter(c => c.direction === 'EMIS' && c.status !== 'ANNULE')
    .reduce((sum, c) => {
      const val = typeof c.amount === 'number' ? c.amount : parseFloat(String(c.amount).replace(/[^0-9.-]+/g, ''));
      return sum + (isNaN(val) ? 0 : val);
    }, 0);

  const totalProvisionsDossier = (Number(dossier.totalProvisionsReceived) || 0) + attachedCheques
    .filter(c => c.direction === 'RECU' && c.status !== 'ANNULE')
    .reduce((sum, c) => {
      const val = typeof c.amount === 'number' ? c.amount : parseFloat(String(c.amount).replace(/[^0-9.-]+/g, ''));
      return sum + (isNaN(val) ? 0 : val);
    }, 0);

  const balanceDossier = totalProvisionsDossier - totalDebourseDossier;

  const statusCfg = DOSSIER_STATUS_CONFIG[dossier.status] || {
    label: dossier.status,
    textClass: 'text-slate-800',
    bgClass: 'bg-slate-100',
    borderClass: 'border-slate-300'
  };

  const handlePrint = () => {
    const sheet = document.getElementById('printable-dossier-sheet');
    if (!sheet) {
      window.print();
      return;
    }

    try {
      // Create hidden iframe to bypass any modal / scroll / iframe clipping
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.setAttribute('title', 'Impression Dossier');
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
  <title>Dossier ${dossier.dossierNumber} - ${dossier.clientName}</title>
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
    setIsExporting(true);
    try {
      const sheet = document.getElementById('printable-dossier-sheet');
      if (!sheet) return;

      const headStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        .map(el => el.outerHTML)
        .join('\n');

      const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fiche_Dossier_${dossier.dossierNumber}_${dossier.clientName.replace(/\s+/g, '_')}</title>
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
      link.download = `Fiche_Dossier_${dossier.dossierNumber}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setTimeout(() => setIsExporting(false), 800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-2 sm:p-5 overflow-y-auto backdrop-blur-xs print:p-0 print:bg-white print:static print:overflow-visible">
      <div className="bg-white border border-slate-300 rounded-2xl max-w-4xl w-full max-h-[94vh] flex flex-col shadow-2xl print:bg-white print:border-none print:shadow-none print:max-w-none print:max-h-none print:p-0">
        
        {/* Modal Controls Bar (Hidden when printing) */}
        <div className="print:hidden p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/90 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-100 text-cyan-800 border border-cyan-200">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Fiche d'Émargement & Bilan du Dossier : <span className="font-mono text-cyan-800">{dossier.dossierNumber}</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Aperçu avant impression et exportation PDF pour le dossier de {dossier.clientName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-cyan-600/30 transition-all cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimer</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadStandaloneHTML}
              disabled={isExporting}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 border border-slate-300 shadow-2xs transition-colors cursor-pointer"
              title="Télécharger une version imprimable autonome"
            >
              <Download className="h-4 w-4 text-emerald-600" />
              <span>Télécharger Fiche (PDF/HTML)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Configuration Row (Hidden when printing) */}
        <div className="print:hidden p-3 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Date d'édition du document :</label>
            <input
              type="date"
              value={printDate}
              onChange={e => setPrintDate(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-slate-900 text-xs focus:border-cyan-600"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Observation additionnelle (optionnelle) :</label>
            <input
              type="text"
              value={customNotes}
              onChange={e => setCustomNotes(e.target.value)}
              placeholder="ex: Dossier soldé - Quittance douanière transmise au service comptable..."
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 text-xs focus:border-cyan-600"
            />
          </div>
        </div>

        {/* PRINTABLE SHEET (White paper A4 style) */}
        <div 
          id="printable-dossier-sheet"
          className="printable-document flex-1 overflow-y-auto p-6 sm:p-8 bg-white text-slate-900 font-sans print:p-0 print:overflow-visible"
        >
          
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-4">
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-3">
                <img 
                  src={GICA_LOGO_BASE64} 
                  alt="Groupe GICA" 
                  className="h-12 w-auto object-contain border border-slate-200 p-0.5 rounded bg-white"
                  style={{ maxHeight: '48px', width: 'auto', display: 'block' }}
                />
                <div>
                  <h1 className="text-lg font-black uppercase tracking-wider text-slate-900">
                    {companyName}
                  </h1>
                  <p className="text-xs text-slate-800 font-bold">
                    GROUPE INDUSTRIEL DES CIMENTS D'ALGÉRIE (GICA) · FILIALE SCHB
                  </p>
                  <p className="text-xs text-slate-600 font-medium">
                    Service Transit, Douane & Suivi des Débours
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {agencyCity} · Tél : {agencyPhone}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-bold uppercase bg-slate-100 px-3 py-1 border border-slate-300 rounded inline-block">
                  Fournisseur : {dossier.dossierNumber}
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  Édité le : <strong>{formatShortDate(printDate)}</strong>
                </div>
                <div className="text-[10px] text-cyan-800 font-semibold mt-0.5">
                  Réalisé par : Noui Adel
                </div>
              </div>
            </div>
          </div>

          {/* Title of Document */}
          <div className="text-center my-3">
            <h2 className="text-sm font-bold uppercase tracking-wide border-y border-slate-300 py-1.5 bg-slate-50 text-slate-900">
              FICHE RÉCAPITULATIVE & ÉTAT DE DÉBOURS DU DOSSIER DE TRANSIT
            </h2>
            <div className="text-xs text-slate-600 mt-1.5 flex items-center justify-center gap-4 flex-wrap">
              <span>N° Bon de Commande : <strong className="text-slate-900 font-mono">{dossier.clientName}</strong></span>
              <span>·</span>
              <span>Fournisseur : <strong className="text-slate-900">{dossier.dossierNumber}</strong></span>
              <span>·</span>
              <span>Statut : <strong className="text-slate-900">{statusCfg.label}</strong></span>
              <span>·</span>
              <span>Régime : <strong className="text-slate-900">{dossier.regime.replace('_', ' ')}</strong></span>
            </div>
          </div>

          {/* Dossier Information Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs my-3">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">N° Connaissement (B/L)</span>
              <span className="font-mono font-bold text-slate-900">{dossier.blNumber}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Déclaration Douane</span>
              <span className="font-mono font-bold text-emerald-800">{dossier.declarationNumber || 'En cours'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Port Débarquement</span>
              <span className="font-semibold text-slate-900">{dossier.portOfDischarge}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Navire</span>
              <span className="font-semibold text-slate-900">{dossier.vesselName || 'Non spécifié'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Conteneurs Déclarés</span>
              <span className="font-mono font-bold text-slate-900">{dossier.containerCount} conteneur(s)</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Date d'Ouverture</span>
              <span className="font-medium text-slate-900">{formatShortDate(dossier.openedDate)}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">1. Date Accostage Navire</span>
              <span className="font-medium text-slate-900 font-mono">
                {dossier.berthingDate ? formatShortDate(dossier.berthingDate) : 'En attente'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">2. Date Reçu Dossier (Banque)</span>
              <span className="font-medium text-slate-900 font-mono">
                {dossier.bankReceptionDate ? formatShortDate(dossier.bankReceptionDate) : 'En attente'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Désignation Marchandises</span>
              <span className="font-medium text-slate-900 truncate block">{dossier.goodsDescription}</span>
            </div>
          </div>

          {/* Financial Summary Strip */}
          <div className="grid grid-cols-3 gap-2.5 my-3">
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Débours Émis</span>
              <span className="font-mono font-bold text-sm text-slate-900">
                {formatAmount(totalDebourseDossier, selectedCurrency)}
              </span>
            </div>
            <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-lg">
              <span className="text-[10px] text-emerald-800 uppercase font-bold block">Avances Client Reçues</span>
              <span className="font-mono font-bold text-sm text-emerald-950">
                {formatAmount(totalProvisionsDossier, selectedCurrency)}
              </span>
            </div>
            <div className={`p-2.5 rounded-lg border ${
              balanceDossier >= 0 ? 'bg-teal-50/70 border-teal-200' : 'bg-rose-50/70 border-rose-200'
            }`}>
              <span className="text-[10px] uppercase font-bold block text-slate-600">Solde Net Dossier</span>
              <span className={`font-mono font-bold text-sm ${
                balanceDossier >= 0 ? 'text-teal-800' : 'text-rose-800'
              }`}>
                {balanceDossier >= 0 ? '+' : ''}{formatAmount(balanceDossier, selectedCurrency)}
              </span>
            </div>
          </div>

          {/* Attached Cheques Table */}
          <div className="mt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2 flex items-center justify-between">
              <span>Chèques Rattachés à ce Dossier ({attachedCheques.length})</span>
              <span className="text-[10px] font-normal text-slate-500 lowercase">Tous montants en {selectedCurrency}</span>
            </h3>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-y-2 border-slate-900 bg-slate-100 font-bold text-slate-800">
                  <th className="py-2 px-2 border-r border-slate-200">N°</th>
                  <th className="py-2 px-2 border-r border-slate-200">N° Chèque & Banque</th>
                  <th className="py-2 px-2 border-r border-slate-200">Nature de la Dépense</th>
                  <th className="py-2 px-2 border-r border-slate-200">Bénéficiaire</th>
                  <th className="py-2 px-2 border-r border-slate-200">Déclarant / Coursier</th>
                  <th className="py-2 px-2 border-r border-slate-200">Statut</th>
                  <th className="py-2 px-2 text-right">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {attachedCheques.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-400 italic">
                      Aucun chèque de débours n'a encore été émis ou enregistré pour ce dossier.
                    </td>
                  </tr>
                ) : (
                  attachedCheques.map((chq, index) => {
                    const cat = CATEGORY_LABELS[chq.category];
                    const chqStatusCfg = STATUS_CONFIG[chq.status] || STATUS_CONFIG.BROUILLON;
                    return (
                      <tr key={chq.id} className="text-slate-800">
                        <td className="py-2 px-2 border-r border-slate-200 font-mono text-[11px]">
                          {index + 1}
                        </td>
                        <td className="py-2 px-2 border-r border-slate-200 font-mono font-bold">
                          {chq.chequeNumber}
                          <div className="text-[10px] font-sans font-normal text-slate-500">{chq.bankName}</div>
                        </td>
                        <td className="py-2 px-2 border-r border-slate-200 font-medium">
                          {cat?.label || chq.category}
                          {chq.containerInfo && (
                            <div className="text-[10px] text-amber-800 font-mono">
                              Conteneurs: {chq.containerInfo.containerNumbers.join(', ')}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-2 border-r border-slate-200 font-semibold">
                          {chq.beneficiary}
                        </td>
                        <td className="py-2 px-2 border-r border-slate-200 text-[11px] text-slate-600">
                          {chq.coursierName || 'Non assigné'}
                        </td>
                        <td className="py-2 px-2 border-r border-slate-200">
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300">
                            {chqStatusCfg.label}
                          </span>
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
                <tr className="border-t-2 border-slate-900 bg-slate-50 font-bold text-xs">
                  <td colSpan={6} className="py-2 px-2 text-right uppercase">
                    Total Débours Dossier :
                  </td>
                  <td className="py-2 px-2 text-right font-mono text-sm text-slate-900">
                    {formatAmount(totalDebourseDossier, selectedCurrency)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Observations note if any */}
          {customNotes && (
            <div className="mt-3 p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700">
              <strong>Observation :</strong> {customNotes}
            </div>
          )}

          {/* Signatures & Stamp Blocks */}
          <div className="grid grid-cols-3 gap-6 mt-8 pt-4 border-t border-slate-300 text-xs">
            <div className="space-y-12">
              <span className="font-bold text-slate-800 block">Le Déclarant / Coursier :</span>
              <div className="border-b border-dashed border-slate-400 w-3/4"></div>
              <span className="text-[10px] text-slate-500 italic block">Signature</span>
            </div>

            <div className="space-y-12">
              <span className="font-bold text-slate-800 block">Chef de Service Transit & Douane :</span>
              <div className="border-b border-dashed border-slate-400 w-3/4"></div>
              <span className="text-[10px] text-slate-500 italic block">Visa & Cachet Service</span>
            </div>

            <div className="space-y-12">
              <span className="font-bold text-slate-800 block">Direction Financière / Caisse :</span>
              <div className="border-b border-dashed border-slate-400 w-3/4"></div>
              <span className="text-[10px] text-slate-500 italic block">Pour Acquit & Conformité</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
