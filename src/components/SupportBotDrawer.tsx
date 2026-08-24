import React, { useState, useRef, useEffect } from "react";
import { 
  X, 
  Send, 
  Bot, 
  MessageCircle, 
  Sparkles, 
  Phone, 
  MapPin, 
  Clock, 
  Gift, 
  CreditCard,
  ChevronRight,
  RefreshCw,
  User,
  UserX,
  Cake,
  ShoppingBag,
  CheckCircle2,
  Calendar,
  ArrowRight,
  AlertCircle
} from "lucide-react";
import { PapoulaLogo } from "./PapoulaLogo";
import { Customer, KanbanOrder, Product, StoreConfig } from "../types";
import { getStoreBusinessHours, DEFAULT_STORE_CONFIG } from "../utils/businessHours";

interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: string;
  orderCard?: {
    orderNumber: string;
    productName: string;
    totalPrice: number;
    deliveryAddress: string;
    deliveryCity: string;
    isOffHours?: boolean;
    nextOpenText?: string;
  };
  link?: {
    label: string;
    url: string;
  };
}

interface SupportBotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  storeConfig?: StoreConfig;
  initialProductForOrder?: Product | null;
  initialCity?: string;
  onRegisterCustomer: (customer: Customer) => void;
  onCreateKanbanOrder: (order: KanbanOrder) => void;
}

