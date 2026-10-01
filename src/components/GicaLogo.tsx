import React, { useState } from 'react';

interface GicaLogoProps {
  className?: string;
  showSubtitle?: boolean;
  showAuthor?: boolean;
  authorName?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const GicaLogo: React.FC<GicaLogoProps> = ({
  className = '',
  showSubtitle = true,
  showAuthor = true,
  authorName = 'Noui Adel',
  size = 'md'
}) => {
  const [imgError, setImgError] = useState(false);

  const imgHeight = size === 'sm' ? 'h-8' : size === 'lg' ? 'h-14' : 'h-11';

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Real logo image with vector SVG fallback */}
      <div className="flex-shrink-0 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
        {!imgError ? (
          <img
            src="/gica_logo.png"
            alt="Logo Groupe GICA - SCHB"
            className={`${imgHeight} w-auto object-contain`}
            onError={() => setImgError(true)}
          />
        ) : (
          /* High fidelity vector fallback of the GICA emblem */
          <div className="flex items-center gap-1.5 px-2 py-1 text-[#003366]">
            <svg viewBox="0 0 100 100" className="h-8 w-8 text-[#003366]" fill="currentColor">
              <rect x="5" y="5" width="90" height="90" fill="none" stroke="currentColor" strokeWidth="6" />
              <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="5" />
              <circle cx="50" cy="50" r="9" fill="currentColor" />
              <path d="M50 15 A35 35 0 0 1 85 50" fill="none" stroke="currentColor" strokeWidth="5" />
              <path d="M50 85 A35 35 0 0 1 15 50" fill="none" stroke="currentColor" strokeWidth="5" />
            </svg>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-tight leading-none text-[#003366]">
                GICA
              </span>
              <span className="text-[10px] font-bold leading-none text-slate-600">
                جيكا
              </span>
            </div>
          </div>
        )}
      </div>

      {(showSubtitle || showAuthor) && (
        <div className="flex flex-col leading-tight">
          <span className="font-extrabold text-xs text-slate-900 tracking-tight">
            GROUPE GICA · SCHB
          </span>
          {showSubtitle && (
            <span className="text-[10px] text-slate-500 font-medium">
              Groupe Industriel des Ciments d'Algérie
            </span>
          )}
          {showAuthor && (
            <span className="text-[10px] font-bold text-cyan-800 bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-200 mt-0.5 inline-flex items-center gap-1 w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-600"></span>
              Réalisé par : <span className="text-slate-900 font-bold">{authorName}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
};
