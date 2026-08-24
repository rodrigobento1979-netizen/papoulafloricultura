import React, { useState } from "react";
import { 
  X, 
  Truck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Camera, 
  MessageSquare, 
  Search, 
  Phone, 
  Gift, 
  Heart,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { Order } from "../types";

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeOrder: Order | null;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  isOpen,
  onClose,
  activeOrder,
}) => {
  if (!isOpen) return null;

  const [searchCode, setSearchCode] = useState("");
  // Simulated tracking state progression for realism
  const [currentStepIndex, setCurrentStepIndex] = useState(2); // Step 3: Arranjo Pronto com Foto de Inspeção

  const trackingSteps = [
    {
      id: 1,
      title: "Pedido Recebido & Confirmado",
      desc: "Pagamento aprovado instantaneamente e encaminhado ao florista parceiro local.",
      time: "09:15",
      done: true,
    },
    {
      id: 2,
      title: "Florista Selecionando Flores Frescas",
      desc: "Botões de rosas e folhagens selecionados do lote do dia com hidratação mineral.",
      time: "09:42",
      done: true,
    },
    {
      id: 3,
      title: "Arranjo Confeccionado & Foto de Inspeção",
      desc: "Montagem artesanal concluída, laço acetinado e cartão de dedicatória envelopado.",
      time: "10:30",
      done: currentStepIndex >= 2,
      isCurrent: currentStepIndex === 2,
    },
    {
      id: 4,
      title: "Saiu para Entrega Expressa",
      desc: "Transporte climatizado e seguro a caminho do endereço do destinatário.",
      time: "Previsão: 11:20",
      done: currentStepIndex >= 3,
      isCurrent: currentStepIndex === 3,
    },
    {
      id: 5,
      title: "Entregue com Sucesso!",
      desc: "Presente entregue em mãos com confirmação e sorriso garantido.",
      time: "Previsão: 11:45",
      done: currentStepIndex >= 4,
      isCurrent: currentStepIndex === 4,
    },
  ];

  // Default sample order if opened without completing checkout yet
  const displayOrder: Order = activeOrder || {
    orderId: "FW-894215",
    createdAt: "10:15",
    status: "pronto_foto",
    items: [],
    delivery: {
      cep: "01310-100",
      street: "Avenida Paulista",
      number: "1578",
      complement: "Apto 82",
      neighborhood: "Bela Vista",
      city: "São Paulo",
      state: "SP",
      reference: "Portaria Central",
      date: new Date().toISOString().split("T")[0],
      dateLabel: "Hoje",
      shiftId: "morning",
      shiftName: "Manhã (08h às 12h)",
      shiftFee: 0,
      recipientName: "Camila Guimarães",
      recipientPhone: "(11) 98765-4321",
    },
    card: {
      cardType: "romantico",
      occasion: "romance",
      messageText: "Para a pessoa mais especial da minha vida. Que o seu dia seja tão radiante e doce quanto você!",
      senderSignature: "Com todo amor, Rodrigo",
      isAnonymous: false,
    },
    buyer: {
      fullName: "Rodrigo Bento",
      email: "rodrigo@exemplo.com",
      phone: "(11) 99999-8888",
      cpf: "123.456.789-00",
      paymentMethod: "pix",
    },
    subtotal: 189.9,
    deliveryFee: 0,
    total: 189.9,
    inspectionPhotoUrl: "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-stone-100 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-emerald-950 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-800 text-amber-300 rounded-xl">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-base sm:text-lg">
                  Rastreamento em Tempo Real
                </h3>
                <span className="bg-amber-400 text-emerald-950 text-xs font-bold px-2 py-0.5 rounded-md">
                  {displayOrder.orderId}
                </span>
              </div>
              <p className="text-xs text-emerald-200">
                Acompanhe cada etapa de confecção e entrega do seu presente floral.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-emerald-200 hover:text-white hover:bg-emerald-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* WhatsApp Real-time Alert Banner */}
        <div className="bg-emerald-50 border-b border-emerald-200/80 px-4 py-2.5 flex items-center justify-between text-xs text-emerald-950">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              Notificações e fotos automáticas enviadas para: <strong>{displayOrder.buyer.phone || "(11) 99999-8888"}</strong>
            </span>
          </div>
          <span className="font-semibold text-emerald-800 hidden sm:inline">WhatsApp Ativo</span>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* Timeline & Florist Inspection Photo Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Timeline Column */}
            <div className="md:col-span-7 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-700 block">
                Status da Entrega:
              </span>

              <div className="space-y-4 relative pl-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-200">
                {trackingSteps.map((step) => (
                  <div key={step.id} className="relative">
                    {/* Bullet */}
                    <div
                      className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        step.done
                          ? "bg-emerald-800 text-amber-300 ring-4 ring-emerald-100"
                          : "bg-stone-200 text-stone-500"
                      }`}
                    >
                      {step.done ? <CheckCircle2 className="w-3.5 h-3.5" /> : step.id}
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <h4
                          className={`text-xs font-bold ${
                            step.done ? "text-emerald-950" : "text-stone-400"
                          }`}
                        >
                          {step.title}
                        </h4>
                        <span className="text-[11px] font-mono text-stone-500">{step.time}</span>
                      </div>
                      <p className="text-[11px] text-stone-500 leading-relaxed mt-0.5">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Simulation buttons to advance stages for demonstration */}
              <div className="pt-2 flex items-center gap-2">
                <span className="text-[11px] text-stone-400 font-semibold">Simular Etapa:</span>
                {[1, 2, 3, 4].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setCurrentStepIndex(lvl)}
                    className={`px-2 py-1 text-[10px] font-bold rounded-md border transition-colors ${
                      currentStepIndex === lvl
                        ? "bg-emerald-800 text-white border-emerald-800"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    Fase {lvl + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Inspection Photo Column */}
            <div className="md:col-span-5 space-y-3">
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-emerald-700" />
                    Foto de Inspeção do Florista
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    Aprovado
                  </span>
                </div>

                <div className="aspect-square rounded-xl overflow-hidden bg-stone-200 border border-stone-300 relative group">
                  <img
                    src={displayOrder.inspectionPhotoUrl}
                    alt="Arranjo montado"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-3">
                    <span className="text-white text-[11px] font-semibold">
                      Confeccionado hoje às 10:28 • Flores AA
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-stone-500 text-center leading-tight">
                  Foto registrada no atelier antes do envio para assegurar padrão de qualidade de 100%.
                </p>
              </div>
            </div>
          </div>

          {/* Delivery & Card Recap Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {/* Recipient Card */}
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 space-y-1.5 text-xs">
              <h5 className="font-bold text-stone-900 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                Dados do Destinatário
              </h5>
              <p className="font-semibold text-stone-800">{displayOrder.delivery.recipientName}</p>
              <p className="text-stone-600">
                {displayOrder.delivery.street}, {displayOrder.delivery.number}{" "}
                {displayOrder.delivery.complement && `(${displayOrder.delivery.complement})`}
              </p>
              <p className="text-stone-500">
                {displayOrder.delivery.neighborhood}, {displayOrder.delivery.city} - {displayOrder.delivery.state}
              </p>
              <p className="text-emerald-800 font-semibold pt-1 border-t border-stone-200">
                Agendamento: {displayOrder.delivery.dateLabel} ({displayOrder.delivery.shiftName})
              </p>
            </div>

            {/* Card Dedication Preview */}
            <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 space-y-1.5 text-xs">
              <h5 className="font-bold text-amber-950 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                <Heart className="w-3.5 h-3.5 text-amber-700" />
                Mensagem do Cartão Envelopado
              </h5>
              <p className="text-stone-700 italic font-serif leading-relaxed">
                "{displayOrder.card.messageText}"
              </p>
              <p className="font-bold text-stone-900 text-right">
                — {displayOrder.card.isAnonymous ? "Admirador(a) Secreto(a)" : displayOrder.card.senderSignature}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-stone-50 border-t border-stone-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-stone-600">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Precisa falar com o florista? Ligue (11) 98765-4321</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Fechar Rastreio
          </button>
        </div>
      </div>
    </div>
  );
};
