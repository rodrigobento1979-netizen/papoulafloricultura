import * as XLSX from "xlsx";
import { Product, Category, Customer, KanbanOrder } from "../types";

/**
 * Exporta todos os dados do sistema (Pedidos, Catálogo, Categorias e Clientes)
 * em um único arquivo Excel (.xlsx) contendo 4 abas separadas.
 */
export function exportDatabaseToExcel(params: {
  orders: KanbanOrder[];
  products: Product[];
  categories: Category[];
  customers: Customer[];
}) {
  const { orders, products, categories, customers } = params;
  const workbook = XLSX.utils.book_new();

  // ABA 1: PEDIDOS
  const ordersData = orders.map((o) => {
    const rawNum = (o.orderNumber || o.id || "").toString().replace(/^#/, "");
    const freight = o.freightFee !== undefined ? o.freightFee : (o.deliveryCity?.includes("Buritizeiro") ? 15.0 : 10.0);
    const refPrice = o.referencePrice !== undefined ? o.referencePrice : Math.max(0, (o.totalPrice || 0) - freight);
    const total = o.totalPrice !== undefined && o.totalPrice > 0 ? o.totalPrice : (refPrice + freight);

    let statusLabel: string = o.status;
    if (o.status === "pedido") statusLabel = "1. Novo Pedido";
    else if (o.status === "confirmado") statusLabel = "2. Confirmado / Pago";
    else if (o.status === "em_andamento") statusLabel = "3. Na Bancada / Produção";
    else if (o.status === "concluido") statusLabel = "4. Concluído / Entregue";

    let formattedDate = "";
    if (o.createdAt) {
      try {
        const d = new Date(o.createdAt);
        formattedDate = !isNaN(d.getTime()) ? d.toLocaleString("pt-BR") : o.createdAt;
      } catch {
        formattedDate = o.createdAt;
      }
    }

    return {
      "ID": o.id,
      "Nº Pedido": `#${rawNum}`,
      "Data e Hora": formattedDate,
      "Status": statusLabel,
      "Nome do Cliente": o.customerName || "—",
      "WhatsApp Cliente": o.customerPhone || "—",
      "Aniversário Cliente": o.customerBirthDate || "—",
      "Cidade de Entrega": o.deliveryCity || "Pirapora",
      "Endereço de Entrega": o.deliveryAddress || "Retirada na Loja",
      "Bairro": o.deliveryNeighborhood || "—",
      "Data/Turno de Entrega": o.deliveryDate || "Hoje",
      "Produto / Flores": o.productName || "—",
      "Categoria": o.category || "—",
      "Preço Ref. Produto (R$)": Number(refPrice.toFixed(2)),
      "Taxa de Frete (R$)": Number(freight.toFixed(2)),
      "Total do Pedido (R$)": Number(total.toFixed(2)),
      "Forma de Pagamento": o.paymentMethod || "pix",
      "Mensagem do Cartão": o.cardMessage || "—",
      "Remetente do Cartão": o.cardSender || "—",
      "Observações": o.notes || "—",
    };
  });

  const ordersSheet = XLSX.utils.json_to_sheet(ordersData.length > 0 ? ordersData : [
    {
      "ID": "—",
      "Nº Pedido": "—",
      "Data e Hora": "—",
      "Status": "—",
      "Nome do Cliente": "Nenhum pedido registrado",
      "WhatsApp Cliente": "—",
      "Aniversário Cliente": "—",
      "Cidade de Entrega": "—",
      "Endereço de Entrega": "—",
      "Bairro": "—",
      "Data/Turno de Entrega": "—",
      "Produto / Flores": "—",
      "Categoria": "—",
      "Preço Ref. Produto (R$)": 0,
      "Taxa de Frete (R$)": 0,
      "Total do Pedido (R$)": 0,
      "Forma de Pagamento": "—",
      "Mensagem do Cartão": "—",
      "Remetente do Cartão": "—",
      "Observações": "—",
    }
  ]);
  XLSX.utils.book_append_sheet(workbook, ordersSheet, "Pedidos");

  // ABA 2: CATÁLOGO DE FLORES
  const catalogData = products.map((p) => {
    const categoryName = categories.find((c) => c.slug === p.category || c.id === p.category || c.name === p.category)?.name || p.category || "Geral";
    const priceVal = p.price !== undefined ? p.price : (p.referencePrice || 0);
    return {
      "ID": p.id,
      "Nome do Produto": p.name,
      "Categoria": categoryName,
      "Preço de Venda (R$)": p.isPriceOnDemand ? "Sob Consulta" : Number(priceVal.toFixed(2)),
      "Preço 'De' (R$)": p.originalPrice ? Number(p.originalPrice.toFixed(2)) : "—",
      "Tipo de Preço": p.isPriceOnDemand ? "Sob Consulta (WhatsApp)" : "Preço Fixo",
      "Preço Ref. Interno (R$)": p.referencePrice ? Number(p.referencePrice.toFixed(2)) : Number(priceVal.toFixed(2)),
      "Volume de Pedidos": p.orderCount || 0,
      "Avaliação": p.rating || 5,
      "Em Estoque / Ativo": p.inStock ? "Sim" : "Não (Pausado)",
      "Descrição": p.description || "—",
      "Tags": Array.isArray(p.tags) ? p.tags.join(", ") : (p.tags || "—"),
      "Link da Foto": p.imageUrl || "—",
    };
  });

  const catalogSheet = XLSX.utils.json_to_sheet(catalogData.length > 0 ? catalogData : [
    {
      "ID": "—",
      "Nome do Produto": "Nenhum produto cadastrado",
      "Categoria": "—",
      "Preço de Venda (R$)": 0,
      "Preço 'De' (R$)": "—",
      "Tipo de Preço": "—",
      "Preço Ref. Interno (R$)": 0,
      "Volume de Pedidos": 0,
      "Avaliação": 5,
      "Em Estoque / Ativo": "—",
      "Descrição": "—",
      "Tags": "—",
      "Link da Foto": "—",
    }
  ]);
  XLSX.utils.book_append_sheet(workbook, catalogSheet, "Catálogo de Flores");

  // ABA 3: CATEGORIAS
  const categoriesData = categories.map((c) => ({
    "ID": c.id,
    "Nome da Categoria": c.name,
    "Slug / Identificador": c.slug,
    "Ícone / Emoji": c.icon || "🌸",
    "Descrição": c.description || "—",
    "Status": c.active !== false ? "Ativa" : "Inativa",
  }));

  const categoriesSheet = XLSX.utils.json_to_sheet(categoriesData.length > 0 ? categoriesData : [
    {
      "ID": "—",
      "Nome da Categoria": "Nenhuma categoria cadastrada",
      "Slug / Identificador": "—",
      "Ícone / Emoji": "—",
      "Descrição": "—",
      "Status": "—",
    }
  ]);
  XLSX.utils.book_append_sheet(workbook, categoriesSheet, "Categorias");

  // ABA 4: CLIENTES
  const customersData = customers.map((c) => {
    let formattedRegDate = "";
    if (c.createdAt) {
      try {
        const d = new Date(c.createdAt);
        formattedRegDate = !isNaN(d.getTime()) ? d.toLocaleDateString("pt-BR") : c.createdAt;
      } catch {
        formattedRegDate = c.createdAt;
      }
    }

    return {
      "ID": c.id,
      "Nome Completo": c.fullName,
      "WhatsApp / Telefone": c.phone,
      "Data de Aniversário": c.birthDate || "—",
      "Total de Pedidos": c.totalOrders || 0,
      "Observações / Preferências": c.notes || "—",
      "Data de Cadastro": formattedRegDate || "—",
    };
  });

  const customersSheet = XLSX.utils.json_to_sheet(customersData.length > 0 ? customersData : [
    {
      "ID": "—",
      "Nome Completo": "Nenhum cliente cadastrado",
      "WhatsApp / Telefone": "—",
      "Data de Aniversário": "—",
      "Total de Pedidos": 0,
      "Observações / Preferências": "—",
      "Data de Cadastro": "—",
    }
  ]);
  XLSX.utils.book_append_sheet(workbook, customersSheet, "Clientes");

  // Format filename with current date
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const filename = `Floricultura_Papoula_Dados_${dateStr}.xlsx`;

  // Trigger download
  XLSX.writeFile(workbook, filename);
}
