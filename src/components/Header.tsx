import React from "react";
import { 
  Search, 
  MessageCircle,
  Lock,
  Sparkles
} from "lucide-react";
import { PapoulaLogo } from "./PapoulaLogo";
import { Category } from "../types";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categories: Category[];
  onOpenSupportBot: () => void;
  onOpenAdminPanel: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  categories,
  onOpenSupportBot,
  onOpenAdminPanel,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100/60 shadow-xs">
      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-3 sm:gap-6">
          {/* Logo with Papoula Emblem */}
          <div 
            onClick={() => onSelectCategory("todos")} 
            className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
          >
            <PapoulaLogo size="md" showTextBeside={true} />
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md relative">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar por flores, rosas, girassóis, cestas..."
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-stone-50/90 border border-stone-200 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 text-stone-900 placeholder:text-stone-400 transition-all shadow-2xs"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs font-semibold cursor-pointer"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons: Admin Internal Area */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Admin Internal Area Button */}
            <button
              onClick={onOpenAdminPanel}
              className="flex items-center gap-1.5 bg-[#114b30] hover:bg-[#0c3924] text-white px-3.5 sm:px-4 py-2 rounded-full font-bold text-xs sm:text-sm shadow-sm transition-all hover:shadow-md cursor-pointer border border-emerald-700/50"
              title="Acessar Painel Administrativo"
            >
              <Lock className="w-3.5 h-3.5 text-amber-300" />
              <span>Área Interna</span>
            </button>
          </div>
        </div>

        {/* Category Navigation Ribbon */}
        <nav className="mt-2.5 pt-2 border-t border-emerald-50 flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
          <button
            onClick={() => onSelectCategory("todos")}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              selectedCategory === "todos"
                ? "bg-[#114b30] text-amber-200 shadow-xs font-bold"
                : "text-stone-700 hover:text-emerald-900 hover:bg-emerald-50"
            }`}
          >
            🌸 Todos os Produtos
          </button>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-[#114b30] text-amber-200 shadow-xs font-bold"
                    : "text-stone-700 hover:text-emerald-900 hover:bg-emerald-50"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
