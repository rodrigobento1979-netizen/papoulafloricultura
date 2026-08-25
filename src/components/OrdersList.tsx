import React, { useState, useRef } from "react";
import { 
  ShoppingBag, 
  Calendar, 
  Search, 
  X, 
  DollarSign, 
  Download, 
  Database, 
  Edit, 
  Trash2,
  CheckCircle2,
  RefreshCw,
  Upload,
  AlertCircle
} from "lucide-react";
import { KanbanOrder, KanbanOrderStatus, Product, GoogleDriveConfig } from "../types";
import { EditOrderModal } from "./EditOrderModal";
import { 
  exportOrdersToCSV, 
  downloadCSV, 
  fetchStoreDataFromGoogleDrive, 
  parseOrdersFromJSON, 
  downloadOrdersJSON,
  mergeOrders 
} from "../utils/googleDriveSync";
import { buildWhatsAppUrl } from "../utils/whatsapp";

type DateFilterType = "all" | "today" | "yesterday" | "last7days" | "this_month" | "custom";

interface OrdersListProps {
  orders: KanbanOrder[];
  products: Product[];
  googleDriveConfig?: GoogleDriveConfig;
  onUpdateOrderStatus: (orderId: string, status: KanbanOrderStatus, photoUrl?: string) => void;
  onUpdateOrder: (updatedOrder: KanbanOrder) => void;
  onAddOrder: (order: KanbanOrder) => void;
  onBatchImportOrders?: (orders: KanbanOrder[]) => void;
  onDeleteOrder?: (orderId: string) => void;
  onClearOrders?: () => void;
  onOpenDatabaseSettings?: () => void;
}

const STATUS_CONFIG: Record<KanbanOrderStatus, { label: string; badgeBg: string; badgeText: string }> = {
  pedido: {
    label: "Novo Pedido",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-900",
  },
  confirmado: {
    label: "Confirmado / Pago",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-900",
  },
  em_andamento: {
    label: "Na Bancada / Produção",
    badgeBg: "bg-purple-100",
    badgeText: "text-purple-900",
  },
  concluido: {
    label: "Concluído / Entregue",
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-900",
  },
};

