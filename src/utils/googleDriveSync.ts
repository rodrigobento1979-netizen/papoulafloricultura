import { KanbanOrder, Customer, GoogleDriveConfig } from "../types";

/**
 * Sends single order payload to Google Apps Script Webhook (POST)
 */
export async function sendOrderToGoogleSheetsWebhook(
  webhookUrl: string,
  orderData: {
    orderNumber?: string;
    productName: string;
    price?: number | string;
    referencePrice?: number | string;
    deliveryFee?: number | string;
    total?: number | string;
    senderName?: string;
    senderPhone?: string;
    senderBirthDate?: string;
    recipientName: string;
    recipientPhone?: string;
    city: string;
    address: string;
    neighborhood?: string;
    reference?: string;
    deliveryDate?: string;
    timeSlot?: string;
    cardMessage?: string;
    paymentMethod?: string;
    status?: string;
  }
): Promise<boolean> {
  if (!webhookUrl || !webhookUrl.trim() || !webhookUrl.startsWith("http")) {
    return false;
  }

  try {
    const cleanUrl = webhookUrl.trim();
    // Using no-cors or standard POST. Google Apps Script Web App redirects on POST (302)
    await fetch(cleanUrl, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    });
    return true;
  } catch (err) {
    console.warn("Erro ao enviar dados para o Google Sheets Webhook:", err);
    return false;
  }
}

/**
 * Fetches all orders from Google Sheets Webhook or direct Google Sheet via backend proxy
 */
export async function fetchOrdersFromGoogleSheets(
  webhookUrl?: string,
  spreadsheetId?: string,
  folderUrl?: string
): Promise<{
  success: boolean;
  orders: KanbanOrder[];
  message?: string;
}> {
  const target = (webhookUrl || "").trim();
  const sheetId = (spreadsheetId || "").trim();
  const folder = (folderUrl || "").trim();

  if (!target && !sheetId && !folder) {
    return {
      success: false,
      orders: [],
      message: "Por favor, informe a URL do Webhook do Google Apps Script ou o Link da Planilha nas configurações.",
    };
  }

  // 1. Try fetching through the backend proxy (handles CORS, redirects, GET, POST getOrders, and direct CSV export)
  try {
    const apiRes = await fetch("/api/sync-sheets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: target, spreadsheetId: sheetId, folderUrl: folder }),
    });

    if (apiRes.ok) {
      const data = await apiRes.json();
      if (data.success && Array.isArray(data.orders) && data.orders.length > 0) {
        const normalized = data.orders.map((o: any, idx: number) => ({
          ...o,
          id: o.id || `order-sync-${Date.now()}-${idx}`,
          orderNumber: o.orderNumber || `#PAP-${1000 + idx}`,
          createdAt: normalizeDate(o.createdAt),
          referencePrice: Number(o.referencePrice || o.price || 0),
          freightFee: Number(o.freightFee || o.deliveryFee || 0),
          totalPrice: Number(o.totalPrice || o.total || (Number(o.referencePrice || 0) + Number(o.freightFee || 0))),
          status: o.status || "pedido",
          paymentMethod: o.paymentMethod || "pix",
        }));
        return { success: true, orders: normalized };
      } else if (data.success && data.rawCSV) {
        const parsed = parseOrdersFromCSV(data.rawCSV);
        return { success: true, orders: parsed };
      } else if (data.success && Array.isArray(data.orders) && data.orders.length === 0) {
        return { success: true, orders: [] };
      } else if (data.error) {
        return { success: false, orders: [], message: data.error };
      }
    }
  } catch (backendErr) {
    console.warn("Backend proxy /api/sync-sheets unavailable, trying direct fetch:", backendErr);
  }

  // 2. Direct browser fallback
  try {
    let directUrl = target || (folder.includes("spreadsheets") ? folder : "");
    const sheetIdMatch = directUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/) || (sheetId ? [null, sheetId] : null);

    if (sheetIdMatch && sheetIdMatch[1]) {
      directUrl = `https://docs.google.com/spreadsheets/d/${sheetIdMatch[1]}/export?format=csv`;
    } else if (directUrl.includes("script.google.com")) {
      const separator = directUrl.includes("?") ? "&" : "?";
      directUrl = `${directUrl}${separator}_t=${Date.now()}`;
    }

    if (directUrl) {
      const response = await fetch(directUrl, {
        method: "GET",
        headers: { Accept: "application/json, text/csv, */*" },
      });

      if (response.ok) {
        const text = await response.text();
        try {
          const data = JSON.parse(text);
          if (data && Array.isArray(data.orders)) {
            return { success: true, orders: data.orders };
          } else if (Array.isArray(data)) {
            return { success: true, orders: data };
          }
        } catch {
          const orders = parseOrdersFromCSV(text);
          if (orders.length > 0) {
            return { success: true, orders };
          }
        }
      }
    }

    return {
      success: false,
      orders: [],
      message: "Nenhum dado retornado da planilha. Verifique a URL e as permissões de acesso.",
    };
  } catch (err: any) {
    console.error("Erro ao buscar pedidos do Google Sheets:", err);
    return {
      success: false,
      orders: [],
      message:
        err.message ||
        "Falha ao conectar com a planilha. Verifique se o script no Google Sheets foi implantado com acesso para 'Qualquer Pessoa' (Anyone).",
    };
  }
}

