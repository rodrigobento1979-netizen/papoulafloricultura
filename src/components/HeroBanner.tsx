import React from "react";
import { MapPin, Clock, ArrowRight, MessageCircle, Heart, Sparkles, ShieldCheck } from "lucide-react";
import { CityOption } from "../data/cities";

interface HeroBannerProps {
  currentCity: CityOption;
  selectedOccasion: string;
  onSelectOccasion: (occ: string) => void;
  onOpenLocation: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  currentCity,
  selectedOccasion,
  onSelectOccasion,
  onOpenLocation,
}) => {
  const occasions = [
    { id: "todos", label: "Todas as Ocasiões", icon: "✨" },
    { id: "romance", label: "Amor & Romance", icon: "💖" },
    { id: "aniversario", label: "Aniversários", icon: "🎂" },
    { id: "agradecimento", label: "Agradecimento", icon: "🙏" },
    { id: "maternidade", label: "Maternidade", icon: "👶" },
    { id: "condolencias", label: "Condolências", icon: "🕊️" },
  ];

  const handleScrollToCatalog = () => {
    const catalogEl = document.getElementById("catalogo-produtos");
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({ top: 480, behavior: "smooth" });
    }
  };

  return (
    <div className="relative bg-[#1a0f14] overflow-hidden text-white border-b border-rose-950/40">
      {/* Background with Atmospheric Dark Burgundy & Midnight Gradient matching reference */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 85% 40%, #521c2a 0%, #30111a 35%, #18090f 75%, #0d0408 100%)",
        }}
      />

      {/* Atmospheric Bokeh and Glow Orbs */}
      <div className="absolute top-1/4 right-1/4 w-72 h-72 rounded-full bg-rose-600/15 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-12 w-64 h-64 rounded-full bg-red-500/20 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 left-1/3 w-80 h-80 rounded-full bg-emerald-950/30 blur-3xl pointer-events-none" />

      {/* Decorative Red Poppy Flowers (Papoulas) Botanical Artwork on the Right Side */}
      <div className="absolute right-0 top-0 bottom-0 w-full lg:w-1/2 pointer-events-none overflow-hidden select-none flex items-center justify-end">
        <svg
          viewBox="0 0 600 450"
          className="w-[120%] sm:w-[90%] lg:w-[650px] h-full object-cover object-right opacity-90 transition-transform duration-1000 transform scale-105"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Poppy Petal Red Gradients */}
            <radialGradient id="poppyRedMain" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ff4d6d" />
              <stop offset="35%" stopColor="#d90429" />
              <stop offset="70%" stopColor="#9b001c" />
              <stop offset="100%" stopColor="#590010" />
            </radialGradient>

            <radialGradient id="poppyRedSoft" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#ff758f" />
              <stop offset="45%" stopColor="#c9184a" />
              <stop offset="85%" stopColor="#800f2f" />
              <stop offset="100%" stopColor="#400515" />
            </radialGradient>

            <radialGradient id="poppyCenterDark" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffd166" />
              <stop offset="20%" stopColor="#2b1b17" />
              <stop offset="60%" stopColor="#120c0a" />
              <stop offset="100%" stopColor="#080403" />
            </radialGradient>

            <radialGradient id="poppyGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ff4d6d" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#b5179e" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>

            {/* Botanical Leaf Gradient */}
            <linearGradient id="poppyLeaf" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2d6a4f" />
              <stop offset="50%" stopColor="#1b4332" />
              <stop offset="100%" stopColor="#081c15" />
            </linearGradient>
          </defs>

          {/* Soft Background Poppy Glow Circles */}
          <circle cx="480" cy="240" r="140" fill="url(#poppyGlow)" opacity="0.4" />
          <circle cx="340" cy="180" r="90" fill="url(#poppyGlow)" opacity="0.35" />
          <circle cx="420" cy="380" r="110" fill="url(#poppyGlow)" opacity="0.3" />

          {/* Botanical Leaves & Stems */}
          <g opacity="0.75">
            {/* Left Stems */}
            <path
              d="M 330 450 Q 320 320 280 260"
              stroke="url(#poppyLeaf)"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Leaf 1 */}
            <path
              d="M 280 260 Q 240 240 260 210 Q 295 240 280 260 Z"
              fill="url(#poppyLeaf)"
            />
            {/* Leaf 2 */}
            <path
              d="M 310 330 Q 270 320 285 285 Q 315 310 310 330 Z"
              fill="url(#poppyLeaf)"
            />
            {/* Right Stems */}
            <path
              d="M 460 450 Q 480 340 500 280"
              stroke="url(#poppyLeaf)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M 500 320 Q 540 310 535 270 Q 500 290 500 320 Z"
              fill="url(#poppyLeaf)"
            />
          </g>

          {/* Small Top-Left Poppy Flower */}
          <g transform="translate(340, 160) scale(0.65)">
            {/* Petals */}
            <circle cx="-25" cy="-25" r="48" fill="url(#poppyRedSoft)" opacity="0.9" />
            <circle cx="25" cy="-25" r="48" fill="url(#poppyRedSoft)" opacity="0.9" />
            <circle cx="25" cy="25" r="48" fill="url(#poppyRedMain)" opacity="0.95" />
            <circle cx="-25" cy="25" r="48" fill="url(#poppyRedMain)" opacity="0.95" />
            {/* Center Core */}
            <circle cx="0" cy="0" r="22" fill="url(#poppyCenterDark)" />
            {/* Core Stamens */}
            <circle cx="0" cy="0" r="9" fill="#fca311" opacity="0.8" />
          </g>

          {/* Medium Lower-Right Poppy Flower */}
          <g transform="translate(420, 360) scale(0.9)">
            <ellipse cx="-35" cy="-20" rx="55" ry="45" fill="url(#poppyRedSoft)" opacity="0.95" />
            <ellipse cx="35" cy="-20" rx="55" ry="45" fill="url(#poppyRedSoft)" opacity="0.95" />
            <ellipse cx="30" cy="35" rx="60" ry="50" fill="url(#poppyRedMain)" />
            <ellipse cx="-30" cy="35" rx="60" ry="50" fill="url(#poppyRedMain)" />
            <circle cx="0" cy="0" r="30" fill="url(#poppyCenterDark)" />
            <circle cx="0" cy="0" r="14" fill="#fbbf24" opacity="0.85" />
          </g>

          {/* Large Hero Master Poppy Flower (Papoula Dourada & Carmesim) */}
          <g transform="translate(490, 240)">
            {/* Outer Petals Layer */}
            <path
              d="M 0 -85 C 50 -85, 90 -45, 90 0 C 90 45, 50 85, 0 85 C -50 85, -90 45, -90 0 C -90 -45, -50 -85, 0 -85 Z"
              fill="url(#poppyRedSoft)"
              opacity="0.85"
            />
            {/* Multi-lobed Poppy Petals */}
            <circle cx="-40" cy="-35" r="65" fill="url(#poppyRedSoft)" />
            <circle cx="40" cy="-35" r="65" fill="url(#poppyRedSoft)" />
            <circle cx="45" cy="35" r="70" fill="url(#poppyRedMain)" />
            <circle cx="-45" cy="35" r="70" fill="url(#poppyRedMain)" />
            <circle cx="0" cy="-45" r="58" fill="url(#poppyRedSoft)" opacity="0.95" />
            <circle cx="0" cy="45" r="65" fill="url(#poppyRedMain)" />

            {/* Inner Poppy Velvety Center */}
            <circle cx="0" cy="0" r="38" fill="url(#poppyCenterDark)" />
            <circle cx="0" cy="0" r="28" fill="#140907" />
            
            {/* Golden Pollen Stamens */}
            <circle cx="0" cy="0" r="16" fill="#f59e0b" opacity="0.8" />
            <circle cx="0" cy="0" r="8" fill="#fef08a" />
          </g>
        </svg>
      </div>

      {/* Foreground Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative z-10">
        <div className="max-w-2xl space-y-6">
          {/* Eyebrow matching reference: "FLORICULTURA ONLINE" */}
          <div className="inline-flex items-center gap-2 text-[#E78282] font-mono tracking-[0.22em] text-xs uppercase font-bold">
            <span className="w-2 h-2 rounded-full bg-[#E78282] animate-pulse" />
            <span>FLORICULTURA ONLINE • PIRAPORA & BURITIZEIRO</span>
          </div>

          {/* Main Title matching reference: "Flores que dizem o que você sente" */}
          <h1 
            className="text-4xl sm:text-5xl lg:text-6xl font-serif text-white tracking-tight leading-[1.15]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Flores que dizem <br />
            o que você <span className="italic font-normal text-[#F4978E] underline decoration-[#F4978E]/40">sente</span>
          </h1>

          {/* Subtitle matching reference */}
          <p className="text-stone-300/90 text-sm sm:text-base sm:leading-relaxed max-w-xl">
            Buquês, arranjos e cestas montados na hora e entregues com carinho em{" "}
            <strong className="text-white font-semibold">{currentCity.name}</strong> e{" "}
            <strong className="text-white font-semibold">Buritizeiro</strong>. Diga pra onde vamos levar amor e veja tudo disponível na sua cidade.
          </p>

          {/* Direct WhatsApp Call Badge */}
          <div className="pt-2">
            <a
              href="https://wa.me/5538988512855?text=Ol%C3%A1%21+Gostaria+de+fazer+um+pedido+na+Floricultura+Papoula"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white px-5 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-emerald-950/40 transition-all hover:scale-105 border border-emerald-300/40"
            >
              <MessageCircle className="w-5 h-5 text-white fill-white/20" />
              <span>Atendimento pelo WhatsApp: (38) 98851-2855</span>
            </a>
          </div>

          {/* Occasion Filter Shortcuts */}
          <div className="pt-4 border-t border-white/10">
            <span className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold block mb-2">
              Escolha a ocasião do presente:
            </span>
            <div className="flex flex-wrap gap-2">
              {occasions.map((occ) => {
                const isSelected = selectedOccasion === occ.id;
                return (
                  <button
                    key={occ.id}
                    onClick={() => onSelectOccasion(occ.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? "bg-[#D97768] text-white font-bold shadow-sm"
                        : "bg-white/10 text-stone-300 hover:bg-white/20 hover:text-white border border-white/5"
                    }`}
                  >
                    <span>{occ.icon}</span>
                    <span>{occ.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
