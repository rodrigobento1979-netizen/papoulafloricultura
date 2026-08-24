import React, { useState } from "react";
import { 
  X, 
  MessageCircle, 
  User, 
  MapPin, 
  Heart, 
  Check, 
  Truck, 
  Sparkles, 
  ShieldCheck, 
  Gift, 
  Clock, 
  ArrowRight,
  ArrowLeft,
  Info
} from "lucide-react";
import { Product, ProductSize, GoogleDriveConfig } from "../types";
import { sendOrderToGoogleSheetsWebhook } from "../utils/googleDriveSync";

interface WhatsAppOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  selectedSize?: ProductSize;
  initialCity?: string;
  initialDeliveryFee?: number;
}

export const WhatsAppOrderModal: React.FC<WhatsAppOrderModalProps> = ({
  isOpen,
  onClose,
  product,
  selectedSize,
  initialCity = "Pirapora",
  initialDeliveryFee = 10.0,
}) => {
  if (!isOpen || !product) return null;

  // Step state: 1: Sender | 2: Recipient/Address | 3: Dedication/Time | 4: Review/PIX | 5: Success
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 1: Sender
  const [senderType, setSenderType] = useState<"identified" | "anonymous">("identified");
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");

  // Step 2: Recipient details
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [deliveryCity, setDeliveryCity] = useState<"Pirapora" | "Buritizeiro">(
    initialCity.includes("Buritizeiro") ? "Buritizeiro" : "Pirapora"
  );
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryNeighborhood, setDeliveryNeighborhood] = useState("");
  const [deliveryReference, setDeliveryReference] = useState("");

  // Step 3: Dedication and Delivery time
  const [cardMessage, setCardMessage] = useState("");
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState<string>("Hoje - O quanto antes");

  const deliveryFee = deliveryCity === "Pirapora" ? 10.0 : 15.0;
  const currentPrice = selectedSize ? selectedSize.price : (product.price || 0);
  const isPriceOnDemand = product.isPriceOnDemand || (!currentPrice && currentPrice === 0);

  const formatCurrency = (val: number) => {
    return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const dedicationSuggestions = [
    "Com todo meu amor e carinho! 🌹",
    "Feliz Aniversário! Que seu dia seja tão lindo quanto você! 🎂✨",
    "Você ilumina meus dias. Obrigado(a) por existir! 💖",
    "Um mimo especial para alegrar o seu dia! 🌸",
  ];

  // Step navigation validations
  const handleNextFromStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (senderType === "identified" && !senderName.trim()) {
      alert("Por favor, informe seu nome ou escolha 'Envio Anônimo'.");
      return;
    }
    setCurrentStep(2);
  };

  const handleNextFromStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim()) {
      alert("Por favor, informe o nome da pessoa que receberá as flores.");
      return;
    }
    if (!deliveryAddress.trim()) {
      alert("Por favor, informe o endereço de entrega.");
      return;
    }
    setCurrentStep(3);
  };

  const handleNextFromStep3 = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentStep(4);
  };

  const handleSendToWhatsApp = () => {
    const sizeInfo = selectedSize ? ` (Tamanho: ${selectedSize.name})` : "";
    const priceInfo = !isPriceOnDemand ? `${formatCurrency(currentPrice)}` : "Sob Consulta";
    const totalWithDelivery = !isPriceOnDemand ? `${formatCurrency(currentPrice + deliveryFee)}` : "A calcular pela floricultura";

    let senderInfoText = "";
    if (senderType === "anonymous") {
      senderInfoText = `🕵️‍♂️ *ENVIO ANÔNIMO / ADMIRADOR SECRETO*\n_(Não colocar o nome de quem comprou no cartão)_\n*WhatsApp para envio da chave PIX:* ${senderPhone || "Informarei aqui na conversa"}`;
    } else {
      senderInfoText = `👤 *Remetente:* ${senderName.trim()} ${senderPhone ? `(${senderPhone.trim()})` : ""}`;
    }

    const fullAddress = `${deliveryAddress.trim()}${deliveryNeighborhood ? `, Bairro ${deliveryNeighborhood.trim()}` : ""}${deliveryReference ? ` (Ref: ${deliveryReference.trim()})` : ""}`;

    const orderNum = `#PAP-${Math.floor(1000 + Math.random() * 9000)}`;

    const msg = 
`🌸 *NOVO PEDIDO DE FLORES - FLORICULTURA PAPOULA* 🌸
Pedido: ${orderNum}

💐 *PRODUTO:* ${product.name}${sizeInfo}
💰 *Valor do Item:* ${priceInfo}
🚚 *Frete:* ${formatCurrency(deliveryFee)} (${deliveryCity})
🏷️ *Estimativa Total:* ${totalWithDelivery}

${senderInfoText}

🎁 *DADOS DO DESTINATÁRIO:*
• *Nome:* ${recipientName.trim()}
• *Cidade:* ${deliveryCity} - MG
• *Endereço:* ${fullAddress}
${recipientPhone.trim() ? `• *Telefone Destinatário:* ${recipientPhone.trim()}\n` : ""}• *Previsão de Entrega:* ${deliveryTimeSlot}

💌 *DEDICATÓRIA DO CARTÃO:*
"${cardMessage.trim() || "Com todo meu amor e carinho!"}"

💳 *Forma de Pagamento:* PIX
👉 *Por favor, confirme a disponibilidade, o valor total e me envie a chave PIX para pagamento!* ✨`;

    // Try sending directly to configured Google Apps Script Webhook
    try {
      const storedConfig = localStorage.getItem("papoula_gdrive_config");
      if (storedConfig) {
        const parsed: GoogleDriveConfig = JSON.parse(storedConfig);
        if (parsed.sheetWebhookUrl && parsed.autoSync) {
          sendOrderToGoogleSheetsWebhook(parsed.sheetWebhookUrl, {
            orderNumber: orderNum,
            productName: `${product.name}${sizeInfo}`,
            price: currentPrice,
            deliveryFee: deliveryFee,
            total: currentPrice + deliveryFee,
            senderName: senderType === "anonymous" ? "Envio Anônimo" : (senderName.trim() || "Anônimo"),
            senderPhone: senderPhone.trim(),
            recipientName: recipientName.trim(),
            recipientPhone: recipientPhone.trim(),
            city: deliveryCity,
            address: deliveryAddress.trim(),
            neighborhood: deliveryNeighborhood.trim(),
            reference: deliveryReference.trim(),
            timeSlot: deliveryTimeSlot,
            cardMessage: cardMessage.trim(),
            paymentMethod: "PIX"
          });
        }
      }
    } catch (e) {
      console.warn("Could not sync with Google Sheets:", e);
    }

    const waUrl = `https://wa.me/5538988512855?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, "_blank");

    setCurrentStep(5);
  };

  const handleResetAndClose = () => {
    setCurrentStep(1);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-100 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Top Bar */}
        <div className="bg-[#114b30] text-white px-4 sm:px-5 py-3 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-amber-300">
              <MessageCircle className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-xs sm:text-sm leading-tight flex items-center gap-1.5">
                <span>Pedido Rápido no WhatsApp</span>
              </h3>
              <p className="text-[10px] text-emerald-100/90">
                Floricultura Papoula • Pirapora & Buritizeiro
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1 rounded-full text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Compact Stepper Progress Bar (Etapas 1 a 4) */}
        {currentStep <= 4 && (
          <div className="bg-stone-50 border-b border-stone-200 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-stone-700">
              <span className="w-5 h-5 rounded-full bg-[#114b30] text-white flex items-center justify-center text-[10px]">
                {currentStep}
              </span>
              <span>
                {currentStep === 1 && "1. Quem está enviando?"}
                {currentStep === 2 && "2. Onde devemos entregar?"}
                {currentStep === 3 && "3. Cartão de Dedicatória"}
                {currentStep === 4 && "4. Revisão & Chave PIX"}
              </span>
            </div>

            {/* Visual Step Dots */}
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all ${
                    s === currentStep
                      ? "w-5 bg-[#114b30]"
                      : s < currentStep
                      ? "w-2.5 bg-emerald-600"
                      : "w-2 bg-stone-300"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Mini Product Header Info */}
        {currentStep <= 4 && (
          <div className="px-4 py-2 bg-emerald-50/60 border-b border-emerald-100/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate pr-2">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-7 h-7 rounded-md object-contain bg-white border border-stone-200 shrink-0"
              />
              <span className="font-serif font-bold text-stone-900 truncate">
                {product.name}
              </span>
            </div>
            <span className="font-bold text-[#114b30] font-serif shrink-0">
              {!isPriceOnDemand ? formatCurrency(currentPrice) : "Sob Consulta"}
            </span>
          </div>
        )}

        {/* Step 1: Quem está enviando (Identificado vs Anônimo) */}
        {currentStep === 1 && (
          <form onSubmit={handleNextFromStep1} className="p-4 sm:p-5 space-y-3.5">
            <div className="space-y-1">
              <h4 className="font-serif font-bold text-stone-900 text-sm sm:text-base">
                Como deseja que o presente seja entregue?
              </h4>
              <p className="text-xs text-stone-500">
                Escolha se o seu nome aparecerá no cartão ou se será surpresa anônima.
              </p>
            </div>

            {/* Toggle Options */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSenderType("identified")}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  senderType === "identified"
                    ? "bg-emerald-50/80 border-[#114b30] ring-2 ring-[#114b30]/30 text-emerald-950 font-semibold"
                    : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xs font-bold flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-[#114b30]" />
                    Identificado
                  </span>
                  {senderType === "identified" && <Check className="w-3.5 h-3.5 text-[#114b30]" />}
                </div>
                <span className="text-[10px] text-stone-500 font-normal leading-tight">
                  Seu nome irá no cartão de presente
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSenderType("anonymous")}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  senderType === "anonymous"
                    ? "bg-emerald-50/80 border-[#114b30] ring-2 ring-[#114b30]/30 text-emerald-950 font-semibold"
                    : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xs font-bold flex items-center gap-1">
                    🕵️‍♂️ Anônimo
                  </span>
                  {senderType === "anonymous" && <Check className="w-3.5 h-3.5 text-[#114b30]" />}
                </div>
                <span className="text-[10px] text-stone-500 font-normal leading-tight">
                  Admirador secreto, sem revelar quem enviou
                </span>
              </button>
            </div>

            {/* Inputs based on selection */}
            {senderType === "identified" ? (
              <div className="space-y-2 pt-1">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Seu Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Ex: Carlos Eduardo"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-[#114b30]/30 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Seu WhatsApp (opcional)
                  </label>
                  <input
                    type="tel"
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    placeholder="(38) 9..."
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-[#114b30]/30 focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs space-y-1.5">
                <p className="font-bold flex items-center gap-1.5 text-amber-900 text-xs">
                  <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                  Sigilo 100% Garantido
                </p>
                <p className="text-[11px] text-amber-800 leading-tight">
                  A floricultura não informará sua identidade ao destinatário.
                </p>
                <input
                  type="tel"
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  placeholder="Seu WhatsApp (opcional, só para envio do PIX)"
                  className="w-full mt-1 px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs focus:outline-none"
                />
              </div>
            )}

            {/* Next Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 bg-[#114b30] hover:bg-[#0d3924] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Avançar para Destinatário</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Destinatário e Endereço */}
        {currentStep === 2 && (
          <form onSubmit={handleNextFromStep2} className="p-4 sm:p-5 space-y-3">
            <div className="space-y-1">
              <h4 className="font-serif font-bold text-stone-900 text-sm sm:text-base">
                Para quem e onde devemos entregar?
              </h4>
              <p className="text-xs text-stone-500">
                Informe o nome do destinatário e o endereço em Pirapora ou Buritizeiro.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Nome de quem vai receber as flores *
              </label>
              <input
                type="text"
                required
                autoFocus
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Ex: Mariana Silva"
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-[#114b30]/30 focus:outline-none"
              />
            </div>

            {/* City Selection Buttons */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Cidade de Entrega *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDeliveryCity("Pirapora")}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                    deliveryCity === "Pirapora"
                      ? "bg-[#114b30] text-white border-[#114b30] shadow-xs"
                      : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                  }`}
                >
                  <span>🌿 Pirapora</span>
                  <span className={deliveryCity === "Pirapora" ? "text-amber-300" : "text-emerald-800"}>
                    R$ 10,00
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryCity("Buritizeiro")}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                    deliveryCity === "Buritizeiro"
                      ? "bg-[#114b30] text-white border-[#114b30] shadow-xs"
                      : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                  }`}
                >
                  <span>🌿 Buritizeiro</span>
                  <span className={deliveryCity === "Buritizeiro" ? "text-amber-300" : "text-emerald-800"}>
                    R$ 15,00
                  </span>
                </button>
              </div>
            </div>

            {/* Address fields */}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Endereço (Rua e Nº) *
                </label>
                <input
                  type="text"
                  required
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Ex: Rua Mato Grosso, 211"
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-[#114b30]/30 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Bairro
                </label>
                <input
                  type="text"
                  value={deliveryNeighborhood}
                  onChange={(e) => setDeliveryNeighborhood(e.target.value)}
                  placeholder="Centro..."
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-[#114b30]/30 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Ponto de Referência / Complemento (opcional)
              </label>
              <input
                type="text"
                value={deliveryReference}
                onChange={(e) => setDeliveryReference(e.target.value)}
                placeholder="Ex: Portão branco / Próximo à praça"
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-[#114b30]/30 focus:outline-none"
              />
            </div>

            {/* Nav Buttons */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="w-1/3 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar</span>
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-[#114b30] hover:bg-[#0d3924] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Avançar para o Cartão</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Cartão de Dedicatória & Horário */}
        {currentStep === 3 && (
          <form onSubmit={handleNextFromStep3} className="p-4 sm:p-5 space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="font-serif font-bold text-stone-900 text-sm sm:text-base flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-rose-600" />
                  <span>Mensagem para o Cartão</span>
                </h4>
                <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                  Cortesia Grátis
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Escreva a mensagem especial que iremos imprimir e anexar ao arranjo.
              </p>
            </div>

            <textarea
              rows={2}
              autoFocus
              value={cardMessage}
              onChange={(e) => setCardMessage(e.target.value)}
              placeholder="Digite sua dedicatória com carinho..."
              className="w-full p-2.5 bg-white border border-rose-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-400/30 focus:outline-none resize-none"
            />

            {/* Quick Inspiration Pills */}
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-stone-500 block">
                Sugestões rápidas:
              </span>
              <div className="flex flex-wrap gap-1">
                {dedicationSuggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCardMessage(sug)}
                    className="text-[10px] bg-stone-50 hover:bg-rose-50 border border-stone-200 hover:border-rose-300 text-stone-700 px-2 py-0.5 rounded-lg transition-colors cursor-pointer text-left truncate max-w-full"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>

            {/* Horário */}
            <div className="pt-1">
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Quando prefere que façamos a entrega?
              </label>
              <select
                value={deliveryTimeSlot}
                onChange={(e) => setDeliveryTimeSlot(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-[#114b30]/30 focus:outline-none"
              >
                <option value="Hoje - O quanto antes">Hoje - O quanto antes (entrega expressa)</option>
                <option value="Hoje - Período da Manhã">Hoje - Período da Manhã (até 12h)</option>
                <option value="Hoje - Período da Tarde">Hoje - Período da Tarde (14h às 18h)</option>
                <option value="Amanhã pela Manhã">Amanhã pela Manhã</option>
                <option value="Amanhã pela Tarde">Amanhã pela Tarde</option>
                <option value="Data Agendada (A combinar no WhatsApp)">Outra Data Agendada (Combinar no WhatsApp)</option>
              </select>
            </div>

            {/* Nav Buttons */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="w-1/3 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar</span>
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-[#114b30] hover:bg-[#0d3924] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Revisar & Chave PIX</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* Step 4: Revisão, Como Funciona o PIX & Enviar para WhatsApp */}
        {currentStep === 4 && (
          <div className="p-4 sm:p-5 space-y-3">
            <div className="space-y-1">
              <h4 className="font-serif font-bold text-stone-900 text-sm sm:text-base">
                Quase pronto! Revise seu pedido:
              </h4>
            </div>

            {/* Compact Order Summary Box */}
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3 text-xs space-y-1.5">
              <div className="flex justify-between items-center text-stone-700">
                <span>💐 Produto:</span>
                <strong className="text-stone-900">{product.name}</strong>
              </div>
              <div className="flex justify-between items-center text-stone-700">
                <span>🎁 Destinatário:</span>
                <strong className="text-stone-900">{recipientName}</strong>
              </div>
              <div className="flex justify-between items-center text-stone-700">
                <span>📍 Entrega:</span>
                <span className="text-stone-900 font-medium text-right text-[11px] truncate max-w-[200px]">
                  {deliveryAddress}, {deliveryCity}
                </span>
              </div>
              <div className="flex justify-between items-center text-stone-700">
                <span>👤 Remetente:</span>
                <span className="text-stone-900 font-medium">
                  {senderType === "anonymous" ? "🕵️‍♂️ Anônimo" : senderName}
                </span>
              </div>
              <div className="border-t border-stone-200 pt-1.5 flex justify-between items-center text-xs">
                <span className="font-bold text-stone-800">Total (com frete):</span>
                <strong className="text-sm font-bold text-[#114b30] font-serif">
                  {!isPriceOnDemand ? formatCurrency(currentPrice + deliveryFee) : "Sob Consulta"}
                </strong>
              </div>
            </div>

            {/* Explanatory PIX box */}
            <div className="bg-emerald-50 border border-emerald-200/90 rounded-2xl p-3 text-xs text-emerald-950 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Como funciona o pagamento via PIX:</span>
              </div>
              <p className="text-[11px] text-emerald-900/90 leading-tight">
                1. Ao clicar abaixo, a mensagem é enviada ao WhatsApp da loja.
              </p>
              <p className="text-[11px] text-emerald-900/90 leading-tight">
                2. A atendente confirmará e enviará a <strong>chave PIX da floricultura</strong>.
              </p>
              <p className="text-[11px] text-emerald-900/90 leading-tight">
                3. <strong>Após o pagamento, o pedido é confirmado</strong> e enviamos fotos do arranjo antes da saída!
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleSendToWhatsApp}
                className="w-full py-3 sm:py-3.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-950/20 transition-all flex items-center justify-center gap-2 cursor-pointer border border-emerald-300/40 hover:scale-[1.01]"
              >
                <MessageCircle className="w-4 h-4 text-white fill-white/20" />
                <span>Enviar Pedido para o WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="w-full py-1.5 text-stone-500 hover:text-stone-800 text-xs font-semibold cursor-pointer"
              >
                ← Voltar e alterar dados
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Sucesso / Agradecimento */}
        {currentStep === 5 && (
          <div className="p-5 sm:p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-inner">
              <Check className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900">
                Pedido Enviado para o WhatsApp!
              </h3>
              <p className="text-xs text-stone-600 max-w-sm mx-auto leading-relaxed">
                Nossa atendente já está recebendo as informações de <strong>{recipientName}</strong> em <strong>(38) 98851-2855</strong>.
              </p>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-left text-xs text-emerald-950 space-y-1">
              <strong className="block text-emerald-900">Próximos passos:</strong>
              <p className="text-[11px] leading-tight">
                • Aguarde a atendente passar a chave PIX e o valor confirmado.
              </p>
              <p className="text-[11px] leading-tight">
                • Após pagar, seu presente é preparado com todo o carinho e você receberá as notificações da entrega.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="w-full py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Voltar ao Catálogo
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