// Helper to extract clean order number (e.g. "#PAP-102" -> "102", "#101" -> "101")
const formatCleanOrderNumber = (rawNum: string | undefined): string => {
  if (!rawNum) return "—";
  const trimmed = rawNum.trim();
  const digitsOrClean = trimmed.replace(/^[#A-Za-z\-_]+/, "").trim();
  return digitsOrClean || trimmed.replace(/^#/, "");
};

// Helper to format date only (without time)
const formatDateOnly = (dateStr: string | undefined): string => {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr.split("T")[0] || dateStr;
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  } catch {
    return dateStr;
  }
};

export const OrdersList: React.FC<OrdersListProps> = ({
  orders,
  products,
  googleDriveConfig,
  onUpdateOrderStatus,
  onUpdateOrder,
  onAddOrder,
  onBatchImportOrders,
  onDeleteOrder,
  onClearOrders,
  onOpenDatabaseSettings,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilterType>("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [cityFilter, setCityFilter] = useState<"todas" | "Pirapora" | "Buritizeiro">("todas");

  // Modals state
  const [editingOrder, setEditingOrder] = useState<KanbanOrder | null>(null);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showSyncToast = (type: "success" | "error" | "info", message: string) => {
    setSyncToast({ type, message });
    setTimeout(() => setSyncToast(null), 5000);
  };

  const handleSyncFromSheets = async () => {
    const webhookUrl = googleDriveConfig?.driveWebhookUrl || googleDriveConfig?.sheetWebhookUrl || "";
    const folderUrl = googleDriveConfig?.folderUrl || "";
    const folderId = googleDriveConfig?.folderId || "";

    const target = webhookUrl || folderUrl || folderId;

    if (!target || !target.trim()) {
      showSyncToast("info", "Abra as configurações do Google Drive para informar a URL do Webhook do Google Apps Script.");
      if (onOpenDatabaseSettings) onOpenDatabaseSettings();
      return;
    }

    setIsSyncing(true);
    try {
      const result = await fetchStoreDataFromGoogleDrive(webhookUrl, folderUrl, folderId);
      if (result.success && result.orders.length > 0) {
        if (onBatchImportOrders) {
          const { merged, addedCount, updatedCount } = mergeOrders(orders, result.orders);
          onBatchImportOrders(merged);
          showSyncToast(
            "success",
            `✅ Google Drive sincronizado! ${result.orders.length} pedidos em 'pedidos.json' (${addedCount} novos, ${updatedCount} atualizados).`
          );
        } else {
          showSyncToast("success", `✅ ${result.orders.length} pedidos encontrados no arquivo pedidos.json.`);
        }
      } else if (result.success && result.orders.length === 0) {
        showSyncToast("info", "Google Drive conectado com sucesso, mas o arquivo pedidos.json está vazio.");
      } else {
        showSyncToast(
          "error",
          result.message || "Não foi possível carregar os pedidos. Verifique se o Web App do Google Apps Script está ativo."
        );
      }
    } catch (err: any) {
      showSyncToast("error", err.message || "Erro de conexão ao buscar pedidos no Google Drive.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleJSONUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = parseOrdersFromJSON(text);
        if (parsed.length > 0) {
          if (onBatchImportOrders) {
            const { merged, addedCount, updatedCount } = mergeOrders(orders, parsed);
            onBatchImportOrders(merged);
            showSyncToast(
              "success",
              `✅ Arquivo pedidos.json importado! ${parsed.length} pedidos lidos (${addedCount} novos, ${updatedCount} atualizados).`
            );
          }
        } else {
          showSyncToast("error", "Nenhum pedido válido encontrado no arquivo JSON.");
        }
      } catch (err: any) {
        showSyncToast("error", "Erro ao processar arquivo JSON: " + err.message);
      }
    };
    reader.readAsText(file, "UTF-8");
    if (fileInputRef.current) fileInputRef.current.value = "";
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
    if (!isOrderMatchingDate(o)) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchNum = o.orderNumber?.toLowerCase().includes(q);
      const matchCust = o.customerName?.toLowerCase().includes(q);
      const matchPhone = o.customerPhone?.includes(q);
      const matchProd = o.productName?.toLowerCase().includes(q);
      const matchCity = o.deliveryCity?.toLowerCase().includes(q);
      const matchAddr = o.deliveryAddress?.toLowerCase().includes(q);
      if (!matchNum && !matchCust && !matchPhone && !matchProd && !matchCity && !matchAddr) return false;
    }
    return true;
  });

  // Calculate Detailed Metrics for Current Filter
  const totalFreightSum = filteredOrders.reduce((acc, o) => {
    const freight = o.freightFee !== undefined ? o.freightFee : (o.deliveryCity?.includes("Buritizeiro") ? 15.0 : 10.0);
    return acc + freight;
  }, 0);

  const totalRefSalesSum = filteredOrders.reduce((acc, o) => {
    const freight = o.freightFee !== undefined ? o.freightFee : (o.deliveryCity?.includes("Buritizeiro") ? 15.0 : 10.0);
    const ref = o.referencePrice !== undefined ? o.referencePrice : Math.max(0, (o.totalPrice || 0) - freight);
    return acc + ref;
  }, 0);

  const totalOverallSum = filteredOrders.reduce((acc, o) => {
    const freight = o.freightFee !== undefined ? o.freightFee : (o.deliveryCity?.includes("Buritizeiro") ? 15.0 : 10.0);
    const ref = o.referencePrice !== undefined ? o.referencePrice : Math.max(0, (o.totalPrice || 0) - freight);
    const tot = o.totalPrice !== undefined && o.totalPrice > 0 ? o.totalPrice : (ref + freight);
    return acc + tot;
  }, 0);

  const handleExportCSV = () => {
    downloadOrdersJSON(filteredOrders);
  };

  return (
    <div className="flex-1 flex flex-col h-full space-y-4">
      
      {/* KPI METRICS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              Total de Pedidos
            </span>
            <span className="text-2xl sm:text-3xl font-serif font-extrabold text-[#114b30]">
              {filteredOrders.length}
            </span>
            <span className="text-[11px] text-stone-500 block mt-0.5">
              {orders.length} pedidos na planilha
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-[#114b30] flex items-center justify-center font-bold">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              Custo de Fretes
            </span>
            <span className="text-2xl sm:text-3xl font-serif font-extrabold text-stone-900">
              R$ {totalFreightSum.toFixed(2)}
            </span>
            <span className="text-[11px] text-stone-500 block mt-0.5">
              Taxas de entrega somadas
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-stone-100 text-stone-700 flex items-center justify-center font-bold">
            <span className="text-base font-serif font-extrabold">🚚</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              Vendas (Ref. Itens)
            </span>
            <span className="text-2xl sm:text-3xl font-serif font-extrabold text-emerald-800">
              R$ {totalRefSalesSum.toFixed(2)}
            </span>
            <span className="text-[11px] text-emerald-700 font-medium block mt-0.5">
              Estimativa interna dos arranjos
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-950 uppercase tracking-wider block">
              Total Geral Estimado
            </span>
            <span className="text-2xl sm:text-3xl font-serif font-extrabold text-emerald-950">
              R$ {totalOverallSum.toFixed(2)}
            </span>
            <span className="text-[11px] text-stone-500 block mt-0.5">
              Itens + Frete ({dateFilter === "all" ? "Geral" : dateFilter})
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-100 text-emerald-950 flex items-center justify-center font-bold">
            <span className="text-base font-bold font-serif">✨</span>
          </div>
        </div>
      </div>

      {/* SYNC NOTIFICATION TOAST */}
      {syncToast && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between shadow-sm animate-fadeIn ${
            syncToast.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-950"
              : syncToast.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-900"
              : "bg-blue-50 border-blue-200 text-blue-950"
          }`}
        >
          <div className="flex items-center gap-2">
            {syncToast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            ) : syncToast.type === "error" ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <RefreshCw className="w-4 h-4 text-blue-600 shrink-0" />
            )}
            <span className="font-medium">{syncToast.message}</span>
          </div>
          <button
            onClick={() => setSyncToast(null)}
            className="p-1 hover:bg-black/5 rounded-lg text-stone-500 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* FILTER CONTROLS & COMPACT ACTIONS BAR */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs space-y-3.5">
        
        {/* Row 1: Header + Compact Icon Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#114b30] text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
              <ShoppingBag className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-base sm:text-lg text-stone-900 flex items-center gap-2">
                <span>Listagem Geral de Pedidos</span>
                <span className="text-xs bg-emerald-100 text-emerald-950 font-bold px-2.5 py-0.5 rounded-full">
                  {filteredOrders.length} {filteredOrders.length === 1 ? "pedido" : "pedidos"}
                </span>
              </h2>
              <p className="text-xs text-stone-500">
                Lista compacta de pedidos da planilha com filtros e busca rápida.
              </p>
            </div>
          </div>

          {/* 1º Requirement: Sincronização, Importar, Exportar e Banco de Dados em Apenas Ícones */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Sync from Google Sheets Icon Button */}
            <button
              type="button"
              onClick={handleSyncFromSheets}
              disabled={isSyncing}
              className="p-2.5 bg-[#114b30] hover:bg-[#0c3924] text-white rounded-xl shadow-2xs transition-all cursor-pointer hover:scale-105 disabled:opacity-60 flex items-center justify-center"
              title="Ler pedidos.json do Google Drive"
              aria-label="Ler pedidos do Google Drive"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin text-amber-300" : "text-amber-300"}`} />
            </button>

            {/* Import JSON Icon Button */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleJSONUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 bg-stone-100 hover:bg-emerald-50 text-stone-800 hover:text-emerald-950 border border-stone-300 rounded-xl transition-all cursor-pointer hover:scale-105 flex items-center justify-center"
              title="Importar pedidos.json do Computador/Celular"
              aria-label="Importar pedidos.json"
            >
              <Upload className="w-4 h-4 text-emerald-800" />
            </button>

            {/* Export JSON Icon Button */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-300 rounded-xl transition-all cursor-pointer hover:scale-105 flex items-center justify-center"
              title="Baixar pedidos.json"
              aria-label="Baixar pedidos.json"
            >
              <Download className="w-4 h-4 text-emerald-700" />
            </button>

            {/* Google Drive / Database Icon Button */}
            {onOpenDatabaseSettings && (
              <button
                type="button"
                onClick={onOpenDatabaseSettings}
                className="p-2.5 bg-stone-100 hover:bg-emerald-50 text-stone-700 hover:text-emerald-900 border border-stone-300 rounded-xl transition-all cursor-pointer hover:scale-105 flex items-center justify-center"
                title="Configurar Google Drive & Banco de Dados"
                aria-label="Google Drive & Banco de Dados"
              >
                <Database className="w-4 h-4 text-emerald-800" />
              </button>
            )}

            {/* Clear orders Icon button */}
            {onClearOrders && orders.length > 0 && (
              <button
                type="button"
                onClick={onClearOrders}
                className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl transition-colors cursor-pointer flex items-center justify-center"
                title={`Limpar todos os ${orders.length} pedidos`}
                aria-label="Limpar Pedidos"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
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
              <span>Filtrar:</span>
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

      </div>

      {/* LISTAGEM DE PEDIDOS COMPACTA (SEM COLUNA ANIVERSÁRIO, SEM MENSAGEM DO CARTÃO NA COLUNA PRODUTO, BOTÕES ÍCONE) */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-100 text-stone-700 font-bold uppercase text-[10px] tracking-wider border-b border-stone-200">
              <tr>
                <th className="py-3 px-3.5">Nº</th>
                <th className="py-3 px-3.5">Data</th>
                <th className="py-3 px-3.5">Cliente</th>
                <th className="py-3 px-3.5">WhatsApp</th>
                <th className="py-3 px-3.5">Produto / Arranjo</th>
                <th className="py-3 px-3.5">Endereço & Cidade</th>
                <th className="py-3 px-3.5 text-stone-700">Custo Frete</th>
                <th className="py-3 px-3.5 text-emerald-900">Ref. Arranjo</th>
                <th className="py-3 px-3.5 text-emerald-950 font-extrabold">Total Estimado</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 px-4 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#114b30] flex items-center justify-center mx-auto shadow-xs">
                        <ShoppingBag className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-stone-800">
                          {orders.length === 0
                            ? "Nenhum pedido carregado no sistema ainda."
                            : "Nenhum pedido encontrado para o período selecionado."}
                        </p>
                        <p className="text-xs text-stone-500 mt-1">
                          {orders.length === 0
                            ? "Sincronize com sua planilha do Google Drive ou importe um arquivo CSV para carregar seus pedidos."
                            : "Tente selecionar outro filtro de data como 'Todas as Datas' ou 'Este Mês'."}
                        </p>
                      </div>

                      <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
                        <button
                          type="button"
                          onClick={handleSyncFromSheets}
                          disabled={isSyncing}
                          className="px-3.5 py-2 bg-[#114b30] hover:bg-[#0c3924] text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-60"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-amber-300" : "text-amber-300"}`} />
                          <span>{isSyncing ? "Buscando..." : "Sincronizar com a Planilha"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5 text-emerald-800" />
                          <span>Importar CSV</span>
                        </button>

                        {onOpenDatabaseSettings && (
                          <button
                            type="button"
                            onClick={onOpenDatabaseSettings}
                            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Database className="w-3.5 h-3.5 text-emerald-800" />
                            <span>Configurações</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const statusInfo = STATUS_CONFIG[order.status] || STATUS_CONFIG.pedido;
                  const formattedDateOnly = formatDateOnly(order.createdAt);
                  const cleanNum = formatCleanOrderNumber(order.orderNumber);

                  const orderFreight = order.freightFee !== undefined 
                    ? order.freightFee 
                    : (order.deliveryCity?.includes("Buritizeiro") ? 15.0 : 10.0);

                  const orderRefPrice = order.referencePrice !== undefined 
                    ? order.referencePrice 
                    : Math.max(0, (order.totalPrice || 0) - orderFreight);

                  const orderTotal = order.totalPrice !== undefined && order.totalPrice > 0 
                    ? order.totalPrice 
                    : (orderRefPrice + orderFreight);

                  return (
                    <tr key={order.id} className="hover:bg-stone-50/80 transition-colors">
                      {/* 3º: Número do pedido: apenas o número */}
                      <td className="py-2.5 px-3.5 font-mono font-bold text-emerald-950 whitespace-nowrap">
                        {cleanNum}
                      </td>
                      {/* 3º: Data/hora: apenas a data */}
                      <td className="py-2.5 px-3.5 text-stone-600 font-medium whitespace-nowrap text-[11px]">
                        {formattedDateOnly}
                      </td>
                      <td className="py-2.5 px-3.5 font-semibold text-stone-900">
                        {order.customerName}
                      </td>
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        {order.customerPhone ? (
                          <a
                            href={buildWhatsAppUrl(order.customerPhone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-700 hover:underline flex items-center gap-1 font-medium"
                          >
                            <span className="text-[#25D366] text-xs">💬</span>
                            <span>{order.customerPhone}</span>
                          </a>
                        ) : (
                          <span className="text-stone-400">—</span>
                        )}
                      </td>
                      {/* 3º: Coluna Produto: apenas nome do produto (sem mensagem do cartão) */}
                      <td className="py-2.5 px-3.5 font-medium text-stone-800 max-w-xs">
                        <span className="block truncate font-semibold" title={order.productName}>
                          {order.productName}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-stone-600 max-w-xs">
                        <span className="block truncate">{order.deliveryAddress || "Retirada na Loja"}</span>
                        <span className="text-[10px] font-bold text-[#114b30]">{order.deliveryCity}</span>
                      </td>
                      <td className="py-2.5 px-3.5 font-medium text-stone-600 whitespace-nowrap">
                        R$ {orderFreight.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3.5 font-semibold text-emerald-800 whitespace-nowrap">
                        R$ {orderRefPrice.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3.5 font-bold text-emerald-950 whitespace-nowrap">
                        R$ {orderTotal.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3.5">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${statusInfo.badgeBg} ${statusInfo.badgeText}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      {/* 3º: Ações: Editar usar apenas ícone */}
                      <td className="py-2.5 px-3.5 text-right space-x-1 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setEditingOrder(order)}
                          className="p-1.5 text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center"
                          title="Editar / Ver detalhes do pedido"
                          aria-label="Editar Pedido"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {onDeleteOrder && (
                          <button
                            type="button"
                            onClick={() => onDeleteOrder(order.id)}
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center"
                            title="Remover pedido"
                            aria-label="Remover Pedido"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredOrders.length > 0 && (
              <tfoot className="bg-stone-100/90 font-bold border-t-2 border-stone-300 text-stone-900">
                <tr>
                  <td colSpan={6} className="py-3 px-3.5 text-right text-[11px] uppercase tracking-wider text-stone-600">
                    Totais do Período ({filteredOrders.length} {filteredOrders.length === 1 ? "pedido" : "pedidos"}):
                  </td>
                  <td className="py-3 px-3.5 font-bold text-stone-700 whitespace-nowrap">
                    R$ {totalFreightSum.toFixed(2)}
                  </td>
                  <td className="py-3 px-3.5 font-bold text-emerald-800 whitespace-nowrap">
                    R$ {totalRefSalesSum.toFixed(2)}
                  </td>
                  <td className="py-3 px-3.5 font-extrabold text-emerald-950 whitespace-nowrap text-sm">
                    R$ {totalOverallSum.toFixed(2)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Edit Order Modal */}
      <EditOrderModal
        order={editingOrder}
        isOpen={!!editingOrder}
        onClose={() => setEditingOrder(null)}
        onSaveOrder={onUpdateOrder}
        products={products}
      />

    </div>
  );
};