export const SupportBotDrawer: React.FC<SupportBotDrawerProps> = ({
  isOpen,
  onClose,
  products,
  storeConfig = DEFAULT_STORE_CONFIG,
  initialProductForOrder = null,
  initialCity = "Pirapora",
  onRegisterCustomer,
  onCreateKanbanOrder,
}) => {
  const [inputMessage, setInputMessage] = useState("");
  const businessHours = getStoreBusinessHours(storeConfig);
  
  // Client identification state
  const [clientProfile, setClientProfile] = useState<{
    fullName: string;
    phone: string;
    birthDate: string;
  } | null>(() => {
    try {
      const saved = localStorage.getItem("papoula_client_profile");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  // Controls whether the initial onboarding card is showing or the chat conversation is active
  const [isIdentifiedOrSkipped, setIsIdentifiedOrSkipped] = useState<boolean>(() => {
    return false; // Default to onboarding unless opened with a specific order
  });

  const [leadName, setLeadName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadBirthDate, setLeadBirthDate] = useState("");

  // Fast Order in bot state
  const [isOrderingMode, setIsOrderingMode] = useState(false);
  const [orderProduct, setOrderProduct] = useState<Product | null>(initialProductForOrder || products[0] || null);
  const [orderRecipientAddress, setOrderRecipientAddress] = useState("");
  const [orderCity, setOrderCity] = useState(initialCity || "Pirapora");
  const [orderCardMessage, setOrderCardMessage] = useState("");
  const [orderPayment, setOrderPayment] = useState<"pix" | "cartao" | "dinheiro">("pix");

  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // When initialProductForOrder changes or drawer opens with it, jump into fast ordering
  useEffect(() => {
    if (isOpen && initialProductForOrder) {
      setOrderProduct(initialProductForOrder);
      if (initialCity) setOrderCity(initialCity);
      setIsOrderingMode(true);
      setIsIdentifiedOrSkipped(true);
      if (messages.length === 0) {
        startChatSession(clientProfile?.fullName || undefined, !clientProfile);
      }
    }
  }, [isOpen, initialProductForOrder, initialCity]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && isIdentifiedOrSkipped) {
      setTimeout(scrollToBottom, 100);
    }
  }, [isOpen, messages, isTyping, isOrderingMode, isIdentifiedOrSkipped]);

  // Transition to chat with welcome message & WhatsApp link
  const startChatSession = (name?: string, isAnon: boolean = false, birthDate?: string) => {
    setIsIdentifiedOrSkipped(true);

    const hours = getStoreBusinessHours(storeConfig);
    const welcomeGreeting = isAnon || !name
      ? `Olá! Seja muito bem-vindo(a) à Floricultura Papoula! 🌺 Sou a assistente virtual e atendo toda a região de Pirapora e Buritizeiro.`
      : `Olá, ${name}! Seja muito bem-vindo(a) à Floricultura Papoula! 🌺 Sou a assistente virtual da nossa loja em Pirapora & Buritizeiro.${birthDate ? ` Já anotei sua data de aniversário (${birthDate}) para seus mimos e descontos especiais!` : ""}`;

    const hoursNotice = hours.isOpenNow
      ? `🟢 *Atendimento em tempo real aberto agora!*\n${storeConfig.weekdays.openTime} às ${storeConfig.weekdays.closeTime} (Seg-Sex) • ${storeConfig.saturday.openTime} às ${storeConfig.saturday.closeTime} (Sáb/Feriados)`
      : `🌙 *Aviso de Atendimento:* Estamos fora do horário comercial no momento, mas aceitamos e registramos seu pedido normalmente! ${storeConfig.closedMessage} (${hours.nextOpenText}).`;

    setMessages([
      {
        id: "welcome-1",
        sender: "bot",
        text: `${welcomeGreeting}\n\n${hoursNotice}`,
        timestamp: "Agora",
      },
      {
        id: "welcome-whatsapp",
        sender: "bot",
        text: "Como podemos te ajudar hoje? Você pode gerar uma encomenda rápida, tirar dúvidas ou falar com a florista no WhatsApp:",
        timestamp: "Agora",
        link: {
          label: `📲 Falar com Florista no WhatsApp ${storeConfig.phone}`,
          url: `https://wa.me/${storeConfig.whatsapp}?text=Ol%C3%A1%21+Vim+pelo+atendimento+virtual+da+Floricultura+Papoula+e+gostaria+de+informa%C3%A7%C3%B5es`,
        },
      },
    ]);
  };

  // Handle lead form submission
  const handleSaveLead = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanName = leadName.trim() || "Cliente Especial";
    const cleanPhone = leadPhone.trim() || "(38) 98851-2855";
    const cleanBirthDate = leadBirthDate.trim();

    const newProfile = {
      fullName: cleanName,
      phone: cleanPhone,
      birthDate: cleanBirthDate,
    };

    setClientProfile(newProfile);
    localStorage.setItem("papoula_client_profile", JSON.stringify(newProfile));

    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      fullName: newProfile.fullName,
      phone: newProfile.phone,
      birthDate: newProfile.birthDate,
      createdAt: new Date().toISOString(),
      notes: "Cadastrado via Bot de Atendimento Papoula",
      totalOrders: 0,
    };

    onRegisterCustomer(newCustomer);
    startChatSession(newProfile.fullName, false, newProfile.birthDate);
  };

  // Handle anonymous continuation
  const handleContinueAnonymous = () => {
    setClientProfile(null);
    startChatSession(undefined, true);
  };

  // Fast order generation with off-hours handling
  const handleCreateFastOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderProduct) return;
    if (!orderRecipientAddress.trim()) {
      alert("Por favor preencha o endereço de entrega.");
      return;
    }

    const currentHours = getStoreBusinessHours(storeConfig);
    const orderNum = `PAP-${Math.floor(1000 + Math.random() * 9000)}`;
    const custName = clientProfile?.fullName || leadName || "Cliente";
    const custPhone = clientProfile?.phone || leadPhone || "(38) 99999-9999";
    const prodPrice = orderProduct.price || 0;
    const deliveryFee = orderCity === "Buritizeiro" ? 15.0 : 10.0;
    const grandTotal = prodPrice + deliveryFee;

    const newOrder: KanbanOrder = {
      id: `ord-${Date.now()}`,
      orderNumber: orderNum,
      customerName: custName,
      customerPhone: custPhone,
      customerBirthDate: clientProfile?.birthDate || "",
      productName: orderProduct.name,
      category: orderProduct.category,
      totalPrice: grandTotal,
      deliveryAddress: `${orderRecipientAddress.trim()} (${orderCity})`,
      deliveryCity: orderCity,
      deliveryDate: currentHours.isOpenNow ? "Hoje" : "Próximo Dia Útil",
      cardMessage: orderCardMessage.trim() || "Com todo carinho!",
      cardSender: custName,
      status: "pedido",
      createdAt: new Date().toISOString(),
      paymentMethod: orderPayment,
      notes: !currentHours.isOpenNow ? "Pedido gerado fora do horário - Processar no próximo dia útil" : `Frete: R$ ${deliveryFee.toFixed(2)} (${orderCity})`,
    };

    onCreateKanbanOrder(newOrder);
    setIsOrderingMode(false);

    // Add bot confirmation message with off-hours note
    const offHoursNotice = !currentHours.isOpenNow
      ? `\n\n📌 *Nota de Horário:* Seu pedido foi registrado com sucesso e nossa equipe começará a montagem e entrega com prioridade no primeiro horário do próximo dia útil (${currentHours.nextOpenText})!`
      : `\n\n✨ Nossa equipe já recebeu a notificação na bancada da floricultura para preparação!`;

    const orderMsg: Message = {
      id: `bot-order-${Date.now()}`,
      sender: "bot",
      text: `🎉 Perfeito, ${custName}! Seu pedido foi gerado com sucesso para entrega em ${orderCity} (Frete: R$ ${deliveryFee.toFixed(2)}) e lançado no Kanban da Floricultura Papoula!${offHoursNotice}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      orderCard: {
        orderNumber: orderNum,
        productName: orderProduct.name,
        totalPrice: grandTotal,
        deliveryAddress: `${orderRecipientAddress} (${orderCity})`,
        deliveryCity: orderCity,
        isOffHours: !currentHours.isOpenNow,
        nextOpenText: currentHours.nextOpenText,
      },
      link: {
        label: "📲 Confirmar no WhatsApp da Floricultura",
        url: `https://wa.me/${storeConfig.whatsapp}?text=${encodeURIComponent(`Olá! Acabei de solicitar o pedido ${orderNum} (${orderProduct.name}) no site da Floricultura Papoula para entrega em ${orderCity} (Total: R$ ${grandTotal.toFixed(2)} com entrega). Gostaria de confirmar!`)}`,
      },
    };

    setMessages((prev) => [...prev, orderMsg]);
  };

  const quickQuestions = [
    {
      label: "🛍️ Solicitar Pedido / Encomenda Rápida",
      action: () => setIsOrderingMode(true),
    },
    {
      label: "🚚 Taxas de Entrega (Pirapora R$ 10 / Buritizeiro R$ 15)",
      query: "Qual é a taxa e como funciona a entrega em Pirapora e Buritizeiro?",
    },
    {
      label: "⏰ Horário de Atendimento da Loja",
      query: "Qual é o horário de atendimento da Floricultura Papoula?",
    },
    {
      label: "🌹 Flores & Arranjos Disponíveis",
      query: "Quais buquês de rosas nobres e arranjos estão disponíveis hoje?",
    },
    {
      label: "💌 Cartão com dedicatória gratuita",
      query: "Como funciona o cartão com dedicatória gratuita?",
    },
    {
      label: "💳 Formas de Pagamento (PIX e Cartão)",
      query: "Quais as formas de pagamento aceitas?",
    },
    {
      label: "📍 Endereço da loja física em Pirapora",
      query: "Qual o endereço da floricultura física?",
    },
    {
      label: "📱 Conversar no WhatsApp com atendente",
      query: "Quero falar com um atendente humano no WhatsApp",
    },
  ];

  const getBotResponse = (userText: string): { text: string; link?: { label: string; url: string } } => {
    const textLower = userText.toLowerCase();
    const hours = getStoreBusinessHours();

    if (textLower.includes("horario") || textLower.includes("horário") || textLower.includes("funciona") || textLower.includes("aberto") || textLower.includes("fechado")) {
      return {
        text: `⏰ *Horários de Atendimento da Floricultura Papoula:*\n\n• *Segunda a Sexta-feira:* 07:30 às 18:30\n• *Sábados e Feriados:* 08:00 às 12:30\n\n📌 *Status Atual:* ${hours.isOpenNow ? "🟢 Aberto agora!" : `🌙 Fora do horário comercial. Próxima abertura: ${hours.nextOpenText}`}\n\n✨ Mesmo fora do horário, você pode solicitar seu pedido pelo site ou WhatsApp que processamos no primeiro horário!`,
      };
    }

    if (textLower.includes("entrega") || textLower.includes("frete") || textLower.includes("prazo") || textLower.includes("taxa") || textLower.includes("buritizeiro") || textLower.includes("pirapora")) {
      return {
        text: "🛵 *Taxas de Entrega da Floricultura Papoula:*\n\n• **Pirapora:** R$ 10,00 (Entrega Expressa no mesmo dia)\n• **Buritizeiro:** R$ 15,00 (Entrega Expressa no mesmo dia)\n\n✨ Pedidos até às 17h saem fresquinhos no mesmo dia com foto enviada antes da entrega!",
        link: {
          label: "📲 Falar com Atendente no WhatsApp",
          url: "https://wa.me/5538988512855?text=Ol%C3%A1%21+Gostaria+de+solicitar+uma+entrega+em+Pirapora%2FBuritizeiro",
        },
      };
    }

    if (textLower.includes("endereço") || textLower.includes("local") || textLower.includes("onde fica") || textLower.includes("rua")) {
      return {
        text: "📍 Nossa loja física fica localizada na Rua Mato Grosso, 211B — Centro, Pirapora - MG. Você pode comprar online e entregamos para você, ou passar para retirar!",
      };
    }

    if (textLower.includes("cartão") || textLower.includes("dedicatória") || textLower.includes("mensagem") || textLower.includes("grátis")) {
      return {
        text: "💌 Em todos os presentes da Floricultura Papoula, você ganha um Cartão Especial com a sua mensagem impressa com tipografia elegante sem nenhum custo adicional!",
      };
    }

    if (textLower.includes("pagamento") || textLower.includes("pix") || textLower.includes("cartão") || textLower.includes("parcelamento")) {
      return {
        text: "💳 Aceitamos PIX com confirmação instantânea, além de todos os cartões de crédito e débito.",
      };
    }

    if (textLower.includes("whatsapp") || textLower.includes("humano") || textLower.includes("atendente")) {
      return {
        text: "📱 Nosso florista de plantão está disponível no WhatsApp para te atender com carinho!",
        link: {
          label: "💬 Conversar no WhatsApp (38) 98851-2855",
          url: "https://wa.me/5538988512855?text=Ol%C3%A1%21+Gostaria+de+falar+com+um+atendente+da+Floricultura+Papoula",
        },
      };
    }

    return {
      text: "Arranjos florais nobres com rosas colombianas, girassóis, orquídeas e cestas de café da manhã montadas na hora em Pirapora e Buritizeiro. Deseja fazer uma encomenda rápida?",
      link: {
        label: "📲 Falar no WhatsApp da Loja",
        url: "https://wa.me/5538988512855?text=Ol%C3%A1%21+Vim+pelo+atendimento+online+da+Floricultura+Papoula",
      },
    };
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputMessage.trim();
    if (!text) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage("");
    setIsTyping(true);

    setTimeout(() => {
      const response = getBotResponse(text);
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        link: response.link,
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 500);
  };

  const handleResetChat = () => {
    setIsIdentifiedOrSkipped(false);
    setMessages([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Lateral Drawer (Right side) */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-4 sm:pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-emerald-950/20">
          
          {/* Header */}
          <div className="bg-[#114b30] text-white px-4 py-3.5 flex items-center justify-between shadow-md shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 p-1 flex items-center justify-center border border-amber-300/40 shrink-0">
                <PapoulaLogo size="sm" showTextBeside={false} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-bold text-base text-white">
                    Atendimento Papoula
                  </h3>
                  <span className={`w-2 h-2 rounded-full ${businessHours.isOpenNow ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                </div>
                <span className="text-[11px] text-emerald-200 block">
                  {businessHours.isOpenNow ? "🟢 Aberto agora (07:30 - 18:30)" : "🌙 Aceitando pedidos (Próx. dia útil)"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleResetChat}
                title="Reiniciar atendimento"
                className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Business Hours Info Banner */}
          <div className={`px-4 py-1.5 text-[11px] flex items-center justify-between border-b ${
            businessHours.isOpenNow 
              ? "bg-emerald-50 text-emerald-900 border-emerald-200" 
              : "bg-amber-50 text-amber-950 border-amber-200"
          }`}>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Seg-Sex: 07:30-18:30 | Sáb/Feriados: 08:00-12:30</span>
            </span>
            <span className="font-bold text-[10px] uppercase">
              {businessHours.isOpenNow ? "Aberto" : "Plantão Web"}
            </span>
          </div>

          {/* User badge if registered in active chat */}
          {isIdentifiedOrSkipped && clientProfile && (
            <div className="bg-emerald-50 px-4 py-2 border-b border-emerald-200/80 flex items-center justify-between text-xs text-emerald-950 shrink-0">
              <div className="flex items-center gap-1.5 truncate">
                <User className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span className="font-semibold truncate">{clientProfile.fullName}</span>
                {clientProfile.birthDate && (
                  <span className="text-[10px] bg-rose-100 text-rose-900 px-1.5 py-0.2 rounded font-bold ml-1 flex items-center gap-0.5">
                    <Cake className="w-2.5 h-2.5 text-rose-500" /> {clientProfile.birthDate}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsIdentifiedOrSkipped(false)}
                className="text-[10px] text-emerald-700 hover:underline font-bold shrink-0 ml-2 cursor-pointer"
              >
                Editar dados
              </button>
            </div>
          )}

          {/* Anonymous User Badge in active chat */}
          {isIdentifiedOrSkipped && !clientProfile && (
            <div className="bg-stone-100 px-4 py-2 border-b border-stone-200 flex items-center justify-between text-xs text-stone-700 shrink-0">
              <div className="flex items-center gap-1.5">
                <UserX className="w-3.5 h-3.5 text-stone-500" />
                <span className="text-stone-600 text-[11px]">Modo Anônimo</span>
              </div>
              <button
                onClick={() => setIsIdentifiedOrSkipped(false)}
                className="text-[10px] text-emerald-800 hover:underline font-bold cursor-pointer"
              >
                Cadastrar para mimos VIP 🎁
              </button>
            </div>
          )}

          {/* STAGE 1: ONBOARDING IDENTIFICATION SCREEN (FIRST MOMENT) */}
          {!isIdentifiedOrSkipped ? (
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-stone-50 flex flex-col justify-center animate-fadeIn">
              <div className="bg-white p-5 sm:p-6 rounded-3xl border-2 border-emerald-600/40 shadow-lg space-y-4">
                
                {/* Title & Badge */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-[#114b30] font-serif font-bold text-base sm:text-lg">
                    <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
                    <span>Cadastro Rápido & Mimos de Aniversário</span>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Informe seus dados para identificarmos seu pedido e enviarmos um cartão/desconto exclusivo no seu aniversário! Se preferir, você também pode continuar de forma anônima.
                  </p>
                </div>

                {/* Form Fields */}
                <form onSubmit={handleSaveLead} className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Seu Nome Completo
                    </label>
                    <input
                      type="text"
                      value={leadName}
                      onChange={(e) => setLeadName(e.target.value)}
                      placeholder="Ex: Mariana Souza"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                        WhatsApp / Celular
                      </label>
                      <input
                        type="text"
                        value={leadPhone}
                        onChange={(e) => setLeadPhone(e.target.value)}
                        placeholder="(38) 9..."
                        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                        Data de Nascimento
                      </label>
                      <input
                        type="text"
                        value={leadBirthDate}
                        onChange={(e) => setLeadBirthDate(e.target.value)}
                        placeholder="DD/MM/AAAA"
                        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition-all"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 space-y-2.5">
                    <button
                      type="submit"
                      className="w-full py-3 bg-[#114b30] hover:bg-[#0c3924] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Salvar & Continuar Atendimento</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleContinueAnonymous}
                      className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs rounded-xl border border-stone-300 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <UserX className="w-4 h-4 text-stone-500" />
                      <span>Continuar como Anônimo</span>
                    </button>
                  </div>
                </form>

              </div>
            </div>
          ) : (
            /* STAGE 2: CHAT CONVERSATION AREA */
            <>
              {/* Chat Messages Body */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-stone-50/70 text-xs sm:text-sm">
                
                {/* Fast Order Form Modal Inside Drawer */}
                {isOrderingMode && (
                  <div className="bg-white p-4 rounded-2xl border-2 border-amber-500 shadow-lg space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between pb-1 border-b border-stone-200">
                      <div className="flex items-center gap-1.5 font-serif font-bold text-stone-900 text-sm">
                        <ShoppingBag className="w-4 h-4 text-emerald-800" />
                        <span>Montar Encomenda Rápida</span>
                      </div>
                      <button onClick={() => setIsOrderingMode(false)} className="text-stone-400 hover:text-stone-700 cursor-pointer">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {!businessHours.isOpenNow && (
                      <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-[11px] text-amber-950 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                        <span>
                          <strong>Horário comercial encerrado.</strong> Aceitamos seu pedido normalmente! Nossa equipe o processará no próximo dia útil ({businessHours.nextOpenText}).
                        </span>
                      </div>
                    )}

                    <form onSubmit={handleCreateFastOrder} className="space-y-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-stone-700 uppercase mb-0.5">
                          Escolha o Arranjo / Presente:
                        </label>
                        <select
                          value={orderProduct?.id}
                          onChange={(e) => {
                            const prod = products.find(p => p.id === e.target.value);
                            if (prod) setOrderProduct(prod);
                          }}
                          className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:outline-none"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} {p.price ? `— R$ ${p.price.toFixed(2)}` : "(Sob Consulta)"}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <label className="block text-[11px] font-bold text-stone-700 uppercase mb-0.5">
                            Endereço de Entrega *
                          </label>
                          <input
                            type="text"
                            value={orderRecipientAddress}
                            onChange={(e) => setOrderRecipientAddress(e.target.value)}
                            placeholder="Rua, número, bairro..."
                            required
                            className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-stone-700 uppercase mb-0.5">
                            Cidade de Entrega
                          </label>
                          <select
                            value={orderCity}
                            onChange={(e) => setOrderCity(e.target.value)}
                            className="w-full px-2 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold"
                          >
                            <option value="Pirapora">Pirapora (Frete: R$ 10,00)</option>
                            <option value="Buritizeiro">Buritizeiro (Frete: R$ 15,00)</option>
                          </select>
                        </div>
                      </div>

                      {/* Delivery and Total preview box */}
                      <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-2.5 text-xs text-stone-700 space-y-1">
                        <div className="flex justify-between items-center text-[11px]">
                          <span>Valor do Produto:</span>
                          <span className="font-semibold">{orderProduct?.price ? `R$ ${orderProduct.price.toFixed(2)}` : "Sob Consulta"}</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span>Taxa de Entrega ({orderCity}):</span>
                          <span className="font-semibold text-emerald-800">{orderCity === "Buritizeiro" ? "R$ 15,00" : "R$ 10,00"}</span>
                        </div>
                        <div className="pt-1 border-t border-amber-200/80 flex justify-between items-center font-bold text-emerald-950">
                          <span>Total Estimado:</span>
                          <span className="text-sm font-serif text-emerald-900">
                            {orderProduct?.price ? `R$ ${(orderProduct.price + (orderCity === "Buritizeiro" ? 15 : 10)).toFixed(2)}` : "Sob Consulta + Frete"}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-stone-700 uppercase mb-0.5">
                          Mensagem do Cartão Gratuito:
                        </label>
                        <textarea
                          rows={2}
                          value={orderCardMessage}
                          onChange={(e) => setOrderCardMessage(e.target.value)}
                          placeholder="Escreva a dedicatória especial..."
                          className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-stone-700 uppercase mb-0.5">
                          Forma de Pagamento:
                        </label>
                        <div className="flex gap-2">
                          {(["pix", "cartao", "dinheiro"] as const).map((method) => (
                            <button
                              key={method}
                              type="button"
                              onClick={() => setOrderPayment(method)}
                              className={`flex-1 py-1.5 text-xs font-bold rounded-lg border uppercase transition-colors cursor-pointer ${
                                orderPayment === method ? "bg-emerald-800 text-white border-emerald-900" : "bg-stone-50 text-stone-700 border-stone-200"
                              }`}
                            >
                              {method === "pix" ? "PIX" : method === "cartao" ? "Cartão" : "Dinheiro"}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-[#25D366] hover:bg-[#1ebd59] text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 mt-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Confirmar & Gerar Pedido no Kanban</span>
                      </button>
                    </form>
                  </div>
                )}

                {/* Conversation Flow */}
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl px-4 py-3 shadow-2xs ${
                        msg.sender === "user"
                          ? "bg-[#114b30] text-white rounded-br-none"
                          : "bg-white text-stone-800 border border-stone-200/80 rounded-bl-none"
                      }`}
                    >
                      <p className="leading-relaxed whitespace-pre-line text-xs sm:text-sm">{msg.text}</p>

                      {/* Order Card Result */}
                      {msg.orderCard && (
                        <div className="mt-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 space-y-1">
                          <div className="flex items-center justify-between font-bold">
                            <span className="text-emerald-800">Pedido: {msg.orderCard.orderNumber}</span>
                            <span>{msg.orderCard.totalPrice > 0 ? `R$ ${msg.orderCard.totalPrice.toFixed(2)}` : "Sob Consulta"}</span>
                          </div>
                          <p className="font-semibold">{msg.orderCard.productName}</p>
                          <p className="text-[11px] text-stone-500">
                            📍 {msg.orderCard.deliveryAddress} - {msg.orderCard.deliveryCity}
                          </p>

                          {msg.orderCard.isOffHours && (
                            <p className="text-[10px] text-amber-800 font-bold bg-amber-100/80 p-1.5 rounded mt-1 border border-amber-200">
                              🌙 Fora do horário: Processamento no próximo dia útil ({msg.orderCard.nextOpenText})!
                            </p>
                          )}

                          <div className="pt-1 flex items-center gap-1 text-[10px] text-emerald-700 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Lançado na esteira do florista!</span>
                          </div>
                        </div>
                      )}

                      {msg.link && (
                        <a
                          href={msg.link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2.5 inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-transform hover:scale-102 cursor-pointer"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>{msg.link.label}</span>
                        </a>
                      )}
                    </div>
                    <span className="text-[10px] text-stone-400 mt-1 px-1">{msg.timestamp}</span>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-full px-3 py-2 w-16 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-800 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-800 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-800 animate-bounce [animation-delay:0.4s]" />
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Action Suggestions */}
              <div className="p-3 bg-stone-100 border-t border-stone-200/80 shrink-0">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1.5">
                  Sugestões Rápidas:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {quickQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        if (q.action) {
                          q.action();
                        } else if (q.query) {
                          handleSendMessage(q.query);
                        }
                      }}
                      className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all text-left cursor-pointer ${
                        q.action
                          ? "bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300 font-bold"
                          : "bg-white hover:bg-emerald-50 text-stone-700 hover:text-emerald-900 border-stone-200 hover:border-emerald-300"
                      }`}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input text bar */}
              <div className="p-3 bg-white border-t border-stone-200 shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Digite sua dúvida ou mensagem..."
                    className="flex-1 px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
                  />
                  <button
                    type="submit"
                    disabled={!inputMessage.trim()}
                    className="p-2.5 bg-[#114b30] hover:bg-[#0c3924] disabled:opacity-40 text-white rounded-xl transition-all cursor-pointer shadow-xs"
                    title="Enviar mensagem"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};
