import React, { useState } from "react";
import { 
  X, 
  Save, 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  CreditCard, 
  ShoppingBag, 
  MessageSquare, 
  Sparkles,
  Cake,
  FileText
} from "lucide-react";
import { KanbanOrder, KanbanOrderStatus, Product } from "../types";

interface EditOrderModalProps {
  order: KanbanOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveOrder: (updatedOrder: KanbanOrder) => void;
  products?: Product[];
}

export const EditOrderModal: React.FC<EditOrderModalProps> = ({
  order,
  isOpen,
  onClose,
  onSaveOrder,
  products = [],
}) => {
  if (!isOpen || !order) return null;

  const [customerName, setCustomerName] = useState(order.customerName);
  const [customerPhone, setCustomerPhone] = useState(order.customerPhone);
  const [customerBirthDate, setCustomerBirthDate] = useState(order.customerBirthDate || "");
  const [productName, setProductName] = useState(order.productName);
  const [totalPrice, setTotalPrice] = useState(order.totalPrice?.toString() || "0");
  const [deliveryAddress, setDeliveryAddress] = useState(order.deliveryAddress);
  const [deliveryCity, setDeliveryCity] = useState(order.deliveryCity);
  const [deliveryDate, setDeliveryDate] = useState(order.deliveryDate || "Hoje");
  const [cardMessage, setCardMessage] = useState(order.cardMessage || "");
  const [cardSender, setCardSender] = useState(order.cardSender || "");
  const [status, setStatus] = useState<KanbanOrderStatus>(order.status);
  const [paymentMethod, setPaymentMethod] = useState(order.paymentMethod || "pix");
  const [notes, setNotes] = useState(order.notes || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: KanbanOrder = {
      ...order,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerBirthDate: customerBirthDate.trim(),
      productName: productName.trim(),
      totalPrice: parseFloat(totalPrice.replace(",", ".")) || 0,
      deliveryAddress: deliveryAddress.trim(),
      deliveryCity,
      deliveryDate: deliveryDate.trim(),
      cardMessage: cardMessage.trim(),
      cardSender: cardSender.trim(),
      status,
      paymentMethod,
      notes: notes.trim(),
    };

    onSaveOrder(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl border border-stone-200 space-y-4 max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-2 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold font-mono text-xs">
              {order.orderNumber}
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900">
                Editar Pedido & Dados do Cliente
              </h3>
              <p className="text-xs text-stone-500">
                Atualize endereço, dedicatória do cartão, dados de contato e aniversário.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Section 1: Customer info */}
          <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-2.5">
            <span className="text-[11px] font-bold text-[#114b30] uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>Dados do Cliente & Aniversário</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-0.5">
                  Nome do Cliente *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-0.5">
                  WhatsApp / Telefone *
                </label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase mb-0.5 flex items-center gap-1">
                <Cake className="w-3 h-3 text-rose-500" />
                <span>Data de Aniversário (para mimos VIP)</span>
              </label>
              <input
                type="text"
                value={customerBirthDate}
                onChange={(e) => setCustomerBirthDate(e.target.value)}
                placeholder="DD/MM/AAAA"
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
              />
            </div>
          </div>

          {/* Section 2: Delivery & Address */}
          <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-2.5">
            <span className="text-[11px] font-bold text-[#114b30] uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>Endereço & Data de Entrega</span>
            </span>

            <div className="grid grid-cols-3 gap-2.5">
              <div className="col-span-2">
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-0.5">
                  Endereço Completo (Rua, Nº, Bairro) *
                </label>
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-0.5">
                  Cidade
                </label>
                <select
                  value={deliveryCity}
                  onChange={(e) => setDeliveryCity(e.target.value)}
                  className="w-full px-2 py-2 bg-white border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                >
                  <option value="Pirapora">Pirapora</option>
                  <option value="Buritizeiro">Buritizeiro</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase mb-0.5">
                Data / Turno de Entrega
              </label>
              <input
                type="text"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                placeholder="Ex: Hoje, Amanhã pela manhã..."
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
              />
            </div>
          </div>

          {/* Section 3: Product, Card Message & Payment */}
          <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-2.5">
            <span className="text-[11px] font-bold text-[#114b30] uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Mensagem do Cartão & Produto</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-0.5">
                  Produto / Arranjo
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-0.5">
                  Valor Total (R$)
                </label>
                <input
                  type="text"
                  value={totalPrice}
                  onChange={(e) => setTotalPrice(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase mb-0.5">
                Mensagem da Dedicatória no Cartão Especial:
              </label>
              <textarea
                rows={2}
                value={cardMessage}
                onChange={(e) => setCardMessage(e.target.value)}
                placeholder="Escreva a mensagem personalizada..."
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-0.5">
                  Status no Kanban
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as KanbanOrderStatus)}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs focus:outline-none"
                >
                  <option value="pedido">1. Novo Pedido</option>
                  <option value="confirmado">2. Confirmado / Pago</option>
                  <option value="em_andamento">3. Na Bancada (Montagem)</option>
                  <option value="concluido">4. Concluído / Entregue</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-0.5">
                  Forma de Pagamento
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs focus:outline-none"
                >
                  <option value="pix">PIX</option>
                  <option value="cartao">Cartão de Crédito/Débito</option>
                  <option value="dinheiro">Dinheiro</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#114b30] hover:bg-[#0c3924] text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Alterações</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