/**
 * Normalizes Brazilian and international date formats to standard ISO string
 */
export function normalizeDate(rawDate?: string): string {
  if (!rawDate || !rawDate.trim()) return new Date().toISOString();
  const trimmed = rawDate.trim();

  // 1. Brazilian format: dd/MM/yyyy or dd/MM/yyyy HH:mm[:ss]
  const brMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (brMatch) {
    const day = parseInt(brMatch[1], 10);
    const month = parseInt(brMatch[2], 10) - 1;
    let year = parseInt(brMatch[3], 10);
    if (year < 100) year += 2000;
    const hour = brMatch[4] ? parseInt(brMatch[4], 10) : 12;
    const min = brMatch[5] ? parseInt(brMatch[5], 10) : 0;
    const sec = brMatch[6] ? parseInt(brMatch[6], 10) : 0;
    const d = new Date(year, month, day, hour, min, sec);
    if (!isNaN(d.getTime())) return d.toISOString();
  }

  // 2. Standard ISO / JS parseable
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) return d.toISOString();

  return new Date().toISOString();
}

/**
 * Intelligent merger for orders: avoids duplicate orders by orderNumber or id
 */
export function mergeOrders(
  existingOrders: KanbanOrder[],
  incomingOrders: KanbanOrder[]
): { merged: KanbanOrder[]; addedCount: number; updatedCount: number } {
  let addedCount = 0;
  let updatedCount = 0;

  const existingMap = new Map<string, KanbanOrder>();
  existingOrders.forEach((o) => {
    const key = (o.orderNumber || o.id).toLowerCase().trim();
    existingMap.set(key, o);
  });

  incomingOrders.forEach((incoming) => {
    const key = (incoming.orderNumber || incoming.id).toLowerCase().trim();
    if (existingMap.has(key)) {
      const current = existingMap.get(key)!;
      existingMap.set(key, {
        ...current,
        ...incoming,
        photoProofUrl: incoming.photoProofUrl || current.photoProofUrl,
      });
      updatedCount++;
    } else {
      existingMap.set(key, incoming);
      addedCount++;
    }
  });

  const merged = Array.from(existingMap.values()).sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });

  return { merged, addedCount, updatedCount };
}

/**
 * Parses raw CSV string (from Google Sheets export or uploaded CSV file) into KanbanOrder array
 */
