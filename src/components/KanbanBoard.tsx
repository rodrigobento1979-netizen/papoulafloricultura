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
  Trash2,
  DollarSign,
  Download,
  CalendarDays
} from "lucide-react";
import { KanbanOrder, KanbanOrderStatus, Product } from "../types";
import { EditOrderModal } from "./EditOrderModal";
import { WhatsAppOrderModal } from "./WhatsAppOrderModal";
import { exportOrdersToCSV, downloadCSV } from "../utils/googleDriveSync";
import { buildWhatsAppUrl, openWhatsApp } from "../utils/whatsapp";

type DateFilterType = "all" | "today" | "yesterday" | "last7days" | "this_month" | "custom";

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
  const [statusFilter, setStatusFilter] = useState<"all" | KanbanOrderStatus>("all");

  // Date filter state
  const [dateFilter, setDateFilter] = useState<DateFilterType>("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

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
      openWhatsApp(cleanPhone, msg);
    }

    setConcludingOrder(null);
  };

  // Date filter evaluation
  const isOrderMatchingDate = (order: KanbanOrder): boolean => {
    if (dateFilter === "all") return true;

    const rawDate = order.createdAt;
    if (!rawDate) return true;

    const orderTime = new Date(rawDate).getTime();
    if (isNaN(orderTime)) return true;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();

    if (dateFilter === "today") {
      return orderTime >= startOfToday && orderTime <= endOfToday;
    }

    if (dateFilter === "yesterday") {
      const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
      const endOfYesterday = endOfToday - 24 * 60 * 60 * 1000;
      return orderTime >= startOfYesterday && orderTime <= endOfYesterday;
    }

    if (dateFilter === "last7days") {
      const start7DaysAgo = startOfToday - 7 * 24 * 60 * 60 * 1000;
      return orderTime >= start7DaysAgo && orderTime <= endOfToday;
    }

    if (dateFilter === "this_month") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
      return orderTime >= startOfMonth && orderTime <= endOfMonth;
    }

    if (dateFilter === "custom") {
      if (customStartDate) {
        const customStart = new Date(`${customStartDate}T00:00:00`).getTime();
        if (orderTime < customStart) return false;
      }
      if (customEndDate) {
        const customEnd = new Date(`${customEndDate}T23:59:59`).getTime();
        if (orderTime > customEnd) return false;
      }
      return true;
    }

    return true;
  };

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    if (cityFilter !== "todas" && o.deliveryCity !== cityFilter) return false;
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (!isOrderMatchingDate(o)) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchNum = o.orderNumber?.toLowerCase().includes(q);
      const matchCust = o.customerName?.toLowerCase().includes(q);
      const matchPhone = o.customerPhone?.includes(q);
      const matchProd = o.productName?.toLowerCase().includes(q);
      const matchCity = o.deliveryCity?.toLowerCase().includes(q);
      const matchAddr = o.deliveryAddress?.toLowerCase().includes(q);
      const matchMsg = o.cardMessage?.toLowerCase().includes(q);
      if (!matchNum && !matchCust && !matchPhone && !matchProd && !matchCity && !matchAddr && !matchMsg) return false;
    }
    return true;
  });

  // Calculate Metrics for Current Filter
  const totalFilteredRevenue = filteredOrders.reduce((acc, order) => acc + (order.totalPrice || 0), 0);
  const pendingOrdersCount = filteredOrders.filter((o) => o.status !== "concluido").length;
  const completedOrdersCount = filteredOrders.filter((o) => o.status === "concluido").length;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
  const todayOrdersCount = orders.filter((o) => {
    if (!o.createdAt) return false;
    const t = new Date(o.createdAt).getTime();
    return !isNaN(t) && t >= startOfToday && t <= endOfToday;
  }).length;

  const handleExportFilteredCSV = () => {
    const csv = exportOrdersToCSV(filteredOrders);
    const date = new Date().toISOString().split("T")[0];
    downloadCSV(`pedidos_papoula_filtrados_${date}.csv`, csv);
  };

  return (
    <div className="flex-1 flex flex-col h-full space-y-4">
      
      {/* KPI METRICS OVERVIEW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              Total de Pedidos
            </span>
            <span className="text-xl sm:text-2xl font-serif font-extrabold text-[#114b30]">
              {filteredOrders.length}
            </span>
            <span className="text-[10px] text-stone-400 block mt-0.5">
              {orders.length} cadastrados no total
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#114b30] flex items-center justify-center font-bold">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              Faturamento no Filtro
            </span>
            <span className="text-xl sm:text-2xl font-serif font-extrabold text-emerald-700">
              R$ {totalFilteredRevenue.toFixed(2)}
            </span>
            <span className="text-[10px] text-stone-400 block mt-0.5">
              Média R$ {(filteredOrders.length > 0 ? totalFilteredRevenue / filteredOrders.length : 0).toFixed(2)}/ped
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              Pedidos Criados Hoje
            </span>
            <span className="text-xl sm:text-2xl font-serif font-extrabold text-amber-600">
              {todayOrdersCount}
            </span>
            <span className="text-[10px] text-stone-400 block mt-0.5">
              {pendingOrdersCount} pendentes de entrega
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              Concluídos & Entregues
            </span>
            <span className="text-xl sm:text-2xl font-serif font-extrabold text-emerald-800">
              {completedOrdersCount}
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
              Taxa de conclusão: {filteredOrders.length > 0 ? Math.round((completedOrdersCount / filteredOrders.length) * 100) : 0}%
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* FILTER CONTROLS & ACTIONS BAR */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-xs space-y-3.5">
        
        {/* Row 1: Title + Action buttons */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#114b30] text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
              <ShoppingBag className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-base sm:text-lg text-stone-900 flex items-center gap-2">
                <span>Painel de Pedidos & Produção</span>
                <span className="text-xs bg-emerald-100 text-emerald-950 font-bold px-2.5 py-0.5 rounded-full">
                  {filteredOrders.length} {filteredOrders.length === 1 ? "pedido" : "pedidos"}
                </span>
              </h2>
              <p className="text-xs text-stone-500">
                Visualize todos os pedidos, filtre por data e acompanhe o status de montagem e entrega.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Create WhatsApp Order button */}
            <button
              onClick={() => setIsWhatsAppModalOpen(true)}
              className="px-3.5 py-2 bg-[#25D366] hover:bg-[#1ebd59] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer hover:scale-102"
              title="Lançar Pedido Recebido pelo WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
              <span>+ Novo Pedido</span>
            </button>

            {/* Export CSV button */}
            <button
              onClick={handleExportFilteredCSV}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-300 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="Baixar lista filtrada em planilha Excel / CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden sm:inline">Exportar CSV</span>
            </button>

            {/* Google Drive button */}
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
                className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 font-semibold transition-all cursor-pointer ${
                  viewMode === "kanban"
                    ? "bg-[#114b30] text-white shadow-xs"
                    : "text-stone-600 hover:text-stone-900"
                }`}
                title="Visualização em Colunas Kanban"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Colunas</span>
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 font-semibold transition-all cursor-pointer ${
                  viewMode === "table"
                    ? "bg-[#114b30] text-white shadow-xs"
                    : "text-stone-600 hover:text-stone-900"
                }`}
                title="Visualização em Lista / Tabela Completa"
              >
                <List className="w-3.5 h-3.5" />
                <span>Lista Detalhada</span>
              </button>
            </div>

            {/* Clear orders button */}
            {onClearOrders && orders.length > 0 && (
              <button
                onClick={onClearOrders}
                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                title="Limpar todos os pedidos"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Limpar</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Date Filters & Search */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          
          {/* Date Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-stone-500 flex items-center gap-1 mr-1">
              <Calendar className="w-3.5 h-3.5 text-[#114b30]" />
              <span>Filtrar por Data:</span>
            </span>

            {[
              { id: "all", label: "Todas as Datas" },
              { id: "today", label: "Hoje" },
              { id: "yesterday", label: "Ontem" },
              { id: "last7days", label: "Últimos 7 dias" },
              { id: "this_month", label: "Este Mês" },
              { id: "custom", label: "Personalizado" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setDateFilter(tab.id as DateFilterType)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  dateFilter === tab.id
                    ? "bg-[#114b30] text-white shadow-2xs"
                    : "bg-stone-100 hover:bg-stone-200 text-stone-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search box & City Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative text-xs flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar cliente, número, arranjo..."
                className="w-full pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-600 text-xs"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* City filter */}
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs">
              {(["todas", "Pirapora", "Buritizeiro"] as const).map((city) => (
                <button
                  key={city}
                  onClick={() => setCityFilter(city)}
                  className={`px-2.5 py-1 rounded-lg font-semibold text-xs transition-colors cursor-pointer ${
                    cityFilter === city
                      ? "bg-white text-emerald-950 font-bold shadow-2xs"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  {city === "todas" ? "Todas Cidades" : city}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Optional Row 3: Custom Date Range Pickers */}
        {dateFilter === "custom" && (
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 flex flex-wrap items-center gap-4 text-xs animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-950">De:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2.5 py-1 bg-white border border-emerald-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-950">Até:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2.5 py-1 bg-white border border-emerald-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
            {(customStartDate || customEndDate) && (
              <button
                onClick={() => {
                  setCustomStartDate("");
                  setCustomEndDate("");
                }}
                className="text-[11px] text-emerald-800 underline font-bold hover:text-emerald-950 cursor-pointer"
              >
                Limpar datas
              </button>
            )}
          </div>
        )}

        {/* Row 4: Status Quick Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1 rounded-lg font-bold text-xs whitespace-nowrap transition-colors cursor-pointer ${
              statusFilter === "all"
                ? "bg-stone-800 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            Todos os Status ({orders.length})
          </button>
          {COLUMNS.map((col) => {
            const count = orders.filter((o) => o.status === col.id).length;
            const isSelected = statusFilter === col.id;
            return (
              <button
                key={col.id}
                onClick={() => setStatusFilter(isSelected ? "all" : col.id)}
                className={`px-3 py-1 rounded-lg font-bold text-xs whitespace-nowrap flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-[#114b30] text-white shadow-2xs"
                    : `${col.badgeBg} ${col.badgeText} hover:opacity-80`
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                <span>{col.title.replace(/^\d+\.\s*/, "")}</span>
                <span className="opacity-80">({count})</span>
              </button>
            );
          })}
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
                                  href={buildWhatsAppUrl(order.customerPhone)}
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
                  <th className="py-3 px-3.5">Data / Hora</th>
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
                    <td colSpan={10} className="py-8 text-center text-stone-400">
                      Nenhum pedido encontrado com os filtros atuais.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const statusObj = COLUMNS.find((c) => c.id === order.status) || COLUMNS[0];
                    const formattedDate = order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—";

                    return (
                      <tr key={order.id} className="hover:bg-stone-50 transition-colors">
                        <td className="py-2.5 px-3.5 font-mono font-bold text-emerald-950">
                          {order.orderNumber}
                        </td>
                        <td className="py-2.5 px-3.5 text-stone-500 font-medium whitespace-nowrap text-[11px]">
                          {formattedDate}
                        </td>
                        <td className="py-2.5 px-3.5 font-semibold text-stone-900">
                          {order.customerName}
                        </td>
                        <td className="py-2.5 px-3.5">
                          {order.customerPhone ? (
                            <a
                              href={buildWhatsAppUrl(order.customerPhone)}
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
