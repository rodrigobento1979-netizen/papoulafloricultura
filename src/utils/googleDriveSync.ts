import { KanbanOrder, Customer, GoogleDriveConfig } from "../types";

/**
 * Sends single order payload to Google Apps Script Webhook
 */
export async function sendOrderToGoogleSheetsWebhook(
  webhookUrl: string,
  orderData: {
    orderNumber?: string;
    productName: string;
    price?: number | string;
    deliveryFee?: number | string;
    total?: number | string;
    senderName?: string;
    senderPhone?: string;
    recipientName: string;
    recipientPhone?: string;
    city: string;
    address: string;
    neighborhood?: string;
    reference?: string;
    timeSlot?: string;
    cardMessage?: string;
    paymentMethod?: string;
  }
): Promise<boolean> {
  if (!webhookUrl || !webhookUrl.trim() || !webhookUrl.startsWith("http")) {
    return false;
  }

  try {
    const cleanUrl = webhookUrl.trim();
    // Using no-cors or standard POST. Google Apps Script Web App redirects on POST (302)
    // Fetch with mode 'no-cors' allows browser to execute the request without CORS blockage
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
    "Status do Pedido"
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
    `"Pendente Confirmação PIX"`
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