export function parseOrdersFromCSV(csvContent: string): KanbanOrder[] {
  if (!csvContent || !csvContent.trim()) return [];

  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length <= 1) return [];

  // Auto-detect delimiter: comma, semicolon, or tab
  const firstLine = lines[0];
  const countCommas = (firstLine.match(/,/g) || []).length;
  const countSemicolons = (firstLine.match(/;/g) || []).length;
  const countTabs = (firstLine.match(/\t/g) || []).length;

  let delimiter = ",";
  if (countSemicolons > countCommas && countSemicolons > countTabs) {
    delimiter = ";";
  } else if (countTabs > countCommas && countTabs > countSemicolons) {
    delimiter = "\t";
  }

  // Helper to parse CSV line respecting quotes
  const parseCSVLine = (text: string, delim: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        if (inQuotes && text[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delim && !inQuotes) {
        result.push(current.trim().replace(/^"|"$/g, ""));
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^"|"$/g, ""));
    return result;
  };

  // Normalize string for fuzzy header comparison
  const normalizeHeader = (h: string) =>
    h
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  const headers = parseCSVLine(lines[0], delimiter).map(normalizeHeader);

  const findCol = (keywords: string[]): number => {
    const normKeywords = keywords.map((k) =>
      k
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
    );
    for (const kw of normKeywords) {
      const idx = headers.findIndex((h) => h.includes(kw));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const idxOrderNum = findCol(["numero", "pedido", "codigo", "n.", "nº"]);
  const idxDate = findCol(["data criacao", "data e hora", "data cadastro", "timestamp", "carimbo", "data"]);
  const idxCustomer = findCol(["cliente", "remetente", "nome", "comprador"]);
  const idxPhone = findCol(["whatsapp", "telefone", "celular", "contato"]);
  const idxBirth = findCol(["aniversario", "nascimento"]);
  const idxProduct = findCol(["produto", "arranjo", "item", "escolhido"]);
  const idxCategory = findCol(["categoria"]);
  const idxRefPrice = findCol(["referencia", "preco referencia", "valor do produto", "preco do produto", "valor referencia"]);
  const idxFreight = findCol(["custo de frete", "taxa de frete", "frete", "entrega"]);
  const idxTotal = findCol(["valor total", "total estimado", "total"]);
  const idxAddress = findCol(["endereco", "rua", "local"]);
  const idxNeighborhood = findCol(["bairro"]);
  const idxCity = findCol(["cidade", "municipio"]);
  const idxDeliveryDate = findCol(["data de entrega", "horario", "previsao", "turno"]);
  const idxCard = findCol(["mensagem", "cartao", "dedicatoria"]);
  const idxPayment = findCol(["forma pagamento", "pagamento", "meio"]);
  const idxStatus = findCol(["status", "situacao", "etapa"]);

  const orders: KanbanOrder[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i], delimiter);
    if (cols.length === 0 || cols.every((c) => !c)) continue;

    const orderNum = (idxOrderNum !== -1 && cols[idxOrderNum]) || `#PAP-${1000 + i}`;
    const rawDate = idxDate !== -1 && cols[idxDate] ? cols[idxDate] : "";
    const createdAt = normalizeDate(rawDate);

    const customerName = (idxCustomer !== -1 && cols[idxCustomer]) || "Cliente";
    const phone = (idxPhone !== -1 && cols[idxPhone]) || "";
    const birth = (idxBirth !== -1 && cols[idxBirth]) || "";
    const product = (idxProduct !== -1 && cols[idxProduct]) || "Arranjo de Flores";
    const category = (idxCategory !== -1 && cols[idxCategory]) || "Arranjos";

    const parseNum = (val: string): number => {
      if (!val) return 0;
      const clean = val.replace(/R\$/gi, "").replace(/\s/g, "").replace(",", ".");
      const n = parseFloat(clean);
      return isNaN(n) ? 0 : n;
    };

    const refPrice = idxRefPrice !== -1 ? parseNum(cols[idxRefPrice]) : 0;
    const freightFee = idxFreight !== -1 ? parseNum(cols[idxFreight]) : 0;
    let totalPrice = idxTotal !== -1 ? parseNum(cols[idxTotal]) : 0;
    if (totalPrice === 0) totalPrice = refPrice + freightFee;

    const address = (idxAddress !== -1 && cols[idxAddress]) || "";
    const neighborhood = (idxNeighborhood !== -1 && cols[idxNeighborhood]) || "";
    const city = (idxCity !== -1 && cols[idxCity]) || "Pirapora";
    const deliveryDate = (idxDeliveryDate !== -1 && cols[idxDeliveryDate]) || "";
    const cardMsg = (idxCard !== -1 && cols[idxCard]) || "";
    const paymentRaw = (idxPayment !== -1 && cols[idxPayment] ? cols[idxPayment].toLowerCase() : "");
    let paymentMethod: "pix" | "cartao" | "dinheiro" = "pix";
    if (paymentRaw.includes("cart") || paymentRaw.includes("cred") || paymentRaw.includes("deb")) {
      paymentMethod = "cartao";
    } else if (paymentRaw.includes("dinh") || paymentRaw.includes("esp")) {
      paymentMethod = "dinheiro";
    }
    const statusRaw = (idxStatus !== -1 && cols[idxStatus] ? cols[idxStatus].toLowerCase() : "pedido");

    let status: KanbanOrder["status"] = "pedido";
    if (statusRaw.includes("conf") || statusRaw.includes("pago") || statusRaw.includes("prod") || statusRaw.includes("bancada")) {
      status = "confirmado";
    } else if (statusRaw.includes("rota") || statusRaw.includes("saiu") || statusRaw.includes("andamento")) {
      status = "em_andamento";
    } else if (statusRaw.includes("conc") || statusRaw.includes("entr") || statusRaw.includes("final")) {
      status = "concluido";
    }

    orders.push({
      id: `csv-${Date.now()}-${i}-${orderNum.replace(/[^a-zA-Z0-9]/g, "")}`,
      orderNumber: orderNum,
      createdAt,
      customerName,
      customerPhone: phone,
      customerBirthDate: birth,
      productName: product,
      category,
      referencePrice: refPrice,
      freightFee,
      totalPrice,
      deliveryAddress: address,
      deliveryNeighborhood: neighborhood,
      deliveryCity: city,
      deliveryDate,
      cardMessage: cardMsg,
      paymentMethod,
      status,
    });
  }

  return orders;
}

