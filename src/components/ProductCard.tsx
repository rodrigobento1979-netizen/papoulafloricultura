import React from "react";
import { Info, Droplets, Ruler, Heart, MessageCircle } from "lucide-react";
import { Product } from "../types";

interface ProductCardProps {
  product: Product;
  onOpenDetails: (product: Product) => void;
  onOpenWhatsAppOrder?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onOpenDetails,
  onOpenWhatsAppOrder,
}) => {
  // Format Brazilian Real
  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return "Sob Consulta";
    return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const hasPrice = !product.isPriceOnDemand && product.price !== undefined && product.price > 0;

  return (
    <div className="group bg-white rounded-2xl border border-stone-200/90 hover:border-[#114b30]/60 shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden relative">
      {/* Product Image Container - Uses object-contain with gentle padding so flowers are never cropped top or bottom */}
      <div 
        onClick={() => onOpenDetails(product)}
        className="relative aspect-square overflow-hidden bg-stone-50/90 flex items-center justify-center p-2 cursor-pointer border-b border-stone-100"
      >
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Badges if any */}
        {product.tags && product.tags.length > 0 && (
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
            {product.tags.slice(0, 2).map((tag, idx) => {
              let bgClass = "bg-stone-900/80 text-white";
              if (tag.includes("Mais Vendido")) bgClass = "bg-amber-500 text-emerald-950 font-bold shadow-xs";
              if (tag.includes("Frete Grátis")) bgClass = "bg-emerald-800 text-emerald-100 font-semibold";
              if (tag.includes("Entrega Hoje") || tag.includes("2h")) bgClass = "bg-rose-700 text-white font-semibold";
              return (
                <span
                  key={idx}
                  className={`text-[10px] px-2 py-0.5 rounded-full tracking-tight backdrop-blur-xs ${bgClass}`}
                >
                  {tag}
                </span>
              );
            })}
          </div>
        )}

        <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-stone-500 hover:text-rose-600 hover:bg-white transition-colors shadow-2xs">
          <Heart className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Product Info */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-2">
        <div className="space-y-1.5">
          {/* Title Header */}
          <div className="flex items-start justify-between gap-2">
            <h3 
              onClick={() => onOpenDetails(product)}
              className="font-serif font-bold text-stone-900 text-sm sm:text-base leading-snug line-clamp-2 hover:text-[#114b30] cursor-pointer transition-colors"
            >
              {product.name}
            </h3>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-1.5">
            {hasPrice ? (
              <span className="text-base sm:text-lg font-bold text-[#114b30] font-serif">
                {formatCurrency(product.price)}
              </span>
            ) : (
              <span className="text-xs font-bold text-emerald-900 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                Sob Consulta
              </span>
            )}
          </div>

          {/* Short Description */}
          {product.description && (
            <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}

          {/* Cuidados (Care Instructions highlight) */}
          {product.details?.careInstructions ? (
            <div className="bg-emerald-50/70 border border-emerald-100/90 rounded-xl px-2.5 py-1 text-[11px] text-emerald-950 flex items-start gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-[#114b30] shrink-0 mt-0.5" />
              <span className="line-clamp-2 leading-tight">
                <strong>Cuidados:</strong> {product.details.careInstructions}
              </span>
            </div>
          ) : product.details?.height ? (
            <div className="bg-stone-50 border border-stone-200/80 rounded-xl px-2.5 py-1 text-[11px] text-stone-600 flex items-center gap-1.5">
              <Ruler className="w-3.5 h-3.5 text-[#114b30] shrink-0" />
              <span><strong>Tam.:</strong> {product.details.height}</span>
            </div>
          ) : null}
        </div>

        {/* Action Buttons: Detalhes & Pedir pelo WhatsApp */}
        <div className="pt-2 border-t border-stone-100 grid grid-cols-2 gap-1.5">
          <button
            onClick={() => onOpenDetails(product)}
            className="py-2 px-2 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 hover:text-stone-900 rounded-xl transition-all duration-200 border border-stone-200/80 cursor-pointer flex items-center justify-center gap-1"
          >
            <Info className="w-3.5 h-3.5 text-stone-500" />
            <span>Detalhes</span>
          </button>

          <button
            onClick={() => {
              if (onOpenWhatsAppOrder) {
                onOpenWhatsAppOrder(product);
              } else {
                onOpenDetails(product);
              }
            }}
            className="py-2 px-2 text-xs font-bold text-white bg-[#25D366] hover:bg-[#20bd5a] rounded-xl transition-all duration-200 shadow-2xs border border-emerald-400/40 cursor-pointer flex items-center justify-center gap-1"
            title="Pedir este produto pelo WhatsApp"
          >
            <MessageCircle className="w-3.5 h-3.5 text-white fill-white/20" />
            <span>Pedir</span>
          </button>
        </div>
      </div>
    </div>
  );
};
