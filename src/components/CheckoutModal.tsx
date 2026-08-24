import React, { useState } from "react";
import { 
  X, 
  MapPin, 
  Heart, 
  CreditCard, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Truck, 
  Calendar, 
  Clock, 
  QrCode, 
  Copy, 
  ArrowRight, 
  ArrowLeft,
  AlertCircle,
  MessageSquareHeart,
  Wand2,
  Lock
} from "lucide-react";
import confetti from "canvas-confetti";
import { CartItem, DeliveryInfo, CardMessage, BuyerInfo, Order } from "../types";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  initialDelivery: Partial<DeliveryInfo>;
  onOrderCompleted: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  initialDelivery,
  onOrderCompleted,
}) => {
  if (!isOpen) return null;

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Delivery & Recipient
  const [delivery, setDelivery] = useState<DeliveryInfo>({
    cep: initialDelivery.cep || "39270-000",
    street: initialDelivery.street || "Rua Mato Grosso",
    number: initialDelivery.number || "211B",
    complement: initialDelivery.complement || "",
    neighborhood: initialDelivery.neighborhood || "Centro",
    city: initialDelivery.city || "Pirapora",
    state: initialDelivery.state || "MG",
    reference: initialDelivery.reference || "Próximo à Floricultura Papoula",
    date: initialDelivery.date || new Date().toISOString().split("T")[0],
    dateLabel: initialDelivery.dateLabel || "Hoje",
    shiftId: initialDelivery.shiftId || "afternoon",
    shiftName: initialDelivery.shiftName || "Tarde (13h às 18h)",
    shiftFee: initialDelivery.shiftFee || 0,
    recipientName: initialDelivery.recipientName || "",
    recipientPhone: initialDelivery.recipientPhone || "",
  });

  // Step 2: Card & AI Message
  const [card, setCard] = useState<CardMessage>({
    cardType: "romantico",
    occasion: "romance",
    messageText: "Que cada pétala deste buquê leve até você todo o meu amor e carinho. Você é muito especial para mim!",
    senderSignature: "Com todo amor",
    isAnonymous: false,
  });

  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiTone, setAiTone] = useState("Romântico e Apaixonado");
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  // Step 3: Buyer & Payment
  const [buyer, setBuyer] = useState<BuyerInfo>({
    fullName: "",
    email: "",
    phone: "",
    cpf: "",
    paymentMethod: "pix",
    cardNumber: "",
    cardName: "",
    cardExpiry: "",
    cardCvv: "",
    installments: 1,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPixCopied, setIsPixCopied] = useState(false);

  // Financial calculations
  const subtotal = items.reduce((acc, item) => {
    const addonsPrice = item.addons.reduce(
      (aAcc, a) => aAcc + a.addon.price * a.quantity,
      0
    );
    return acc + (item.unitPrice + addonsPrice) * item.quantity;
  }, 0);

  const deliveryFee = delivery.shiftFee || 0;
  const total = subtotal + deliveryFee;

  const formatCurrency = (val: number) => {
    return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  // Validation handlers
  const validateStep1 = () => {
    const errors: Record<string, string> = {};
    if (!delivery.recipientName.trim()) {
      errors.recipientName = "Informe o nome de quem receberá as flores.";
    }
    if (!delivery.recipientPhone.trim()) {
      errors.recipientPhone = "Informe o telefone/WhatsApp do destinatário.";
    }
    if (!delivery.street.trim()) {
      errors.street = "Informe o logradouro / rua.";
    }
    if (!delivery.number.trim()) {
      errors.number = "Informe o número.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep3 = () => {
    const errors: Record<string, string> = {};
    if (!buyer.fullName.trim()) errors.fullName = "Informe seu nome completo.";
    if (!buyer.email.trim() || !buyer.email.includes("@")) errors.email = "Informe um e-mail válido.";
    if (!buyer.phone.trim()) errors.phone = "Informe seu WhatsApp para receber o rastreio.";
    if (!buyer.cpf.trim()) errors.cpf = "CPF é obrigatório para emissão da NF.";

    if (buyer.paymentMethod === "credit_card") {
      if (!buyer.cardNumber || buyer.cardNumber.replace(/\D/g, "").length < 13) {
        errors.cardNumber = "Número de cartão inválido.";
      }
      if (!buyer.cardName) errors.cardName = "Nome impresso no cartão obrigatório.";
      if (!buyer.cardExpiry) errors.cardExpiry = "Validade obrigatória (MM/AA).";
      if (!buyer.cardCvv || buyer.cardCvv.length < 3) errors.cardCvv = "CVV inválido.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Generate Card Message using AI Endpoint
  const handleGenerateAiMessage = async () => {
    setIsGeneratingAi(true);
    try {
      const res = await fetch("/api/generate-card-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          occasion: card.occasion,
          recipientName: delivery.recipientName || "Alguém muito especial",
          tone: aiTone,
        }),
      });
      const data = await res.json();
      if (data.success && data.messages.length > 0) {
        setAiSuggestions(data.messages);
        setCard((prev) => ({ ...prev, messageText: data.messages[0] }));
      }
    } catch (err) {
      console.warn("AI generation failed, using fallback", err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Submit Order
  const handleFinalizeOrder = () => {
    if (!validateStep3()) return;

    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);

      // Trigger Confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {}

      const newOrder: Order = {
        orderId: `FW-${Math.floor(100000 + Math.random() * 900000)}`,
        createdAt: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        status: "confirmado",
        items,
        delivery,
        card,
        buyer,
        subtotal,
        deliveryFee,
        total,
        pixCode: "00020126580014br.gov.bcb.pix0136floriculturanaweb-pagamentos-pix-5204000053039865405189.905802BR5925FLORICULTURA NA WEB LTDA6009SAO PAULO62070503***6304E2B1",
        pixQrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=00020126580014br.gov.bcb.pix0136floriculturanaweb-pagamentos-pix-52040000",
        inspectionPhotoUrl: items[0]?.product?.imageUrl || "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80",
      };

      onOrderCompleted(newOrder);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-stone-100 overflow-hidden my-auto max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="bg-emerald-950 text-white p-4 sm:p-5 flex items-center justify-between border-b border-emerald-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-800 text-amber-300 flex items-center justify-center font-bold font-serif text-sm">
              {step}
            </div>
            <div>
              <h3 className="font-serif font-bold text-base sm:text-lg">
                Checkout Seguro Floricultura na Web
              </h3>
              <p className="text-xs text-emerald-200">
                {step === 1 && "Passo 1 de 3: Destinatário & Endereço de Entrega"}
                {step === 2 && "Passo 2 de 3: Cartão de Mensagem & Dedicatória"}
                {step === 3 && "Passo 3 de 3: Dados do Pagador & Pagamento"}
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

        {/* Step Indicator Pills */}
        <div className="bg-stone-100 px-4 py-2 flex items-center justify-between border-b border-stone-200 text-xs font-semibold text-stone-600">
          <div className={`flex items-center gap-1.5 ${step >= 1 ? "text-emerald-800 font-bold" : ""}`}>
            <MapPin className="w-4 h-4 text-emerald-700" />
            <span>1. Destinatário</span>
          </div>
          <div className="text-stone-300">➔</div>
          <div className={`flex items-center gap-1.5 ${step >= 2 ? "text-emerald-800 font-bold" : ""}`}>
            <MessageSquareHeart className="w-4 h-4 text-emerald-700" />
            <span>2. Mensagem do Cartão</span>
          </div>
          <div className="text-stone-300">➔</div>
          <div className={`flex items-center gap-1.5 ${step >= 3 ? "text-emerald-800 font-bold" : ""}`}>
            <CreditCard className="w-4 h-4 text-emerald-700" />
            <span>3. Pagamento</span>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* STEP 1: DESTINATÁRIO & ENDEREÇO */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-3.5 text-xs text-emerald-950 flex items-start gap-2">
                <Heart className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <p>
                  <strong>Quem é a pessoa especial que vai receber esta surpresa?</strong> Preencha com cuidado os dados para garantirmos a entrega perfeita e discreta.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Nome Completo do Destinatário *
                  </label>
                  <input
                    type="text"
                    value={delivery.recipientName}
                    onChange={(e) => setDelivery({ ...delivery, recipientName: e.target.value })}
                    placeholder="Ex: Ana Clara Silveira"
                    className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  />
                  {formErrors.recipientName && (
                    <span className="text-[11px] text-rose-600 font-semibold">{formErrors.recipientName}</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Telefone / WhatsApp do Destinatário *
                  </label>
                  <input
                    type="text"
                    value={delivery.recipientPhone}
                    onChange={(e) => setDelivery({ ...delivery, recipientPhone: e.target.value })}
                    placeholder="Ex: (11) 98765-4321"
                    className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  />
                  {formErrors.recipientPhone && (
                    <span className="text-[11px] text-rose-600 font-semibold">{formErrors.recipientPhone}</span>
                  )}
                </div>
              </div>

              {/* Address Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    CEP de Entrega
                  </label>
                  <input
                    type="text"
                    value={delivery.cep}
                    onChange={(e) => setDelivery({ ...delivery, cep: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Logradouro / Rua / Avenida *
                  </label>
                  <input
                    type="text"
                    value={delivery.street}
                    onChange={(e) => setDelivery({ ...delivery, street: e.target.value })}
                    placeholder="Ex: Av. Paulista"
                    className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  />
                  {formErrors.street && (
                    <span className="text-[11px] text-rose-600 font-semibold">{formErrors.street}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Número *
                  </label>
                  <input
                    type="text"
                    value={delivery.number}
                    onChange={(e) => setDelivery({ ...delivery, number: e.target.value })}
                    placeholder="Ex: 1578"
                    className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  />
                  {formErrors.number && (
                    <span className="text-[11px] text-rose-600 font-semibold">{formErrors.number}</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Complemento
                  </label>
                  <input
                    type="text"
                    value={delivery.complement}
                    onChange={(e) => setDelivery({ ...delivery, complement: e.target.value })}
                    placeholder="Apto, Bloco, Sala"
                    className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Bairro
                  </label>
                  <input
                    type="text"
                    value={delivery.neighborhood}
                    onChange={(e) => setDelivery({ ...delivery, neighborhood: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Cidade / UF
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`${delivery.city} - ${delivery.state}`}
                    className="w-full px-3.5 py-2.5 text-xs bg-stone-100 border border-stone-300 rounded-xl text-stone-600 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Ponto de Referência / Instrução para a Portaria
                </label>
                <input
                  type="text"
                  value={delivery.reference}
                  onChange={(e) => setDelivery({ ...delivery, reference: e.target.value })}
                  placeholder="Ex: Deixar na portaria com o porteiro Silva ou interfone 82"
                  className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
              </div>

              {/* Delivery Timing Recap */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between text-xs text-amber-950">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    Entrega agendada para <strong>{delivery.dateLabel}</strong> ({delivery.shiftName})
                  </span>
                </div>
                <span className="font-bold text-emerald-800">
                  {delivery.shiftFee === 0 ? "Frete Grátis" : `Taxa: ${formatCurrency(delivery.shiftFee)}`}
                </span>
              </div>
            </div>
          )}

          {/* STEP 2: CARTÃO DE MENSAGEM & IA */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-serif font-bold text-stone-900 text-sm">
                    Personalize o Cartão de Dedicatória (Incluso Gratuitamente)
                  </h4>
                  <p className="text-xs text-stone-500">
                    O cartão é impresso em papel de alta gramatura e lacrado em envelope especial.
                  </p>
                </div>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full">
                  100% Grátis
                </span>
              </div>

              {/* Occasion / Tone Selector for AI Assistant */}
              <div className="bg-gradient-to-r from-emerald-900 to-emerald-950 text-white rounded-xl p-4 space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-amber-300" />
                    <span className="text-xs font-bold text-amber-200 uppercase tracking-wider">
                      Assistente de Inspiração com Inteligência Artificial
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-300 font-medium">Powered by Gemini AI</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-emerald-200 mb-1">Tom da Mensagem:</label>
                    <select
                      value={aiTone}
                      onChange={(e) => setAiTone(e.target.value)}
                      className="w-full bg-emerald-800/90 border border-emerald-700 text-white text-xs rounded-lg px-3 py-2 focus:outline-none"
                    >
                      <option value="Romântico e Apaixonado">💖 Romântico e Apaixonado</option>
                      <option value="Emocionante e Profundo">✨ Emocionante e Profundo</option>
                      <option value="Alegre e Divertido">🎉 Alegre e Divertido</option>
                      <option value="Carinhoso para Aniversário">🎂 Carinhoso de Aniversário</option>
                      <option value="Respeitoso e Formal">🕊️ Respeitoso / Condolências</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={handleGenerateAiMessage}
                      disabled={isGeneratingAi}
                      className="w-full py-2 bg-amber-400 hover:bg-amber-300 text-emerald-950 text-xs font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isGeneratingAi ? "Criando Mensagens..." : "Gerar Dedicatória com IA"}</span>
                    </button>
                  </div>
                </div>

                {aiSuggestions.length > 1 && (
                  <div className="pt-2 border-t border-emerald-800/80 space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-amber-300">
                      Outras sugestões geradas:
                    </span>
                    <div className="space-y-1">
                      {aiSuggestions.map((sug, i) => (
                        <button
                          key={i}
                          onClick={() => setCard({ ...card, messageText: sug })}
                          className="w-full text-left text-xs bg-emerald-800/60 hover:bg-emerald-800 p-2 rounded-lg text-emerald-100 transition-colors line-clamp-1 cursor-pointer"
                        >
                          "{sug}"
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Message Text Area */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Texto da Dedicatória:
                </label>
                <textarea
                  rows={4}
                  value={card.messageText}
                  onChange={(e) => setCard({ ...card, messageText: e.target.value })}
                  maxLength={350}
                  placeholder="Escreva aqui a mensagem do seu cartão..."
                  className="w-full p-3 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:outline-none leading-relaxed font-sans"
                />
                <div className="flex justify-between text-[11px] text-stone-400 mt-1">
                  <span>Dica: Mencione memórias especiais para tocar o coração</span>
                  <span>{card.messageText.length} / 350 caracteres</span>
                </div>
              </div>

              {/* Sender Signature & Anonymous Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Assinatura do Cartão (Como você deseja assinar):
                  </label>
                  <input
                    type="text"
                    disabled={card.isAnonymous}
                    value={card.isAnonymous ? "Admirador(a) Secreto(a)" : card.senderSignature}
                    onChange={(e) => setCard({ ...card, senderSignature: e.target.value })}
                    placeholder="Ex: Com amor, Rodrigo"
                    className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:outline-none disabled:bg-stone-100 disabled:text-stone-400"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-xs font-semibold text-stone-800 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={card.isAnonymous}
                      onChange={(e) => setCard({ ...card, isAnonymous: e.target.checked })}
                      className="w-4 h-4 text-emerald-800 rounded-md focus:ring-emerald-700"
                    />
                    <span>Enviar como presente anônimo (Admirador Secreto)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: COMPRADOR & PAGAMENTO */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Buyer info */}
              <div className="space-y-3">
                <h4 className="font-serif font-bold text-stone-900 text-sm">
                  Dados de Quem Está Comprando (Para Rastreamento & NF)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                      Seu Nome Completo *
                    </label>
                    <input
                      type="text"
                      value={buyer.fullName}
                      onChange={(e) => setBuyer({ ...buyer, fullName: e.target.value })}
                      placeholder="Ex: Rodrigo Bento"
                      className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                    />
                    {formErrors.fullName && (
                      <span className="text-[11px] text-rose-600 font-semibold">{formErrors.fullName}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                      Seu E-mail (Para confirmação do pedido) *
                    </label>
                    <input
                      type="email"
                      value={buyer.email}
                      onChange={(e) => setBuyer({ ...buyer, email: e.target.value })}
                      placeholder="seuemail@exemplo.com"
                      className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                    />
                    {formErrors.email && (
                      <span className="text-[11px] text-rose-600 font-semibold">{formErrors.email}</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                      Seu WhatsApp (Receberá fotos do arranjo) *
                    </label>
                    <input
                      type="text"
                      value={buyer.phone}
                      onChange={(e) => setBuyer({ ...buyer, phone: e.target.value })}
                      placeholder="(11) 99999-8888"
                      className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                    />
                    {formErrors.phone && (
                      <span className="text-[11px] text-rose-600 font-semibold">{formErrors.phone}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                      Seu CPF (Exigido pela Receita para emissão de NF) *
                    </label>
                    <input
                      type="text"
                      value={buyer.cpf}
                      onChange={(e) => setBuyer({ ...buyer, cpf: e.target.value })}
                      placeholder="000.000.000-00"
                      className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                    />
                    {formErrors.cpf && (
                      <span className="text-[11px] text-rose-600 font-semibold">{formErrors.cpf}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Methods Selector */}
              <div className="pt-2 space-y-3">
                <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider">
                  Forma de Pagamento:
                </label>

                <div className="grid grid-cols-2 gap-3">
                  {/* PIX Option */}
                  <button
                    type="button"
                    onClick={() => setBuyer({ ...buyer, paymentMethod: "pix" })}
                    className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      buyer.paymentMethod === "pix"
                        ? "border-emerald-700 bg-emerald-50/80 ring-1 ring-emerald-700"
                        : "border-stone-200 hover:border-stone-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-800 text-amber-300 flex items-center justify-center font-bold text-xs">
                        PIX
                      </div>
                      <div>
                        <span className="text-xs font-bold text-stone-900 block">PIX Instantâneo</span>
                        <span className="text-[11px] text-emerald-800 font-semibold">Aprovação em 5 segundos</span>
                      </div>
                    </div>
                    {buyer.paymentMethod === "pix" && <Check className="w-4 h-4 text-emerald-700" />}
                  </button>

                  {/* Credit Card Option */}
                  <button
                    type="button"
                    onClick={() => setBuyer({ ...buyer, paymentMethod: "credit_card" })}
                    className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      buyer.paymentMethod === "credit_card"
                        ? "border-emerald-700 bg-emerald-50/80 ring-1 ring-emerald-700"
                        : "border-stone-200 hover:border-stone-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-stone-800 text-white flex items-center justify-center">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-stone-900 block">Cartão de Crédito</span>
                        <span className="text-[11px] text-stone-500">Em até 6x sem juros</span>
                      </div>
                    </div>
                    {buyer.paymentMethod === "credit_card" && <Check className="w-4 h-4 text-emerald-700" />}
                  </button>
                </div>

                {/* PIX Simulated QR Code Preview */}
                {buyer.paymentMethod === "pix" && (
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-28 h-28 bg-white p-2 rounded-lg border border-emerald-200 shadow-xs flex items-center justify-center">
                      <QrCode className="w-24 h-24 text-emerald-950" />
                    </div>
                    <div className="flex-1 text-xs space-y-1.5 text-stone-700 text-center sm:text-left">
                      <h5 className="font-bold text-emerald-950">Pagamento Fácil via PIX</h5>
                      <p className="text-[11px] text-stone-600 leading-relaxed">
                        Ao clicar em "Confirmar Pedido", o QR Code dinâmico e o código Copia e Cola serão gerados. A confirmação é instantânea e o florista inicia a montagem do arranjo na hora!
                      </p>
                      <span className="inline-block bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-md font-bold text-[10px]">
                        ✓ Desconto de pontualidade aplicado
                      </span>
                    </div>
                  </div>
                )}

                {/* Credit Card Form */}
                {buyer.paymentMethod === "credit_card" && (
                  <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                        Número do Cartão *
                      </label>
                      <input
                        type="text"
                        value={buyer.cardNumber}
                        onChange={(e) => setBuyer({ ...buyer, cardNumber: e.target.value })}
                        placeholder="0000 0000 0000 0000"
                        maxLength={19}
                        className="w-full px-3.5 py-2 text-xs bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                      />
                      {formErrors.cardNumber && (
                        <span className="text-[11px] text-rose-600">{formErrors.cardNumber}</span>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                        Nome Impresso no Cartão *
                      </label>
                      <input
                        type="text"
                        value={buyer.cardName}
                        onChange={(e) => setBuyer({ ...buyer, cardName: e.target.value })}
                        placeholder="NOME COMO NO CARTAO"
                        className="w-full px-3.5 py-2 text-xs bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:outline-none uppercase"
                      />
                      {formErrors.cardName && (
                        <span className="text-[11px] text-rose-600">{formErrors.cardName}</span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                          Validade (MM/AA) *
                        </label>
                        <input
                          type="text"
                          value={buyer.cardExpiry}
                          onChange={(e) => setBuyer({ ...buyer, cardExpiry: e.target.value })}
                          placeholder="12/28"
                          maxLength={5}
                          className="w-full px-3.5 py-2 text-xs bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                        />
                        {formErrors.cardExpiry && (
                          <span className="text-[11px] text-rose-600">{formErrors.cardExpiry}</span>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                          Código CVV *
                        </label>
                        <input
                          type="password"
                          value={buyer.cardCvv}
                          onChange={(e) => setBuyer({ ...buyer, cardCvv: e.target.value })}
                          placeholder="123"
                          maxLength={4}
                          className="w-full px-3.5 py-2 text-xs bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                        />
                        {formErrors.cardCvv && (
                          <span className="text-[11px] text-rose-600">{formErrors.cardCvv}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Order Summary & Footer Action Bar */}
        <div className="bg-stone-50 border-t border-stone-200 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-4">
            <div>
              <span className="text-xs text-stone-500 uppercase block font-semibold">Total a Pagar:</span>
              <span className="text-xl font-bold font-serif text-emerald-950">
                {formatCurrency(total)}
              </span>
            </div>
            <div className="text-right sm:text-left text-xs text-stone-500 border-l border-stone-200 pl-3">
              <span>Entrega: <strong>{delivery.city}</strong></span>
              <span className="block text-emerald-800 font-semibold">{delivery.dateLabel} ({delivery.shiftName})</span>
            </div>
          </div>

          <div className="w-full sm:w-auto flex items-center gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((prev) => (prev - 1) as 1 | 2 | 3)}
                className="px-4 py-2.5 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar</span>
              </button>
            )}

            {step === 1 && (
              <button
                type="button"
                onClick={() => {
                  if (validateStep1()) setStep(2);
                }}
                className="flex-1 sm:flex-none px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Avançar para o Cartão</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 sm:flex-none px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Avançar para o Pagamento</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                onClick={handleFinalizeOrder}
                disabled={isProcessing}
                className="flex-1 sm:flex-none px-8 py-3 bg-emerald-800 hover:bg-emerald-900 text-amber-300 font-bold text-sm rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                <span>{isProcessing ? "Confirmando Pedido..." : "Finalizar e Enviar Flores"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
