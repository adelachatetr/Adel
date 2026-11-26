import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X, Download } from 'lucide-react';
import { TransitCheque } from '../types/transit';
import { formatAmount, formatShortDate, CATEGORY_LABELS, CHEQUE_NATURE_LABELS } from '../utils/storage';
import { GICA_LOGO_BASE64 } from '../data/logoData';

interface DeboursBreakdownPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  cheques: TransitCheque[];
  selectedCurrency: string;
  companyName: string;
  agencyCity: string;
  agencyPhone: string;
  initialGroupingMode?: 'EXPENSE_NATURE' | 'CATEGORY';
}

export const DeboursBreakdownPrintModal: React.FC<DeboursBreakdownPrintModalProps> = ({
  isOpen,
  onClose,
  cheques,
  selectedCurrency,
  companyName,
  agencyCity,
  agencyPhone,
  initialGroupingMode = 'EXPENSE_NATURE'
}) => {
  const [showDetailedCheques, setShowDetailedCheques] = useState(true);
  const [periodFilter, setPeriodFilter] = useState<'ALL' | 'THIS_MONTH' | 'THIS_YEAR'>('ALL');
  const [groupingMode, setGroupingMode] = useState<'EXPENSE_NATURE' | 'CATEGORY'>(initialGroupingMode);
  const [reportRef] = useState(`RAP-DEBOURS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10));
  const [customNotes, setCustomNotes] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setGroupingMode(initialGroupingMode);
    }
  }, [isOpen, initialGroupingMode]);

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

  // Group by category (including nested expenseNature details)
  const categoriesMap: Record<
    string,
    {
      count: number;
      totalAmount: number;
      chequesList: TransitCheque[];
      subNaturesMap: Record<string, { count: number; totalAmount: number }>;
    }
  > = {};

  // Group by specific Nature de dépenses
  const expenseNatureMap: Record<
    string,
    {
      key: string;
      expenseNatureLabel: string;
      catKey: string;
      count: number;
      totalAmount: number;
      chequesList: TransitCheque[];
    }
  > = {};

  validCheques.forEach(c => {
    const cat = c.category;
    const val = typeof c.amount === 'number' ? c.amount : parseFloat(String(c.amount).replace(/[^0-9.-]+/g, '')) || 0;
    const catInfo = CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS];
    const natureLabel = c.expenseNature?.trim() || `${catInfo?.short || cat} (Non précisée)`;

    if (!categoriesMap[cat]) {
      categoriesMap[cat] = { count: 0, totalAmount: 0, chequesList: [], subNaturesMap: {} };
    }
    categoriesMap[cat].count += 1;
    categoriesMap[cat].totalAmount += val;
    categoriesMap[cat].chequesList.push(c);

    if (!categoriesMap[cat].subNaturesMap[natureLabel]) {
      categoriesMap[cat].subNaturesMap[natureLabel] = { count: 0, totalAmount: 0 };
    }
    categoriesMap[cat].subNaturesMap[natureLabel].count += 1;
    categoriesMap[cat].subNaturesMap[natureLabel].totalAmount += val;

    const expKey = `${cat}::${natureLabel}`;
    if (!expenseNatureMap[expKey]) {
      expenseNatureMap[expKey] = {
        key: expKey,
        expenseNatureLabel: natureLabel,
        catKey: cat,
        count: 0,
        totalAmount: 0,
        chequesList: []
      };
    }
    expenseNatureMap[expKey].count += 1;
    expenseNatureMap[expKey].totalAmount += val;
    expenseNatureMap[expKey].chequesList.push(c);
  });

  const categoryBreakdownList = Object.entries(categoriesMap)
    .map(([catKey, data]) => {
      const percent = totalDeboursAmount > 0 ? (data.totalAmount / totalDeboursAmount) * 100 : 0;
      const subNatures = Object.entries(data.subNaturesMap)
        .map(([name, subData]) => ({
          name,
          count: subData.count,
          totalAmount: subData.totalAmount,
          percentInCategory:
            data.totalAmount > 0 ? Math.round((subData.totalAmount / data.totalAmount) * 1000) / 10 : 0
        }))
        .sort((a, b) => b.totalAmount - a.totalAmount);
      return {
        catKey,
        count: data.count,
        totalAmount: data.totalAmount,
        chequesList: data.chequesList,
        subNatures,
        percent: Math.round(percent * 10) / 10
      };
    })
    .sort((a, b) => b.totalAmount - a.totalAmount);

  const expenseNatureBreakdownList = Object.values(expenseNatureMap)
    .map(item => {
      const percent = totalDeboursAmount > 0 ? (item.totalAmount / totalDeboursAmount) * 100 : 0;
      return {
        ...item,
        percent: Math.round(percent * 10) / 10
      };
    })
    .sort((a, b) => b.totalAmount - a.totalAmount);

  // Exact same iframe print mechanism as DossierPrintModal
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

  // Exact same standalone HTML/PDF export mechanism as DossierPrintModal
  const handleDownloadStandaloneHTML = () => {
    setIsExporting(true);
    try {
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
    .printable-document { max-width: 1020px; margin: 0 auto; }
    .whitespace-nowrap { white-space: nowrap !important; }
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
    } finally {
      setTimeout(() => setIsExporting(false), 800);
    }
  };

  const periodLabel =
    periodFilter === 'ALL'
      ? 'Historique complet des opérations'
      : periodFilter === 'THIS_MONTH'
      ? 'Mois en cours'
      : `Exercice annuel ${new Date().getFullYear()}`;

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-2 sm:p-5 overflow-y-auto backdrop-blur-xs print:p-0 print:bg-white print:static print:overflow-visible">
      <div className="bg-white border border-slate-300 rounded-2xl max-w-5xl w-full max-h-[94vh] flex flex-col shadow-2xl print:bg-white print:border-none print:shadow-none print:max-w-none print:max-h-none print:p-0">
        
        {/* Modal Controls Bar (Hidden when printing) */}
        <div className="print:hidden shrink-0 p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-slate-50/90 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-100 text-cyan-800 border border-cyan-200">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {groupingMode === 'EXPENSE_NATURE'
                  ? 'État Récapitulatif : Répartition des Débours par Nature de Dépenses'
                  : 'État Récapitulatif : Répartition des Débours par Nature de Charge'}
                {' · '}
                <span className="font-mono text-cyan-800">{reportRef}</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Aperçu avant impression et exportation PDF · {validCheques.length} chèque(s) émis ({formatAmount(totalDeboursAmount, selectedCurrency)})
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
              <span>Télécharger État (PDF/HTML)</span>
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
        <div className="print:hidden shrink-0 p-3 bg-slate-50 border-b border-slate-200 space-y-2.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Détail par :</label>
              <select
                value={groupingMode}
                onChange={e => setGroupingMode(e.target.value as 'EXPENSE_NATURE' | 'CATEGORY')}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-cyan-900 font-bold text-xs focus:border-cyan-600 cursor-pointer"
              >
                <option value="EXPENSE_NATURE">Nature de dépenses (Détaillé)</option>
                <option value="CATEGORY">Nature de Charge / Catégorie</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Période :</label>
              <select
                value={periodFilter}
                onChange={e => setPeriodFilter(e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-medium text-xs focus:border-cyan-600 cursor-pointer"
              >
                <option value="ALL">Tout l'historique</option>
                <option value="THIS_MONTH">Mois en cours</option>
                <option value="THIS_YEAR">Année en cours ({new Date().getFullYear()})</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Date d'édition du document :</label>
              <input
                type="date"
                value={reportDate}
                onChange={e => setReportDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-slate-900 text-xs focus:border-cyan-600"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Observation additionnelle (optionnelle) :</label>
              <input
                type="text"
                value={customNotes}
                onChange={e => setCustomNotes(e.target.value)}
                placeholder="ex: État transmis à la Direction Financière..."
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 text-xs focus:border-cyan-600"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/80">
            <label className="flex items-center gap-1.5 text-slate-700 font-medium cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showDetailedCheques}
                onChange={e => setShowDetailedCheques(e.target.checked)}
                className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
              />
              <span>Inclure la liste détaillée des chèques émis</span>
            </label>

            <div className="text-slate-600 text-xs">
              Total débours : <strong className="font-mono text-cyan-900 font-bold">{formatAmount(totalDeboursAmount, selectedCurrency)}</strong> ({validCheques.length} chèques)
            </div>
          </div>
        </div>

        {/* PRINTABLE SHEET (White paper A4 style — identical structure to DossierPrintModal) */}
        <div 
          id="printable-debours-breakdown-sheet"
          className="printable-document flex-1 min-h-0 overflow-y-auto p-6 sm:p-8 bg-white text-slate-900 font-sans print:p-0 print:overflow-visible"
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
                <div className="text-xs font-bold uppercase bg-slate-100 px-3 py-1 border border-slate-300 rounded inline-block font-mono">
                  Réf : {reportRef}
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  Édité le : <strong>{formatShortDate(reportDate)}</strong>
                </div>
                <div className="text-[10px] text-cyan-800 font-bold mt-0.5">
                  Réalisé par : NOUI ADEL
                </div>
              </div>
            </div>
          </div>

          {/* Title of Document */}
          <div className="text-center my-3">
            <h2 className="text-sm font-bold uppercase tracking-wide border-y border-slate-300 py-1.5 bg-slate-50 text-slate-900">
              {groupingMode === 'EXPENSE_NATURE'
                ? 'ÉTAT RÉCAPITULATIF : RÉPARTITION DES DÉBOURS PAR NATURE DE DÉPENSES'
                : 'ÉTAT RÉCAPITULATIF : RÉPARTITION DES DÉBOURS PAR NATURE DE CHARGE'}
            </h2>
            <div className="text-xs text-slate-600 mt-1.5 flex items-center justify-center gap-4 flex-wrap">
              <span>Période : <strong className="text-slate-900">{periodLabel}</strong></span>
              <span>·</span>
              <span>Titres émis : <strong className="text-slate-900 font-mono">{validCheques.length} chèque(s)</strong></span>
              <span>·</span>
              <span>Total Débours : <strong className="text-slate-900 font-mono">{formatAmount(totalDeboursAmount, selectedCurrency)}</strong></span>
            </div>
          </div>

          {/* Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs my-3">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">
                Total Global des Débours
              </span>
              <span className="font-mono font-black text-slate-900 text-sm">
                {formatAmount(totalDeboursAmount, selectedCurrency)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">
                Nombre de Chèques Émis
              </span>
              <span className="font-mono font-bold text-cyan-900 text-sm">
                {validCheques.length} chèque(s)
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">
                {groupingMode === 'EXPENSE_NATURE' ? 'Natures de Dépenses' : 'Catégories de Charge'}
              </span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {groupingMode === 'EXPENSE_NATURE'
                  ? `${expenseNatureBreakdownList.length} poste(s)`
                  : `${categoryBreakdownList.length} catégorie(s)`}
              </span>
            </div>
          </div>

          {/* Main Breakdown Table */}
          <div className="mt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2 flex items-center justify-between">
              <span>
                {groupingMode === 'EXPENSE_NATURE'
                  ? `Ventilation par Nature de Dépenses (${expenseNatureBreakdownList.length})`
                  : `Ventilation par Nature de Charge / Catégorie (${categoryBreakdownList.length})`}
              </span>
              <span className="text-[10px] font-normal text-slate-500 lowercase">Tous montants en {selectedCurrency}</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-y-2 border-slate-900 bg-slate-100 font-bold text-slate-800">
                    <th className="py-2 px-2 border-r border-slate-200 w-10 text-center">N°</th>
                    <th className="py-2 px-2 border-r border-slate-200">
                      {groupingMode === 'EXPENSE_NATURE'
                        ? 'Nature de Dépenses & Catégorie'
                        : 'Catégorie & Détail des Natures de Dépenses'}
                    </th>
                    <th className="py-2 px-2 border-r border-slate-200 text-center w-24">Nbre Chèques</th>
                    <th className="py-2 px-3 border-r border-slate-200 text-right whitespace-nowrap min-w-[140px]">Montant Total</th>
                    <th className="py-2 px-2 border-r border-slate-200 text-center w-20">Part (%)</th>
                    <th className="py-2 px-2 w-36">Proportion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {validCheques.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                        Aucun chèque de débours émis pour cette période.
                      </td>
                    </tr>
                  ) : groupingMode === 'EXPENSE_NATURE' ? (
                    expenseNatureBreakdownList.map((item, idx) => {
                      const info = CATEGORY_LABELS[item.catKey as keyof typeof CATEGORY_LABELS] || { label: item.catKey };
                      return (
                        <tr key={item.key} className="text-slate-800">
                          <td className="py-2 px-2 border-r border-slate-200 text-center font-mono text-[11px] font-bold">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-2 border-r border-slate-200">
                            <div className="font-bold text-slate-900">{item.expenseNatureLabel}</div>
                            <div className="text-[10px] text-cyan-800 font-medium">
                              Catégorie : {info.label}
                            </div>
                          </td>
                          <td className="py-2 px-2 border-r border-slate-200 text-center font-mono font-bold">
                            {item.count}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 text-right font-mono font-bold whitespace-nowrap text-slate-900">
                            {formatAmount(item.totalAmount, selectedCurrency)}
                          </td>
                          <td className="py-2 px-2 border-r border-slate-200 text-center font-mono font-bold">
                            {item.percent}%
                          </td>
                          <td className="py-2 px-2">
                            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-cyan-700"
                                style={{ width: `${Math.min(item.percent, 100)}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    categoryBreakdownList.map((item, idx) => {
                      const info = CATEGORY_LABELS[item.catKey as keyof typeof CATEGORY_LABELS] || { label: item.catKey };
                      return (
                        <tr key={item.catKey} className="text-slate-800">
                          <td className="py-2 px-2 border-r border-slate-200 text-center font-mono text-[11px] font-bold align-top">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-2 border-r border-slate-200">
                            <div className="font-bold text-slate-900">{info.label}</div>
                            {item.subNatures.length > 0 && (
                              <div className="mt-1 pl-2 border-l-2 border-cyan-200 space-y-0.5">
                                {item.subNatures.map(sub => (
                                  <div key={sub.name} className="text-[10px] text-slate-700 flex items-center justify-between gap-2">
                                    <span>• {sub.name} ({sub.count})</span>
                                    <span className="font-mono font-semibold text-slate-900 whitespace-nowrap">
                                      {formatAmount(sub.totalAmount, selectedCurrency)} ({sub.percentInCategory}%)
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-2 border-r border-slate-200 text-center font-mono font-bold align-top">
                            {item.count}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 text-right font-mono font-bold whitespace-nowrap text-slate-900 align-top">
                            {formatAmount(item.totalAmount, selectedCurrency)}
                          </td>
                          <td className="py-2 px-2 border-r border-slate-200 text-center font-mono font-bold align-top">
                            {item.percent}%
                          </td>
                          <td className="py-2 px-2 align-top pt-3">
                            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
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
                  <tr className="border-t-2 border-slate-900 bg-slate-50 font-bold text-xs">
                    <td colSpan={2} className="py-2 px-2 text-right uppercase">
                      Total Global Débours :
                    </td>
                    <td className="py-2 px-2 text-center font-mono font-black text-slate-900">
                      {validCheques.length}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-black text-sm whitespace-nowrap text-slate-900">
                      {formatAmount(totalDeboursAmount, selectedCurrency)}
                    </td>
                    <td className="py-2 px-2 text-center font-mono font-black text-slate-900">
                      100%
                    </td>
                    <td className="py-2 px-2 text-[10px] text-slate-500 font-medium">
                      Validé
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Detailed Cheques List */}
          {showDetailedCheques && validCheques.length > 0 && (
            <div className="mt-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2 flex items-center justify-between">
                <span>
                  {groupingMode === 'EXPENSE_NATURE'
                    ? 'Détail des Chèques Émis par Nature de Dépenses'
                    : 'Détail des Chèques Émis par Catégorie'}
                </span>
                <span className="text-[10px] font-normal text-slate-500 lowercase">{validCheques.length} chèque(s)</span>
              </h3>

              <div className="space-y-3">
                {(groupingMode === 'EXPENSE_NATURE'
                  ? expenseNatureBreakdownList.map(item => ({
                      key: item.key,
                      title: `${item.expenseNatureLabel} — ${(CATEGORY_LABELS[item.catKey as keyof typeof CATEGORY_LABELS]?.short || item.catKey)}`,
                      count: item.count,
                      totalAmount: item.totalAmount,
                      chequesList: item.chequesList
                    }))
                  : categoryBreakdownList.map(item => ({
                      key: item.catKey,
                      title: CATEGORY_LABELS[item.catKey as keyof typeof CATEGORY_LABELS]?.label || item.catKey,
                      count: item.count,
                      totalAmount: item.totalAmount,
                      chequesList: item.chequesList
                    }))
                ).map(group => (
                  <div key={`detail-${group.key}`} className="border border-slate-300 rounded-lg overflow-hidden">
                    <div className="bg-slate-100 px-3 py-1.5 font-bold text-xs text-slate-900 flex items-center justify-between border-b border-slate-300">
                      <span>{group.title} ({group.count} chèque{group.count > 1 ? 's' : ''})</span>
                      <span className="font-mono text-cyan-900 whitespace-nowrap">{formatAmount(group.totalAmount, selectedCurrency)}</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[11px] border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold">
                            <th className="py-1.5 px-2 border-r border-slate-200">Nature de chèque & Banque</th>
                            <th className="py-1.5 px-2 border-r border-slate-200">Nature de dépenses</th>
                            <th className="py-1.5 px-2 border-r border-slate-200">Bénéficiaire</th>
                            <th className="py-1.5 px-2 border-r border-slate-200">Fournisseur / BC</th>
                            <th className="py-1.5 px-2 border-r border-slate-200 whitespace-nowrap">Remis transitaires</th>
                            <th className="py-1.5 px-2 text-right whitespace-nowrap">Montant</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {group.chequesList.map(chq => {
                            const isBlankPending = chq.chequeNature === 'A_BLANC' && chq.amount === 0;
                            return (
                              <tr key={chq.id} className="text-slate-800">
                                <td className="py-1.5 px-2 border-r border-slate-200">
                                  <div className={`font-bold ${chq.chequeNature === 'A_BLANC' ? 'text-red-700' : 'text-slate-900'}`}>
                                    {CHEQUE_NATURE_LABELS[chq.chequeNature || 'ORDINAIRE']?.label}
                                  </div>
                                  <div className="font-mono text-[10px] text-slate-600">{chq.chequeNumber}</div>
                                  <div className="text-[10px] text-slate-500 truncate max-w-[140px]">{chq.bankName}</div>
                                </td>
                                <td className="py-1.5 px-2 border-r border-slate-200 text-cyan-900 font-semibold">
                                  {chq.expenseNature || CATEGORY_LABELS[chq.category]?.short || chq.category}
                                </td>
                                <td className="py-1.5 px-2 border-r border-slate-200 font-semibold">{chq.beneficiary}</td>
                                <td className="py-1.5 px-2 border-r border-slate-200">
                                  <div className="font-bold text-slate-900">{chq.dossierNumber}</div>
                                  <div className="text-[10px] font-mono text-slate-600">{chq.clientName}</div>
                                </td>
                                <td className="py-1.5 px-2 border-r border-slate-200 font-mono text-slate-700 whitespace-nowrap">
                                  {formatShortDate(chq.dateEmission)}
                                </td>
                                <td className={`py-1.5 px-2 text-right font-mono font-bold whitespace-nowrap ${isBlankPending ? 'text-red-700' : 'text-slate-900'}`}>
                                  {isBlankPending
                                    ? `0,00\u00A0${chq.currency}`
                                    : formatAmount(chq.amount, chq.currency)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Observations note if any */}
          {customNotes && (
            <div className="mt-3 p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700">
              <strong>Observation :</strong> {customNotes}
            </div>
          )}

          {/* Signatures & Stamp Blocks */}
          <div className="grid grid-cols-3 gap-6 mt-8 pt-4 border-t border-slate-300 text-xs">
            <div className="space-y-12">
              <span className="font-bold text-slate-800 block">Établi par : Le Caissier Transit</span>
              <div className="border-b border-dashed border-slate-400 w-3/4"></div>
              <span className="text-[10px] text-slate-500 italic block">Signature & Cachet Caisse</span>
            </div>

            <div className="space-y-12">
              <span className="font-bold text-slate-800 block">Vérifié par : Chef de Service Transit</span>
              <div className="border-b border-dashed border-slate-400 w-3/4"></div>
              <span className="text-[10px] text-slate-700 font-bold italic block">NOUI ADEL - Visa Transit</span>
            </div>

            <div className="space-y-12">
              <span className="font-bold text-slate-800 block">Approuvé par : Direction Financière</span>
              <div className="border-b border-dashed border-slate-400 w-3/4"></div>
              <span className="text-[10px] text-slate-500 italic block">Direction Générale SCHB / GICA</span>
            </div>
          </div>

        </div>

      </div>
    </div>,
    document.body
  );
};
