import React from "react";
import { X, Trash2, ShoppingBag, Truck, Calendar, Clock, ArrowRight, ShieldCheck } from "lucide-react";
import { CartItem, DeliveryInfo } from "../types";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  delivery: Partial<DeliveryInfo>;
  onUpdateQuantity: (itemId: string, delta: number) => void;
  onRemoveItem: (itemId: string) => void;
  onRemoveAddon: (itemId: string, addonId: string) => void;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  delivery,
  onUpdateQuantity,
  onRemoveItem,
  onRemoveAddon,
  onProceedToCheckout,
}) => {
  if (!isOpen) return null;

  const formatCurrency = (val: number) => {
    return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const subtotal = items.reduce((acc, item) => {
    const addonsPrice = item.addons.reduce(
      (aAcc, a) => aAcc + a.addon.price * a.quantity,
      0
    );
    return acc + (item.unitPrice + addonsPrice) * item.quantity;
  }, 0);

  const deliveryFee = delivery.shiftFee || 0;
  const total = subtotal + deliveryFee;

  // Free delivery bar calculation (e.g. threshold R$ 180)
  const freeShippingThreshold = 180;
  const progressPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));
  const remainingForFree = Math.max(0, freeShippingThreshold - subtotal);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
        {/* Cart Header */}
        <div className="bg-emerald-950 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-300" />
            <h3 className="font-serif font-bold text-base">Meu Presente</h3>
            <span className="text-xs bg-emerald-800 text-amber-200 px-2 py-0.5 rounded-full font-bold">
              {items.length} {items.length === 1 ? "item" : "itens"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-emerald-200 hover:text-white hover:bg-emerald-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free shipping progress alert */}
        <div className="bg-emerald-50 border-b border-emerald-100 p-3 text-xs">
          <div className="flex items-center justify-between text-emerald-950 font-semibold mb-1">
            <span className="flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-emerald-700" />
              {remainingForFree > 0 ? (
                <>Faltam <strong>{formatCurrency(remainingForFree)}</strong> para Frete Grátis</>
              ) : (
                <span className="text-emerald-800 font-bold">🎉 Parabéns! Você ganhou Frete Grátis</span>
              )}
            </span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full bg-emerald-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-700 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Selected Scheduled Date/Shift Card */}
        {delivery.dateLabel && (
          <div className="bg-stone-50 px-4 py-2.5 border-b border-stone-200 flex items-center justify-between text-xs text-stone-700">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>
                Agendado para: <strong>{delivery.dateLabel}</strong> ({delivery.shiftName})
              </span>
            </div>
          </div>
        )}

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
                <ShoppingBag className="w-8 h-8 opacity-40" />
              </div>
              <h4 className="font-serif font-bold text-stone-800 text-base">Seu presente está vazio</h4>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">
                Explore nossos buquês de rosas, orquídeas e cestas de café para encantar alguém especial hoje.
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-5 py-2 bg-emerald-800 text-white rounded-xl text-xs font-bold hover:bg-emerald-900 transition-colors cursor-pointer"
              >
                Explorar Flores & Cestas
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-stone-200 p-3.5 space-y-3 shadow-2xs"
              >
                {/* Main Product Info */}
                <div className="flex gap-3">
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    className="w-16 h-16 rounded-lg object-cover border border-stone-100"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="text-xs font-bold text-stone-900 leading-snug line-clamp-2">
                        {item.product.name}
                      </h4>
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="text-stone-400 hover:text-rose-600 p-1 transition-colors"
                        title="Remover produto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {item.selectedSize && (
                      <span className="text-[11px] text-emerald-800 font-medium block">
                        {item.selectedSize.name}
                      </span>
                    )}

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden text-xs">
                        <button
                          onClick={() => onUpdateQuantity(item.id, -1)}
                          className="px-2 py-0.5 hover:bg-stone-100 font-bold text-stone-600"
                        >
                          -
                        </button>
                        <span className="px-2.5 py-0.5 font-semibold bg-stone-50 text-stone-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, 1)}
                          className="px-2 py-0.5 hover:bg-stone-100 font-bold text-stone-600"
                        >
                          +
                        </button>
                      </div>

                      <span className="text-xs font-bold text-emerald-950 font-serif">
                        {formatCurrency(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Attached Add-ons */}
                {item.addons && item.addons.length > 0 && (
                  <div className="pt-2 border-t border-stone-100 space-y-1.5 bg-stone-50/70 -mx-3.5 -mb-3.5 p-3 rounded-b-xl">
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                      Acompanhamentos deste item:
                    </span>
                    {item.addons.map(({ addon, quantity }) => (
                      <div
                        key={addon.id}
                        className="flex items-center justify-between text-xs text-stone-700"
                      >
                        <div className="flex items-center gap-1.5">
                          <img
                            src={addon.imageUrl}
                            alt=""
                            className="w-6 h-6 rounded-md object-cover"
                          />
                          <span>
                            {addon.name} {quantity > 1 && `(x${quantity})`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-emerald-900">
                            {formatCurrency(addon.price * quantity)}
                          </span>
                          <button
                            onClick={() => onRemoveAddon(item.id, addon.id)}
                            className="text-stone-400 hover:text-rose-500 text-[10px]"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Cart Footer */}
        {items.length > 0 && (
          <div className="bg-stone-50 border-t border-stone-200 p-4 space-y-3">
            <div className="space-y-1.5 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Subtotal dos produtos:</span>
                <span className="font-semibold text-stone-900">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxa de Entrega / Agendamento:</span>
                <span className="font-semibold text-emerald-800">
                  {deliveryFee === 0 ? "Grátis" : formatCurrency(deliveryFee)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-emerald-950 pt-1.5 border-t border-stone-200">
                <span>Total:</span>
                <span className="text-base font-serif font-bold text-emerald-950">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            <button
              onClick={onProceedToCheckout}
              className="w-full py-3.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Finalizar Compra Segura</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Ambiente Criptografado & Atendimento Humanizado</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
