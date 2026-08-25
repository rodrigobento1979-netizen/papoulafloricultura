import { KanbanOrder, Customer, Product, Category, GoogleDriveConfig } from "../types";

/**
 * =========================================================================
 * FLORICULTURA PAPOULA - SINCRONIZAÇÃO EM ARQUIVOS JSON NO GOOGLE DRIVE
 * Armazena pedidos, catálogo e categorias em arquivos:
 * - pedidos.json
 * - catalogo.json
 * - categorias.json
 * dentro da pasta compartilhada do Google Drive.
 * =========================================================================
 */

/**
 * Sends a single order payload to Google Apps Script Web App to be appended into pedidos.json
 */
export async function sendOrderToGoogleDrive(
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
    const proxyRes = await fetch("/api/sync-drive", {
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
    // Direct client fallback
    await fetch(cleanUrl, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "newOrder",
        ...orderData,
      }),
    });
    return true;
  } catch (err) {
    console.warn("Erro ao enviar dados para o Google Drive JSON Webhook:", err);
    return false;
  }
}

/**
 * Saves all Orders directly into pedidos.json in the Google Drive folder
 */
export async function saveOrdersToGoogleDrive(
  webhookUrl: string,
  orders: KanbanOrder[]
): Promise<{ success: boolean; message: string }> {
  if (!webhookUrl || !webhookUrl.trim() || !webhookUrl.startsWith("http")) {
    return {
      success: false,
      message: "URL do Web App do Google Apps Script não informada ou inválida.",
    };
  }

  try {
    const res = await fetch("/api/sync-drive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: webhookUrl.trim(),
        action: "saveOrders",
        orders: orders,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return {
          success: true,
          message: data.message || `Arquivo 'pedidos.json' com ${orders.length} pedidos salvo com sucesso na pasta do Google Drive!`,
        };
      }
    }
  } catch (backendErr) {
    console.warn("Backend proxy error on saveOrdersToGoogleDrive:", backendErr);
  }

  // Direct client fallback
  try {
    await fetch(webhookUrl.trim(), {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "saveOrders",
        orders: orders,
      }),
    });
    return {
      success: true,
      message: `Arquivo 'pedidos.json' enviado para atualização na pasta do Google Drive (${orders.length} pedidos)!`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Erro ao salvar pedidos.json no Google Drive.",
    };
  }
}

/**
 * Saves Catalog (Products) into catalogo.json in the Google Drive folder
 */
export async function saveCatalogToGoogleDrive(
  webhookUrl: string,
  products: Product[]
): Promise<{ success: boolean; message: string }> {
  if (!webhookUrl || !webhookUrl.trim() || !webhookUrl.startsWith("http")) {
    return {
      success: false,
      message: "URL do Web App do Google Apps Script não informada ou inválida.",
    };
  }

  try {
    const res = await fetch("/api/sync-drive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: webhookUrl.trim(),
        action: "saveCatalog",
        products: products,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return {
          success: true,
          message: data.message || `Arquivo 'catalogo.json' com ${products.length} produtos salvo na pasta do Google Drive!`,
        };
      }
    }
  } catch (backendErr) {
    console.warn("Backend proxy error on saveCatalogToGoogleDrive:", backendErr);
  }

  // Direct client fallback
  try {
    await fetch(webhookUrl.trim(), {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "saveCatalog",
        products: products,
      }),
    });
    return {
      success: true,
      message: `Arquivo 'catalogo.json' enviado para a pasta do Google Drive (${products.length} produtos)!`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Erro ao salvar catálogo no Google Drive.",
    };
  }
}

/**
 * Saves Categories into categorias.json in the Google Drive folder
 */
