export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description?: string;
  active: boolean;
}

export interface Customer {
  id: string;
  fullName: string;
  phone: string;
  birthDate?: string; // DD/MM/YYYY or YYYY-MM-DD
  createdAt: string;
  notes?: string;
  totalOrders: number;
}

export type KanbanOrderStatus = "pedido" | "confirmado" | "em_andamento" | "concluido";

export interface KanbanOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerBirthDate?: string;
  productName: string;
  category: string;
  referencePrice?: number; // Preço de referência interno do arranjo (oculto no catálogo)
  freightFee?: number; // Custo da taxa de frete / entrega
  totalPrice: number; // Valor total estimado (referência + frete)
  deliveryAddress: string;
  deliveryNeighborhood?: string;
  deliveryCity: string;
  deliveryDate: string; // e.g. "Hoje" or "24/08/2026"
  cardMessage?: string;
  cardSender?: string;
  status: KanbanOrderStatus;
  createdAt: string;
  photoProofUrl?: string; // photo attached when concluded
  notes?: string;
  paymentMethod: "pix" | "cartao" | "dinheiro";
}

export interface ProductSize {
  id: string;
  name: string; // ex: "Padrão (12 Rosas)", "Premium (18 Rosas)", "Luxo (24 Rosas)"
  price: number;
  referencePrice?: number;
  originalPrice?: number;
  description: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  occasion: string[]; // ["romance", "aniversario", "agradecimento", "maternidade", "condolencias"]
  flowerType: string[]; // ["rosas", "girassol", "lirios", "orquideas", "astromelias"]
  price?: number; // Optional if isPriceOnDemand is true
  referencePrice?: number; // Preço de referência interno quando marcado como "Sob Consulta"
  originalPrice?: number;
  isPriceOnDemand?: boolean; // When true, displays "Sob Consulta / WhatsApp" without fixed price
  orderCount?: number; // Dynamic count of orders for 5-star calculation
  sizes?: ProductSize[];
  imageUrl: string;
  secondaryImages?: string[];
  description: string;
  details: {
    height?: string;
    width?: string;
    durability?: string;
    itemsIncluded: string[];
    careInstructions: string;
  };
  tags: string[]; // ["Mais Vendido", "Frete Grátis", "Entrega Hoje", "Vaso Incluso"]
  rating: number;
  reviewCount: number;
  inStock: boolean;
}

export interface Addon {
  id: string;
  name: string;
  category: "chocolate" | "pelucia" | "bebida" | "balao" | "vaso";
  price: number;
  imageUrl: string;
  description: string;
}

export interface CartItem {
  id: string; // unique item id in cart
  product: Product;
  selectedSize?: ProductSize;
  unitPrice: number;
  quantity: number;
  addons: { addon: Addon; quantity: number }[];
}

export interface DeliveryInfo {
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  reference?: string;
  date: string; // YYYY-MM-DD
  dateLabel: string; // "Hoje, 23/Ago"
  shiftId: string;
  shiftName: string;
  shiftFee: number;
  recipientName: string;
  recipientPhone: string;
}

export interface CardMessage {
  cardType: "romantico" | "aniversario" | "elegante" | "condolencias" | "sem_cartao";
  occasion: string;
  messageText: string;
  senderSignature: string;
  isAnonymous: boolean;
}

export interface BuyerInfo {
  fullName: string;
  email: string;
  phone: string;
  cpf: string;
  paymentMethod: "pix" | "credit_card";
  cardNumber?: string;
  cardName?: string;
  cardExpiry?: string;
  cardCvv?: string;
  installments?: number;
}

export interface Order {
  orderId: string;
  createdAt: string;
  status: "confirmado" | "preparando" | "pronto_foto" | "em_rota" | "entregue";
  items: CartItem[];
  delivery: DeliveryInfo;
  card: CardMessage;
  buyer: BuyerInfo;
  subtotal: number;
  deliveryFee: number;
  total: number;
  pixCode?: string;
  pixQrCodeUrl?: string;
  inspectionPhotoUrl?: string;
}

export interface Review {
  id: string;
  author: string;
  city: string;
  date: string;
  rating: number;
  comment: string;
  productBought: string;
  verified: boolean;
}

export interface GoogleDriveConfig {
  driveWebhookUrl?: string; // Web App URL do Google Apps Script (Drive JSON)
  folderUrl?: string; // Link da pasta compartilhada do Google Drive
  folderId?: string; // ID da pasta do Google Drive
  sheetWebhookUrl?: string; // Retrocompatibilidade
  spreadsheetId?: string; // Retrocompatibilidade
  autoSync: boolean;
  lastSyncedAt?: string;
}

export interface StoreConfig {
  storeName: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  address: string;
  city: string;
  operationMode: "auto" | "forced_open" | "forced_closed";
  weekdays: {
    enabled: boolean;
    openTime: string; // e.g. "07:30"
    closeTime: string; // e.g. "18:30"
  };
  saturday: {
    enabled: boolean;
    openTime: string; // e.g. "08:00"
    closeTime: string; // e.g. "12:30"
  };
  sunday: {
    enabled: boolean;
    openTime: string; // e.g. "08:00"
    closeTime: string; // e.g. "12:00"
  };
  closedMessage: string;
}

