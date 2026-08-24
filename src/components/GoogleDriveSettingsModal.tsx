import React, { useState, useRef } from "react";
import { 
  Database, 
  FileSpreadsheet, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  RefreshCw, 
  Save, 
  Sparkles, 
  Copy, 
  Check, 
  ShieldCheck, 
  Info,
  Upload,
  AlertCircle,
  FolderOpen,
  Flower2,
  FolderTree,
  Send
} from "lucide-react";
import { GoogleDriveConfig, KanbanOrder, Customer, Product, Category } from "../types";
import { 
  exportOrdersToCSV, 
  exportCustomersToCSV, 
  exportCatalogToCSV,
  exportCategoriesToCSV,
  downloadCSV, 
  downloadOfficialSpreadsheetTemplate,
  fetchStoreDataFromGoogleSheets,
  parseOrdersFromCSV,
  parseCatalogFromCSV,
  parseCategoriesFromCSV,
  mergeOrders,
  syncCatalogToGoogleSheets,
  syncCategoriesToGoogleSheets,
  syncAllToGoogleSheets,
  GOOGLE_APPS_SCRIPT_MASTER_CODE
} from "../utils/googleDriveSync";

interface GoogleDriveSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: KanbanOrder[];
  customers: Customer[];
  products?: Product[];
  categories?: Category[];
  config: GoogleDriveConfig;
  onSaveConfig: (config: GoogleDriveConfig) => void;
  onImportOrders?: (orders: KanbanOrder[]) => void;
  onImportProducts?: (products: Product[]) => void;
  onImportCategories?: (categories: Category[]) => void;
}

