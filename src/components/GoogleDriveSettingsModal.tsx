import React, { useState, useRef } from "react";
import { 
  Database, 
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
  Send,
  FileJson,
  Layers,
  ArrowRight,
  HardDrive
} from "lucide-react";
import { GoogleDriveConfig, KanbanOrder, Customer, Product, Category } from "../types";
import { 
  exportOrdersToJSON, 
  exportCatalogToJSON, 
  exportCategoriesToJSON,
  downloadOrdersJSON,
  downloadCatalogJSON,
  downloadCategoriesJSON,
  downloadJSON,
  parseOrdersFromJSON,
  parseCatalogFromJSON,
  parseCategoriesFromJSON,
  fetchStoreDataFromGoogleDrive,
  saveAllToGoogleDrive,
  saveOrdersToGoogleDrive,
  saveCatalogToGoogleDrive,
  saveCategoriesToGoogleDrive,
  mergeOrders,
  GOOGLE_APPS_SCRIPT_DRIVE_JSON_CODE
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
  const [webhookUrl, setWebhookUrl] = useState(config.driveWebhookUrl || config.sheetWebhookUrl || "");
  const [folderUrl, setFolderUrl] = useState(config.folderUrl || "");
  const [folderId, setFolderId] = useState(config.folderId || "");
  const [autoSync, setAutoSync] = useState(config.autoSync);
  const [savedNotice, setSavedNotice] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  // Sync states
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncingOrders, setIsSyncingOrders] = useState(false);
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
      driveWebhookUrl: webhookUrl.trim(),
      sheetWebhookUrl: webhookUrl.trim(),
      folderUrl: folderUrl.trim(),
      folderId: folderId.trim(),
      autoSync,
      lastSyncedAt: new Date().toLocaleDateString("pt-BR") + " às " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  // Push All JSON Files to Google Drive
  const handleSyncAllToDrive = async () => {
    if (!webhookUrl.trim()) {
      setSyncStatus({
        type: "error",
        message: "Informe a URL do Web App do Google Apps Script para sincronizar os arquivos JSON.",
      });
      return;
    }

    setIsSyncingAll(true);
    setSyncStatus({ type: "idle", message: "" });

    try {
      const res = await saveAllToGoogleDrive(webhookUrl.trim(), {
        orders,
        products,
        categories,
        customers,
      });

      setSyncStatus({
        type: res.success ? "success" : "error",
        message: res.message,
      });

      if (res.success) {
        onSaveConfig({
          ...config,
          driveWebhookUrl: webhookUrl.trim(),
          sheetWebhookUrl: webhookUrl.trim(),
          folderUrl: folderUrl.trim(),
          folderId: folderId.trim(),
          autoSync,
          lastSyncedAt: new Date().toLocaleDateString("pt-BR") + " às " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        });
      }
    } catch (err: any) {
      setSyncStatus({
        type: "error",
        message: err.message || "Erro ao salvar arquivos JSON no Google Drive.",
      });
    } finally {
      setIsSyncingAll(false);
    }
  };

  // Push Orders (pedidos.json)
  const handlePushOrdersToDrive = async () => {
    if (!webhookUrl.trim()) {
      setSyncStatus({
        type: "error",
        message: "Informe a URL do Web App do Google Apps Script.",
      });
      return;
    }

    setIsSyncingOrders(true);
    setSyncStatus({ type: "idle", message: "" });

    try {
      const res = await saveOrdersToGoogleDrive(webhookUrl.trim(), orders);
      setSyncStatus({
        type: res.success ? "success" : "error",
        message: res.message,
      });
    } catch (err: any) {
      setSyncStatus({
        type: "error",
        message: err.message || "Erro ao salvar pedidos.json.",
      });
    } finally {
      setIsSyncingOrders(false);
    }
  };

  // Push Catalog (catalogo.json)
  const handlePushCatalogToDrive = async () => {
    if (!webhookUrl.trim()) {
      setSyncStatus({
        type: "error",
        message: "Informe a URL do Web App do Google Apps Script.",
      });
      return;
    }

    setIsSyncingCatalog(true);
    setSyncStatus({ type: "idle", message: "" });

    try {
      const res = await saveCatalogToGoogleDrive(webhookUrl.trim(), products);
      setSyncStatus({
        type: res.success ? "success" : "error",
        message: res.message,
      });
    } catch (err: any) {
      setSyncStatus({
        type: "error",
        message: err.message || "Erro ao salvar catalogo.json.",
      });
    } finally {
      setIsSyncingCatalog(false);
    }
  };

  // Push Categories (categorias.json)
  const handlePushCategoriesToDrive = async () => {
    if (!webhookUrl.trim()) {
      setSyncStatus({
        type: "error",
        message: "Informe a URL do Web App do Google Apps Script.",
      });
      return;
    }

    setIsSyncingCategories(true);
    setSyncStatus({ type: "idle", message: "" });

    try {
      const res = await saveCategoriesToGoogleDrive(webhookUrl.trim(), categories);
      setSyncStatus({
        type: res.success ? "success" : "error",
        message: res.message,
      });
    } catch (err: any) {
      setSyncStatus({
        type: "error",
        message: err.message || "Erro ao salvar categorias.json.",
      });
    } finally {
      setIsSyncingCategories(false);
    }
  };

  // Read JSON files from Google Drive
  const handleFetchFromDrive = async () => {
    if (!webhookUrl.trim() && !folderUrl.trim() && !folderId.trim()) {
      setSyncStatus({
        type: "error",
        message: "Informe a URL do Web App do Google Apps Script ou o Link da Pasta do Google Drive.",
      });
      return;
    }

    setIsSyncing(true);
    setSyncStatus({ type: "idle", message: "" });

    try {
      const res = await fetchStoreDataFromGoogleDrive(
        webhookUrl.trim(),
        folderUrl.trim(),
        folderId.trim()
      );

      if (res.success) {
        let updateLogs: string[] = [];

        // 1. Orders
        if (res.orders && res.orders.length > 0 && onImportOrders) {
          const { merged, addedCount, updatedCount } = mergeOrders(orders, res.orders);
          onImportOrders(merged);
          updateLogs.push(`${res.orders.length} pedidos em 'pedidos.json' (+${addedCount} novos, ${updatedCount} atualizados)`);
        }

        // 2. Products
        if (res.products && res.products.length > 0 && onImportProducts) {
          onImportProducts(res.products);
          updateLogs.push(`${res.products.length} produtos em 'catalogo.json'`);
        }

        // 3. Categories
        if (res.categories && res.categories.length > 0 && onImportCategories) {
          onImportCategories(res.categories);
          updateLogs.push(`${res.categories.length} categorias em 'categorias.json'`);
        }

        const summaryMsg = updateLogs.length > 0
          ? `Sucesso! Arquivos lidos da pasta do Google Drive: ${updateLogs.join(" | ")}.`
          : "Conectado ao Google Drive com sucesso! Os arquivos JSON estão sincronizados.";

        setSyncStatus({
          type: "success",
          message: summaryMsg,
        });

        onSaveConfig({
          ...config,
          driveWebhookUrl: webhookUrl.trim(),
          sheetWebhookUrl: webhookUrl.trim(),
          folderUrl: folderUrl.trim(),
          folderId: folderId.trim(),
          autoSync,
          lastSyncedAt: new Date().toLocaleDateString("pt-BR") + " às " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        });
      } else {
        setSyncStatus({
          type: "error",
          message: res.message || "Não foi possível carregar os arquivos JSON do Google Drive.",
        });
      }
    } catch (err: any) {
      setSyncStatus({
        type: "error",
        message: err.message || "Erro inesperado ao consultar o Google Drive.",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Local JSON File Upload Handlers
  const handleUploadOrdersFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseOrdersFromJSON(text);
        if (parsed.length === 0) {
          alert("Nenhum pedido válido foi encontrado no arquivo JSON.");
          return;
        }

        if (onImportOrders) {
          const { merged, addedCount, updatedCount } = mergeOrders(orders, parsed);
          onImportOrders(merged);
          alert(`✅ Importação de Pedidos concluída!\n\n• ${addedCount} novos pedidos adicionados\n• ${updatedCount} pedidos atualizados\n• Total no Kanban: ${merged.length}`);
        }
      } catch (err: any) {
        alert("Erro ao ler arquivo JSON de pedidos: " + err.message);
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = "";
  };

  const handleUploadCatalogFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const { products: parsedProds, categories: parsedCats } = parseCatalogFromJSON(text);

        if (parsedProds.length === 0) {
          alert("Nenhum produto válido foi encontrado no arquivo JSON.");
          return;
        }

        if (onImportProducts) {
          onImportProducts(parsedProds);
        }
        if (parsedCats.length > 0 && onImportCategories) {
          onImportCategories(parsedCats);
        }

        alert(`✅ Catálogo importado com sucesso!\n\n• ${parsedProds.length} produtos carregados\n• ${parsedCats.length} categorias carregadas`);
      } catch (err: any) {
        alert("Erro ao ler arquivo JSON do catálogo: " + err.message);
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = "";
  };

  const handleUploadCategoriesFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseCategoriesFromJSON(text);

        if (parsed.length === 0) {
          alert("Nenhuma categoria válida foi encontrada no arquivo JSON.");
          return;
        }

        if (onImportCategories) {
          onImportCategories(parsed);
        }
        alert(`✅ ${parsed.length} categorias importadas com sucesso!`);
      } catch (err: any) {
        alert("Erro ao ler arquivo JSON de categorias: " + err.message);
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = "";
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_DRIVE_JSON_CODE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-stone-200 flex items-center justify-between bg-emerald-950 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-800/80 border border-emerald-700/50 flex items-center justify-center text-emerald-200 shadow-xs">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg sm:text-xl text-stone-100 flex items-center gap-2">
                <span>Google Drive • Armazenamento em Arquivos JSON</span>
                <span className="text-[10px] bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded-full font-sans font-bold uppercase tracking-wider">
                  Nuvem Direta
                </span>
              </h2>
              <p className="text-xs text-emerald-200/80">
                Lê e salva automaticamente <code>pedidos.json</code>, <code>catalogo.json</code> e <code>categorias.json</code> na pasta compartilhada do Drive.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-stone-50/50">

          {/* Sync Status Banner */}
          {syncStatus.type !== "idle" && (
            <div
              className={`p-4 rounded-2xl border flex items-start gap-3 text-xs sm:text-sm animate-in fade-in duration-200 ${
                syncStatus.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : "bg-rose-50 border-rose-200 text-rose-900"
              }`}
            >
              {syncStatus.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 font-medium">{syncStatus.message}</div>
            </div>
          )}

          {/* 3 Core JSON Files Status Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* pedidos.json */}
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 font-mono">
                  <FileJson className="w-4 h-4 text-emerald-700" />
                  pedidos.json
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  {orders.length} pedidos
                </span>
              </div>
              <p className="text-[11px] text-stone-500 leading-snug">
                Todos os pedidos recebidos no Kanban e via WhatsApp.
              </p>
              <div className="flex items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => downloadOrdersJSON(orders)}
                  className="flex-1 text-[11px] font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Baixar .json
                </button>
                <button
                  type="button"
                  onClick={handlePushOrdersToDrive}
                  disabled={isSyncingOrders}
                  className="text-[11px] font-bold bg-emerald-800 hover:bg-emerald-900 text-white py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                  title="Salvar apenas pedidos.json no Google Drive"
                >
                  {isSyncingOrders ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  Salvar
                </button>
              </div>
            </div>

            {/* catalogo.json */}
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5 font-mono">
                  <FileJson className="w-4 h-4 text-amber-700" />
                  catalogo.json
                </span>
                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                  {products.length} produtos
                </span>
              </div>
              <p className="text-[11px] text-stone-500 leading-snug">
                Produtos florais, fotos, tags, preços de venda e referência.
              </p>
              <div className="flex items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => downloadCatalogJSON(products, categories)}
                  className="flex-1 text-[11px] font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Baixar .json
                </button>
                <button
                  type="button"
                  onClick={handlePushCatalogToDrive}
                  disabled={isSyncingCatalog}
                  className="text-[11px] font-bold bg-amber-800 hover:bg-amber-900 text-white py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                  title="Salvar apenas catalogo.json no Google Drive"
                >
                  {isSyncingCatalog ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  Salvar
                </button>
              </div>
            </div>

            {/* categorias.json */}
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5 font-mono">
                  <FileJson className="w-4 h-4 text-blue-700" />
                  categorias.json
                </span>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                  {categories.length} categorias
                </span>
              </div>
              <p className="text-[11px] text-stone-500 leading-snug">
                Categorias ativas com ícones/emojis e descrições.
              </p>
              <div className="flex items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => downloadCategoriesJSON(categories)}
                  className="flex-1 text-[11px] font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Baixar .json
                </button>
                <button
                  type="button"
                  onClick={handlePushCategoriesToDrive}
                  disabled={isSyncingCategories}
                  className="text-[11px] font-bold bg-blue-800 hover:bg-blue-900 text-white py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                  title="Salvar apenas categorias.json no Google Drive"
                >
                  {isSyncingCategories ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  Salvar
                </button>
              </div>
            </div>
          </div>

          {/* Configuration Form */}
          <form onSubmit={handleSave} className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-bold text-stone-900 text-sm sm:text-base flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-800" />
                  Conexão com o Google Apps Script & Google Drive
                </h3>
                <p className="text-xs text-stone-500">
                  Insira o Web App do script para leitura e gravação instantânea dos arquivos JSON.
                </p>
              </div>

              {config.lastSyncedAt && (
                <span className="text-[11px] text-emerald-800 font-medium bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full self-start sm:self-auto">
                  Última sincronização: {config.lastSyncedAt}
                </span>
              )}
            </div>

            <div className="space-y-4">
              {/* Web App URL */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  URL do Web App do Google Apps Script (Drive JSON) *
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm font-mono text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                  />
                </div>
                <p className="text-[11px] text-stone-500 mt-1">
                  💡 O script lê e atualiza os arquivos <code>pedidos.json</code>, <code>catalogo.json</code> e <code>categorias.json</code> diretamente na sua pasta do Google Drive.
                </p>
              </div>

              {/* Folder URL (Optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Link da Pasta do Google Drive (Opcional)
                  </label>
                  <input
                    type="text"
                    value={folderUrl}
                    onChange={(e) => setFolderUrl(e.target.value)}
                    placeholder="https://drive.google.com/drive/folders/1aBcDeFg..."
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm font-mono text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                  <p className="text-[11px] text-stone-500 mt-1">
                    Link da pasta onde você guarda as fotos e os arquivos.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    ID da Pasta no Google Drive (Opcional)
                  </label>
                  <input
                    type="text"
                    value={folderId}
                    onChange={(e) => setFolderId(e.target.value)}
                    placeholder="Ex: 1aBcDeFg_hIjKlMnOpQrStUvWxYz"
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm font-mono text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                  <p className="text-[11px] text-stone-500 mt-1">
                    Se deixar em branco, o script utiliza a pasta padrão <strong>Floricultura Papoula - Dados</strong>.
                  </p>
                </div>
              </div>

              {/* Auto Sync Toggle */}
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-stone-900 block">
                    Sincronização Automática ao Abrir o Sistema
                  </span>
                  <span className="text-[11px] text-stone-500">
                    Ao abrir a loja/painel, lê os arquivos JSON da pasta do Google Drive e sincroniza automaticamente a cada 2 minutos.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoSync(!autoSync)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    autoSync ? "bg-emerald-800" : "bg-stone-300"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      autoSync ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100">
              <div className="flex flex-wrap items-center gap-2">
                {/* Save All to Drive Button */}
                <button
                  type="button"
                  onClick={handleSyncAllToDrive}
                  disabled={isSyncingAll}
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
                >
                  {isSyncingAll ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>⚡ Salvar Tudo no Google Drive (.json)</span>
                </button>

                {/* Fetch from Drive Button */}
                <button
                  type="button"
                  onClick={handleFetchFromDrive}
                  disabled={isSyncing}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
                >
                  {isSyncing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  <span>🔄 Ler e Atualizar do Drive Agora</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {savedNotice && (
                  <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Configuração Salva!
                  </span>
                )}
                <button
                  type="submit"
                  className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  Salvar Configuração
                </button>
              </div>
            </div>
          </form>

          {/* Local JSON Import / Export Toolbox */}
          <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-4">
            <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-emerald-800" />
              Importar / Restaurar Arquivos JSON Locais (Backup do PC ou Celular)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Import Orders */}
              <div className="p-3.5 rounded-2xl border border-stone-200 bg-stone-50/70 space-y-2">
                <span className="text-xs font-bold text-stone-800 block">Pedidos (pedidos.json)</span>
                <p className="text-[11px] text-stone-500">Restaura ou mescla pedidos salvos localmente.</p>
                <input
                  type="file"
                  ref={orderFileInputRef}
                  onChange={handleUploadOrdersFile}
                  accept=".json"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => orderFileInputRef.current?.click()}
                  className="w-full text-xs font-bold bg-white border border-stone-300 hover:bg-stone-100 text-stone-800 py-2 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-800" />
                  Importar pedidos.json
                </button>
              </div>

              {/* Import Catalog */}
              <div className="p-3.5 rounded-2xl border border-stone-200 bg-stone-50/70 space-y-2">
                <span className="text-xs font-bold text-stone-800 block">Catálogo (catalogo.json)</span>
                <p className="text-[11px] text-stone-500">Restaura produtos com fotos, tags e preços.</p>
                <input
                  type="file"
                  ref={catalogFileInputRef}
                  onChange={handleUploadCatalogFile}
                  accept=".json"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => catalogFileInputRef.current?.click()}
                  className="w-full text-xs font-bold bg-white border border-stone-300 hover:bg-stone-100 text-stone-800 py-2 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-800" />
                  Importar catalogo.json
                </button>
              </div>

              {/* Import Categories */}
              <div className="p-3.5 rounded-2xl border border-stone-200 bg-stone-50/70 space-y-2">
                <span className="text-xs font-bold text-stone-800 block">Categorias (categorias.json)</span>
                <p className="text-[11px] text-stone-500">Restaura categorias e ícones florais.</p>
                <input
                  type="file"
                  ref={categoryFileInputRef}
                  onChange={handleUploadCategoriesFile}
                  accept=".json"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => categoryFileInputRef.current?.click()}
                  className="w-full text-xs font-bold bg-white border border-stone-300 hover:bg-stone-100 text-stone-800 py-2 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-800" />
                  Importar categorias.json
                </button>
              </div>
            </div>
          </div>

          {/* Quick Setup Guide with Ready-To-Copy Google Apps Script */}
          <div className="bg-emerald-950 text-white p-5 sm:p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-emerald-300" />
                <h4 className="font-serif font-bold text-base text-stone-100">
                  Código do Google Apps Script Oficial (Arquivos JSON no Google Drive)
                </h4>
              </div>
              <button
                type="button"
                onClick={handleCopyScript}
                className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedScript ? "Copiado!" : "Copiar Código"}</span>
              </button>
            </div>

            <ol className="text-xs text-emerald-200/90 space-y-1.5 list-decimal list-inside leading-relaxed bg-emerald-900/50 p-4 rounded-2xl border border-emerald-800/50">
              <li>Acesse <strong>https://script.google.com</strong> e clique em <strong>Novo Projeto</strong>.</li>
              <li>Apague todo o código existente e clique em <strong>Copiar Código</strong> acima para colar lá.</li>
              <li>Clique no ícone de <strong>Salvar (Ctrl+S)</strong>.</li>
              <li>Para testar e criar os arquivos na sua pasta, selecione a função <code>testarIntegracaoDriveJSON</code> e clique em <strong>Executar</strong>.</li>
              <li>Clique no botão azul <strong>Implantar &gt; Nova implantação</strong>.</li>
              <li>Selecione <strong>Aplicativo da Web</strong> | Executar como: <strong>Eu</strong> | Quem pode acessar: <strong>Qualquer pessoa</strong> (IMPORTANTE!).</li>
              <li>Clique em <strong>Implantar</strong> e copie a URL gerada (terminada em <code>/exec</code>) para colar no campo acima.</li>
            </ol>

            <div className="pt-2">
              <p className="text-[11px] text-emerald-300/80">
                ✨ <strong>Pronto!</strong> Todos os dados da Floricultura Papoula passam a ser gravados e lidos diretamente na pasta do Google Drive em formato JSON, sem dependência de planilhas ou erros de abas.
              </p>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-stone-200 bg-white flex items-center justify-between">
          <span className="text-xs text-stone-500">
            Floricultura Papoula • Pirapora & Buritizeiro
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs sm:text-sm font-bold cursor-pointer transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
