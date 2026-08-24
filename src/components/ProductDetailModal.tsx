import React, { useState } from "react";
import { 
  X, 
  Truck, 
  Clock, 
  Sparkles, 
  Check, 
  Info,
  Droplets,
  Ruler,
  MessageCircle,
  HeartHandshake
} from "lucide-react";
import { Product, ProductSize } from "../types";
import { CityOption } from "../data/cities";
import { openWhatsApp } from "../utils/whatsapp";

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  currentCity: CityOption;
  onRequestOrder?: (
    product: Product,
    selectedSize?: ProductSize,
    deliveryCity?: string,
    deliveryFee?: number
  ) => void;
  onOpenWhatsAppOrder?: (
    product: Product,
    selectedSize?: ProductSize,
    deliveryCity?: string,
    deliveryFee?: number
  ) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  currentCity,
  onOpenWhatsAppOrder,
}) => {
  if (!isOpen || !product) return null;

  // Selected size state
  const [selectedSize, setSelectedSize] = useState<ProductSize | undefined>(
    product.sizes ? product.sizes[0] : undefined
  );

  // Active image in gallery
  const [activeImage, setActiveImage] = useState<string>(product.imageUrl);

  // Destination City selection (Pirapora R$ 10,00 / Buritizeiro R$ 15,00)
  const [selectedCityName, setSelectedCityName] = useState<"Pirapora" | "Buritizeiro">(
    currentCity.name.includes("Buritizeiro") ? "Buritizeiro" : "Pirapora"
  );

  const deliveryFee = selectedCityName === "Pirapora" ? 10.0 : 15.0;

  // Price computation
  const currentPrice = selectedSize ? selectedSize.price : (product.price || 0);
  const currentOriginalPrice = selectedSize?.originalPrice || product.originalPrice;
  const isPriceOnDemand = product.isPriceOnDemand || (!currentPrice && currentPrice === 0);

  const formatCurrency = (val: number) => {
    return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const handleDirectWhatsAppClick = () => {
    if (onOpenWhatsAppOrder) {
      onOpenWhatsAppOrder(product, selectedSize, selectedCityName, deliveryFee);
      onClose();
    } else {
      const sizeText = selectedSize ? ` (Tamanho: ${selectedSize.name})` : "";
      const priceText = !isPriceOnDemand ? ` - Valor: ${formatCurrency(currentPrice)}` : " - Sob Consulta";
      const msg = `Olá! Gostaria de encomendar o arranjo *${product.name}*${sizeText}${priceText} da Floricultura Papoula para entrega em *${selectedCityName}* (Frete: ${formatCurrency(deliveryFee)}).`;
      openWhatsApp("5538988512855", msg);
    }
  };

  const imagesList = [product.imageUrl, ...(product.secondaryImages || [])];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-stone-100 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Bar */}
        <div className="bg-stone-50 border-b border-stone-200 px-4 sm:px-5 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Floricultura Papoula • Pirapora & Buritizeiro</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-stone-500 hover:text-stone-900 hover:bg-stone-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Two Columns */}
        <div className="p-3.5 sm:p-5 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5">
          {/* Left Column: Gallery & Care Specs */}
          <div className="md:col-span-6 space-y-3 flex flex-col">
            {/* Main Image - Uses object-contain so the whole bouquet/plant is fully visible */}
            <div className="aspect-square rounded-2xl overflow-hidden bg-stone-50/90 relative border border-stone-200 shadow-2xs flex items-center justify-center p-2">
              <img
                src={activeImage}
                alt={product.name}
                className="w-full h-full object-contain object-center"
              />
              <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                {product.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-900/90 text-amber-300 backdrop-blur-xs shadow-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Gallery Thumbnails if multiple */}
            {imagesList.length > 1 && (
              <div className="flex gap-2">
                {imagesList.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all cursor-pointer bg-stone-50 p-0.5 ${
                      activeImage === img
                        ? "border-emerald-700 shadow-xs scale-105"
                        : "border-stone-200 hover:border-emerald-300 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}

            {/* Specifications and Care Instructions (Especificações e Cuidados) */}
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 space-y-2 text-xs text-stone-700">
              <h4 className="font-bold text-[#114b30] flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                <Info className="w-3.5 h-3.5 text-emerald-700" />
                Especificações e Cuidados
              </h4>

              {product.details.height && (
                <div className="flex items-center gap-1.5 text-stone-700 text-[11px]">
                  <Ruler className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span><strong>Dimensões:</strong> {product.details.height} {product.details.width ? `x ${product.details.width}` : ""}</span>
                </div>
              )}

              {product.details.durability && (
                <div className="flex items-center gap-1.5 text-stone-700 text-[11px]">
                  <Clock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span><strong>Durabilidade:</strong> {product.details.durability}</span>
                </div>
              )}

              {product.details.careInstructions && (
                <div className="flex items-start gap-1.5 text-stone-700 pt-1.5 border-t border-emerald-200/60 text-[11px]">
                  <Droplets className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-emerald-950 font-bold mb-0.5">Dicas de Cuidado:</strong>
                    <p className="leading-tight text-stone-600">{product.details.careInstructions}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Title, Compact Price, Compact Delivery Info & Pedir WhatsApp */}
          <div className="md:col-span-6 space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              {/* Category & Title */}
              <div>
                <span className="text-[11px] font-bold text-[#114b30] uppercase tracking-wider block mb-0.5">
                  {product.category === "buques" && "🌹 Buquê Floral"}
                  {product.category === "cestas" && "☕ Cesta Especial"}
                  {product.category === "orquideas" && "🪴 Orquídea Nobre"}
                  {product.category === "arranjos" && "✨ Arranjo Floral"}
                  {product.category === "flores-do-campo" && "🌻 Flores do Campo"}
                  {product.category === "condolencias" && "🕊️ Condolências"}
                  {!["buques", "cestas", "orquideas", "arranjos", "flores-do-campo", "condolencias"].includes(product.category) && "🌸 Floricultura Papoula"}
                </span>

                <h2 className="text-lg sm:text-xl font-serif font-bold text-stone-900 leading-snug">
                  {product.name}
                </h2>

                {product.description && (
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed line-clamp-3">
                    {product.description}
                  </p>
                )}
              </div>

              {/* Compact Price Display */}
              <div className="bg-stone-50/90 px-3 py-2.5 rounded-xl border border-stone-200/80 flex items-center justify-between">
                <div>
                  {!isPriceOnDemand && currentOriginalPrice && (
                    <span className="text-[10px] text-stone-400 line-through block">
                      De {formatCurrency(currentOriginalPrice)}
                    </span>
                  )}
                  <div className="flex items-baseline gap-2">
                    {!isPriceOnDemand ? (
                      <span className="text-xl sm:text-2xl font-serif font-bold text-[#114b30]">
                        {formatCurrency(currentPrice)}
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-emerald-950 bg-amber-400/90 px-2.5 py-0.5 rounded-md shadow-2xs">
                        Sob Consulta
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right text-[11px] text-stone-500">
                  <span className="text-emerald-700 font-bold block">✓ Cartão com dedicatória</span>
                  <span>Flores frescas do dia</span>
                </div>
              </div>

              {/* Size options if applicable */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-stone-800 uppercase tracking-wider">
                    Opção / Tamanho:
                  </label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {product.sizes.map((sz) => {
                      const isSelected = selectedSize?.id === sz.id;
                      return (
                        <button
                          key={sz.id}
                          onClick={() => setSelectedSize(sz)}
                          className={`p-2 rounded-xl text-left text-xs transition-all border flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? "border-emerald-700 bg-emerald-50/90 ring-1 ring-emerald-700 text-emerald-950 font-medium"
                              : "border-stone-200 hover:border-stone-300 bg-white text-stone-800"
                          }`}
                        >
                          <div>
                            <span className="font-bold block text-xs">{sz.name}</span>
                            <span className="text-[10px] text-stone-500">{sz.description}</span>
                          </div>
                          <span className="font-bold text-emerald-900 text-xs">
                            {formatCurrency(sz.price)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Items included checklist */}
              {product.details.itemsIncluded && product.details.itemsIncluded.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-stone-800 uppercase tracking-wider block">
                    Itens Inclusos:
                  </span>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {product.details.itemsIncluded.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1 text-[11px] text-stone-600">
                        <Check className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Compact Delivery Rates Box: Pirapora R$ 10,00 / Buritizeiro R$ 15,00 */}
              <div className="bg-amber-50/70 border border-amber-300/80 rounded-xl p-2.5 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1 font-bold text-amber-950 uppercase tracking-wider">
                    <Truck className="w-3.5 h-3.5 text-amber-700" />
                    <span>Entrega Expressa</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.2 rounded">
                    Hoje Disponível
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedCityName("Pirapora")}
                    className={`py-1.5 px-2 rounded-lg border text-left transition-all cursor-pointer ${
                      selectedCityName === "Pirapora"
                        ? "bg-white border-[#114b30] shadow-2xs ring-1 ring-[#114b30]"
                        : "bg-white/60 border-amber-200 hover:bg-white text-stone-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-stone-900">Pirapora</span>
                      <span className="font-bold text-emerald-800 text-xs">R$ 10,00</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedCityName("Buritizeiro")}
                    className={`py-1.5 px-2 rounded-lg border text-left transition-all cursor-pointer ${
                      selectedCityName === "Buritizeiro"
                        ? "bg-white border-[#114b30] shadow-2xs ring-1 ring-[#114b30]"
                        : "bg-white/60 border-amber-200 hover:bg-white text-stone-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-stone-900">Buritizeiro</span>
                      <span className="font-bold text-emerald-800 text-xs">R$ 15,00</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Actions: Pedido pelo WhatsApp */}
            <div className="pt-2 border-t border-stone-200 space-y-1.5">
              <button
                onClick={handleDirectWhatsAppClick}
                className="w-full py-2.5 sm:py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer group border border-emerald-300/40"
                title="Fazer Pedido pelo WhatsApp da Floricultura"
              >
                <MessageCircle className="w-4 h-4 text-white fill-white/20 group-hover:scale-110 transition-transform" />
                <span>Pedir pelo WhatsApp • (38) 98851-2855</span>
              </button>

              <p className="text-[10px] text-center text-stone-500 flex items-center justify-center gap-1">
                <HeartHandshake className="w-3 h-3 text-emerald-700" />
                <span>Atendimento humano • Enviamos foto do arranjo antes da entrega!</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
