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
  FolderOpen
} from "lucide-react";
import { GoogleDriveConfig, KanbanOrder, Customer } from "../types";
import { 
  exportOrdersToCSV, 
  exportCustomersToCSV, 
  downloadCSV, 
  downloadOfficialSpreadsheetTemplate,
  fetchOrdersFromGoogleSheets,
  parseOrdersFromCSV,
  mergeOrders
} from "../utils/googleDriveSync";

interface GoogleDriveSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: KanbanOrder[];
  customers: Customer[];
  config: GoogleDriveConfig;
  onSaveConfig: (config: GoogleDriveConfig) => void;
  onImportOrders?: (orders: KanbanOrder[]) => void;
}

export const GoogleDriveSettingsModal: React.FC<GoogleDriveSettingsModalProps> = ({
  isOpen,
  onClose,
  orders,
  customers,
  config,
  onSaveConfig,
  onImportOrders,
}) => {
  const [webhookUrl, setWebhookUrl] = useState(config.sheetWebhookUrl || "");
  const [spreadsheetId, setSpreadsheetId] = useState(config.spreadsheetId || "");
  const [folderUrl, setFolderUrl] = useState(config.folderUrl || "");
  const [autoSync, setAutoSync] = useState(config.autoSync);
  const [savedNotice, setSavedNotice] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{
    type: "idle" | "success" | "error";
    message: string;
  }>({ type: "idle", message: "" });

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Pull Orders from Webhook via doGet() or direct Google Sheet
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
      const result = await fetchOrdersFromGoogleSheets(webhookUrl.trim(), spreadsheetId.trim(), folderUrl.trim());
      if (result.success && result.orders.length > 0) {
        if (onImportOrders) {
          const { merged, addedCount, updatedCount } = mergeOrders(orders, result.orders);
          onImportOrders(merged);
          setSyncStatus({
            type: "success",
            message: `Sincronização concluída! ${result.orders.length} pedidos carregados da planilha (${addedCount} novos adicionados, ${updatedCount} atualizados).`,
          });
        } else {
          setSyncStatus({
            type: "success",
            message: `${result.orders.length} pedidos encontrados na planilha!`,
          });
        }
      } else if (result.success && result.orders.length === 0) {
        setSyncStatus({
          type: "success",
          message: "Conexão estabelecida com sucesso, mas nenhuma linha de pedido foi encontrada na planilha.",
        });
      } else {
        setSyncStatus({
          type: "error",
          message: result.message || "Erro ao consultar a planilha. Verifique as permissões de acesso do Webhook ou da Planilha.",
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

  // Import CSV File Directly
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = parseOrdersFromCSV(text);
        if (parsed.length > 0) {
          if (onImportOrders) {
            const { merged, addedCount, updatedCount } = mergeOrders(orders, parsed);
            onImportOrders(merged);
            setSyncStatus({
              type: "success",
              message: `Arquivo importado com sucesso! ${parsed.length} pedidos processados (${addedCount} novos, ${updatedCount} atualizados).`,
            });
          }
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
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const googleAppsScriptCode = `/**
 * FLORICULTURA PAPOULA - GOOGLE APPS SCRIPT WEB APP
 * Integração bidirecional com o Sistema Web
 * 
 * 1. doPost(e): Salva novos pedidos OU retorna pedidos se action='getOrders'
 * 2. doGet(e): Retorna todos os pedidos da planilha em JSON para o sistema web
 */

function doPost(e) {
  try {
    var contents = e.postData ? e.postData.contents : "";
    var data = {};
    try {
      data = contents ? JSON.parse(contents) : {};
    } catch (parseErr) {
      data = {};
    }

    // Se for uma requisicao de consulta / sincronizacao de pedidos
    if (data.action === "getOrders" || data.action === "get_orders" || (e.parameter && e.parameter.action === "getOrders")) {
      return doGet(e);
    }
    
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Garante que a linha de cabeçalhos exista
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Numero Pedido",
        "Data Criacao",
        "Cliente / Remetente",
        "WhatsApp Cliente",
        "Aniversario Cliente",
        "Produto / Arranjo",
        "Categoria",
        "Preco Referencia Item (R$)",
        "Custo de Frete (R$)",
        "Valor Total Estimado (R$)",
        "Destinatario",
        "Endereco de Entrega",
        "Bairro",
        "Cidade",
        "Data de Entrega",
        "Horario",
        "Mensagem do Cartao",
        "Forma Pagamento",
        "Status Kanban"
      ]);
    }
    
    var orderNum = data.orderNumber || ("#PAP-" + Math.floor(1000 + Math.random() * 9000));
    var createdAt = data.createdAt || new Date();
    var customerName = data.senderName || data.customerName || "Cliente";
    var customerPhone = data.senderPhone || data.customerPhone || "";
    var customerBirthDate = data.customerBirthDate || "";
    var productName = data.productName || "Arranjo de Flores";
    var category = data.category || "Arranjos";
    var refPrice = data.referencePrice || data.price || 0;
    var freightFee = data.deliveryFee || data.freightFee || 0;
    var totalPrice = data.total || data.totalPrice || (Number(refPrice) + Number(freightFee)) || 0;
    var recipientName = data.recipientName || customerName;
    var address = data.address || data.deliveryAddress || "";
    var neighborhood = data.neighborhood || data.deliveryNeighborhood || "";
    var city = data.city || data.deliveryCity || "Pirapora";
    var deliveryDate = data.deliveryDate || "";
    var timeSlot = data.timeSlot || "";
    var cardMsg = data.cardMessage || "";
    var payment = data.paymentMethod || "PIX";
    var status = data.status || "pedido";
    
    sheet.appendRow([
      orderNum,
      createdAt,
      customerName,
      customerPhone,
      customerBirthDate,
      productName,
      category,
      refPrice,
      freightFee,
      totalPrice,
      recipientName,
      address,
      neighborhood,
      city,
      deliveryDate,
      timeSlot,
      cardMsg,
      payment,
      status
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ "result": "success", "orderNumber": orderNum }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ "result": "error", "error": error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = sheet.getDataRange().getValues();
    
    if (!data || data.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify({ "result": "success", "orders": [] }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var headers = data[0].map(function(h) { return String(h || "").trim().toLowerCase(); });
    
    function findCol(keywords) {
      for (var k = 0; k < keywords.length; k++) {
        for (var i = 0; i < headers.length; i++) {
          if (headers[i].indexOf(keywords[k]) !== -1) return i;
        }
      }
      return -1;
    }
    
    var idxOrderNum = findCol(["numero", "pedido", "código", "codigo"]);
    var idxDate = findCol(["data criacao", "data e hora", "data cadastro", "timestamp", "data"]);
    var idxCustomer = findCol(["cliente", "remetente", "nome"]);
    var idxPhone = findCol(["whatsapp", "telefone", "celular", "contato"]);
    var idxBirth = findCol(["aniversario", "nascimento"]);
    var idxProduct = findCol(["produto", "arranjo", "item"]);
    var idxCategory = findCol(["categoria"]);
    var idxRefPrice = findCol(["referencia", "preco do produto", "valor do produto", "preco"]);
    var idxFreight = findCol(["frete", "taxa de frete", "custo de frete", "entrega"]);
    var idxTotal = findCol(["total", "valor total", "total estimado"]);
    var idxAddress = findCol(["endereco", "endereço", "rua"]);
    var idxCity = findCol(["cidade", "municipio"]);
    var idxDeliveryDate = findCol(["data de entrega", "horario", "entrega"]);
    var idxCard = findCol(["mensagem", "cartao", "dedicatoria", "cartão"]);
    var idxPayment = findCol(["pagamento", "forma"]);
    var idxStatus = findCol(["status", "situacao", "etapa"]);
    
    var orders = [];
    
    for (var r = 1; r < data.length; r++) {
      var row = data[r];
      if (!row || row.every(function(cell) { return cell === "" || cell === null; })) continue;
      
      var orderNum = (idxOrderNum !== -1 && row[idxOrderNum]) ? String(row[idxOrderNum]).trim() : ("#PAP-" + (1000 + r));
      var createdAt = (idxDate !== -1 && row[idxDate]) ? new Date(row[idxDate]).toISOString() : new Date().toISOString();
      var customerName = (idxCustomer !== -1 && row[idxCustomer]) ? String(row[idxCustomer]).trim() : "Cliente";
      var phone = (idxPhone !== -1 && row[idxPhone]) ? String(row[idxPhone]).trim() : "";
      var birth = (idxBirth !== -1 && row[idxBirth]) ? String(row[idxBirth]).trim() : "";
      var product = (idxProduct !== -1 && row[idxProduct]) ? String(row[idxProduct]).trim() : "Arranjo Especial";
      var category = (idxCategory !== -1 && row[idxCategory]) ? String(row[idxCategory]).trim() : "Arranjos";
      
      var refVal = (idxRefPrice !== -1 && row[idxRefPrice]) ? parseFloat(String(row[idxRefPrice]).replace(",", ".")) : 0;
      var freightVal = (idxFreight !== -1 && row[idxFreight]) ? parseFloat(String(row[idxFreight]).replace(",", ".")) : 0;
      var totalVal = (idxTotal !== -1 && row[idxTotal]) ? parseFloat(String(row[idxTotal]).replace(",", ".")) : 0;
      
      if (isNaN(refVal)) refVal = 0;
      if (isNaN(freightVal)) freightVal = 0;
      if (isNaN(totalVal) || totalVal <= 0) totalVal = refVal + freightVal;
      
      var address = (idxAddress !== -1 && row[idxAddress]) ? String(row[idxAddress]).trim() : "";
      var city = (idxCity !== -1 && row[idxCity]) ? String(row[idxCity]).trim() : "Pirapora";
      var delDate = (idxDeliveryDate !== -1 && row[idxDeliveryDate]) ? String(row[idxDeliveryDate]).trim() : "Hoje";
      var card = (idxCard !== -1 && row[idxCard]) ? String(row[idxCard]).trim() : "";
      var payment = (idxPayment !== -1 && row[idxPayment]) ? String(row[idxPayment]).trim() : "PIX";
      var statusRaw = (idxStatus !== -1 && row[idxStatus]) ? String(row[idxStatus]).toLowerCase().trim() : "pedido";
      
      var status = "pedido";
      if (statusRaw.indexOf("prod") !== -1 || statusRaw.indexOf("conf") !== -1 || statusRaw.indexOf("pago") !== -1 || statusRaw.indexOf("bancada") !== -1) {
        status = "confirmado";
      } else if (statusRaw.indexOf("rota") !== -1 || statusRaw.indexOf("saiu") !== -1 || statusRaw.indexOf("transporte") !== -1 || statusRaw.indexOf("andamento") !== -1) {
        status = "em_andamento";
      } else if (statusRaw.indexOf("conc") !== -1 || statusRaw.indexOf("entr") !== -1 || statusRaw.indexOf("final") !== -1) {
        status = "concluido";
      }
      
      orders.push({
        id: "sheet-" + r + "-" + orderNum.replace(/[^a-zA-Z0-9]/g, ""),
        orderNumber: orderNum,
        createdAt: createdAt,
        customerName: customerName,
        customerPhone: phone,
        customerBirthDate: birth,
        productName: product,
        category: category,
        referencePrice: refVal,
        freightFee: freightVal,
        totalPrice: totalVal,
        deliveryAddress: address,
        deliveryCity: city,
        deliveryDate: delDate,
        cardMessage: card,
        paymentMethod: payment,
        status: status
      });
    }
    
    return ContentService.createTextOutput(JSON.stringify({ "result": "success", "orders": orders }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ "result": "error", "error": error.toString() }))
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
                Sincronize pedidos, clientes e aniversários em duas vias (enviar e receber) com o Google Sheets no Google Drive.
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

        {/* Actions: Live Sync & CSV Import */}
        <div className="p-4 bg-gradient-to-r from-emerald-50 to-stone-50 rounded-2xl border border-emerald-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#114b30] uppercase tracking-wider flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4" />
              <span>Sincronização Imediata com a Planilha</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Direct Sync Button */}
            <button
              type="button"
              onClick={handleFetchFromSheets}
              disabled={isSyncing}
              className="p-3 bg-[#114b30] hover:bg-[#0c3924] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin text-amber-300" : "text-amber-300"}`} />
              <span>{isSyncing ? "Buscando na Planilha..." : "Puxar Pedidos da Planilha (Web)"}</span>
            </button>

            {/* Direct CSV Upload Button */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-file-upload"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-3 bg-white hover:bg-emerald-50 text-stone-800 hover:text-emerald-950 border border-stone-300 hover:border-emerald-400 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4 text-emerald-800" />
                <span>Importar Arquivo (.CSV)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Export Actions */}
        <div className="space-y-2.5">
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
            Exportar Dados para o Google Drive
          </label>

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
                  📥 Baixar Planilha Modelo Oficial (.CSV)
                </span>
                <span className="text-[11px] text-emerald-100/90 block">
                  Com colunas de Produto, Custo de Frete, Ref. Arranjo e Total
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
                  Com fretes e preços de referência
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
                  Exportar Clientes ({customers.length})
                </span>
                <span className="text-[11px] text-stone-500 block truncate">
                  WhatsApp e datas de aniversários
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
                URL do Webhook do Google Apps Script (Envio e Leitura Automática):
              </label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600/30 font-mono"
              />
              <span className="text-[11px] text-stone-500 block mt-1">
                Cole a URL do Web App gerada no Google Apps Script (com <strong>doGet</strong> e <strong>doPost</strong>).
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
              <span className="text-[11px] text-stone-500 block mt-1">
                Permite puxar pedidos diretamente da planilha mesmo sem o Apps Script (compartilhe como <em>"Qualquer pessoa com o link pode ler"</em>).
              </span>
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
                Quando ativado, o sistema <strong>puxa e atualiza todos os pedidos da planilha automaticamente sempre que você abrir ou recarregar a página</strong>, além de checar atualizações em segundo plano a cada 2 minutos (sem você precisar ficar clicando toda hora).
              </p>
            </div>

            {/* Script Helper Accordion */}
            <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-emerald-800" />
                  <span>Código do Script para o Google Sheets (doGet + doPost):</span>
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
                <p className="font-bold">⚠️ Como configurar no Google Sheets para puxar os dados corretamente:</p>
                <ol className="list-decimal pl-4 space-y-0.5 text-amber-900">
                  <li>No Google Sheets, clique em <strong>Extensões &gt; Apps Script</strong>.</li>
                  <li>Cole o código abaixo substituindo o conteúdo anterior e clique em <strong>Salvar (Ctrl+S)</strong>.</li>
                  <li>Clique no botão azul <strong>Implantar &gt; Nova implantação</strong>.</li>
                  <li>Selecione o tipo <strong>App da Web</strong>.</li>
                  <li>Em <em>"Quem pode acessar"</em>, selecione <strong>Qualquer pessoa (Anyone)</strong>.</li>
                  <li>Copie a URL da Web App gerada e cole no campo acima!</li>
                </ol>
              </div>

              <pre className="text-[10px] bg-stone-900 text-stone-200 p-2.5 rounded-xl font-mono overflow-x-auto max-h-36">
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
