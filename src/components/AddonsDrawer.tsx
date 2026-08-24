import React from "react";
import { X, Plus, Check, Sparkles, ArrowRight, ShoppingBag } from "lucide-react";
import { Addon, Product, ProductSize } from "../types";
import { ADDONS } from "../data/addons";

interface AddonsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  addedProduct: { product: Product; selectedSize?: ProductSize } | null;
  selectedAddons: { addon: Addon; quantity: number }[];
  onToggleAddon: (addon: Addon) => void;
  onContinueToCart: () => void;
}

export const AddonsDrawer: React.FC<AddonsDrawerProps> = ({
  isOpen,
  onClose,
  addedProduct,
  selectedAddons,
  onToggleAddon,
  onContinueToCart,
}) => {
  if (!isOpen || !addedProduct) return null;

  const formatCurrency = (val: number) => {
    return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const productPrice = addedProduct.selectedSize
    ? addedProduct.selectedSize.price
    : addedProduct.product.price;

  const addonsTotal = selectedAddons.reduce(
    (acc, curr) => acc + curr.addon.price * curr.quantity,
    0
  );

  const totalGift = productPrice + addonsTotal;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-stone-100 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 to-emerald-800 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-400/20 rounded-xl text-amber-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base sm:text-lg">
                Torne seu presente ainda mais inesquecível!
              </h3>
              <p className="text-xs text-emerald-200">
                Selecione complementos artesanais para embalar junto com suas flores.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-emerald-200 hover:text-white hover:bg-emerald-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Main Product Mini-Summary */}
        <div className="bg-emerald-50/60 border-b border-emerald-100 p-3 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={addedProduct.product.imageUrl}
              alt=""
              className="w-12 h-12 rounded-lg object-cover border border-emerald-200"
            />
            <div>
              <span className="text-xs font-bold text-emerald-950 block">
                {addedProduct.product.name}
              </span>
              <span className="text-[11px] text-stone-500">
                {addedProduct.selectedSize ? addedProduct.selectedSize.name : "Tamanho Padrão"}
              </span>
            </div>
          </div>
          <span className="text-sm font-bold text-emerald-900">
            {formatCurrency(productPrice)}
          </span>
        </div>

        {/* Addons Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-700 block">
            Complementos Sugeridos:
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ADDONS.map((addon) => {
              const isSelected = selectedAddons.some((item) => item.addon.id === addon.id);

              return (
                <div
                  key={addon.id}
                  onClick={() => onToggleAddon(addon)}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer select-none ${
                    isSelected
                      ? "border-emerald-700 bg-emerald-50/80 ring-1 ring-emerald-700 shadow-xs"
                      : "border-stone-200 hover:border-stone-300 hover:bg-stone-50 bg-white"
                  }`}
                >
                  <img
                    src={addon.imageUrl}
                    alt={addon.name}
                    className="w-14 h-14 rounded-lg object-cover border border-stone-100 shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-stone-900 truncate">
                      {addon.name}
                    </h4>
                    <p className="text-[11px] text-stone-500 line-clamp-1">
                      {addon.description}
                    </p>
                    <span className="text-xs font-bold text-emerald-800 block mt-1">
                      + {formatCurrency(addon.price)}
                    </span>
                  </div>

                  <button
                    type="button"
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                      isSelected
                        ? "bg-emerald-800 text-white shadow-xs"
                        : "bg-stone-100 text-stone-600 hover:bg-emerald-100 hover:text-emerald-800"
                    }`}
                  >
                    {isSelected ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer with subtotal and continue button */}
        <div className="bg-stone-50 border-t border-stone-200 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-auto flex items-baseline justify-between sm:justify-start gap-3">
            <span className="text-xs text-stone-500 uppercase font-semibold">Total do Presente:</span>
            <span className="text-xl font-bold font-serif text-emerald-950">
              {formatCurrency(totalGift)}
            </span>
          </div>

          <div className="w-full sm:w-auto flex items-center gap-2">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
            >
              Continuar Comprando
            </button>
            <button
              onClick={onContinueToCart}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Ir para o Carrinho</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