export const GoogleDriveSettingsModal: React.FC<GoogleDriveSettingsModalProps> = ({
  isOpen,
  onClose,
  orders,
  customers,
  products = [],
  categories = [],
  config,
  onSaveConfig,
  onImportOrders,
  onImportProducts,
  onImportCategories,
}) => {
  const [webhookUrl, setWebhookUrl] = useState(config.sheetWebhookUrl || "");
  const [spreadsheetId, setSpreadsheetId] = useState(config.spreadsheetId || "");
  const [folderUrl, setFolderUrl] = useState(config.folderUrl || "");
  const [autoSync, setAutoSync] = useState(config.autoSync);
  const [savedNotice, setSavedNotice] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  // Sync states
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncingCatalog, setIsSyncingCatalog] = useState(false);
  const [isSyncingCategories, setIsSyncingCategories] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{
    type: "idle" | "success" | "error";
    message: string;
  }>({ type: "idle", message: "" });

  const orderFileInputRef = useRef<HTMLInputElement>(null);
  const catalogFileInputRef = useRef<HTMLInputElement>(null);
  const categoryFileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      sheetWebhookUrl: webhookUrl.trim(),
      spreadsheetId: spreadsheetId.trim(),
      folderUrl: folderUrl.trim(),
      autoSync,
      lastSyncedAt: new Date().toLocaleDateString("pt-BR") + " às " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleDownloadOrders = () => {
    const csv = exportOrdersToCSV(orders);
    const date = new Date().toISOString().split("T")[0];
    downloadCSV(`papoula_pedidos_kanban_${date}.csv`, csv);
  };

  const handleDownloadCatalog = () => {
    const csv = exportCatalogToCSV(products);
    const date = new Date().toISOString().split("T")[0];
    downloadCSV(`papoula_catalogo_produtos_${date}.csv`, csv);
  };

  const handleDownloadCategories = () => {
    const csv = exportCategoriesToCSV(categories);
    const date = new Date().toISOString().split("T")[0];
    downloadCSV(`papoula_categorias_${date}.csv`, csv);
  };

  const handleDownloadCustomers = () => {
    const csv = exportCustomersToCSV(customers);
    const date = new Date().toISOString().split("T")[0];
    downloadCSV(`papoula_clientes_aniversarios_${date}.csv`, csv);
  };

  // Push Catalog to Google Sheets
  const handlePushCatalogToSheets = async () => {
    if (!webhookUrl.trim()) {
      setSyncStatus({
        type: "error",
        message: "Informe a URL do Webhook do Google Apps Script para salvar o catálogo na planilha.",
      });
      return;
    }

    setIsSyncingCatalog(true);
    setSyncStatus({ type: "idle", message: "" });

    try {
      const res = await syncCatalogToGoogleSheets(webhookUrl.trim(), products);
      setSyncStatus({
        type: res.success ? "success" : "error",
        message: res.message,
      });
    } catch (err: any) {
      setSyncStatus({
        type: "error",
        message: err.message || "Erro ao salvar catálogo na planilha.",
      });
    } finally {
      setIsSyncingCatalog(false);
    }
  };

  // Push Categories to Google Sheets
  const handlePushCategoriesToSheets = async () => {
    if (!webhookUrl.trim()) {
      setSyncStatus({
        type: "error",
        message: "Informe a URL do Webhook do Google Apps Script para salvar as categorias na planilha.",
      });
      return;
    }

    setIsSyncingCategories(true);
    setSyncStatus({ type: "idle", message: "" });

    try {
      const res = await syncCategoriesToGoogleSheets(webhookUrl.trim(), categories);
      setSyncStatus({
        type: res.success ? "success" : "error",
        message: res.message,
      });
    } catch (err: any) {
      setSyncStatus({
        type: "error",
        message: err.message || "Erro ao salvar categorias na planilha.",
      });
    } finally {
      setIsSyncingCategories(false);
    }
  };

  // Push Everything to Google Sheets
  const handleSyncAllToSheets = async () => {
    if (!webhookUrl.trim()) {
      setSyncStatus({
        type: "error",
        message: "Informe a URL do Webhook do Google Apps Script para sincronizar todos os dados.",
      });
      return;
    }

    setIsSyncingAll(true);
    setSyncStatus({ type: "idle", message: "" });

    try {
      const res = await syncAllToGoogleSheets(webhookUrl.trim(), {
        orders,
        products,
        categories,
        customers,
      });
      setSyncStatus({
        type: res.success ? "success" : "error",
        message: res.message,
      });
    } catch (err: any) {
      setSyncStatus({
        type: "error",
        message: err.message || "Erro ao sincronizar todos os dados na planilha.",
      });
    } finally {
      setIsSyncingAll(false);
    }
  };

  // Pull All Store Data (Orders, Catalog, Categories) from Google Sheets
  const handleFetchFromSheets = async () => {
    if (!webhookUrl.trim() && !spreadsheetId.trim() && !folderUrl.trim()) {
      setSyncStatus({
        type: "error",
        message: "Por favor, informe a URL do Webhook do Google Apps Script ou o Link da Planilha abaixo.",
      });
      return;
    }

    setIsSyncing(true);
    setSyncStatus({ type: "idle", message: "" });

    try {
      const result = await fetchStoreDataFromGoogleSheets(webhookUrl.trim(), spreadsheetId.trim(), folderUrl.trim());
      
      let msgParts: string[] = [];

      if (result.orders && result.orders.length > 0 && onImportOrders) {
        const { merged, addedCount, updatedCount } = mergeOrders(orders, result.orders);
        onImportOrders(merged);
        msgParts.push(`${result.orders.length} pedidos (${addedCount} novos, ${updatedCount} atualizados)`);
      }

      if (result.products && result.products.length > 0 && onImportProducts) {
        onImportProducts(result.products);
        msgParts.push(`${result.products.length} produtos no catálogo`);
      }

      if (result.categories && result.categories.length > 0 && onImportCategories) {
        onImportCategories(result.categories);
        msgParts.push(`${result.categories.length} categorias`);
      }

      if (msgParts.length > 0) {
        setSyncStatus({
          type: "success",
          message: `Sincronização concluída com sucesso! Carregados: ${msgParts.join(", ")}.`,
        });
      } else if (result.success) {
        setSyncStatus({
          type: "success",
          message: "Conexão estabelecida com a planilha, pronta para enviar e receber dados!",
        });
      } else {
        setSyncStatus({
          type: "error",
          message: result.message || "Erro ao consultar a planilha. Verifique as permissões de acesso do Webhook.",
        });
      }
    } catch (err: any) {
      setSyncStatus({
        type: "error",
        message: err.message || "Falha na conexão com a planilha.",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Import Orders CSV File Directly
  const handleOrdersFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = parseOrdersFromCSV(text);
        if (parsed.length > 0 && onImportOrders) {
          const { merged, addedCount, updatedCount } = mergeOrders(orders, parsed);
          onImportOrders(merged);
          setSyncStatus({
            type: "success",
            message: `Arquivo importado com sucesso! ${parsed.length} pedidos processados (${addedCount} novos, ${updatedCount} atualizados).`,
          });
        } else {
          setSyncStatus({
            type: "error",
            message: "Nenhum pedido reconhecido no arquivo CSV fornecido.",
          });
        }
      } catch (err: any) {
        setSyncStatus({
          type: "error",
          message: "Erro ao ler arquivo CSV: " + err.message,
        });
      }
    };
    reader.readAsText(file, "UTF-8");
    if (orderFileInputRef.current) orderFileInputRef.current.value = "";
  };

  // Import Catalog CSV File Directly
  const handleCatalogFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = parseCatalogFromCSV(text);
        if (parsed.length > 0 && onImportProducts) {
          onImportProducts(parsed);
          setSyncStatus({
            type: "success",
            message: `Catálogo importado com sucesso! ${parsed.length} produtos cadastrados no sistema.`,
          });
        } else {
          setSyncStatus({
            type: "error",
            message: "Nenhum produto reconhecido no arquivo CSV de catálogo.",
          });
        }
      } catch (err: any) {
        setSyncStatus({
          type: "error",
          message: "Erro ao ler arquivo de catálogo: " + err.message,
        });
      }
    };
    reader.readAsText(file, "UTF-8");
    if (catalogFileInputRef.current) catalogFileInputRef.current.value = "";
  };

  // Import Categories CSV File Directly
  const handleCategoriesFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = parseCategoriesFromCSV(text);
        if (parsed.length > 0 && onImportCategories) {
          onImportCategories(parsed);
          setSyncStatus({
            type: "success",
            message: `Categorias importadas com sucesso! ${parsed.length} categorias cadastradas.`,
          });
        } else {
          setSyncStatus({
            type: "error",
            message: "Nenhuma categoria reconhecida no arquivo CSV.",
          });
        }
      } catch (err: any) {
        setSyncStatus({
          type: "error",
          message: "Erro ao ler arquivo de categorias: " + err.message,
        });
      }
    };
    reader.readAsText(file, "UTF-8");
    if (categoryFileInputRef.current) categoryFileInputRef.current.value = "";
  };

  const copyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_MASTER_CODE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl p-6 max-w-3xl w-full shadow-2xl border border-stone-200 space-y-5 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#114b30] flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-2">
                <span>Banco de Dados & Google Drive (Multi-Abas)</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                  Pedidos • Catálogo • Categorias
                </span>
              </h3>
              <p className="text-xs text-stone-500">
                Sincronize pedidos, catálogo de arranjos e categorias em abas automáticas na sua Planilha Google.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Sync Feedback Status Banner */}
        {syncStatus.message && (
          <div
            className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 animate-fadeIn ${
              syncStatus.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                : "bg-rose-50 border-rose-200 text-rose-900"
            }`}
          >
            {syncStatus.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 font-medium">{syncStatus.message}</div>
          </div>
        )}

        {/* Master Action: Sincronizar Tudo */}
        <div className="p-4 bg-gradient-to-r from-emerald-900 to-[#114b30] text-white rounded-2xl shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-300" />
              <div>
                <span className="font-bold text-sm block">Sincronização Completa da Floricultura na Planilha</span>
                <span className="text-xs text-emerald-200 block">
                  Salva e atualiza as 3 abas ("Pedidos", "Catalogo" e "Categorias") em um único clique.
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleSyncAllToSheets}
              disabled={isSyncingAll}
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-emerald-950 rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 transition-transform hover:scale-102"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncingAll ? "animate-spin" : ""}`} />
              <span>{isSyncingAll ? "Sincronizando Tudo..." : "💾 Salvar Tudo na Planilha (Pedidos, Catálogo e Categorias)"}</span>
            </button>

            <button
              type="button"
              onClick={handleFetchFromSheets}
              disabled={isSyncing}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 text-amber-300 ${isSyncing ? "animate-spin" : ""}`} />
              <span>{isSyncing ? "Puxando Dados..." : "📥 Puxar Dados da Planilha (Web)"}</span>
            </button>
          </div>
        </div>

        {/* Section: Sincronização e Exportação Específica por Módulo */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
            Ações por Módulo (Catálogo, Categorias e Pedidos)
          </label>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Card 1: Catálogo de Produtos */}
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col justify-between space-y-3">
              <div className="flex items-center gap-2 text-stone-900 font-bold text-xs">
                <Flower2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="truncate">Catálogo ({products.length} itens)</span>
              </div>
              <p className="text-[11px] text-stone-500">
                Preços, fotos, descrições e itens inclusos na aba 'Catalogo'.
              </p>
              <div className="space-y-1.5 pt-1">
                <button
                  type="button"
                  onClick={handlePushCatalogToSheets}
                  disabled={isSyncingCatalog}
                  className="w-full py-2 px-2.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-950 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5 text-emerald-800" />
                  <span>{isSyncingCatalog ? "Salvando..." : "Salvar na Planilha"}</span>
                </button>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={handleDownloadCatalog}
                    className="flex-1 py-1.5 px-2 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                    title="Baixar Catálogo em CSV"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar CSV</span>
                  </button>
                  <div>
                    <input
                      ref={catalogFileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleCatalogFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => catalogFileInputRef.current?.click()}
                      className="p-1.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-lg text-[11px] font-bold flex items-center justify-center cursor-pointer"
                      title="Importar CSV do Catálogo"
                    >
                      <Upload className="w-3.5 h-3.5 text-emerald-700" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Categorias */}
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col justify-between space-y-3">
              <div className="flex items-center gap-2 text-stone-900 font-bold text-xs">
                <FolderTree className="w-4 h-4 text-amber-700 shrink-0" />
                <span className="truncate">Categorias ({categories.length})</span>
              </div>
              <p className="text-[11px] text-stone-500">
                Nomes, emojis e descrições na aba 'Categorias'.
              </p>
              <div className="space-y-1.5 pt-1">
                <button
                  type="button"
                  onClick={handlePushCategoriesToSheets}
                  disabled={isSyncingCategories}
                  className="w-full py-2 px-2.5 bg-amber-100 hover:bg-amber-200 text-amber-950 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5 text-amber-800" />
                  <span>{isSyncingCategories ? "Salvando..." : "Salvar na Planilha"}</span>
                </button>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={handleDownloadCategories}
                    className="flex-1 py-1.5 px-2 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                    title="Baixar Categorias em CSV"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar CSV</span>
                  </button>
                  <div>
                    <input
                      ref={categoryFileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleCategoriesFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => categoryFileInputRef.current?.click()}
                      className="p-1.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-lg text-[11px] font-bold flex items-center justify-center cursor-pointer"
                      title="Importar CSV de Categorias"
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-700" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Pedidos */}
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col justify-between space-y-3">
              <div className="flex items-center gap-2 text-stone-900 font-bold text-xs">
                <FileSpreadsheet className="w-4 h-4 text-emerald-800 shrink-0" />
                <span className="truncate">Pedidos ({orders.length})</span>
              </div>
              <p className="text-[11px] text-stone-500">
                Histórico com fretes, produtos e clientes na aba 'Pedidos'.
              </p>
              <div className="space-y-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => downloadOfficialSpreadsheetTemplate()}
                  className="w-full py-2 px-2.5 bg-[#114b30] hover:bg-[#0c3924] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-amber-300" />
                  <span>Modelo Multi-Aba (.CSV)</span>
                </button>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={handleDownloadOrders}
                    className="flex-1 py-1.5 px-2 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                    title="Baixar Pedidos em CSV"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar CSV</span>
                  </button>
                  <div>
                    <input
                      ref={orderFileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleOrdersFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => orderFileInputRef.current?.click()}
                      className="p-1.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-lg text-[11px] font-bold flex items-center justify-center cursor-pointer"
                      title="Importar CSV de Pedidos"
                    >
                      <Upload className="w-3.5 h-3.5 text-emerald-700" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Configuration Form */}
        <form onSubmit={handleSave} className="space-y-4 pt-2 border-t border-stone-200">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Link da Pasta no Google Drive:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={folderUrl}
                  onChange={(e) => setFolderUrl(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="flex-1 px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                />
                {folderUrl && (
                  <a
                    href={folderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-stone-100 hover:bg-stone-200 rounded-xl text-stone-700 text-xs flex items-center gap-1 shrink-0 font-medium"
                    title="Abrir no Google Drive"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Abrir Drive</span>
                  </a>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                URL do Webhook do Google Apps Script (Multi-Abas Automático):
              </label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600/30 font-mono"
              />
              <span className="text-[11px] text-stone-500 block mt-1">
                Cole a URL do Web App gerada no Google Apps Script para sincronizar automaticamente as abas <strong>Pedidos</strong>, <strong>Catalogo</strong> e <strong>Categorias</strong>.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Link Direto da Planilha Google Sheets (Opcional / Fallback):
              </label>
              <input
                type="url"
                value={spreadsheetId}
                onChange={(e) => setSpreadsheetId(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600/30 font-mono"
              />
            </div>

            {/* Sincronização Automática ao Entrar */}
            <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200 space-y-2">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-emerald-950">
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={(e) => setAutoSync(e.target.checked)}
                  className="w-4 h-4 text-emerald-800 rounded border-stone-300 focus:ring-emerald-500 cursor-pointer"
                />
                <span>Sincronização Automática ao Entrar no Sistema e em Segundo Plano</span>
              </label>
              <p className="text-[11px] text-emerald-900 leading-relaxed pl-6">
                Quando ativado, o sistema <strong>puxa e atualiza os pedidos e catálogo da planilha automaticamente sempre que você abrir a página</strong>, sem precisar ficar clicando.
              </p>
            </div>

            {/* Script Helper Accordion */}
            <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-emerald-800" />
                  <span>Código Oficial Multi-Abas para o Google Apps Script:</span>
                </span>
                <button
                  type="button"
                  onClick={copyScript}
                  className="text-xs text-emerald-800 hover:text-emerald-950 font-bold flex items-center gap-1 cursor-pointer bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200"
                >
                  {copiedScript ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Código Completo</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-amber-50/80 p-2.5 rounded-xl border border-amber-200 text-[11px] text-amber-950 space-y-1">
                <p className="font-bold">⚠️ Como atualizar o script na sua planilha Google:</p>
                <ol className="list-decimal pl-4 space-y-0.5 text-amber-900">
                  <li>No Google Sheets, clique em <strong>Extensões &gt; Apps Script</strong>.</li>
                  <li>Substitua o código atual pelo código abaixo e clique em <strong>Salvar (Ctrl+S)</strong>.</li>
                  <li>Clique em <strong>Implantar &gt; Nova implantação</strong> (App da Web, Acesso: <strong>Qualquer pessoa / Anyone</strong>).</li>
                  <li>Copie a URL gerada e cole no campo acima!</li>
                </ol>
              </div>

              <pre className="text-[10px] bg-stone-900 text-stone-200 p-2.5 rounded-xl font-mono overflow-x-auto max-h-40">
                {GOOGLE_APPS_SCRIPT_MASTER_CODE}
              </pre>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-stone-200">
            <span className="text-xs text-stone-500">
              {config.lastSyncedAt ? `Última sincronização: ${config.lastSyncedAt}` : "Sincronização ativa"}
            </span>

            <div className="flex items-center gap-2">
              {savedNotice && (
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Configurações salvas!
                </span>
              )}
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#114b30] hover:bg-[#0c3924] text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Configuração</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