/**
 * Generates official Google Sheets template for Floricultura Papoula Orders
 * Ready for direct upload to Google Drive
 */
export function downloadOfficialSpreadsheetTemplate() {
  const headers = [
    "Data e Hora",
    "Numero do Pedido",
    "Produto Escolhido",
    "Valor do Produto (R$)",
    "Taxa de Frete (R$)",
    "Valor Total (R$)",
    "Nome do Remetente",
    "WhatsApp do Remetente",
    "Nome do Destinatario",
    "Telefone Destinatario",
    "Cidade de Entrega",
    "Endereco Completo",
    "Bairro",
    "Ponto de Referencia",
    "Horario Solicitado",
    "Mensagem do Cartao",
    "Forma de Pagamento",
    "Status do Pedido",
  ];

  const sampleRow = [
    `"${new Date().toLocaleString("pt-BR")}"`,
    `"#PAP-1001"`,
    `"Buquê 12 Rosas Vermelhas Luxo"`,
    `"180,00"`,
    `"10,00"`,
    `"190,00"`,
    `"Carlos Eduardo"`,
    `"(38) 99999-0000"`,
    `"Mariana Silva"`,
    `"(38) 98888-1111"`,
    `"Pirapora"`,
    `"Rua Montes Claros, 240"`,
    `"Centro"`,
    `"Próximo à Praça dos Cariris"`,
    `"Hoje - O quanto antes"`,
    `"Com todo meu amor e carinho! Feliz aniversário!"`,
    `"PIX"`,
    `"Pendente Confirmação PIX"`,
  ];

  const content = [headers.join(","), sampleRow.join(",")].join("\n");
  downloadCSV("Planilha_Pedidos_Floricultura_Papoula.csv", content);
}

/**
 * Generates ready-to-copy Google Sheets CSV for Orders
 */
export function exportOrdersToCSV(orders: KanbanOrder[]): string {
  const headers = [
    "Numero Pedido",
    "Data Criacao",
    "Cliente",
    "WhatsApp",
    "Aniversario Cliente",
    "Produto / Arranjo",
    "Categoria",
    "Preco Referencia Item (R$)",
    "Custo de Frete (R$)",
    "Valor Total Estimado (R$)",
    "Endereco de Entrega",
    "Cidade",
    "Data de Entrega",
    "Mensagem do Cartao",
    "Forma Pagamento",
    "Status Kanban",
    "Foto Conclusao"
  ];

  const rows = orders.map((o) => {
    const freight = o.freightFee !== undefined ? o.freightFee : (o.deliveryCity?.includes("Buritizeiro") ? 15.0 : 10.0);
    const refPrice = o.referencePrice !== undefined ? o.referencePrice : Math.max(0, (o.totalPrice || 0) - freight);
    const total = o.totalPrice !== undefined ? o.totalPrice : (refPrice + freight);

    return [
      `"${o.orderNumber}"`,
      `"${o.createdAt ? new Date(o.createdAt).toLocaleString("pt-BR") : ""}"`,
      `"${o.customerName || ""}"`,
      `"${o.customerPhone || ""}"`,
      `"${o.customerBirthDate || ""}"`,
      `"${o.productName || ""}"`,
      `"${o.category || ""}"`,
      `"${refPrice.toFixed(2)}"`,
      `"${freight.toFixed(2)}"`,
      `"${total.toFixed(2)}"`,
      `"${o.deliveryAddress || ""}"`,
      `"${o.deliveryCity || ""}"`,
      `"${o.deliveryDate || ""}"`,
      `"${(o.cardMessage || "").replace(/"/g, '""')}"`,
      `"${o.paymentMethod || "pix"}"`,
      `"${o.status}"`,
      `"${o.photoProofUrl || ""}"`
    ];
  });

  return [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
}

/**
 * Generates ready-to-copy Google Sheets CSV for Customers (with Birthdays for VIP promos)
 */
export function exportCustomersToCSV(customers: Customer[]): string {
  const headers = [
    "Nome Completo",
    "WhatsApp / Telefone",
    "Data de Aniversario",
    "Data Cadastro",
    "Total Pedidos",
    "Observacoes / Mimos"
  ];

  const rows = customers.map((c) => [
    `"${c.fullName}"`,
    `"${c.phone}"`,
    `"${c.birthDate || ""}"`,
    `"${c.createdAt ? new Date(c.createdAt).toLocaleDateString("pt-BR") : ""}"`,
    `"${c.totalOrders || 0}"`,
    `"${(c.notes || "").replace(/"/g, '""')}"`
  ]);

  return [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
}

/**
 * Triggers file download in browser
 */
export function downloadCSV(filename: string, content: string) {
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
