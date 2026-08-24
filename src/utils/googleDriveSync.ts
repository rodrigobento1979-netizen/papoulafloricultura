import { Customer, KanbanOrder, Product, GoogleDriveConfig } from "../types";

export const DEFAULT_DRIVE_CONFIG: GoogleDriveConfig = {
  sheetWebhookUrl: "",
  spreadsheetId: "1PapoulaFloricultura_PlanilhaPedidos_2026",
  folderUrl: "https://drive.google.com/drive/folders/papoula-floricultura",
  autoSync: true,
  lastSyncedAt: new Date().toLocaleDateString("pt-BR") + " às " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
};

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
    "Valor Total (R$)",
    "Endereco de Entrega",
    "Cidade",
    "Data de Entrega",
    "Mensagem do Cartao",
    "Forma Pagamento",
    "Status Kanban",
    "Foto Conclusao"
  ];

  const rows = orders.map((o) => [
    `"${o.orderNumber}"`,
    `"${o.createdAt ? new Date(o.createdAt).toLocaleString("pt-BR") : ""}"`,
    `"${o.customerName || ""}"`,
    `"${o.customerPhone || ""}"`,
    `"${o.customerBirthDate || ""}"`,
    `"${o.productName || ""}"`,
    `"${o.category || ""}"`,
    `"${o.totalPrice?.toFixed(2) || "0,00"}"`,
    `"${o.deliveryAddress || ""}"`,
    `"${o.deliveryCity || ""}"`,
    `"${o.deliveryDate || ""}"`,
    `"${(o.cardMessage || "").replace(/"/g, '""')}"`,
    `"${o.paymentMethod || "pix"}"`,
    `"${o.status}"`,
    `"${o.photoProofUrl || ""}"`
  ]);

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
