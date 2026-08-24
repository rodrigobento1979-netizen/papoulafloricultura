import React from "react";

interface PapoulaLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showTextBeside?: boolean;
  className?: string;
  variant?: "dark" | "light";
}

export const PapoulaLogo: React.FC<PapoulaLogoProps> = ({
  size = "md",
  showTextBeside = true,
  className = "",
  variant = "dark",
}) => {
  const sizeMap = {
    xs: { circle: "w-9 h-9", textTitle: "text-base", textSub: "text-[10px]" },
    sm: { circle: "w-12 h-12", textTitle: "text-lg", textSub: "text-xs" },
    md: { circle: "w-14 h-14 sm:w-16 sm:h-16", textTitle: "text-xl sm:text-2xl", textSub: "text-xs sm:text-sm" },
    lg: { circle: "w-16 h-16 sm:w-20 sm:h-20", textTitle: "text-2xl sm:text-3xl", textSub: "text-xs sm:text-sm" },
    xl: { circle: "w-24 h-24 sm:w-28 sm:h-28", textTitle: "text-3xl sm:text-4xl", textSub: "text-sm sm:text-base" },
  };

  const current = sizeMap[size];
  const isLight = variant === "light";

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Circular Emblem matching uploaded logo */}
      <div
        className={`relative ${current.circle} rounded-full bg-[#114b30] border-2 border-[#10b981] ring-2 ring-[#059669]/40 flex flex-col items-center justify-center shadow-lg overflow-hidden shrink-0 transition-transform group-hover:scale-105`}
        style={{
          background: "radial-gradient(circle at 35% 30%, #1a6f49, #0d3824, #062014)",
        }}
      >
        {/* Subtle inner circular rim */}
        <div className="absolute inset-0.5 rounded-full border border-white/25 pointer-events-none" />

        {/* 3 Red Poppies illustration */}
        <div className="relative -mt-1 flex items-center justify-center">
          {/* Top Left Poppy */}
          <div className="relative -mr-1.5 -mb-0.5">
            <div className="w-3 h-3 rounded-full bg-red-600 shadow-xs ring-1 ring-red-400/40 relative">
              <div className="absolute inset-0.5 rounded-full bg-stone-900 flex items-center justify-center">
                <div className="w-0.5 h-0.5 rounded-full bg-amber-400" />
              </div>
            </div>
          </div>

          {/* Top Center Poppy (Higher & Larger) */}
          <div className="relative z-10 -mt-1">
            <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-red-700 via-red-500 to-rose-400 shadow-sm ring-1 ring-red-300/60 relative flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-stone-950 flex items-center justify-center">
                <div className="w-0.5 h-0.5 rounded-full bg-amber-300" />
              </div>
            </div>
          </div>

          {/* Top Right Poppy */}
          <div className="relative -ml-1.5 -mb-0.5">
            <div className="w-3 h-3 rounded-full bg-red-600 shadow-xs ring-1 ring-red-400/40 relative">
              <div className="absolute inset-0.5 rounded-full bg-stone-900 flex items-center justify-center">
                <div className="w-0.5 h-0.5 rounded-full bg-amber-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Badge Text inside circle for large sizes */}
        <div className="text-center -mt-0.5 leading-none px-1">
          <span className="text-[6px] sm:text-[7px] tracking-wider text-emerald-200 uppercase font-sans font-extrabold block opacity-95">
            FLORICULTURA
          </span>
          <span
            className="text-[10px] sm:text-[12px] text-white font-serif italic font-bold tracking-tight block -mt-0.5 text-shadow-sm"
            style={{ fontFamily: "'Playfair Display', Georgia, cursive, serif" }}
          >
            Papoula
          </span>
        </div>
      </div>

      {/* Brand Text Beside Emblem */}
      {showTextBeside && (
        <div className="leading-tight">
          <div className="flex items-baseline gap-1.5">
            <span className={`text-[11px] sm:text-xs tracking-widest uppercase font-sans font-extrabold block ${
              isLight ? "text-emerald-200" : "text-emerald-800"
            }`}>
              FLORICULTURA
            </span>
            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider hidden sm:inline border ${
              isLight 
                ? "bg-rose-500/30 text-rose-200 border-rose-400/40" 
                : "bg-red-100 text-red-800 border-red-200"
            }`}>
              Pirapora - MG
            </span>
          </div>
          <span
            className={`font-serif font-extrabold tracking-tight block ${current.textTitle} ${
              isLight ? "text-white" : "text-stone-900"
            }`}
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Papoula
          </span>
          <span className={`text-[11px] font-medium block ${
            isLight ? "text-emerald-100/80" : "text-stone-500"
          }`}>
            Rua Mato Grosso, 211B • Entregas em Pirapora & Buritizeiro
          </span>
        </div>
      )}
    </div>
  );
};