export async function saveCategoriesToGoogleDrive(
  webhookUrl: string,
  categories: Category[]
): Promise<{ success: boolean; message: string }> {
  if (!webhookUrl || !webhookUrl.trim() || !webhookUrl.startsWith("http")) {
    return {
      success: false,
      message: "URL do Web App do Google Apps Script não informada ou inválida.",
    };
  }

  try {
    const res = await fetch("/api/sync-drive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: webhookUrl.trim(),
        action: "saveCategories",
        categories: categories,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return {
          success: true,
          message: data.message || `Arquivo 'categorias.json' com ${categories.length} categorias salvo na pasta do Google Drive!`,
        };
      }
    }
  } catch (backendErr) {
    console.warn("Backend proxy error on saveCategoriesToGoogleDrive:", backendErr);
  }

  // Direct client fallback
  try {
    await fetch(webhookUrl.trim(), {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "saveCategories",
        categories: categories,
      }),
    });
    return {
      success: true,
      message: `Arquivo 'categorias.json' enviado para a pasta do Google Drive (${categories.length} categorias)!`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Erro ao salvar categorias no Google Drive.",
    };
  }
}

/**
 * Saves All (Orders, Catalog and Categories) into their respective JSON files in the Google Drive folder in 1 batch
 */
export async function saveAllToGoogleDrive(
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
      message: "URL do Web App do Google Apps Script não informada.",
    };
  }

  try {
    const res = await fetch("/api/sync-drive", {
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
          message: respData.message || "Arquivos pedidos.json, catalogo.json e categorias.json salvos com sucesso na pasta do Google Drive!",
        };
      }
    }
  } catch (err) {
    console.warn("Backend error on saveAllToGoogleDrive:", err);
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
      message: "Dados de Pedidos, Catálogo e Categorias enviados para os arquivos JSON no Google Drive!",
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Erro ao salvar arquivos JSON no Google Drive.",
    };
  }
}

/**
 * Fetches all orders, products, and categories from Google Drive JSON files via Web App
 */
export async function fetchStoreDataFromGoogleDrive(
  webhookUrl?: string,
  folderUrl?: string,
  folderId?: string
): Promise<{
  success: boolean;
  orders?: KanbanOrder[];
  products?: Product[];
  categories?: Category[];
  folderName?: string;
  folderUrl?: string;
  message?: string;
}> {
  const target = (webhookUrl || "").trim();
  const folder = (folderUrl || "").trim();
  const fId = (folderId || "").trim();

  if (!target && !folder && !fId) {
    return {
      success: false,
      message: "Por favor, configure o link do Web App do Google Apps Script ou o Link da Pasta do Google Drive.",
    };
  }

  try {
    const apiRes = await fetch("/api/sync-drive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: target,
        folderUrl: folder,
        folderId: fId,
        action: "getData",
      }),
    });

    if (apiRes.ok) {
      const data = await apiRes.json();
      if (data.success) {
        let orders: KanbanOrder[] = [];
        let products: Product[] = [];
        let categories: Category[] = [];

        // 1. Process Orders
        if (Array.isArray(data.orders)) {
          orders = data.orders.map((o: any, idx: number) => ({
            ...o,
            id: o.id || `order-drive-${Date.now()}-${idx}`,
            orderNumber: o.orderNumber || `#PAP-${1000 + idx}`,
            createdAt: normalizeDate(o.createdAt),
            referencePrice: Number(o.referencePrice || o.price || 0),
            freightFee: Number(o.freightFee || o.deliveryFee || 0),
            totalPrice: Number(o.totalPrice || o.total || (Number(o.referencePrice || 0) + Number(o.freightFee || 0))),
            status: o.status || "pedido",
            paymentMethod: o.paymentMethod || "pix",
          }));
        }

        // 2. Process Products / Catalog
        if (Array.isArray(data.catalog) || Array.isArray(data.products)) {
          const rawProds = data.catalog || data.products;
          products = rawProds.map((p: any, idx: number) => ({
            ...p,
            id: p.id || `prod-${Date.now()}-${idx}`,
            name: p.name || "Produto Floral",
            slug: p.slug || (p.name ? p.name.toLowerCase().replace(/[^a-z0-9]/g, "-") : `prod-${idx}`),
            category: p.category || "geral",
            price: p.price !== undefined && p.price !== null ? Number(p.price) : 0,
            referencePrice: p.referencePrice !== undefined && p.referencePrice !== null ? Number(p.referencePrice) : undefined,
            originalPrice: p.originalPrice !== undefined && p.originalPrice !== null ? Number(p.originalPrice) : undefined,
            isPriceOnDemand: Boolean(p.isPriceOnDemand || p.price === 0 || p.price === undefined),
            imageUrl: p.imageUrl || p.image || "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80",
            description: p.description || "",
            details: p.details || { itemsIncluded: [], careInstructions: "" },
            tags: Array.isArray(p.tags) ? p.tags : (typeof p.tags === "string" ? p.tags.split(",").map((t: string) => t.trim()) : []),
            rating: Number(p.rating || 5),
            reviewCount: Number(p.reviewCount || 10),
            inStock: p.inStock !== false,
            orderCount: Number(p.orderCount || 10),
            occasion: Array.isArray(p.occasion) ? p.occasion : [],
            flowerType: Array.isArray(p.flowerType) ? p.flowerType : [],
          }));
        }

        // 3. Process Categories
        if (Array.isArray(data.categories)) {
          categories = data.categories.map((c: any, idx: number) => ({
            id: c.id || c.slug || `cat-${Date.now()}-${idx}`,
            name: c.name || "Categoria",
            slug: c.slug || (c.name ? c.name.toLowerCase().replace(/[^a-z0-9]/g, "-") : `cat-${idx}`),
            icon: c.icon || "🌸",
            description: c.description || "",
            active: c.active !== false,
          }));
        }

        return {
          success: true,
          orders,
          products,
          categories,
          folderName: data.folderName,
          folderUrl: data.folderUrl,
          message: data.message,
        };
      } else {
        return {
          success: false,
          orders: [],
          products: [],
          categories: [],
          message: data.error || data.message || "Não foi possível carregar os arquivos JSON do Google Drive.",
        };
      }
    }
  } catch (err: any) {
    console.warn("fetchStoreDataFromGoogleDrive error:", err);
  }

  return {
    success: false,
    orders: [],
    products: [],
    categories: [],
    message: "Não foi possível conectar ao Google Drive. Verifique a URL do Web App do Google Apps Script.",
  };
}

