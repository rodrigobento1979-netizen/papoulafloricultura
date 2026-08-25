import React from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

export interface DeleteTargetInfo {
  type: "product" | "category" | "customer" | "order" | "all_orders" | "all_customers" | "all_products" | "all_categories" | "custom";
  id?: string;
  title: string;
  subtitle?: string;
  warningExtra?: string;
}

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  target: DeleteTargetInfo | null;
  onClose: () => void;
  onConfirm: () => void;
  isProcessing?: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  target,
  onClose,
  onConfirm,
  isProcessing = false,
}) => {
  if (!isOpen || !target) return null;

  const getTypeLabel = () => {
    switch (target.type) {
      case "product":
        return "Flor / Arranjo Floral";
      case "category":
        return "Categoria";
      case "customer":
        return "Cliente";
      case "order":
        return "Pedido";
      case "all_orders":
        return "Todos os Pedidos";
      case "all_customers":
        return "Todos os Clientes";
      case "all_products":
        return "Todo o Catálogo";
      case "all_categories":
        return "Todas as Categorias";
      default:
        return "Registro";
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div 
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-delete-title"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-stone-100 flex items-start justify-between bg-rose-50/70">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full inline-block mb-1">
                Exclusão Definitiva
              </span>
              <h3 id="modal-delete-title" className="font-serif font-extrabold text-stone-900 text-lg leading-tight">
                Confirmar Exclusão
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl cursor-pointer transition-colors disabled:opacity-50"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Main Warning Box */}
          <div className="bg-rose-50 border border-rose-200/90 rounded-2xl p-4 text-rose-950 space-y-2">
            <p className="text-xs sm:text-sm font-semibold leading-relaxed">
              ⚠️ <strong>Atenção:</strong> Este item será <u>permanentemente excluído</u> do banco de dados e esta ação não poderá ser desfeita.
            </p>
            {target.warningExtra && (
              <p className="text-xs text-rose-800 font-medium">
                {target.warningExtra}
              </p>
            )}
          </div>

          {/* Target Item Details */}
          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80 space-y-1">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
              Item a ser excluído ({getTypeLabel()}):
            </span>
            <h4 className="font-bold text-stone-900 text-sm sm:text-base leading-snug">
              {target.title}
            </h4>
            {target.subtitle && (
              <p className="text-xs text-stone-500 font-medium mt-0.5">
                {target.subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 sm:p-5 bg-stone-50/80 border-t border-stone-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs sm:text-sm rounded-xl cursor-pointer transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-2 disabled:opacity-60 hover:scale-102"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isProcessing ? "Excluindo..." : "Sim, Excluir Permanentemente"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
