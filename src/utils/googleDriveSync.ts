import { KanbanOrder, Customer, Product, Category, GoogleDriveConfig } from "../types";

/**
 * Sends single order payload to Google Apps Script Webhook (POST)
 */
export async function sendOrderToGoogleSheetsWebhook(
  webhookUrl: string,
  orderData: {
    orderNumber?: string;
    productName: string;
    category?: string;
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
    photoProofUrl?: string;
  }
): Promise<boolean> {
  if (!webhookUrl || !webhookUrl.trim() || !webhookUrl.startsWith("http")) {
    return false;
  }

  try {
    const cleanUrl = webhookUrl.trim();
    // 1. Try sending via backend proxy
    const proxyRes = await fetch("/api/sync-sheets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: cleanUrl,
        action: "newOrder",
        ...orderData,
      }),
    });

    if (proxyRes.ok) {
      return true;
    }
  } catch (err) {
    console.warn("Backend proxy failed for order webhook, falling back to direct POST:", err);
  }

  try {
    const cleanUrl = webhookUrl.trim();
    // Using no-cors as client-side fallback
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
 * Sends Catalog (Products) to Google Apps Script Webhook (POST) to save into the "Catalogo" sheet
 */
export async function syncCatalogToGoogleSheets(
  webhookUrl: string,
  products: Product[]
): Promise<{ success: boolean; message: string }> {
  if (!webhookUrl || !webhookUrl.trim() || !webhookUrl.startsWith("http")) {
    return {
      success: false,
      message: "URL do Webhook do Google Apps Script não informada ou inválida.",
    };
  }

  try {
    const res = await fetch("/api/sync-sheets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: webhookUrl.trim(),
        action: "syncCatalog",
        products: products,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return {
          success: true,
          message: data.message || `Catálogo com ${products.length} produtos salvo com sucesso na aba 'Catalogo' da sua Planilha!`,
        };
      }
    }
  } catch (backendErr) {
    console.warn("Backend proxy error on syncCatalog, trying direct post:", backendErr);
  }

  // Direct client fallback
  try {
    await fetch(webhookUrl.trim(), {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "syncCatalog",
        products: products,
      }),
    });
    return {
      success: true,
      message: `Comando de sincronização do catálogo enviado para a Planilha (${products.length} itens)!`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Erro ao sincronizar catálogo com a Planilha.",
    };
  }
}

/**
 * Sends Categories to Google Apps Script Webhook (POST) to save into the "Categorias" sheet
 */
export async function syncCategoriesToGoogleSheets(
  webhookUrl: string,
  categories: Category[]
): Promise<{ success: boolean; message: string }> {
  if (!webhookUrl || !webhookUrl.trim() || !webhookUrl.startsWith("http")) {
    return {
      success: false,
      message: "URL do Webhook do Google Apps Script não informada ou inválida.",
    };
  }

  try {
    const res = await fetch("/api/sync-sheets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: webhookUrl.trim(),
        action: "syncCategories",
        categories: categories,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return {
          success: true,
          message: data.message || `Total de ${categories.length} categorias salvas com sucesso na aba 'Categorias' da sua Planilha!`,
        };
      }
    }
  } catch (backendErr) {
    console.warn("Backend proxy error on syncCategories:", backendErr);
  }

  // Direct client fallback
  try {
    await fetch(webhookUrl.trim(), {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "syncCategories",
        categories: categories,
      }),
    });
    return {
      success: true,
      message: `Comando de sincronização das categorias enviado para a Planilha (${categories.length} categorias)!`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Erro ao sincronizar categorias com a Planilha.",
    };
  }
}

/**
 * Sends Everything (Orders, Catalog & Categories) to Google Sheets in one batch
 */
export async function syncAllToGoogleSheets(
  webhookUrl: string,
  data: {
    orders?: KanbanOrder[];
    products?: Product[];
    categories?: Category[];
    customers?: Customer[];
  }
): Promise<{ success: boolean; message: string }> {
  if (!webhookUrl || !webhookUrl.trim() || !webhookUrl.startsWith("http")) {
    return {
      success: false,
      message: "URL do Webhook do Google Apps Script não informada.",
    };
  }

  try {
    const res = await fetch("/api/sync-sheets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: webhookUrl.trim(),
        action: "syncAll",
        ...data,
      }),
    });

    if (res.ok) {
      const respData = await res.json();
      if (respData.success) {
        return {
          success: true,
          message: respData.message || "Pedidos, Catálogo e Categorias sincronizados com sucesso na Planilha Google!",
        };
      }
    }
  } catch (err) {
    console.warn("Backend error on syncAll:", err);
  }

  // Fallback client POST
  try {
    await fetch(webhookUrl.trim(), {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "syncAll",
        ...data,
      }),
    });
    return {
      success: true,
      message: "Dados de Catálogo, Categorias e Pedidos enviados para a Planilha Google!",
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Erro ao sincronizar tudo com a Planilha.",
    };
  }
}

/**
 * Fetches all orders, products and categories from Google Sheets Webhook via backend proxy
 */
