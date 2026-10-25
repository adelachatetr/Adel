import React, { useState } from 'react';
import { 
  Printer, 
  X, 
  Download, 
  PieChart, 
  Check, 
  Building2, 
  Layers, 
  FileText,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { TransitCheque } from '../types/transit';
import { formatAmount, formatShortDate, CATEGORY_LABELS } from '../utils/storage';
import { GICA_LOGO_BASE64 } from '../data/logoData';

interface DeboursBreakdownPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  cheques: TransitCheque[];
  selectedCurrency: string;
  companyName: string;
  agencyCity: string;
  agencyPhone: string;
}

export const DeboursBreakdownPrintModal: React.FC<DeboursBreakdownPrintModalProps> = ({
  isOpen,
  onClose,
  cheques,
  selectedCurrency,
  companyName,
  agencyCity,
  agencyPhone
}) => {
  const [showDetailedCheques, setShowDetailedCheques] = useState(true);
  const [periodFilter, setPeriodFilter] = useState<'ALL' | 'THIS_MONTH' | 'THIS_YEAR'>('ALL');
  const [reportRef] = useState(`RAP-DEBOURS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [reportDate] = useState(new Date().toISOString().slice(0, 10));

  if (!isOpen) return null;

  // Filter emitted cheques that are not canceled
  const validCheques = cheques.filter(c => {
    if (c.direction !== 'EMIS' || c.status === 'ANNULE') return false;
    
    if (periodFilter === 'THIS_MONTH') {
      const now = new Date();
      const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      return c.dateEmission.startsWith(currentYearMonth);
    }

    if (periodFilter === 'THIS_YEAR') {
      const currentYear = `${new Date().getFullYear()}`;
      return c.dateEmission.startsWith(currentYear);
    }

    return true;
  });

  const totalDeboursAmount = validCheques.reduce((sum, c) => {
    const val = typeof c.amount === 'number' ? c.amount : parseFloat(String(c.amount).replace(/[^0-9.-]+/g, ''));
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  // Group by category
  const categoriesMap: Record<string, { count: number; totalAmount: number; chequesList: TransitCheque[] }> = {};

  validCheques.forEach(c => {
    const cat = c.category;
    if (!categoriesMap[cat]) {
      categoriesMap[cat] = { count: 0, totalAmount: 0, chequesList: [] };
    }
    const val = typeof c.amount === 'number' ? c.amount : parseFloat(String(c.amount).replace(/[^0-9.-]+/g, '')) || 0;
    categoriesMap[cat].count += 1;
    categoriesMap[cat].totalAmount += val;
    categoriesMap[cat].chequesList.push(c);
  });

  const categoryBreakdownList = Object.entries(categoriesMap)
    .map(([catKey, data]) => {
      const percent = totalDeboursAmount > 0 ? (data.totalAmount / totalDeboursAmount) * 100 : 0;
      return {
        catKey,
        ...data,
        percent: Math.round(percent * 10) / 10
      };
    })
    .sort((a, b) => b.totalAmount - a.totalAmount);

  const handlePrint = () => {
    const sheet = document.getElementById('printable-debours-breakdown-sheet');
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
      iframe.setAttribute('title', 'Impression Etat Debours');
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
  <title>Etat_Debours_${reportRef}</title>
  ${headStyles}
  <style>
    @page { margin: 1cm; size: A4 portrait; }
    body { background: white !important; color: #0f172a !important; margin: 0 !important; padding: 0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
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
      console.warn('Iframe print error, fallback to window.print():', err);
    }

    window.print();
  };

  const handleDownloadStandaloneHTML = () => {
    const sheet = document.getElementById('printable-debours-breakdown-sheet');
    if (!sheet) return;

    const headStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(el => el.outerHTML)
      .join('\n');

    const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Etat_Debours_${reportRef}</title>
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
    link.download = `Etat_Debours_${reportRef}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-6 overflow-y-auto backdrop-blur-xs">
      <div className="bg-white border border-slate-300 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl print:bg-white print:border-none print:shadow-none print:max-w-none print:max-h-none print:p-0 overflow-hidden">
        
        {/* Modal Controls Bar (Hidden on print) */}
        <div className="print:hidden p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/90 rounded-t-3xl">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-100 text-cyan-800 border border-cyan-200">
              <PieChart className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Impression : Répartition des Débours par Nature de Charge
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Rapport financier officiel pour la direction générale et la comptabilité
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-cyan-700/30 transition-all cursor-pointer"
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
              <span>Exporter (PDF/HTML)</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Configuration Row (Hidden on print) */}
        <div className="print:hidden p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-500" />
              <span className="font-semibold text-slate-700">Période :</span>
              <select
                value={periodFilter}
                onChange={e => setPeriodFilter(e.target.value as any)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-800 focus:outline-none focus:border-cyan-600"
              >
                <option value="ALL">Tout l'historique</option>
                <option value="THIS_MONTH">Mois en cours</option>
                <option value="THIS_YEAR">Année en cours ({new Date().getFullYear()})</option>
              </select>
            </div>

            <label className="flex items-center gap-1.5 text-slate-700 font-medium cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showDetailedCheques}
                onChange={e => setShowDetailedCheques(e.target.checked)}
                className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
              />
              <span>Inclure la liste détaillée des chèques émis par nature</span>
            </label>
          </div>

          <div className="text-slate-600 text-xs">
            Total débours : <strong className="font-mono text-cyan-900 font-bold">{formatAmount(totalDeboursAmount, selectedCurrency)}</strong> ({validCheques.length} chèques)
          </div>
        </div>

        {/* PRINTABLE SHEET */}
        <div 
          id="printable-debours-breakdown-sheet"
          className="printable-document flex-1 overflow-y-auto p-6 sm:p-8 bg-white text-slate-900 font-sans print:p-0 print:overflow-visible"
        >
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6">
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-4">
                <img 
                  src={GICA_LOGO_BASE64} 
                  alt="Groupe GICA" 
                  className="h-14 w-auto object-contain border border-slate-200 p-0.5 rounded bg-white"
                  style={{ maxHeight: '56px', width: 'auto', display: 'block' }}
                />
                <div>
                  <h1 className="text-xl font-black uppercase tracking-wider text-slate-900">
                    {companyName}
                  </h1>
                  <p className="text-xs text-slate-700 font-bold">
                    GROUPE INDUSTRIEL DES CIMENTS D'ALGÉRIE (GICA) · FILIALE SCHB
                  </p>
                  <p className="text-xs text-slate-600 font-medium">
                    Service Transit, Douanes & Caisse Centrale
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {agencyCity} · Tél: {agencyPhone}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-slate-900 text-white font-mono font-bold text-xs uppercase tracking-wider rounded">
                  DOCUMENT OFFICIEL
                </span>
                <div className="text-xs font-mono font-bold text-slate-800 mt-1">
                  Réf: {reportRef}
                </div>
                <div className="text-xs text-slate-600">
                  Date d'édition : <strong>{formatShortDate(reportDate)}</strong>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-300 text-center">
              <h2 className="text-base font-extrabold uppercase tracking-wide text-slate-900">
                ÉTAT RÉCAPITULATIF : RÉPARTITION DES DÉBOURS PAR NATURE DE CHARGE
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Ventilation analytique des paiements de transit (Douane, Cautions Conteneurs, Frais Maritimes, Port & Transport)
              </p>
            </div>
          </div>

          {/* Key Summary Cards */}
          <div className="grid grid-cols-3 gap-3 mb-6 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-slate-500 font-semibold block text-[11px]">Total Global des Débours :</span>
              <span className="text-base font-black font-mono text-slate-900 block mt-0.5">
                {formatAmount(totalDeboursAmount, selectedCurrency)}
              </span>
              <span className="text-[10px] text-slate-500">
                Pour l'ensemble des dossiers traités
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-slate-500 font-semibold block text-[11px]">Nombre de Titres de Paiement :</span>
              <span className="text-base font-black font-mono text-cyan-900 block mt-0.5">
                {validCheques.length} chèques émis
              </span>
              <span className="text-[10px] text-slate-500">
                Répartis sur {categoryBreakdownList.length} natures de charges
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-slate-500 font-semibold block text-[11px]">Période de Synthèse :</span>
              <span className="text-xs font-bold text-slate-900 block mt-1">
                {periodFilter === 'ALL' && 'Historique complet des opérations'}
                {periodFilter === 'THIS_MONTH' && 'Mois en cours'}
                {periodFilter === 'THIS_YEAR' && `Exercice annuel ${new Date().getFullYear()}`}
              </span>
              <span className="text-[10px] text-slate-500">
                Service Transit SCHB
              </span>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="border border-slate-300 rounded-xl overflow-hidden mb-6">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b-2 border-slate-300 text-slate-800 font-bold uppercase text-[11px]">
                  <th className="py-2.5 px-3 border-r border-slate-300 w-12 text-center">N°</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Nature de la Charge / Débours</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 text-center w-24">Nbre Chèques</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 text-right w-36">Montant Total</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 text-center w-20">Part (%)</th>
                  <th className="py-2.5 px-3 w-40">Proportion Visuelle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {categoryBreakdownList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                      Aucun débours émis pour cette période.
                    </td>
                  </tr>
                ) : (
                  categoryBreakdownList.map((item, idx) => {
                    const info = CATEGORY_LABELS[item.catKey as keyof typeof CATEGORY_LABELS] || { label: item.catKey };
                    return (
                      <tr key={item.catKey} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        <td className="py-2 px-3 border-r border-slate-200 text-center font-mono font-bold text-slate-600">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200">
                          <strong className="text-slate-900 font-bold">{info.label}</strong>
                          <div className="text-[10px] text-slate-500">
                            {item.catKey === 'CAUTION_CONTENEUR' && 'Consignation remboursable sous 14/21 jours dès restitution vide'}
                            {item.catKey === 'DROITS_DOUANE' && 'Liquidation Trésor Public / Droits de douane DUM'}
                            {item.catKey === 'FRAIS_MARITIMES' && 'Échange de B/L, BAD, surestaries et frais portuaires armateurs'}
                            {item.catKey === 'MANUTENTION_PORT' && 'Acconage, magasinage terminal, pesage VGM et prestations de quai'}
                            {item.catKey === 'TRANSPORT_TRACTION' && 'Traction routière entre port de débarquement et usine'}
                            {item.catKey === 'AVANCE_PROVISION' && 'Provisions et avances versées pour les débours'}
                            {item.catKey === 'AUTRE_DEBOURS' && 'Frais annexes, contrôle phytosanitaire, escorte, etc.'}
                          </div>
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 text-center font-mono font-bold text-slate-800">
                          {item.count}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 text-right font-mono font-bold text-slate-950 whitespace-nowrap">
                          {formatAmount(item.totalAmount, selectedCurrency)}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 text-center font-mono font-bold text-slate-800">
                          {item.percent}%
                        </td>
                        <td className="py-2 px-3">
                          <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden flex items-center">
                            <div 
                              className="h-full bg-cyan-700"
                              style={{ width: `${Math.min(item.percent, 100)}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-900 bg-slate-100 font-bold text-xs">
                  <td colSpan={2} className="py-2.5 px-3 text-right uppercase text-slate-900 font-black">
                    TOTAL GLOBAL DES DÉBOURS DE TRANSIT :
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-slate-900 font-black">
                    {validCheques.length}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-sm font-black text-slate-950 whitespace-nowrap">
                    {formatAmount(totalDeboursAmount, selectedCurrency)}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-slate-900 font-black">
                    100%
                  </td>
                  <td className="py-2.5 px-3 text-[10px] text-slate-500 font-medium">
                    Total validé
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Certified Box */}
          <div className="mt-2 text-xs bg-slate-50 border border-slate-300 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <span className="text-slate-700 font-semibold">
              Mention de conformité comptable :
            </span>
            <div className="text-right">
              <span className="text-slate-600">Arrêté le présent état des débours à la somme totale de : </span>
              <strong className="font-mono font-bold text-slate-950 text-sm">
                {formatAmount(totalDeboursAmount, selectedCurrency)}
              </strong>
            </div>
          </div>

          {/* Detailed list of cheques if requested */}
          {showDetailedCheques && categoryBreakdownList.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-300">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-cyan-700" />
                <span>Détail exhaustif des chèques rattachés par nature de charge :</span>
              </h3>

              <div className="space-y-4">
                {categoryBreakdownList.map(item => {
                  const info = CATEGORY_LABELS[item.catKey as keyof typeof CATEGORY_LABELS] || { label: item.catKey };
                  return (
                    <div key={`detail-${item.catKey}`} className="border border-slate-200 rounded-lg overflow-hidden">
                      <div className="bg-slate-100 px-3 py-1.5 font-bold text-xs text-slate-800 flex items-center justify-between">
                        <span>{info.label} ({item.count} chèques)</span>
                        <span className="font-mono text-cyan-900">{formatAmount(item.totalAmount, selectedCurrency)}</span>
                      </div>
                      <table className="w-full text-left text-[11px]">
                        <thead>
                          <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                            <th className="py-1 px-2">N° Chèque</th>
                            <th className="py-1 px-2">Banque</th>
                            <th className="py-1 px-2">Bénéficiaire</th>
                            <th className="py-1 px-2">Dossier / Client</th>
                            <th className="py-1 px-2">Date Émission</th>
                            <th className="py-1 px-2 text-right">Montant</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono">
                          {item.chequesList.map(chq => (
                            <tr key={chq.id} className="hover:bg-slate-50">
                              <td className="py-1 px-2 font-bold text-slate-800">{chq.chequeNumber}</td>
                              <td className="py-1 px-2 font-sans text-slate-600 truncate max-w-[120px]">{chq.bankName}</td>
                              <td className="py-1 px-2 font-sans text-slate-800 font-semibold truncate max-w-[160px]">{chq.beneficiary}</td>
                              <td className="py-1 px-2 font-sans text-slate-600">{chq.dossierNumber}</td>
                              <td className="py-1 px-2 text-slate-600">{formatShortDate(chq.dateEmission)}</td>
                              <td className="py-1 px-2 text-right font-bold text-slate-900 whitespace-nowrap">
                                {formatAmount(chq.amount, chq.currency)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Signature and Stamp Blocks */}
          <div className="grid grid-cols-3 gap-6 mt-8 pt-4 border-t border-slate-300 text-xs">
            <div className="space-y-12">
              <span className="font-bold text-slate-800 block">Établi par : Le Caissier Transit</span>
              <div className="border-b border-dashed border-slate-400 w-3/4"></div>
              <span className="text-[10px] text-slate-500 italic block">Signature & Cachet Caisse</span>
            </div>

            <div className="space-y-12">
              <span className="font-bold text-slate-800 block">Vérifié par : Chef de Service Transit</span>
              <div className="border-b border-dashed border-slate-400 w-3/4"></div>
              <span className="text-[10px] text-slate-500 italic block">Noui Adel - Visa Transit</span>
            </div>

            <div className="space-y-12">
              <span className="font-bold text-slate-800 block">Approuvé par : Direction Financière</span>
              <div className="border-b border-dashed border-slate-400 w-3/4"></div>
              <span className="text-[10px] text-slate-500 italic block">Direction Générale SCHB / GICA</span>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-8 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-400">
            Document généré automatiquement par la Plateforme Transit SCHB · Groupe Industriel des Ciments d'Algérie (GICA)
          </div>
        </div>

      </div>
    </div>
  );
};
