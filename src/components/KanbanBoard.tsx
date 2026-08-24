import React, { useState } from "react";
import { 
  Kanban, 
  User, 
  Phone, 
  MapPin, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Camera, 
  MessageCircle, 
  Plus, 
  Search, 
  Filter, 
  Sparkles,
  ShoppingBag,
  GripVertical,
  X,
  List,
  LayoutGrid,
  Edit,
  Cake,
  Calendar,
  ChevronRight,
  Database,
  Trash2
} from "lucide-react";
import { KanbanOrder, KanbanOrderStatus, Product } from "../types";
import { EditOrderModal } from "./EditOrderModal";
import { WhatsAppOrderModal } from "./WhatsAppOrderModal";

interface KanbanBoardProps {
  orders: KanbanOrder[];
  products: Product[];
  onUpdateOrderStatus: (orderId: string, status: KanbanOrderStatus, photoUrl?: string) => void;
  onUpdateOrder: (updatedOrder: KanbanOrder) => void;
  onAddOrder: (order: KanbanOrder) => void;
  onDeleteOrder?: (orderId: string) => void;
  onClearOrders?: () => void;
  onOpenDatabaseSettings?: () => void;
}

const COLUMNS: { id: KanbanOrderStatus; title: string; color: string; badgeBg: string; badgeText: string; dot: string }[] = [
  { 
    id: "pedido", 
    title: "1. Novos Pedidos", 
    color: "border-blue-200/80 bg-blue-50/30", 
    badgeBg: "bg-blue-100", 
    badgeText: "text-blue-800",
    dot: "bg-blue-500"
  },
  { 
    id: "confirmado", 
    title: "2. Confirmados / Pagos", 
    color: "border-amber-200/80 bg-amber-50/30", 
    badgeBg: "bg-amber-100", 
    badgeText: "text-amber-900",
    dot: "bg-amber-500"
  },
  { 
    id: "em_andamento", 
    title: "3. Na Bancada (Montagem)", 
    color: "border-purple-200/80 bg-purple-50/30", 
    badgeBg: "bg-purple-100", 
    badgeText: "text-purple-900",
    dot: "bg-purple-500 animate-pulse"
  },
  { 
    id: "concluido", 
    title: "4. Concluídos / Entregues", 
    color: "border-emerald-200/80 bg-emerald-50/30", 
    badgeBg: "bg-emerald-100", 
    badgeText: "text-emerald-900",
    dot: "bg-emerald-500"
  },
];