/**
 * Backward compatibility wrappers
 */
export const fetchStoreDataFromGoogleSheets = fetchStoreDataFromGoogleDrive;
export const sendOrderToGoogleSheetsWebhook = sendOrderToGoogleDrive;
export const syncCatalogToGoogleSheets = saveCatalogToGoogleDrive;
export const syncCategoriesToGoogleSheets = saveCategoriesToGoogleDrive;
export const syncAllToGoogleSheets = saveAllToGoogleDrive;

/**
 * Generates formatted JSON string for Orders (pedidos.json)
 */
export function exportOrdersToJSON(orders: KanbanOrder[]): string {
  const payload = {
    appName: "Floricultura Papoula - Sistema de Pedidos",
    version: "2.0",
    exportedAt: new Date().toISOString(),
    totalOrders: orders.length,
    orders: orders,
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Generates formatted JSON string for Catalog (catalogo.json)
 */
export function exportCatalogToJSON(products: Product[], categories: Category[]): string {
  const payload = {
    appName: "Floricultura Papoula - Catálogo Oficial",
    version: "2.0",
    exportedAt: new Date().toISOString(),
    totalProducts: products.length,
    totalCategories: categories.length,
    categories: categories,
    products: products,
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Generates formatted JSON string for Categories (categorias.json)
 */
export function exportCategoriesToJSON(categories: Category[]): string {
  const payload = {
    appName: "Floricultura Papoula - Categorias",
    version: "2.0",
    exportedAt: new Date().toISOString(),
    totalCategories: categories.length,
    categories: categories,
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Parses raw JSON string into KanbanOrder array
 */
export function parseOrdersFromJSON(jsonString: string): KanbanOrder[] {
  if (!jsonString || !jsonString.trim()) return [];
  try {
    const data = JSON.parse(jsonString);
    let rawList: any[] = [];
    if (Array.isArray(data)) {
      rawList = data;
    } else if (data && Array.isArray(data.orders)) {
      rawList = data.orders;
    } else if (data && Array.isArray(data.pedidos)) {
      rawList = data.pedidos;
    }

    return rawList.map((o: any, idx: number) => ({
      id: o.id || `order-json-${Date.now()}-${idx}`,
      orderNumber: o.orderNumber || `#PAP-${1000 + idx}`,
      createdAt: normalizeDate(o.createdAt),
      customerName: o.customerName || o.clientName || o.nomeCliente || "Cliente",
      customerPhone: o.customerPhone || o.phone || o.telefone || "",
      customerBirthDate: o.customerBirthDate || o.birthDate || "",
      productName: o.productName || o.product || o.nomeProduto || "Arranjo de Flores",
      category: o.category || o.categoria || "Arranjos",
      referencePrice: Number(o.referencePrice || o.price || 0),
      freightFee: Number(o.freightFee || o.deliveryFee || 0),
      totalPrice: Number(o.totalPrice || o.total || 0),
      recipientName: o.recipientName || o.destinatario || "",
      recipientPhone: o.recipientPhone || o.telefoneDestinatario || "",
      deliveryAddress: o.deliveryAddress || o.address || o.endereco || "",
      deliveryNeighborhood: o.deliveryNeighborhood || o.neighborhood || o.bairro || "",
      deliveryCity: o.deliveryCity || o.city || o.cidade || "Pirapora",
      deliveryReference: o.deliveryReference || o.reference || "",
      deliveryDate: o.deliveryDate || o.date || "",
      cardMessage: o.cardMessage || o.message || "",
      paymentMethod: o.paymentMethod || "pix",
      status: o.status || "pedido",
      photoProofUrl: o.photoProofUrl || o.photoUrl || "",
      completedAt: o.completedAt || undefined,
    }));
  } catch (err) {
    console.error("Erro ao analisar JSON de pedidos:", err);
    throw new Error("Formato do arquivo JSON de pedidos inválido.");
  }
}

/**
 * Parses raw JSON string into Products & Categories
 */
export function parseCatalogFromJSON(jsonString: string): { products: Product[]; categories: Category[] } {
  if (!jsonString || !jsonString.trim()) return { products: [], categories: [] };
  try {
    const data = JSON.parse(jsonString);
    let rawProducts: any[] = [];
    let rawCategories: any[] = [];

    if (Array.isArray(data)) {
      rawProducts = data;
    } else if (data && typeof data === "object") {
      if (Array.isArray(data.products)) rawProducts = data.products;
      else if (Array.isArray(data.produtos)) rawProducts = data.produtos;
      else if (Array.isArray(data.catalog)) rawProducts = data.catalog;

      if (Array.isArray(data.categories)) rawCategories = data.categories;
      else if (Array.isArray(data.categorias)) rawCategories = data.categorias;
    }

    const products: Product[] = rawProducts.map((p: any, idx: number) => ({
      id: p.id || `prod-${Date.now()}-${idx}`,
      name: p.name || p.nome || "Produto Floral",
      slug: p.slug || (p.name ? p.name.toLowerCase().replace(/[^a-z0-9]/g, "-") : `prod-${idx}`),
      category: p.category || p.categoria || "geral",
      price: p.price !== undefined && p.price !== null ? Number(p.price) : 0,
      referencePrice: p.referencePrice !== undefined && p.referencePrice !== null ? Number(p.referencePrice) : undefined,
      originalPrice: p.originalPrice !== undefined && p.originalPrice !== null ? Number(p.originalPrice) : undefined,
      isPriceOnDemand: Boolean(p.isPriceOnDemand || p.price === 0 || p.price === undefined),
      imageUrl: p.imageUrl || p.image || p.foto || "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80",
      description: p.description || p.descricao || "",
      details: p.details || {
        itemsIncluded: Array.isArray(p.itemsIncluded) ? p.itemsIncluded : [],
        careInstructions: p.careInstructions || "",
      },
      tags: Array.isArray(p.tags) ? p.tags : (typeof p.tags === "string" ? p.tags.split(",").map((t: string) => t.trim()) : []),
      rating: Number(p.rating || 5),
      reviewCount: Number(p.reviewCount || 10),
      inStock: p.inStock !== false,
      orderCount: Number(p.orderCount || 10),
      occasion: Array.isArray(p.occasion) ? p.occasion : [],
      flowerType: Array.isArray(p.flowerType) ? p.flowerType : [],
    }));

    const categories: Category[] = rawCategories.map((c: any, idx: number) => ({
      id: c.id || c.slug || `cat-${Date.now()}-${idx}`,
      name: c.name || c.nome || "Categoria",
      slug: c.slug || (c.name ? c.name.toLowerCase().replace(/[^a-z0-9]/g, "-") : `cat-${idx}`),
      icon: c.icon || c.icone || "🌸",
      description: c.description || c.descricao || "",
      active: c.active !== false,
    }));

    return { products, categories };
  } catch (err) {
    console.error("Erro ao analisar JSON do catálogo:", err);
    throw new Error("Formato do arquivo JSON do catálogo inválido.");
  }
}

/**
 * Parses raw JSON string into Categories
 */
export function parseCategoriesFromJSON(jsonString: string): Category[] {
  if (!jsonString || !jsonString.trim()) return [];
  try {
    const data = JSON.parse(jsonString);
    let rawCategories: any[] = [];

    if (Array.isArray(data)) {
      rawCategories = data;
    } else if (data && typeof data === "object") {
      if (Array.isArray(data.categories)) rawCategories = data.categories;
      else if (Array.isArray(data.categorias)) rawCategories = data.categorias;
    }

    return rawCategories.map((c: any, idx: number) => ({
      id: c.id || c.slug || `cat-${Date.now()}-${idx}`,
      name: c.name || c.nome || "Categoria",
      slug: c.slug || (c.name ? c.name.toLowerCase().replace(/[^a-z0-9]/g, "-") : `cat-${idx}`),
      icon: c.icon || c.icone || "🌸",
      description: c.description || c.descricao || "",
      active: c.active !== false,
    }));
  } catch (err) {
    console.error("Erro ao analisar JSON de categorias:", err);
    throw new Error("Formato do arquivo JSON de categorias inválido.");
  }
}

/**
 * Downloads a formatted JSON file directly in the browser
 */
export function downloadJSON(filename: string, content: string | object) {
  const text = typeof content === "string" ? content : JSON.stringify(content, null, 2);
  const blob = new Blob([text], { type: "application/json;charset=utf-8;" });
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
 * Single-click helper to download pedidos.json
 */
export function downloadOrdersJSON(orders: KanbanOrder[]) {
  const json = exportOrdersToJSON(orders);
  downloadJSON(`pedidos.json`, json);
}

/**
 * Single-click helper to download catalogo.json
 */
export function downloadCatalogJSON(products: Product[], categories: Category[]) {
  const json = exportCatalogToJSON(products, categories);
  downloadJSON(`catalogo.json`, json);
}

/**
 * Single-click helper to download categorias.json
 */
export function downloadCategoriesJSON(categories: Category[]) {
  const json = exportCategoriesToJSON(categories);
  downloadJSON(`categorias.json`, json);
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
 * Helper to export legacy CSV (optional fallback)
 */
export function exportOrdersToCSV(orders: KanbanOrder[]): string {
  const headers = [
    "Numero Pedido", "Data Criacao", "Cliente", "Telefone Cliente", "Aniversario Cliente",
    "Produto", "Categoria", "Preco Referencia", "Taxa de Frete", "Total",
    "Cidade", "Endereco", "Data Entrega", "Mensagem Cartao", "Forma Pagamento", "Status", "Foto Conclusao"
  ];
  const rows = orders.map((o) => [
    o.orderNumber, o.createdAt, o.customerName, o.customerPhone, o.customerBirthDate || "",
    o.productName, o.category, o.referencePrice || "", o.freightFee || "", o.totalPrice,
    o.deliveryCity, o.deliveryAddress, o.deliveryDate, o.cardMessage, o.paymentMethod, o.status, o.photoProofUrl || ""
  ].map((val) => `"${String(val ?? "").replace(/"/g, '""')}"`).join(","));

  return [headers.join(","), ...rows].join("\n");
}

export function parseCatalogFromCSV(text: string): { products: Product[]; categories: Category[] } {
  return parseCatalogFromJSON(text);
}

export function parseCategoriesFromCSV(text: string): Category[] {
  return parseCategoriesFromJSON(text);
}

export function parseOrdersFromCSV(text: string): KanbanOrder[] {
  return parseOrdersFromJSON(text);
}

export function fetchOrdersFromGoogleSheets(webhookUrl: string, sheetId?: string, folderUrl?: string) {
  return fetchStoreDataFromGoogleDrive(webhookUrl, folderUrl, sheetId);
}

export function downloadOfficialSpreadsheetTemplate() {
  downloadCatalogJSON([], []);
}

export function exportCatalogToCSV(products: Product[]): string {
  const headers = ["ID", "Nome", "Slug", "Categoria", "Preco", "Preco Referencia", "Preco Original", "Sob Consulta", "Imagem", "Descricao"];
  const rows = products.map((p) => [
    p.id, p.name, p.slug, p.category, p.price ?? "", p.referencePrice ?? "", p.originalPrice ?? "",
    p.isPriceOnDemand ? "Sim" : "Nao", p.imageUrl, p.description
  ].map((val) => `"${String(val ?? "").replace(/"/g, '""')}"`).join(","));

  return [headers.join(","), ...rows].join("\n");
}

export function exportCategoriesToCSV(categories: Category[]): string {
  const headers = ["ID", "Nome", "Icone", "Descricao", "Ativo"];
  const rows = categories.map((c) => [
    c.id, c.name, c.icon, c.description, c.active ? "Sim" : "Nao"
  ].map((val) => `"${String(val ?? "").replace(/"/g, '""')}"`).join(","));

  return [headers.join(","), ...rows].join("\n");
}

export function exportCustomersToCSV(customers: Customer[]): string {
  const headers = ["Nome", "Telefone", "Aniversario", "Data Cadastro", "Total Pedidos", "Notas"];
  const rows = customers.map((c) => [
    c.fullName, c.phone, c.birthDate || "", c.createdAt, c.totalOrders, c.notes || ""
  ].map((val) => `"${String(val ?? "").replace(/"/g, '""')}"`).join(","));

  return [headers.join(","), ...rows].join("\n");
}

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
 * =========================================================================
 * GOOGLE APPS SCRIPT OFICIAL (GOOGLE DRIVE ARQUIVOS JSON)
 * Código pronto para colar no Google Apps Script vinculado à pasta do Drive.
 * =========================================================================
 */
export const GOOGLE_APPS_SCRIPT_DRIVE_JSON_CODE = `/**
 * =========================================================================
 * FLORICULTURA PAPOULA - BANCO DE DADOS EM ARQUIVOS JSON NO GOOGLE DRIVE
 * Armazena e lê diretamente os arquivos na pasta compartilhada:
 * - pedidos.json
 * - catalogo.json
 * - categorias.json
 * =========================================================================
 * 
 * INSTRUÇÕES RÁPIDAS DE IMPLANTAÇÃO (2 MINUTOS):
 * 1. Acesse https://script.google.com e clique em "Novo Projeto".
 * 2. Apague todo o código existente (Ctrl+A e Delete).
 * 3. Cole este código completo.
 * 4. (Opcional) Cole o ID da sua pasta do Google Drive na variável FOLDER_ID abaixo.
 *    Se deixar em branco, o script cria automaticamente a pasta "Floricultura Papoula - Dados" no seu Drive!
 * 5. Clique em "Salvar" (ícone de disquete ou Ctrl+S).
 * 6. Para testar: selecione a função 'testarIntegracaoDriveJSON' e clique em Executar.
 * 7. Clique em "Implantar" > "Nova implantação" (ícone azul no topo).
 * 8. Tipo: "Aplicativo da Web".
 * 9. Executar como: "Eu" (seu e-mail).
 * 10. Quem pode acessar: "Qualquer pessoa" (IMPORTANTE!).
 * 11. Clique em "Implantar" e copie a URL gerada (/exec) para colar no Painel Administrativo.
 */

// Se tiver o ID de uma pasta específica no Google Drive, cole aqui (ex: "1aBcDeFg_hIjKlMnOpQrStUvWxYz").
// Se deixar vazio, o script cria/encontra a pasta "Floricultura Papoula - Dados" automaticamente!
var FOLDER_ID = "";
var FOLDER_NAME = "Floricultura Papoula - Dados";

/**
 * Localiza ou cria a pasta do Google Drive
 */
function getStorageFolder() {
  if (FOLDER_ID && FOLDER_ID.trim() !== "") {
    try {
      return DriveApp.getFolderById(FOLDER_ID.trim());
    } catch (e) {
      Logger.log("Aviso: Nao foi possivel abrir pelo FOLDER_ID, buscando por nome...");
    }
  }

  var folders = DriveApp.getFoldersByName(FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }

  // Cria a pasta automaticamente
  var newFolder = DriveApp.createFolder(FOLDER_NAME);
  Logger.log("Pasta criada no Google Drive: " + newFolder.getName() + " (ID: " + newFolder.getId() + ")");
  return newFolder;
}

/**
 * Lê o conteúdo de um arquivo JSON da pasta. Se não existir, retorna defaultData
 */
function readJSONFile(folder, filename, defaultData) {
  var files = folder.getFilesByName(filename);
  if (files.hasNext()) {
    var file = files.next();
    var content = file.getBlob().getDataAsString("UTF-8");
    try {
      return JSON.parse(content);
    } catch (e) {
      Logger.log("Erro ao converter " + filename + " para JSON: " + e.toString());
      return defaultData;
    }
  }
  return defaultData;
}

/**
 * Salva ou atualiza um arquivo JSON na pasta do Google Drive
 */
function writeJSONFile(folder, filename, data) {
  var content = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  var files = folder.getFilesByName(filename);
  
  if (files.hasNext()) {
    var file = files.next();
    file.setContent(content);
    return file;
  } else {
    return folder.createFile(filename, content, MimeType.PLAIN_TEXT);
  }
}

/**
 * Função de teste para verificar a pasta e os arquivos JSON
 */
function testarIntegracaoDriveJSON() {
  var folder = getStorageFolder();
  Logger.log("Pasta ativa: " + folder.getName() + " (Link: " + folder.getUrl() + ")");

  var orders = readJSONFile(folder, "pedidos.json", []);
  var catalog = readJSONFile(folder, "catalogo.json", []);
  var categories = readJSONFile(folder, "categorias.json", []);

  // Se pedidos.json estiver vazio, inicializa com array
  if (!orders || orders.length === 0) {
    writeJSONFile(folder, "pedidos.json", []);
  }

  Logger.log("Total Pedidos no Drive: " + (Array.isArray(orders) ? orders.length : (orders.orders ? orders.orders.length : 0)));
  Logger.log("Total Produtos no Drive: " + (Array.isArray(catalog) ? catalog.length : (catalog.products ? catalog.products.length : 0)));
  Logger.log("Total Categorias no Drive: " + (Array.isArray(categories) ? categories.length : (categories.categories ? categories.categories.length : 0)));

  return {
    status: "OK",
    folderName: folder.getName(),
    folderUrl: folder.getUrl(),
    folderId: folder.getId()
  };
}

/**
 * GET: Lê e retorna os arquivos JSON diretamente da pasta do Google Drive
 */
function doGet(e) {
  try {
    var folder = getStorageFolder();
    
    var rawOrders = readJSONFile(folder, "pedidos.json", []);
    var rawCatalog = readJSONFile(folder, "catalogo.json", []);
    var rawCategories = readJSONFile(folder, "categorias.json", []);

    var ordersList = Array.isArray(rawOrders) ? rawOrders : (rawOrders.orders || []);
    var catalogList = Array.isArray(rawCatalog) ? rawCatalog : (rawCatalog.products || rawCatalog.catalog || []);
    var categoriesList = Array.isArray(rawCategories) ? rawCategories : (rawCategories.categories || []);

    var responsePayload = {
      success: true,
      folderName: folder.getName(),
      folderUrl: folder.getUrl(),
      folderId: folder.getId(),
      orders: ordersList,
      catalog: catalogList,
      products: catalogList,
      categories: categoriesList,
      timestamp: new Date().toISOString()
    };

    return ContentService.createTextOutput(JSON.stringify(responsePayload))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * POST: Salva novos pedidos ou atualiza pedidos.json, catalogo.json e categorias.json
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(20000);

  try {
    var contents = (e && e.postData) ? e.postData.contents : "";
    var data = {};
    if (contents) {
      try {
        data = JSON.parse(contents);
      } catch (parseErr) {
        data = {};
      }
    }

    var folder = getStorageFolder();

    // 1. Ação: Obter dados (getData)
    if (data.action === "getData" || data.action === "getOrders") {
      return doGet(e);
    }

    // 2. Ação: Salvar tudo de uma vez (syncAll / saveAll)
    if (data.action === "syncAll" || data.action === "saveAll") {
      if (data.orders && Array.isArray(data.orders)) {
        writeJSONFile(folder, "pedidos.json", data.orders);
      }
      if (data.products && Array.isArray(data.products)) {
        writeJSONFile(folder, "catalogo.json", data.products);
      }
      if (data.categories && Array.isArray(data.categories)) {
        writeJSONFile(folder, "categorias.json", data.categories);
      }

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "Arquivos pedidos.json, catalogo.json e categorias.json salvos com sucesso na pasta do Google Drive!",
        folderUrl: folder.getUrl()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. Ação: Salvar apenas Pedidos
    if (data.action === "saveOrders" && data.orders && Array.isArray(data.orders)) {
      writeJSONFile(folder, "pedidos.json", data.orders);
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "Arquivo pedidos.json atualizado (" + data.orders.length + " pedidos).",
        folderUrl: folder.getUrl()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 4. Ação: Salvar apenas Catálogo de Produtos
    if ((data.action === "saveCatalog" || data.action === "saveProducts") && data.products && Array.isArray(data.products)) {
      writeJSONFile(folder, "catalogo.json", data.products);
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "Arquivo catalogo.json atualizado (" + data.products.length + " produtos).",
        folderUrl: folder.getUrl()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 5. Ação: Salvar apenas Categorias
    if (data.action === "saveCategories" && data.categories && Array.isArray(data.categories)) {
      writeJSONFile(folder, "categorias.json", data.categories);
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "Arquivo categorias.json atualizado (" + data.categories.length + " categorias).",
        folderUrl: folder.getUrl()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 6. Ação: Novo Pedido recebido (WhatsApp / Loja) -> Adiciona no pedidos.json
    var rawOrders = readJSONFile(folder, "pedidos.json", []);
    var existingOrders = Array.isArray(rawOrders) ? rawOrders : (rawOrders.orders || []);

    var orderNum = data.orderNumber || ("#PAP-" + Math.floor(1000 + Math.random() * 9000));
    var newOrderObj = {
      id: "order-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
      orderNumber: orderNum,
      createdAt: data.createdAt || new Date().toISOString(),
      customerName: data.senderName || data.customerName || "Cliente",
      customerPhone: data.senderPhone || data.customerPhone || "",
      customerBirthDate: data.customerBirthDate || data.senderBirthDate || "",
      productName: data.productName || "Arranjo Floral",
      category: data.category || "Arranjos",
      referencePrice: Number(data.referencePrice || data.price || 0),
      freightFee: Number(data.deliveryFee || data.freightFee || 0),
      totalPrice: Number(data.total || data.totalPrice || (Number(data.referencePrice || data.price || 0) + Number(data.deliveryFee || data.freightFee || 0))),
      recipientName: data.recipientName || data.customerName || "",
      recipientPhone: data.recipientPhone || "",
      deliveryCity: data.city || data.deliveryCity || "Pirapora",
      deliveryAddress: data.address || data.deliveryAddress || "",
      deliveryNeighborhood: data.neighborhood || data.deliveryNeighborhood || "",
      deliveryReference: data.reference || data.deliveryReference || "",
      deliveryDate: data.deliveryDate || "",
      timeSlot: data.timeSlot || "",
      cardMessage: data.cardMessage || "",
      paymentMethod: (data.paymentMethod || "PIX").toLowerCase(),
      status: data.status || "pedido",
      photoProofUrl: data.photoProofUrl || ""
    };

    // Insere o novo pedido no início da lista
    existingOrders.unshift(newOrderObj);
    writeJSONFile(folder, "pedidos.json", existingOrders);

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Pedido " + orderNum + " gravado com sucesso no arquivo pedidos.json no Google Drive!",
      orderNumber: orderNum,
      folderUrl: folder.getUrl()
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
`;

export const GOOGLE_APPS_SCRIPT_MASTER_CODE = GOOGLE_APPS_SCRIPT_DRIVE_JSON_CODE;
