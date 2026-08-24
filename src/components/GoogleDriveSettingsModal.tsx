import React, { useState } from "react";
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
  FolderOpen
} from "lucide-react";
import { GoogleDriveConfig, KanbanOrder, Customer } from "../types";
import { exportOrdersToCSV, exportCustomersToCSV, downloadCSV, downloadOfficialSpreadsheetTemplate } from "../utils/googleDriveSync";

interface GoogleDriveSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: KanbanOrder[];
  customers: Customer[];
  config: GoogleDriveConfig;
  onSaveConfig: (config: GoogleDriveConfig) => void;
}

export const GoogleDriveSettingsModal: React.FC<GoogleDriveSettingsModalProps> = ({
  isOpen,
  onClose,
  orders,
  customers,
  config,
  onSaveConfig,
}) => {
  const [webhookUrl, setWebhookUrl] = useState(config.sheetWebhookUrl || "");
  const [spreadsheetId, setSpreadsheetId] = useState(config.spreadsheetId || "");
  const [folderUrl, setFolderUrl] = useState(config.folderUrl || "");
  const [autoSync, setAutoSync] = useState(config.autoSync);
  const [savedNotice, setSavedNotice] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

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

  const handleDownloadCustomers = () => {
    const csv = exportCustomersToCSV(customers);
    const date = new Date().toISOString().split("T")[0];
    downloadCSV(`papoula_clientes_aniversarios_${date}.csv`, csv);
  };

  const googleAppsScriptCode = `function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Adiciona o novo pedido da Floricultura Papoula na planilha
    sheet.appendRow([
      data.orderNumber,
      data.createdAt || new Date(),
      data.customerName,
      data.customerPhone,
      data.productName,
      data.totalPrice,
      data.deliveryAddress,
      data.deliveryCity,
      data.cardMessage,
      data.status
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ "result": "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ "result": "error", "error": error }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

  const copyScript = () => {
    navigator.clipboard.writeText(googleAppsScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border border-stone-200 space-y-5 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#114b30] flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-2">
                <span>Configurar Banco de Dados & Google Drive</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                  Nuvem & Planilhas
                </span>
              </h3>
              <p className="text-xs text-stone-500">
                Sincronize pedidos, clientes e aniversários com suas planilhas do Google Sheets no Google Drive.
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

        {/* Status Notice */}
        <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200/80 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-950 space-y-1">
            <p className="font-bold">
              Como funciona a integração com Google Drive / Google Sheets:
            </p>
            <p className="text-emerald-900/90 leading-relaxed">
              Todos os seus dados já são salvos de forma segura e imediata na memória do sistema. Você pode exportar tabelas prontas para o Google Drive ou colar a URL do seu <strong>Webhook do Google Apps Script</strong> para enviar pedidos em tempo real.
            </p>
          </div>
        </div>

        {/* Quick Export Actions */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
              Download da Planilha Pronta para o Google Drive
            </label>
          </div>

          <button
            type="button"
            onClick={() => downloadOfficialSpreadsheetTemplate()}
            className="w-full p-3.5 bg-[#114b30] hover:bg-[#0c3924] text-white rounded-2xl flex items-center justify-between shadow-md transition-all cursor-pointer group hover:scale-[1.01]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-300 group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div className="text-left">
                <span className="font-bold text-xs sm:text-sm block">
                  📥 Baixar Planilha Oficial de Pedidos (.CSV)
                </span>
                <span className="text-[11px] text-emerald-100/90 block">
                  Com todas as colunas já formatadas para arrastar para o seu Google Drive
                </span>
              </div>
            </div>
            <Download className="w-5 h-5 text-amber-300" />
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              onClick={handleDownloadOrders}
              className="p-3 bg-stone-50 hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 rounded-2xl flex items-center gap-3 transition-all cursor-pointer text-left group"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-bold text-xs text-stone-900 block truncate">
                  Exportar Pedidos Atuais ({orders.length})
                </span>
                <span className="text-[11px] text-stone-500 block truncate">
                  Endereços, cartões e status
                </span>
              </div>
              <Download className="w-4 h-4 text-emerald-700 shrink-0" />
            </button>

            <button
              onClick={handleDownloadCustomers}
              className="p-3 bg-stone-50 hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 rounded-2xl flex items-center gap-3 transition-all cursor-pointer text-left group"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-bold text-xs text-stone-900 block truncate">
                  Exportar Clientes & Aniversários ({customers.length})
                </span>
                <span className="text-[11px] text-stone-500 block truncate">
                  WhatsApp e datas especiais
                </span>
              </div>
              <Download className="w-4 h-4 text-amber-700 shrink-0" />
            </button>
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
                Webhook Google Apps Script (Envio Automático para Google Sheets):
              </label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
              />
              <span className="text-[11px] text-stone-400 block mt-1">
                (Opcional) Cole a URL do Web App gerada no seu Google Apps Script para salvar cada pedido automaticamente no Sheets.
              </span>
            </div>

            {/* Script Helper Accordion */}
            <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-emerald-800" />
                  <span>Código do Script para o Google Sheets:</span>
                </span>
                <button
                  type="button"
                  onClick={copyScript}
                  className="text-xs text-emerald-800 hover:text-emerald-950 font-bold flex items-center gap-1 cursor-pointer"
                >
                  {copiedScript ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Código</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="text-[10px] bg-stone-900 text-stone-200 p-2.5 rounded-xl font-mono overflow-x-auto max-h-28">
                {googleAppsScriptCode}
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