const PRESET_PHOTOS = [
  { name: "Buquê 12 Rosas Vermelhas", url: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=800&q=80" },
  { name: "Girassóis & Flores do Campo", url: "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?auto=format&fit=crop&w=800&q=80" },
  { name: "Orquídea Phalaenopsis Branca", url: "https://images.unsplash.com/photo-1566140967404-b8b393279a2a?auto=format&fit=crop&w=800&q=80" },
  { name: "Cesta Café da Manhã", url: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80" },
  { name: "Box Luxo Rosas", url: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=800&q=80" },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  orders,
  products,
  onUpdateOrderStatus,
  onUpdateOrder,
  onAddOrder,
  onDeleteOrder,
  onClearOrders,
  onOpenDatabaseSettings,
}) => {
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<KanbanOrderStatus | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState<"todas" | "Pirapora" | "Buritizeiro">("todas");

  // Modals state
  const [editingOrder, setEditingOrder] = useState<KanbanOrder | null>(null);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

  // Conclusion Photo Modal State
  const [concludingOrder, setConcludingOrder] = useState<KanbanOrder | null>(null);
  const [photoProofUrl, setPhotoProofUrl] = useState(PRESET_PHOTOS[0].url);
  const [customPhotoUrl, setCustomPhotoUrl] = useState("");

  // Handle Drag & Drop
  const handleDragStart = (e: React.DragEvent, orderId: string) => {
    setDraggedOrderId(orderId);
    e.dataTransfer.setData("text/plain", orderId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, status: KanbanOrderStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverColumn !== status) {
      setDragOverColumn(status);
    }
  };

  const handleDrop = (e: React.DragEvent, targetStatus: KanbanOrderStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const orderId = e.dataTransfer.getData("text/plain") || draggedOrderId;
    if (!orderId) return;

    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    if (targetStatus === "concluido" && order.status !== "concluido") {
      setConcludingOrder(order);
      setPhotoProofUrl(PRESET_PHOTOS[0].url);
      setCustomPhotoUrl("");
    } else {
      onUpdateOrderStatus(orderId, targetStatus);
    }
    setDraggedOrderId(null);
  };

  const handleDragEnd = () => {
    setDraggedOrderId(null);
    setDragOverColumn(null);
  };

  // One-click advancement
  const handleAdvanceStatus = (order: KanbanOrder) => {
    if (order.status === "pedido") {
      onUpdateOrderStatus(order.id, "confirmado");
    } else if (order.status === "confirmado") {
      onUpdateOrderStatus(order.id, "em_andamento");
    } else if (order.status === "em_andamento") {
      setConcludingOrder(order);
      setPhotoProofUrl(PRESET_PHOTOS[0].url);
      setCustomPhotoUrl("");
    }
  };

  // Finalize order with photo and send WhatsApp
  const handleCompleteOrder = () => {
    if (!concludingOrder) return;
    const finalPhoto = customPhotoUrl.trim() || photoProofUrl;
    onUpdateOrderStatus(concludingOrder.id, "concluido", finalPhoto);

    const cleanPhone = concludingOrder.customerPhone.replace(/\D/g, "");
    const msg = `🌺 *Floricultura Papoula - Seu Pedido está Pronto!* 🌺\n\nOlá, *${concludingOrder.customerName}*!\n\nSeu pedido *${concludingOrder.orderNumber}* (${concludingOrder.productName}) foi montado com todo carinho pela nossa equipe e já está pronto para entrega em ${concludingOrder.deliveryCity}!\n\n📍 *Endereço:* ${concludingOrder.deliveryAddress}\n✨ *Status:* Concluído & Pronto para Entrega!\n\n📸 *Comprovação da montagem:* Flores frescas e higienizadas.\n\nMuito obrigado pela preferência!\n*Floricultura Papoula* • Rua Mato Grosso, 211B - Centro, Pirapora/MG`;
    
    if (cleanPhone) {
      const waUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(msg)}`;
      window.open(waUrl, "_blank");
    }

    setConcludingOrder(null);
  };

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    if (cityFilter !== "todas" && o.deliveryCity !== cityFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchNum = o.orderNumber?.toLowerCase().includes(q);
      const matchCust = o.customerName?.toLowerCase().includes(q);
      const matchPhone = o.customerPhone?.includes(q);
      const matchProd = o.productName?.toLowerCase().includes(q);
      const matchCity = o.deliveryCity?.toLowerCase().includes(q);
      if (!matchNum && !matchCust && !matchPhone && !matchProd && !matchCity) return false;
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full space-y-3.5">
      
      {/* Top Filter & Actions Bar */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-stone-200/90 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#114b30] flex items-center justify-center font-bold shrink-0">
            <Kanban className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-base sm:text-lg text-stone-900 flex items-center gap-2">
              <span>Gestão de Pedidos & Kanban</span>
              <span className="text-xs bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                {orders.length} pedidos
              </span>
            </h2>
            <p className="text-xs text-stone-500">
              Controle rápido de produção com suporte a pedidos do WhatsApp e banco em nuvem.
            </p>
          </div>
        </div>

        {/* Action Buttons: New WhatsApp Order, Database config, View toggles */}
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* Create WhatsApp Order button */}
          <button
            onClick={() => setIsWhatsAppModalOpen(true)}
            className="px-3.5 py-2 bg-[#25D366] hover:bg-[#1ebd59] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer hover:scale-102"
            title="Lançar Pedido Recebido pelo WhatsApp"
          >
            <MessageCircle className="w-4 h-4" />
            <span>+ Pedido WhatsApp</span>
          </button>

          {/* Google Drive / DB button */}
          {onOpenDatabaseSettings && (
            <button
              onClick={onOpenDatabaseSettings}
              className="px-3 py-2 bg-stone-100 hover:bg-emerald-50 text-stone-700 hover:text-emerald-900 border border-stone-300 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="Configurar Google Drive & Planilhas"
            >
              <Database className="w-3.5 h-3.5 text-emerald-800" />
              <span className="hidden sm:inline">Google Drive</span>
            </button>
          )}

          {/* View mode toggle (Kanban vs Table) */}
          <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs">
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-1.5 rounded-lg flex items-center gap-1 font-semibold transition-all cursor-pointer ${
                viewMode === "kanban"
                  ? "bg-white text-emerald-950 shadow-xs"
                  : "text-stone-500 hover:text-stone-800"
              }`}
              title="Visualização em Colunas Kanban"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Colunas</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg flex items-center gap-1 font-semibold transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-white text-emerald-950 shadow-xs"
                  : "text-stone-500 hover:text-stone-800"
              }`}
              title="Visualização em Lista / Tabela Compacta"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lista</span>
            </button>
          </div>

          {/* Search box */}
          <div className="relative text-xs">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar pedido, cliente..."
              className="pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-600 text-xs w-36 sm:w-44"
            />
          </div>

          {/* City filter */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs">
            {(["todas", "Pirapora", "Buritizeiro"] as const).map((city) => (
              <button
                key={city}
                onClick={() => setCityFilter(city)}
                className={`px-2 py-1 rounded-lg font-semibold text-[11px] transition-colors cursor-pointer ${
                  cityFilter === city
                    ? "bg-[#114b30] text-white shadow-xs"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                {city === "todas" ? "Todas" : city}
              </button>
            ))}
          </div>

          {/* Clear orders button if orders exist */}
          {onClearOrders && orders.length > 0 && (
            <button
              onClick={onClearOrders}
              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
              title="Limpar todos os pedidos do Kanban"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Limpar</span>
            </button>
          )}
        </div>

      </div>

      {/* VIEW MODE 1: COMPACT KANBAN COLUMNS */}
      {viewMode === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5 flex-1 items-start min-h-[500px]">
          {COLUMNS.map((col) => {
            const colOrders = filteredOrders.filter((o) => o.status === col.id);
            const isOver = dragOverColumn === col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={() => setDragOverColumn(null)}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`rounded-2xl p-3 border-2 flex flex-col space-y-2.5 transition-all min-h-[460px] ${
                  col.color
                } ${
                  isOver 
                    ? "ring-4 ring-emerald-500/50 bg-emerald-100/60 scale-[1.01]" 
                    : "bg-white/80"
                }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 border-b border-stone-200/80">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                    <h3 className="font-bold text-xs uppercase tracking-wider text-stone-800">
                      {col.title}
                    </h3>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${col.badgeBg} ${col.badgeText}`}>
                    {colOrders.length}
                  </span>
                </div>

                {/* Cards List in Column */}
                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[70vh] pr-0.5">
                  {colOrders.length === 0 ? (
                    <div className="h-28 border-2 border-dashed border-stone-200 rounded-xl flex flex-col items-center justify-center text-center p-3 text-stone-400 text-xs">
                      <p className="font-medium">Nenhum pedido</p>
                      <p className="text-[10px] mt-0.5">Arraste um cartão para cá</p>
                    </div>
                  ) : (
                    colOrders.map((order) => {
                      const isBeingDragged = draggedOrderId === order.id;

                      return (
                        <div
                          key={order.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, order.id)}
                          onDragEnd={handleDragEnd}
                          className={`bg-white rounded-xl p-3 border border-stone-200/90 shadow-2xs space-y-2 transition-all cursor-grab active:cursor-grabbing hover:border-emerald-500 hover:shadow-xs ${
                            isBeingDragged ? "opacity-40 scale-95 rotate-1" : ""
                          }`}
                        >
                          {/* Top: Order #, Date & Edit button */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <GripVertical className="w-3 h-3 text-stone-400" />
                              <span className="text-[10px] font-mono font-bold text-emerald-950 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                {order.orderNumber}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-stone-400 font-medium">
                                {order.deliveryDate || "Hoje"}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingOrder(order);
                                }}
                                className="p-1 text-stone-400 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                title="Editar pedido, endereço e cartão"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Product Title */}
                          <div>
                            <h4 className="font-bold text-stone-900 text-xs leading-tight truncate">
                              {order.productName}
                            </h4>
                            <span className="text-[10px] text-emerald-700 font-semibold uppercase tracking-wider block">
                              {order.category}
                            </span>
                          </div>

                          {/* Compact Customer & Address info */}
                          <div className="text-[11px] text-stone-600 bg-stone-50/90 p-2 rounded-lg space-y-1 border border-stone-100">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-stone-900 flex items-center gap-1 truncate">
                                <User className="w-3 h-3 text-stone-400 shrink-0" />
                                {order.customerName}
                              </span>
                              {order.customerPhone && (
                                <a
                                  href={`https://wa.me/55${order.customerPhone.replace(/\D/g, "")}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-emerald-700 hover:text-emerald-900 p-0.5"
                                  title="Falar no WhatsApp"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>

                            <p className="text-[10px] text-stone-500 flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                              <span>{order.deliveryAddress} • <strong className="text-stone-700">{order.deliveryCity}</strong></span>
                            </p>

                            {order.customerBirthDate && (
                              <p className="text-[10px] text-rose-700 font-medium flex items-center gap-1">
                                <Cake className="w-2.5 h-2.5 text-rose-500" />
                                <span>Aniversário: {order.customerBirthDate}</span>
                              </p>
                            )}

                            {order.cardMessage && (
                              <p className="text-[10px] bg-rose-50/80 p-1 rounded text-rose-950 italic border border-rose-100 line-clamp-1">
                                💌 "{order.cardMessage}"
                              </p>
                            )}
                          </div>

                          {/* Price & Forward button */}
                          <div className="pt-1.5 border-t border-stone-100 flex items-center justify-between gap-1.5">
                            <div>
                              <span className="text-xs font-extrabold text-stone-900">
                                R$ {order.totalPrice?.toFixed(2) || "0.00"}
                              </span>
                            </div>

                            {col.id !== "concluido" ? (
                              <button
                                onClick={() => handleAdvanceStatus(order)}
                                className="text-[11px] bg-[#114b30] hover:bg-[#0c3924] text-white font-bold px-2 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-2xs active:scale-95"
                                title="Avançar status"
                              >
                                <span>
                                  {col.id === "pedido" ? "Confirmar" : col.id === "confirmado" ? "Montar" : "Concluir"}
                                </span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            ) : (
                              <div className="flex items-center gap-1">
                                {order.photoProofUrl && (
                                  <a
                                    href={order.photoProofUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded-lg flex items-center gap-0.5 font-bold hover:bg-emerald-100"
                                  >
                                    <Camera className="w-2.5 h-2.5" />
                                    <span>Foto</span>
                                  </a>
                                )}
                                <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5">
                                  <CheckCircle2 className="w-3 h-3" /> Entregue
                                </span>
                              </div>
                            )}
                          </div>

                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VIEW MODE 2: COMPACT LIST / TABLE WITH COLUMNS */
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-100 text-stone-700 font-bold uppercase text-[10px] tracking-wider border-b border-stone-200">
                <tr>
                  <th className="py-3 px-3.5">Nº Pedido</th>
                  <th className="py-3 px-3.5">Cliente</th>
                  <th className="py-3 px-3.5">WhatsApp</th>
                  <th className="py-3 px-3.5">Aniversário</th>
                  <th className="py-3 px-3.5">Produto / Arranjo</th>
                  <th className="py-3 px-3.5">Endereço & Cidade</th>
                  <th className="py-3 px-3.5">Valor (R$)</th>
                  <th className="py-3 px-3.5">Status</th>
                  <th className="py-3 px-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-stone-400">
                      Nenhum pedido encontrado com os filtros atuais.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const statusObj = COLUMNS.find((c) => c.id === order.status) || COLUMNS[0];

                    return (
                      <tr key={order.id} className="hover:bg-stone-50 transition-colors">
                        <td className="py-2.5 px-3.5 font-mono font-bold text-emerald-950">
                          {order.orderNumber}
                        </td>
                        <td className="py-2.5 px-3.5 font-semibold text-stone-900">
                          {order.customerName}
                        </td>
                        <td className="py-2.5 px-3.5">
                          {order.customerPhone ? (
                            <a
                              href={`https://wa.me/55${order.customerPhone.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-700 hover:underline flex items-center gap-1 font-medium"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>{order.customerPhone}</span>
                            </a>
                          ) : (
                            <span className="text-stone-400">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3.5 text-stone-600">
                          {order.customerBirthDate ? (
                            <span className="flex items-center gap-1 text-rose-700 font-medium">
                              <Cake className="w-3 h-3 text-rose-500" />
                              {order.customerBirthDate}
                            </span>
                          ) : (
                            <span className="text-stone-400">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3.5 font-medium text-stone-800">
                          <span className="block truncate max-w-xs">{order.productName}</span>
                          {order.cardMessage && (
                            <span className="text-[10px] text-stone-400 italic block truncate max-w-xs">
                              "{order.cardMessage}"
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3.5 text-stone-600">
                          <span className="block truncate max-w-xs">{order.deliveryAddress}</span>
                          <span className="text-[10px] font-bold text-stone-500">{order.deliveryCity}</span>
                        </td>
                        <td className="py-2.5 px-3.5 font-bold text-stone-900">
                          R$ {order.totalPrice?.toFixed(2) || "0.00"}
                        </td>
                        <td className="py-2.5 px-3.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusObj.badgeBg} ${statusObj.badgeText}`}>
                            {statusObj.title.replace(/^\d+\.\s*/, "")}
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 text-right space-x-1.5">
                          <button
                            onClick={() => setEditingOrder(order)}
                            className="p-1.5 text-stone-500 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Editar pedido"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {order.status !== "concluido" && (
                            <button
                              onClick={() => handleAdvanceStatus(order)}
                              className="px-2 py-1 bg-[#114b30] hover:bg-[#0c3924] text-white font-bold rounded-lg text-[10px] transition-colors cursor-pointer"
                              title="Avançar status"
                            >
                              Avançar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      <EditOrderModal
        order={editingOrder}
        isOpen={!!editingOrder}
        onClose={() => setEditingOrder(null)}
        onSaveOrder={onUpdateOrder}
        products={products}
      />

      {/* WhatsApp Quick Order Modal */}
      <WhatsAppOrderModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        products={products}
        onCreateOrder={onAddOrder}
      />

      {/* Modal for Order Conclusion Photo & WhatsApp Notification */}
      {concludingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-700" />
                <h3 className="font-serif font-bold text-base text-stone-900">
                  Comprovação & Foto do Arranjo Montado
                </h3>
              </div>
              <button
                onClick={() => setConcludingOrder(null)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-600">
              O pedido <strong>#{concludingOrder.orderNumber}</strong> ({concludingOrder.productName}) para <strong>{concludingOrder.customerName}</strong> será marcado como concluído. Selecione ou informe a foto do arranjo finalizado para enviar no WhatsApp do cliente:
            </p>

            {/* Photo Presets Grid */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-stone-700 uppercase">
                Escolha a Foto Comprobatória:
              </label>
              <div className="grid grid-cols-5 gap-2">
                {PRESET_PHOTOS.map((photo, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setPhotoProofUrl(photo.url);
                      setCustomPhotoUrl("");
                    }}
                    className={`aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all relative ${
                      photoProofUrl === photo.url && !customPhotoUrl
                        ? "border-emerald-600 ring-2 ring-emerald-600/30 scale-105"
                        : "border-stone-200 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Photo URL input */}
            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                Ou digite URL de outra foto / upload:
              </label>
              <input
                type="url"
                value={customPhotoUrl}
                onChange={(e) => setCustomPhotoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setConcludingOrder(null)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCompleteOrder}
                className="px-5 py-2.5 bg-[#25D366] hover:bg-[#1ebd59] text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Concluir & Notificar no WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