export async function fetchStoreDataFromGoogleSheets(
  webhookUrl?: string,
  spreadsheetId?: string,
  folderUrl?: string
): Promise<{
  success: boolean;
  orders?: KanbanOrder[];
  products?: Product[];
  categories?: Category[];
  message?: string;
}> {
  const target = (webhookUrl || "").trim();
  const sheetId = (spreadsheetId || "").trim();
  const folder = (folderUrl || "").trim();

  if (!target && !sheetId && !folder) {
    return {
      success: false,
      message: "Por favor, informe a URL do Webhook do Google Apps Script ou o Link da Planilha nas configurações.",
    };
  }

  try {
    const apiRes = await fetch("/api/sync-sheets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: target,
        spreadsheetId: sheetId,
        folderUrl: folder,
        action: "getData",
      }),
    });

    if (apiRes.ok) {
      const data = await apiRes.json();
      if (data.success) {
        let orders: KanbanOrder[] = [];
        let products: Product[] = [];
        let categories: Category[] = [];

        if (Array.isArray(data.orders)) {
          orders = data.orders.map((o: any, idx: number) => ({
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
        } else if (data.rawCSV) {
          orders = parseOrdersFromCSV(data.rawCSV);
        }

        if (Array.isArray(data.catalog) || Array.isArray(data.products)) {
          const rawProds = data.catalog || data.products;
          products = rawProds.map((p: any) => ({
            ...p,
            id: p.id || `prod-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name: p.name || "Produto",
            slug: p.slug || (p.name ? p.name.toLowerCase().replace(/[^a-z0-9]/g, "-") : "produto"),
            category: p.category || "geral",
            price: p.price !== undefined && p.price !== "" ? Number(p.price) : undefined,
            referencePrice: p.referencePrice !== undefined && p.referencePrice !== "" ? Number(p.referencePrice) : undefined,
            originalPrice: p.originalPrice !== undefined && p.originalPrice !== "" ? Number(p.originalPrice) : undefined,
            isPriceOnDemand: p.isPriceOnDemand === true || String(p.isPriceOnDemand).toLowerCase() === "sim",
            imageUrl: p.imageUrl || "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80",
            description: p.description || "",
            details: p.details || { itemsIncluded: [], careInstructions: "" },
            tags: Array.isArray(p.tags) ? p.tags : (typeof p.tags === "string" ? p.tags.split(",").map((t: string) => t.trim()) : []),
            rating: Number(p.rating || 5),
            reviewCount: Number(p.reviewCount || 0),
            inStock: p.inStock !== false && String(p.inStock).toLowerCase() !== "nao",
            orderCount: Number(p.orderCount || 10),
            occasion: Array.isArray(p.occasion) ? p.occasion : [],
            flowerType: Array.isArray(p.flowerType) ? p.flowerType : [],
          }));
        } else if (data.productsCSV) {
          products = parseCatalogFromCSV(data.productsCSV);
        }

        if (Array.isArray(data.categories)) {
          categories = data.categories.map((c: any) => ({
            id: c.id || c.slug || `cat-${Date.now()}`,
            name: c.name || "Categoria",
            slug: c.slug || (c.name ? c.name.toLowerCase().replace(/[^a-z0-9]/g, "-") : "categoria"),
            icon: c.icon || "🌸",
            description: c.description || "",
            active: c.active !== false && String(c.active).toLowerCase() !== "nao",
          }));
        } else if (data.categoriesCSV) {
          categories = parseCategoriesFromCSV(data.categoriesCSV);
        }

        return {
          success: true,
          orders,
          products,
          categories,
        };
      } else {
        return {
          success: false,
          orders: [],
          products: [],
          categories: [],
          message: data.error || data.message || "Não foi possível carregar dados da planilha Google.",
        };
      }
    }
  } catch (err: any) {
    console.warn("fetchStoreDataFromGoogleSheets error:", err);
  }

  // Fallback to fetchOrdersFromGoogleSheets via backend
  const ordersResult = await fetchOrdersFromGoogleSheets(target, sheetId, folder);
  return {
    success: ordersResult.success,
    orders: ordersResult.orders,
    message: ordersResult.message,
  };
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
  } catch (backendErr: any) {
    console.warn("Backend proxy /api/sync-sheets error:", backendErr);
  }

  return {
    success: false,
    orders: [],
    message: "Não foi possível conectar à planilha. Verifique a URL do Webhook e se o Apps Script foi implantado como 'Qualquer pessoa'.",
  };
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
 * Helper to parse CSV line respecting quotes
 */
function parseCSVLine(text: string, delim: string): string[] {
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

  // Auto-detect delimiter
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
 * Generates ready-to-copy Google Sheets CSV for Orders (Pedidos)
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
 * Generates ready-to-copy Google Sheets CSV for Catalog (Catálogo de Produtos)
 */
export function exportCatalogToCSV(products: Product[]): string {
  const headers = [
    "ID / Codigo",
    "Nome do Produto",
    "Slug",
    "Categoria",
    "Preco Venda (R$)",
    "Preco Referencia (R$)",
    "Preco Original (R$)",
    "Sob Consulta",
    "Ocasioes",
    "Tipos de Flor",
    "URL da Imagem",
    "Descricao",
    "Itens Inclusos",
    "Instrucoes de Cuidado",
    "Tags",
    "Avaliacao",
    "Total Avaliacoes",
    "Em Estoque",
    "Total Pedidos"
  ];

  const rows = products.map((p) => {
    return [
      `"${p.id || ""}"`,
      `"${(p.name || "").replace(/"/g, '""')}"`,
      `"${p.slug || ""}"`,
      `"${(p.category || "").replace(/"/g, '""')}"`,
      `"${p.price !== undefined ? p.price.toFixed(2) : ""}"`,
      `"${p.referencePrice !== undefined ? p.referencePrice.toFixed(2) : ""}"`,
      `"${p.originalPrice !== undefined ? p.originalPrice.toFixed(2) : ""}"`,
      `"${p.isPriceOnDemand ? "Sim" : "Nao"}"`,
      `"${(p.occasion || []).join(", ")}"`,
      `"${(p.flowerType || []).join(", ")}"`,
      `"${p.imageUrl || ""}"`,
      `"${(p.description || "").replace(/"/g, '""')}"`,
      `"${(p.details?.itemsIncluded || []).join("; ").replace(/"/g, '""')}"`,
      `"${(p.details?.careInstructions || "").replace(/"/g, '""')}"`,
      `"${(p.tags || []).join(", ")}"`,
      `"${p.rating || 5}"`,
      `"${p.reviewCount || 0}"`,
      `"${p.inStock !== false ? "Sim" : "Nao"}"`,
      `"${p.orderCount || 0}"`
    ];
  });

  return [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
}

/**
 * Parses raw CSV into Product array
 */
export function parseCatalogFromCSV(csvContent: string): Product[] {
  if (!csvContent || !csvContent.trim()) return [];

  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length <= 1) return [];

  const firstLine = lines[0];
  const countCommas = (firstLine.match(/,/g) || []).length;
  const countSemicolons = (firstLine.match(/;/g) || []).length;
  const delimiter = countSemicolons > countCommas ? ";" : ",";

  const normalizeHeader = (h: string) =>
    h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  const headers = parseCSVLine(lines[0], delimiter).map(normalizeHeader);

  const findCol = (keywords: string[]): number => {
    const normKeywords = keywords.map((k) =>
      k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    );
    for (const kw of normKeywords) {
      const idx = headers.findIndex((h) => h.includes(kw));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const idxId = findCol(["id", "codigo"]);
  const idxName = findCol(["nome", "produto", "titulo", "arranjo"]);
  const idxSlug = findCol(["slug"]);
  const idxCategory = findCol(["categoria"]);
  const idxPrice = findCol(["preco venda", "preco", "valor"]);
  const idxRefPrice = findCol(["referencia", "preco referencia"]);
  const idxOrigPrice = findCol(["original", "de"]);
  const idxOnDemand = findCol(["consulta", "sob consulta", "demanda"]);
  const idxOccasion = findCol(["ocasiao", "ocasioes"]);
  const idxFlowerType = findCol(["tipo flor", "flores", "tipo de flor"]);
  const idxImage = findCol(["imagem", "foto", "url", "image"]);
  const idxDesc = findCol(["descricao", "detalhe"]);
  const idxItems = findCol(["itens inclusos", "incluso", "itens"]);
  const idxCare = findCol(["cuidado", "instrucoes"]);
  const idxTags = findCol(["tag", "etiqueta"]);
  const idxStock = findCol(["estoque", "disponivel"]);
  const idxOrders = findCol(["pedidos", "total pedidos", "vendas"]);

  const products: Product[] = [];

  const parseNum = (val: string): number | undefined => {
    if (!val || !val.trim()) return undefined;
    const clean = val.replace(/R\$/gi, "").replace(/\s/g, "").replace(",", ".");
    const n = parseFloat(clean);
    return isNaN(n) ? undefined : n;
  };

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i], delimiter);
    if (cols.length === 0 || cols.every((c) => !c)) continue;

    const name = (idxName !== -1 && cols[idxName]) || `Arranjo #${i}`;
    const id = (idxId !== -1 && cols[idxId]) || `prod-${Date.now()}-${i}`;
    const slug = (idxSlug !== -1 && cols[idxSlug]) || name.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const category = (idxCategory !== -1 && cols[idxCategory]) || "buques-de-rosas";

    const price = idxPrice !== -1 ? parseNum(cols[idxPrice]) : undefined;
    const referencePrice = idxRefPrice !== -1 ? parseNum(cols[idxRefPrice]) : undefined;
    const originalPrice = idxOrigPrice !== -1 ? parseNum(cols[idxOrigPrice]) : undefined;
    const isPriceOnDemand = idxOnDemand !== -1 ? (cols[idxOnDemand].toLowerCase().includes("sim") || cols[idxOnDemand].toLowerCase().includes("true")) : (price === undefined);

    const occasion = idxOccasion !== -1 && cols[idxOccasion] ? cols[idxOccasion].split(",").map((s) => s.trim()) : ["romance", "aniversario"];
    const flowerType = idxFlowerType !== -1 && cols[idxFlowerType] ? cols[idxFlowerType].split(",").map((s) => s.trim()) : ["rosas"];
    const imageUrl = (idxImage !== -1 && cols[idxImage]) || "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80";
    const description = (idxDesc !== -1 && cols[idxDesc]) || "";
    const itemsIncluded = idxItems !== -1 && cols[idxItems] ? cols[idxItems].split(";").map((s) => s.trim()) : [];
    const careInstructions = (idxCare !== -1 && cols[idxCare]) || "Manter em local fresco com água limpa trocada a cada dois dias.";
    const tags = idxTags !== -1 && cols[idxTags] ? cols[idxTags].split(",").map((s) => s.trim()) : ["Entrega Hoje"];
    const inStock = idxStock !== -1 ? !cols[idxStock].toLowerCase().includes("nao") : true;
    const orderCount = idxOrders !== -1 ? (parseNum(cols[idxOrders]) || 10) : 10;

    products.push({
      id,
      name,
      slug,
      category,
      price,
      referencePrice,
      originalPrice,
      isPriceOnDemand,
      occasion,
      flowerType,
      imageUrl,
      description,
      details: {
        itemsIncluded,
        careInstructions,
      },
      tags,
      rating: 5,
      reviewCount: orderCount,
      inStock,
      orderCount,
    });
  }

  return products;
}

/**
 * Generates ready-to-copy Google Sheets CSV for Categories (Categorias)
 */
export function exportCategoriesToCSV(categories: Category[]): string {
  const headers = [
    "ID / Slug",
    "Nome da Categoria",
    "Icone / Emoji",
    "Descricao",
    "Ativo"
  ];

  const rows = categories.map((c) => {
    return [
      `"${c.id || c.slug}"`,
      `"${(c.name || "").replace(/"/g, '""')}"`,
      `"${c.icon || "🌸"}"`,
      `"${(c.description || "").replace(/"/g, '""')}"`,
      `"${c.active !== false ? "Sim" : "Nao"}"`
    ];
  });

  return [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
}

/**
 * Parses raw CSV into Category array
 */
export function parseCategoriesFromCSV(csvContent: string): Category[] {
  if (!csvContent || !csvContent.trim()) return [];

  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length <= 1) return [];

  const firstLine = lines[0];
  const delimiter = firstLine.includes(";") ? ";" : ",";

  const normalizeHeader = (h: string) =>
    h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  const headers = parseCSVLine(lines[0], delimiter).map(normalizeHeader);

  const findCol = (keywords: string[]): number => {
    const normKeywords = keywords.map((k) =>
      k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    );
    for (const kw of normKeywords) {
      const idx = headers.findIndex((h) => h.includes(kw));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const idxId = findCol(["id", "slug", "codigo"]);
  const idxName = findCol(["nome", "categoria", "titulo"]);
  const idxIcon = findCol(["icone", "emoji", "icon"]);
  const idxDesc = findCol(["descricao", "detalhes"]);
  const idxActive = findCol(["ativo", "status", "visivel"]);

  const categories: Category[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i], delimiter);
    if (cols.length === 0 || cols.every((c) => !c)) continue;

    const name = (idxName !== -1 && cols[idxName]) || `Categoria ${i}`;
    const slug = (idxId !== -1 && cols[idxId]) || name.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const icon = (idxIcon !== -1 && cols[idxIcon]) || "🌸";
    const description = (idxDesc !== -1 && cols[idxDesc]) || "";
    const active = idxActive !== -1 ? !cols[idxActive].toLowerCase().includes("nao") : true;

    categories.push({
      id: slug,
      slug,
      name,
      icon,
      description,
      active,
    });
  }

  return categories;
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
 * Generates official multi-section Google Sheets template for Floricultura Papoula
 * containing Orders, Catalog and Categories headers and sample data
 */
export function downloadOfficialSpreadsheetTemplate() {
  const content = [
    `# ==========================================`,
    `# ABA 1: PEDIDOS (Copie e cole na aba 'Pedidos')`,
    `# ==========================================`,
    exportOrdersToCSV([
      {
        id: "sample-1",
        orderNumber: "#PAP-1001",
        customerName: "Carlos Eduardo",
        customerPhone: "(38) 99999-0000",
        customerBirthDate: "15/05/1990",
        productName: "Buquê 12 Rosas Vermelhas Luxo",
        category: "Buquês de Rosas",
        referencePrice: 180.0,
        freightFee: 10.0,
        totalPrice: 190.0,
        deliveryAddress: "Rua Montes Claros, 240",
        deliveryNeighborhood: "Centro",
        deliveryCity: "Pirapora",
        deliveryDate: "Hoje - Imediato",
        cardMessage: "Com todo meu amor e carinho! Feliz aniversário!",
        paymentMethod: "pix",
        status: "confirmado",
        createdAt: new Date().toISOString(),
      },
    ]),
    `\n\n# ==========================================`,
    `# ABA 2: CATALOGO (Copie e cole na aba 'Catalogo')`,
    `# ==========================================`,
    exportCatalogToCSV([
      {
        id: "buque-12-rosas",
        name: "Buquê 12 Rosas Vermelhas Luxo",
        slug: "buque-12-rosas",
        category: "buques-de-rosas",
        price: 180.0,
        referencePrice: 180.0,
        isPriceOnDemand: false,
        occasion: ["romance", "aniversario"],
        flowerType: ["rosas"],
        imageUrl: "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80",
        description: "Arranjo exuberante com 12 botões selecionados de rosas vermelhas nobres e folhagens de eucalipto.",
        details: {
          itemsIncluded: ["12 Rosas Vermelhas", "Folhagens de Eucalipto", "Laço de Cetim", "Embalagem Nobre"],
          careInstructions: "Troque a água do vaso em dias alternados.",
        },
        tags: ["Mais Vendido", "Entrega Hoje"],
        rating: 5,
        reviewCount: 48,
        inStock: true,
        orderCount: 48,
      },
    ]),
    `\n\n# ==========================================`,
    `# ABA 3: CATEGORIAS (Copie e cole na aba 'Categorias')`,
    `# ==========================================`,
    exportCategoriesToCSV([
      { id: "buques-de-rosas", slug: "buques-de-rosas", name: "Buquês de Rosas", icon: "🌹", description: "Buquês artesanais de rosas vermelhas e nobres.", active: true },
      { id: "girassois", slug: "girassois", name: "Girassóis & Combinações", icon: "🌻", description: "Buquês luminosos de girassóis.", active: true },
      { id: "flores-do-campo", slug: "flores-do-campo", name: "Gérberas & Flores do Campo", icon: "💐", description: "Composições florais exuberantes.", active: true },
    ]),
  ].join("\n");

  downloadCSV("Planilha_Completa_Floricultura_Papoula.csv", content);
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

/**
 * Complete Google Apps Script Master Code for multi-tab support with automatic tab and column creation
 */
export const GOOGLE_APPS_SCRIPT_MASTER_CODE = `/**
 * =========================================================================
 * FLORICULTURA PAPOULA - GOOGLE APPS SCRIPT WEB APP MULTI-ABAS
 * Integração Oficial Automática: Produtos, Categorias, Pedidos e Clientes
 * =========================================================================
 * 
 * Este script cria AUTOMATICAMENTE todas as abas e colunas necessárias na planilha:
 *   1. "Produtos"   -> Catálogo de flores, fotos, preços, estoque e detalhes
 *   2. "Categorias" -> Categorias de presentes e flores com ícones e status
 *   3. "Pedidos"    -> Pedidos recebidos via WhatsApp e loja virtual
 *   4. "Clientes"   -> Cadastro de clientes com datas de aniversário
 * 
 * INSTRUÇÕES:
 * 1. Na sua Planilha Google, acesse no menu superior: Extensões > Apps Script.
 * 2. Apague tudo o que estiver lá, cole este código completo e clique em Salvar (ícone do disquete).
 * 3. Clique no botão azul "Implantar" (Deploy) > "Nova implantação".
 * 4. Tipo de implantação: "Aplicativo da Web" (Web App).
 * 5. Executar como: "Eu" (Seu e-mail).
 * 6. Quem pode acessar: "Qualquer pessoa" (Anyone) - IMPORTANTE!
 * 7. Clique em "Implantar", copie a URL gerada (terminada em /exec) e cole no Painel Administrativo.
 */

// Configuração das colunas e abas
var SHEET_CONFIG = {
  produtos: {
    name: "Produtos",
    aliases: ["Produtos", "Catalogo", "Catálogo"],
    headers: [
      "ID / Codigo", "Nome do Produto", "Slug", "Categoria", "Preco Venda (R$)",
      "Preco Referencia (R$)", "Preco Original (R$)", "Sob Consulta", "Ocasioes",
      "Tipos de Flor", "URL da Imagem", "Descricao", "Itens Inclusos",
      "Instrucoes de Cuidado", "Tags", "Avaliacao", "Total Avaliacoes", "Em Estoque", "Total Pedidos"
    ]
  },
  categorias: {
    name: "Categorias",
    aliases: ["Categorias", "Categoria"],
    headers: [
      "ID / Slug", "Nome da Categoria", "Icone / Emoji", "Descricao", "Ativo"
    ]
  },
  pedidos: {
    name: "Pedidos",
    aliases: ["Pedidos", "Vendas"],
    headers: [
      "Numero Pedido", "Data Criacao", "Cliente / Remetente", "WhatsApp Cliente",
      "Aniversario Cliente", "Produto / Arranjo", "Categoria", "Preco Referencia Item (R$)",
      "Custo de Frete (R$)", "Valor Total Estimado (R$)", "Destinatario", "Telefone Destinatario",
      "Cidade de Entrega", "Endereco Completo", "Bairro", "Ponto de Referencia",
      "Data de Entrega", "Horario", "Mensagem do Cartao", "Forma Pagamento", "Status Kanban", "Foto Conclusao"
    ]
  },
  clientes: {
    name: "Clientes",
    aliases: ["Clientes", "Contatos"],
    headers: [
      "Nome Completo", "WhatsApp / Telefone", "Data de Aniversario", "Data Cadastro", "Total Pedidos", "Observacoes / Mimos"
    ]
  }
};

/**
 * Cria ou localiza uma aba pelo nome ou apelidos, e inicializa as colunas e formatação se estiver vazia
 */
function getOrCreateSheetWithHeaders(ss, cfgKey) {
  var cfg = SHEET_CONFIG[cfgKey];
  if (!cfg) return ss.getActiveSheet();

  var sheet = null;
  for (var a = 0; a < cfg.aliases.length; a++) {
    sheet = ss.getSheetByName(cfg.aliases[a]);
    if (sheet) break;
  }

  if (!sheet) {
    sheet = ss.insertSheet(cfg.name);
  }

  // Se a aba estiver sem cabeçalho, cria e formata
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(cfg.headers);
    formatHeaderRow(sheet, cfg.headers.length);
  }

  return sheet;
}

/**
 * Aplica estilo profissional ao cabeçalho (Verde Papoula #114b30, texto branco em negrito e linha congelada)
 */
function formatHeaderRow(sheet, numCols) {
  try {
    var range = sheet.getRange(1, 1, 1, numCols);
    range.setFontWeight("bold");
    range.setBackground("#114b30");
    range.setFontColor("#ffffff");
    range.setFontSize(10);
    sheet.setFrozenRows(1);
    for (var col = 1; col <= numCols; col++) {
      sheet.autoResizeColumn(col);
    }
  } catch (e) {}
}

/**
 * Cria e formata todas as abas necessárias de uma só vez
 */
function setupAllTabs(ss) {
  getOrCreateSheetWithHeaders(ss, "produtos");
  getOrCreateSheetWithHeaders(ss, "categorias");
  getOrCreateSheetWithHeaders(ss, "pedidos");
  getOrCreateSheetWithHeaders(ss, "clientes");
}

/**
 * Adiciona menu no Google Sheets ao abrir a planilha
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("🌸 Floricultura Papoula")
    .addItem("⚡ Criar e Atualizar Todas as Abas", "manualSetup")
    .addToUi();
}

function manualSetup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  setupAllTabs(ss);
  SpreadsheetApp.getUi().alert("Abas 'Produtos', 'Categorias', 'Pedidos' e 'Clientes' configuradas com sucesso!");
}

/**
 * Recebe comandos de sincronização e novos pedidos via POST
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(20000);
  
  try {
    var contents = e.postData ? e.postData.contents : "";
    var data = {};
    try {
      data = contents ? JSON.parse(contents) : {};
    } catch (parseErr) {
      data = {};
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Garante que todas as abas e colunas existam
    setupAllTabs(ss);

    // 1. AÇÃO: Sincronizar Tudo de uma só vez (Produtos, Categorias, Pedidos, Clientes)
    if (data.action === "syncAll" || data.initTabs === true) {
      // Sincroniza Produtos
      if (data.products && Array.isArray(data.products)) {
        var sProd = getOrCreateSheetWithHeaders(ss, "produtos");
        sProd.clearContents();
        sProd.appendRow(SHEET_CONFIG.produtos.headers);
        formatHeaderRow(sProd, SHEET_CONFIG.produtos.headers.length);

        for (var pa = 0; pa < data.products.length; pa++) {
          var pr = data.products[pa];
          sProd.appendRow([
            pr.id || "",
            pr.name || "",
            pr.slug || "",
            pr.category || "",
            pr.price !== undefined && pr.price !== null ? pr.price : "",
            pr.referencePrice !== undefined && pr.referencePrice !== null ? pr.referencePrice : "",
            pr.originalPrice !== undefined && pr.originalPrice !== null ? pr.originalPrice : "",
            pr.isPriceOnDemand ? "Sim" : "Nao",
            Array.isArray(pr.occasion) ? pr.occasion.join(", ") : (pr.occasion || ""),
            Array.isArray(pr.flowerType) ? pr.flowerType.join(", ") : (pr.flowerType || ""),
            pr.imageUrl || "",
            pr.description || "",
            pr.details && pr.details.itemsIncluded ? pr.details.itemsIncluded.join("; ") : "",
            pr.details && pr.details.careInstructions ? pr.details.careInstructions : "",
            Array.isArray(pr.tags) ? pr.tags.join(", ") : (pr.tags || ""),
            pr.rating || 5,
            pr.reviewCount || 0,
            pr.inStock !== false ? "Sim" : "Nao",
            pr.orderCount || 0
          ]);
        }
      }

      // Sincroniza Categorias
      if (data.categories && Array.isArray(data.categories)) {
        var sCatg = getOrCreateSheetWithHeaders(ss, "categorias");
        sCatg.clearContents();
        sCatg.appendRow(SHEET_CONFIG.categorias.headers);
        formatHeaderRow(sCatg, SHEET_CONFIG.categorias.headers.length);

        for (var ca = 0; ca < data.categories.length; ca++) {
          var ci = data.categories[ca];
          sCatg.appendRow([
            ci.id || ci.slug || "",
            ci.name || "",
            ci.icon || "🌸",
            ci.description || "",
            ci.active !== false ? "Sim" : "Nao"
          ]);
        }
      }

      // Sincroniza Pedidos
      if (data.orders && Array.isArray(data.orders) && data.orders.length > 0) {
        var sPed = getOrCreateSheetWithHeaders(ss, "pedidos");
        sPed.clearContents();
        sPed.appendRow(SHEET_CONFIG.pedidos.headers);
        formatHeaderRow(sPed, SHEET_CONFIG.pedidos.headers.length);

        for (var oa = 0; oa < data.orders.length; oa++) {
          var ord = data.orders[oa];
          sPed.appendRow([
            ord.orderNumber || ord.id || "",
            ord.createdAt || new Date().toISOString(),
            ord.customerName || "Cliente",
            ord.customerPhone || "",
            ord.customerBirthDate || "",
            ord.productName || "Arranjo Floral",
            ord.category || "Arranjos",
            ord.referencePrice || ord.price || 0,
            ord.freightFee || 0,
            ord.totalPrice || 0,
            ord.recipientName || ord.customerName || "",
            ord.recipientPhone || "",
            ord.deliveryCity || "Pirapora",
            ord.deliveryAddress || "",
            ord.deliveryNeighborhood || "",
            ord.reference || "",
            ord.deliveryDate || "",
            ord.timeSlot || "",
            ord.cardMessage || "",
            ord.paymentMethod || "PIX",
            ord.status || "pedido",
            ord.photoProofUrl || ""
          ]);
        }
      }

      // Sincroniza Clientes
      if (data.customers && Array.isArray(data.customers) && data.customers.length > 0) {
        var sCust = getOrCreateSheetWithHeaders(ss, "clientes");
        sCust.clearContents();
        sCust.appendRow(SHEET_CONFIG.clientes.headers);
        formatHeaderRow(sCust, SHEET_CONFIG.clientes.headers.length);

        for (var cu = 0; cu < data.customers.length; cu++) {
          var cus = data.customers[cu];
          sCust.appendRow([
            cus.fullName || "",
            cus.phone || "",
            cus.birthDate || "",
            cus.createdAt || new Date().toLocaleDateString("pt-BR"),
            cus.totalOrders || 0,
            cus.notes || ""
          ]);
        }
      }

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "Todas as abas (Produtos, Categorias, Pedidos e Clientes) foram criadas e atualizadas com sucesso na sua Planilha!"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. AÇÃO: Sincronizar apenas Catálogo de Produtos
    if (data.action === "syncCatalog" || data.action === "saveProducts") {
      var sheetProdOnly = getOrCreateSheetWithHeaders(ss, "produtos");
      sheetProdOnly.clearContents();
      sheetProdOnly.appendRow(SHEET_CONFIG.produtos.headers);
      formatHeaderRow(sheetProdOnly, SHEET_CONFIG.produtos.headers.length);
      
      var prods = Array.isArray(data.products) ? data.products : (Array.isArray(data.catalog) ? data.catalog : []);
      for (var i = 0; i < prods.length; i++) {
        var p = prods[i];
        sheetProdOnly.appendRow([
          p.id || "", p.name || "", p.slug || "", p.category || "",
          p.price !== undefined && p.price !== null ? p.price : "",
          p.referencePrice !== undefined && p.referencePrice !== null ? p.referencePrice : "",
          p.originalPrice !== undefined && p.originalPrice !== null ? p.originalPrice : "",
          p.isPriceOnDemand ? "Sim" : "Nao",
          Array.isArray(p.occasion) ? p.occasion.join(", ") : (p.occasion || ""),
          Array.isArray(p.flowerType) ? p.flowerType.join(", ") : (p.flowerType || ""),
          p.imageUrl || "", p.description || "",
          p.details && p.details.itemsIncluded ? p.details.itemsIncluded.join("; ") : "",
          p.details && p.details.careInstructions ? p.details.careInstructions : "",
          Array.isArray(p.tags) ? p.tags.join(", ") : (p.tags || ""),
          p.rating || 5, p.reviewCount || 0,
          p.inStock !== false ? "Sim" : "Nao", p.orderCount || 0
        ]);
      }
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "Aba 'Produtos' atualizada com " + prods.length + " produtos!",
        count: prods.length
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. AÇÃO: Sincronizar apenas Categorias
    if (data.action === "syncCategories" || data.action === "saveCategories") {
      var sheetCatOnly = getOrCreateSheetWithHeaders(ss, "categorias");
      sheetCatOnly.clearContents();
      sheetCatOnly.appendRow(SHEET_CONFIG.categorias.headers);
      formatHeaderRow(sheetCatOnly, SHEET_CONFIG.categorias.headers.length);
      
      var categs = Array.isArray(data.categories) ? data.categories : [];
      for (var j = 0; j < categs.length; j++) {
        var c = categs[j];
        sheetCatOnly.appendRow([
          c.id || c.slug || "",
          c.name || "",
          c.icon || "🌸",
          c.description || "",
          c.active !== false ? "Sim" : "Nao"
        ]);
      }
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "Aba 'Categorias' atualizada com " + categs.length + " categorias!",
        count: categs.length
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 4. AÇÃO: Consulta (getOrders ou getData)
    if (data.action === "getOrders" || data.action === "getData" || data.action === "getCatalog" || data.action === "getCategories") {
      return doGet(e);
    }

    // 5. PADRÃO: Novo Pedido recebido -> Salvar na Aba "Pedidos"
    var sheetPedDefault = getOrCreateSheetWithHeaders(ss, "pedidos");

    var orderNum = data.orderNumber || ("#PAP-" + Math.floor(1000 + Math.random() * 9000));
    var createdAt = data.createdAt || new Date().toISOString();
    var customerName = data.senderName || data.customerName || "Cliente";
    var customerPhone = data.senderPhone || data.customerPhone || "";
    var customerBirthDate = data.customerBirthDate || data.senderBirthDate || "";
    var productName = data.productName || "Arranjo de Flores";
    var category = data.category || "Arranjos";
    var refPrice = data.referencePrice || data.price || 0;
    var freightFee = data.deliveryFee || data.freightFee || 0;
    var totalPrice = data.total || data.totalPrice || (Number(refPrice) + Number(freightFee)) || 0;
    var recipientName = data.recipientName || customerName;
    var recipientPhone = data.recipientPhone || "";
    var city = data.city || data.deliveryCity || "Pirapora";
    var address = data.address || data.deliveryAddress || "";
    var neighborhood = data.neighborhood || data.deliveryNeighborhood || "";
    var reference = data.reference || "";
    var deliveryDate = data.deliveryDate || "";
    var timeSlot = data.timeSlot || "";
    var cardMsg = data.cardMessage || "";
    var payment = data.paymentMethod || "PIX";
    var status = data.status || "pedido";
    var photoProof = data.photoProofUrl || "";

    sheetPedDefault.appendRow([
      orderNum, createdAt, customerName, customerPhone, customerBirthDate,
      productName, category, refPrice, freightFee, totalPrice,
      recipientName, recipientPhone, city, address, neighborhood, reference,
      deliveryDate, timeSlot, cardMsg, payment, status, photoProof
    ]);

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Pedido " + orderNum + " gravado com sucesso na aba 'Pedidos'!",
      orderNumber: orderNum
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Lê pedidos, catálogo de produtos e categorias via GET
 */
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    setupAllTabs(ss);
    
    // Leitura dos Pedidos
    var sheetPedidos = ss.getSheetByName("Pedidos") || ss.getActiveSheet();
    var orders = [];
    var rowsP = sheetPedidos.getDataRange().getValues();
    if (rowsP.length > 1) {
      var headersP = rowsP[0].map(function(h) { return h.toString().toLowerCase(); });
      
      var idxOrderNum = headersP.indexOf("numero pedido");
      if (idxOrderNum === -1) idxOrderNum = 0;
      var idxDate = headersP.indexOf("data criacao");
      if (idxDate === -1) idxDate = 1;
      var idxCustomer = headersP.indexOf("cliente / remetente");
      if (idxCustomer === -1) idxCustomer = headersP.indexOf("cliente");
      if (idxCustomer === -1) idxCustomer = 2;
      var idxPhone = headersP.indexOf("whatsapp cliente");
      if (idxPhone === -1) idxPhone = headersP.indexOf("whatsapp");
      if (idxPhone === -1) idxPhone = 3;
      var idxBirth = headersP.indexOf("aniversario cliente");
      if (idxBirth === -1) idxBirth = 4;
      var idxProd = headersP.indexOf("produto / arranjo");
      if (idxProd === -1) idxProd = headersP.indexOf("produto");
      if (idxProd === -1) idxProd = 5;
      var idxCat = headersP.indexOf("categoria");
      if (idxCat === -1) idxCat = 6;
      var idxRefPrice = headersP.indexOf("preco referencia item (r$)");
      if (idxRefPrice === -1) idxRefPrice = 7;
      var idxFreight = headersP.indexOf("custo de frete (r$)");
      if (idxFreight === -1) idxFreight = 8;
      var idxTotal = headersP.indexOf("valor total estimado (r$)");
      if (idxTotal === -1) idxTotal = 9;
      var idxAddress = headersP.indexOf("endereco completo");
      if (idxAddress === -1) idxAddress = headersP.indexOf("endereco de entrega");
      if (idxAddress === -1) idxAddress = 13;
      var idxCity = headersP.indexOf("cidade de entrega");
      if (idxCity === -1) idxCity = headersP.indexOf("cidade");
      if (idxCity === -1) idxCity = 12;
      var idxDelDate = headersP.indexOf("data de entrega");
      if (idxDelDate === -1) idxDelDate = 16;
      var idxCard = headersP.indexOf("mensagem do cartao");
      if (idxCard === -1) idxCard = 18;
      var idxPay = headersP.indexOf("forma pagamento");
      if (idxPay === -1) idxPay = 19;
      var idxStat = headersP.indexOf("status kanban");
      if (idxStat === -1) idxStat = 20;

      for (var p = 1; p < rowsP.length; p++) {
        var row = rowsP[p];
        if (!row[0] && !row[1] && !row[2]) continue;
        orders.push({
          id: "sheet-order-" + p + "-" + (row[idxOrderNum] || ""),
          orderNumber: row[idxOrderNum] ? row[idxOrderNum].toString() : ("#PAP-" + (1000 + p)),
          createdAt: row[idxDate] ? row[idxDate].toString() : new Date().toISOString(),
          customerName: row[idxCustomer] ? row[idxCustomer].toString() : "Cliente",
          customerPhone: row[idxPhone] ? row[idxPhone].toString() : "",
          customerBirthDate: row[idxBirth] ? row[idxBirth].toString() : "",
          productName: row[idxProd] ? row[idxProd].toString() : "Arranjo Floral",
          category: row[idxCat] ? row[idxCat].toString() : "Arranjos",
          referencePrice: Number(row[idxRefPrice]) || 0,
          freightFee: Number(row[idxFreight]) || 0,
          totalPrice: Number(row[idxTotal]) || 0,
          deliveryAddress: row[idxAddress] ? row[idxAddress].toString() : "",
          deliveryCity: row[idxCity] ? row[idxCity].toString() : "Pirapora",
          deliveryDate: row[idxDelDate] ? row[idxDelDate].toString() : "",
          cardMessage: row[idxCard] ? row[idxCard].toString() : "",
          paymentMethod: row[idxPay] ? row[idxPay].toString().toLowerCase() : "pix",
          status: row[idxStat] ? row[idxStat].toString().toLowerCase() : "pedido"
        });
      }
    }

    // Leitura dos Produtos (procura aba "Produtos" ou "Catalogo")
    var catalog = [];
    var sheetCatalogo = ss.getSheetByName("Produtos") || ss.getSheetByName("Catalogo");
    if (sheetCatalogo && sheetCatalogo.getDataRange().getValues().length > 1) {
      var rowsC = sheetCatalogo.getDataRange().getValues();
      for (var c = 1; c < rowsC.length; c++) {
        var rC = rowsC[c];
        if (!rC[1]) continue;
        catalog.push({
          id: rC[0] ? rC[0].toString() : ("prod-" + c),
          name: rC[1].toString(),
          slug: rC[2] ? rC[2].toString() : rC[1].toString().toLowerCase().replace(/[^a-z0-9]/g, "-"),
          category: rC[3] ? rC[3].toString() : "geral",
          price: rC[4] !== "" ? Number(rC[4]) : undefined,
          referencePrice: rC[5] !== "" ? Number(rC[5]) : undefined,
          originalPrice: rC[6] !== "" ? Number(rC[6]) : undefined,
          isPriceOnDemand: rC[7] && rC[7].toString().toLowerCase() === "sim",
          occasion: rC[8] ? rC[8].toString().split(",").map(function(s) { return s.trim(); }) : [],
          flowerType: rC[9] ? rC[9].toString().split(",").map(function(s) { return s.trim(); }) : [],
          imageUrl: rC[10] ? rC[10].toString() : "",
          description: rC[11] ? rC[11].toString() : "",
          details: {
            itemsIncluded: rC[12] ? rC[12].toString().split(";").map(function(s) { return s.trim(); }) : [],
            careInstructions: rC[13] ? rC[13].toString() : ""
          },
          tags: rC[14] ? rC[14].toString().split(",").map(function(s) { return s.trim(); }) : [],
          rating: Number(rC[15]) || 5,
          reviewCount: Number(rC[16]) || 0,
          inStock: !rC[17] || rC[17].toString().toLowerCase() !== "nao",
          orderCount: Number(rC[18]) || 10
        });
      }
    }

    // Leitura das Categorias
    var categories = [];
    var sheetCategorias = ss.getSheetByName("Categorias");
    if (sheetCategorias && sheetCategorias.getDataRange().getValues().length > 1) {
      var rowsCat = sheetCategorias.getDataRange().getValues();
      for (var k = 1; k < rowsCat.length; k++) {
        var rCat = rowsCat[k];
        if (!rCat[1]) continue;
        categories.push({
          id: rCat[0] ? rCat[0].toString() : ("cat-" + k),
          slug: rCat[0] ? rCat[0].toString() : rCat[1].toString().toLowerCase().replace(/[^a-z0-9]/g, "-"),
          name: rCat[1].toString(),
          icon: rCat[2] ? rCat[2].toString() : "🌸",
          description: rCat[3] ? rCat[3].toString() : "",
          active: !rCat[4] || rCat[4].toString().toLowerCase() !== "nao"
        });
      }
    }

    var result = {
      success: true,
      orders: orders,
      catalog: catalog,
      products: catalog,
      categories: categories,
      timestamp: new Date().toISOString()
    };

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
`;
