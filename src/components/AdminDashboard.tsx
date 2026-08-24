import React, { useState } from "react";
import { 
  Lock, 
  User, 
  KeyRound, 
  PlusCircle, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  LogOut, 
  Sparkles,
  Save,
  RotateCcw,
  Flower2,
  Users,
  Kanban,
  LayoutDashboard,
  FolderTree,
  Phone,
  Cake,
  Calendar,
  Gift,
  Search,
  ArrowLeft,
  Store,
  DollarSign,
  Package,
  TrendingUp,
  X,
  Database,
  Star,
  MessageCircle,
  FileSpreadsheet,
  Download,
  Upload,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Check,
  Settings,
  Clock,
  MapPin,
  SlidersHorizontal,
  Instagram,
  Pencil,
  Send
} from "lucide-react";
import { Product, Category, Customer, KanbanOrder, KanbanOrderStatus, GoogleDriveConfig, StoreConfig } from "../types";
import { PapoulaLogo } from "./PapoulaLogo";
import { OrdersList } from "./OrdersList";
import { GoogleDriveSettingsModal } from "./GoogleDriveSettingsModal";
import { AICatalogExtractorModal } from "./AICatalogExtractorModal";
import { ImageUploadInput } from "./ImageUploadInput";
import { 
  exportOrdersToCSV, 
  exportCustomersToCSV, 
  exportCatalogToCSV, 
  exportCategoriesToCSV, 
  downloadCSV, 
  downloadOfficialSpreadsheetTemplate, 
  sendOrderToGoogleSheetsWebhook,
  syncCatalogToGoogleSheets,
  syncCategoriesToGoogleSheets,
  syncAllToGoogleSheets,
  parseCatalogFromCSV,
  parseCategoriesFromCSV
} from "../utils/googleDriveSync";
import { calculateStarRating, getStoreBusinessHours, DEFAULT_STORE_CONFIG } from "../utils/businessHours";
import { buildWhatsAppUrl } from "../utils/whatsapp";

interface AdminDashboardProps {
  products: Product[];
  categories: Category[];
  customers: Customer[];
  kanbanOrders: KanbanOrder[];
  googleDriveConfig: GoogleDriveConfig;
  onUpdateGoogleDriveConfig: (config: GoogleDriveConfig) => void;
  storeConfig: StoreConfig;
  onUpdateStoreConfig: (config: StoreConfig) => void;
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onAddCategory: (category: Category) => void;
  onUpdateCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
  onBatchImportProducts?: (products: Product[], categories: Category[], replaceMode: boolean) => void;
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customerId: string) => void;
  onUpdateOrderStatus: (orderId: string, status: KanbanOrderStatus, photoUrl?: string) => void;
  onAddKanbanOrder: (order: KanbanOrder) => void;
  onUpdateKanbanOrder?: (order: KanbanOrder) => void;
  onDeleteKanbanOrder?: (orderId: string) => void;
  onBatchImportOrders?: (orders: KanbanOrder[]) => void;
  onClearOrders?: () => void;
  onClearCustomers?: () => void;
  onClearProducts?: () => void;
  onClearCategories?: () => void;
  onClearAllData?: () => void;
  onResetToDefaults: () => void;
  onBackToShop: () => void;
}

const PRESET_FLOWER_IMAGES = [
  {
    name: "Rosas Colombianas Vermelhas",
    url: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=800&q=80",
    category: "buques",
  },
  {
    name: "Girassóis & Flores do Campo",
    url: "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?auto=format&fit=crop&w=800&q=80",
    category: "flores-do-campo",
  },
  {
    name: "Orquídea Phalaenopsis Branca",
    url: "https://images.unsplash.com/photo-1566140967404-b8b393279a2a?auto=format&fit=crop&w=800&q=80",
    category: "orquideas",
  },
  {
    name: "Cesta Café Colonial",
    url: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
    category: "cestas",
  },
  {
    name: "Flower Box Rosas & Ferrero",
    url: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=800&q=80",
    category: "arranjos",
  },
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  categories,
  customers,
  kanbanOrders,
  googleDriveConfig,
  onUpdateGoogleDriveConfig,
  storeConfig = DEFAULT_STORE_CONFIG,
  onUpdateStoreConfig,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onBatchImportProducts,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onUpdateOrderStatus,
  onAddKanbanOrder,
  onUpdateKanbanOrder,
  onDeleteKanbanOrder,
  onBatchImportOrders,
  onClearOrders,
  onClearCustomers,
  onClearProducts,
  onClearCategories,
  onClearAllData,
  onResetToDefaults,
  onBackToShop,
}) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem("papoula_admin_auth") === "true";
  });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Lateral Menu View State
  const [activeMenu, setActiveMenu] = useState<"orders" | "products" | "categories" | "customers" | "settings" | "database" | "dashboard">("orders");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  // Google Drive Modal State
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);

  // AI Catalog Extractor Modal State
  const [isAIExtractorModalOpen, setIsAIExtractorModalOpen] = useState(false);

  // Store Configuration & Business Hours Form State
  const [cfgStoreName, setCfgStoreName] = useState(storeConfig.storeName || "Floricultura Papoula");
  const [cfgPhone, setCfgPhone] = useState(storeConfig.phone || "(38) 98851-2855");
  const [cfgWhatsapp, setCfgWhatsapp] = useState(storeConfig.whatsapp || "5538988512855");
  const [cfgInstagram, setCfgInstagram] = useState(storeConfig.instagram || "floriculturapapoula");
  const [cfgAddress, setCfgAddress] = useState(storeConfig.address || "Rua Montes Claros, 240, Centro");
  const [cfgCity, setCfgCity] = useState(storeConfig.city || "Pirapora - MG");
  const [cfgOperationMode, setCfgOperationMode] = useState<"auto" | "forced_open" | "forced_closed">(storeConfig.operationMode || "auto");
  
  const [cfgWeekdaysEnabled, setCfgWeekdaysEnabled] = useState(storeConfig.weekdays?.enabled ?? true);
  const [cfgWeekdaysOpen, setCfgWeekdaysOpen] = useState(storeConfig.weekdays?.openTime || "08:00");
  const [cfgWeekdaysClose, setCfgWeekdaysClose] = useState(storeConfig.weekdays?.closeTime || "18:00");

  const [cfgSaturdayEnabled, setCfgSaturdayEnabled] = useState(storeConfig.saturday?.enabled ?? true);
  const [cfgSaturdayOpen, setCfgSaturdayOpen] = useState(storeConfig.saturday?.openTime || "08:00");
  const [cfgSaturdayClose, setCfgSaturdayClose] = useState(storeConfig.saturday?.closeTime || "13:00");

  const [cfgSundayEnabled, setCfgSundayEnabled] = useState(storeConfig.sunday?.enabled ?? false);
  const [cfgSundayOpen, setCfgSundayOpen] = useState(storeConfig.sunday?.openTime || "08:00");
  const [cfgSundayClose, setCfgSundayClose] = useState(storeConfig.sunday?.closeTime || "12:00");

  const [cfgClosedMessage, setCfgClosedMessage] = useState(
    storeConfig.closedMessage || "Estamos fora do nosso horário de atendimento em tempo real. Você pode registrar sua encomenda normalmente e responderemos no início do próximo dia útil!"
  );

  // New Product Form State
  const [productName, setProductName] = useState("");
  const [productCategory, setProductCategory] = useState(categories[0]?.id || "buques");
  const [price, setPrice] = useState("");
  const [referencePrice, setReferencePrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [isPriceOnDemand, setIsPriceOnDemand] = useState(false);
  const [orderCountInput, setOrderCountInput] = useState("12");
  const [imageUrl, setImageUrl] = useState(PRESET_FLOWER_IMAGES[0].url);
  const [description, setDescription] = useState("");
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [newPriceValue, setNewPriceValue] = useState("");

  // New Category Form State
  const [catName, setCatName] = useState("");
  const [catIcon, setCatIcon] = useState("🌸");
  const [catDescription, setCatDescription] = useState("");

  // Customer Management Form State
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustBirthDate, setNewCustBirthDate] = useState("");
  const [newCustNotes, setNewCustNotes] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerFilterTab, setCustomerFilterTab] = useState<"all" | "birthdays" | "month_birthdays" | "with_orders">("all");
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  
  // Customer Edit Modal State
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editCustName, setEditCustName] = useState("");
  const [editCustPhone, setEditCustPhone] = useState("");
  const [editCustBirthDate, setEditCustBirthDate] = useState("");
  const [editCustNotes, setEditCustNotes] = useState("");

  // Product Edit Modal State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editProdName, setEditProdName] = useState("");
  const [editProdCategory, setEditProdCategory] = useState("");
  const [editProdPrice, setEditProdPrice] = useState("");
  const [editProdReferencePrice, setEditProdReferencePrice] = useState("");
  const [editProdOriginalPrice, setEditProdOriginalPrice] = useState("");
  const [editProdIsPriceOnDemand, setEditProdIsPriceOnDemand] = useState(false);
  const [editProdImageUrl, setEditProdImageUrl] = useState("");
  const [editProdDescription, setEditProdDescription] = useState("");
  const [editProdOrderCount, setEditProdOrderCount] = useState("10");
  const [editProdInStock, setEditProdInStock] = useState(true);

  // Google Drive inline configuration form state
  const [sheetWebhookUrl, setSheetWebhookUrl] = useState(googleDriveConfig.sheetWebhookUrl || "");
  const [spreadsheetId, setSpreadsheetId] = useState(googleDriveConfig.spreadsheetId || "");
  const [folderUrl, setFolderUrl] = useState(googleDriveConfig.folderUrl || "");
  const [autoSync, setAutoSync] = useState(googleDriveConfig.autoSync);

  // Requirement: Apenas a Última Atualização do Catálogo (cadastro, preço ou foto)
  const [lastUpdate, setLastUpdate] = useState<{
    type: "product" | "price" | "image";
    label: string;
    productName: string;
    detail?: string;
    date: string;
  }>(() => {
    try {
      const saved = localStorage.getItem("papoula_last_single_update");
      if (saved) return JSON.parse(saved);
    } catch (e) {}

    const lastProd = products[products.length - 1] || products[0];
    const nowFormatted = new Date().toLocaleDateString("pt-BR") + " às " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    return {
      type: "product",
      label: "Cadastro de Produto",
      productName: lastProd ? lastProd.name : "Catálogo Inicial",
      detail: lastProd?.price ? `R$ ${lastProd.price.toFixed(2)}` : undefined,
      date: nowFormatted,
    };
  });

  const recordLatestUpdate = (info: {
    type: "product" | "price" | "image";
    label: string;
    productName: string;
    detail?: string;
    date: string;
  }) => {
    setLastUpdate(info);
    try {
      localStorage.setItem("papoula_last_single_update", JSON.stringify(info));
    } catch (e) {}
  };

  const showNotification = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(""), 4000);
  };

  const handleSaveStoreConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: StoreConfig = {
      storeName: cfgStoreName.trim(),
      phone: cfgPhone.trim(),
      whatsapp: cfgWhatsapp.trim(),
      instagram: cfgInstagram.trim().replace(/^@/, ""),
      address: cfgAddress.trim(),
      city: cfgCity.trim(),
      operationMode: cfgOperationMode,
      weekdays: {
        enabled: cfgWeekdaysEnabled,
        openTime: cfgWeekdaysOpen,
        closeTime: cfgWeekdaysClose,
      },
      saturday: {
        enabled: cfgSaturdayEnabled,
        openTime: cfgSaturdayOpen,
        closeTime: cfgSaturdayClose,
      },
      sunday: {
        enabled: cfgSundayEnabled,
        openTime: cfgSundayOpen,
        closeTime: cfgSundayClose,
      },
      closedMessage: cfgClosedMessage.trim(),
    };
    onUpdateStoreConfig(updated);
    showNotification("✅ Horários de funcionamento e configurações salvas com sucesso!");
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim().toLowerCase() === "admin" && password === "papoula123") {
      setIsAuthenticated(true);
      sessionStorage.setItem("papoula_admin_auth", "true");
      setLoginError("");
    } else {
      setLoginError("Usuário ou senha incorretos. Use admin / papoula123");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("papoula_admin_auth");
    setUsername("");
    setPassword("");
  };

  // Product Actions
  const handlePublishProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) {
      alert("Por favor, preencha o nome do produto.");
      return;
    }

    let numPrice = 0;
    let numRefPrice: number | undefined;

    if (!isPriceOnDemand) {
      if (!price.trim()) {
        alert("Por favor, preencha o preço do produto ou marque a opção 'Sob Consulta'.");
        return;
      }
      numPrice = parseFloat(price.replace(",", "."));
      if (isNaN(numPrice) || numPrice <= 0) {
        alert("Informe um preço válido.");
        return;
      }
      numRefPrice = numPrice;
    } else {
      if (referencePrice.trim()) {
        const parsedRef = parseFloat(referencePrice.replace(",", "."));
        if (!isNaN(parsedRef) && parsedRef > 0) {
          numRefPrice = parsedRef;
        }
      }
    }

    let numOriginalPrice: number | undefined;
    if (!isPriceOnDemand && originalPrice.trim()) {
      const parsed = parseFloat(originalPrice.replace(",", "."));
      if (!isNaN(parsed) && parsed > numPrice) {
        numOriginalPrice = parsed;
      }
    }

    const orderCnt = parseInt(orderCountInput) || 5;
    const slug = productName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const newProd: Product = {
      id: `prod-${Date.now()}`,
      name: productName.trim(),
      slug,
      category: productCategory,
      occasion: ["aniversario", "romance", "agradecimento"],
      flowerType: ["rosas", "girassol", "lirios"],
      price: numPrice,
      referencePrice: numRefPrice,
      originalPrice: numOriginalPrice,
      isPriceOnDemand,
      orderCount: orderCnt,
      imageUrl: imageUrl.trim() || PRESET_FLOWER_IMAGES[0].url,
      description: description.trim() || "Arranjo exclusivo confeccionado com flores frescas na Floricultura Papoula.",
      details: {
        durability: "7 a 10 dias com cuidados básicos",
        itemsIncluded: ["Flores frescas selecionadas", "Embalagem para presente", "Cartão com dedicatória"],
        careInstructions: "Trocar a água em dias alternados e manter em local fresco e arejado.",
      },
      tags: isPriceOnDemand ? ["Sob Consulta", "Flores Nobres"] : ["Novidade", "Flores Frescas"],
      inStock: true,
      rating: 5.0,
      reviewCount: Math.max(1, Math.round(orderCnt * 0.8)),
    };

    onAddProduct(newProd);
    
    // Requirement: Registrar apenas a última atualização de cadastro
    const nowTime = new Date().toLocaleDateString("pt-BR") + " às " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    recordLatestUpdate({
      type: "product",
      label: "Cadastro de Produto",
      productName: newProd.name,
      detail: newProd.price && newProd.price > 0 ? `R$ ${newProd.price.toFixed(2)}` : "Cadastrado",
      date: nowTime,
    });

    setProductName("");
    setPrice("");
    setReferencePrice("");
    setOriginalPrice("");
    setIsPriceOnDemand(false);
    setDescription("");
    showNotification(`Produto "${newProd.name}" publicado com sucesso!`);
  };

  const handleSaveInlinePrice = (prod: Product) => {
    const num = parseFloat(newPriceValue.replace(",", "."));
    if (!isNaN(num) && num > 0) {
      onUpdateProduct({ ...prod, price: num, isPriceOnDemand: false });
      setEditingPriceId(null);

      // Requirement: Registrar apenas a última atualização de preço
      const nowTime = new Date().toLocaleDateString("pt-BR") + " às " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      recordLatestUpdate({
        type: "price",
        label: "Alteração de Preço",
        productName: prod.name,
        detail: `R$ ${num.toFixed(2)}`,
        date: nowTime,
      });

      showNotification(`Preço de "${prod.name}" alterado para R$ ${num.toFixed(2)}.`);
    }
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setEditProdName(prod.name);
    setEditProdCategory(prod.category);
    setEditProdPrice(prod.price > 0 ? prod.price.toString().replace(".", ",") : "");
    setEditProdReferencePrice(prod.referencePrice ? prod.referencePrice.toString().replace(".", ",") : (prod.price > 0 ? prod.price.toString().replace(".", ",") : ""));
    setEditProdOriginalPrice(prod.originalPrice ? prod.originalPrice.toString().replace(".", ",") : "");
    setEditProdIsPriceOnDemand(Boolean(prod.isPriceOnDemand));
    setEditProdImageUrl(prod.imageUrl || PRESET_FLOWER_IMAGES[0].url);
    setEditProdDescription(prod.description || "");
    setEditProdOrderCount((prod.orderCount || 10).toString());
    setEditProdInStock(prod.inStock);
  };

  const handleSaveEditProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!editProdName.trim()) {
      alert("Por favor, informe o nome do produto.");
      return;
    }

    let numPrice = 0;
    let numRefPrice: number | undefined;

    if (!editProdIsPriceOnDemand) {
      if (!editProdPrice.trim()) {
        alert("Informe o preço de venda ou marque 'Sob Consulta'.");
        return;
      }
      numPrice = parseFloat(editProdPrice.replace(",", "."));
      if (isNaN(numPrice) || numPrice <= 0) {
        alert("Preço inválido.");
        return;
      }
      numRefPrice = numPrice;
    } else {
      if (editProdReferencePrice.trim()) {
        const parsedRef = parseFloat(editProdReferencePrice.replace(",", "."));
        if (!isNaN(parsedRef) && parsedRef > 0) {
          numRefPrice = parsedRef;
        }
      }
    }

    let origPrice: number | undefined;
    if (!editProdIsPriceOnDemand && editProdOriginalPrice.trim()) {
      const parsed = parseFloat(editProdOriginalPrice.replace(",", "."));
      if (!isNaN(parsed) && parsed > numPrice) {
        origPrice = parsed;
      }
    }

    const updated: Product = {
      ...editingProduct,
      name: editProdName.trim(),
      category: editProdCategory,
      price: numPrice,
      referencePrice: numRefPrice,
      originalPrice: origPrice,
      isPriceOnDemand: editProdIsPriceOnDemand,
      imageUrl: editProdImageUrl.trim() || editingProduct.imageUrl,
      description: editProdDescription.trim(),
      orderCount: parseInt(editProdOrderCount) || 10,
      inStock: editProdInStock,
    };

    onUpdateProduct(updated);

    // Requirement: Registrar apenas a última atualização mais recente
    const nowTime = new Date().toLocaleDateString("pt-BR") + " às " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const imageChanged = editingProduct.imageUrl !== (editProdImageUrl.trim() || editingProduct.imageUrl);
    const priceChanged = editingProduct.price !== numPrice || editingProduct.isPriceOnDemand !== editProdIsPriceOnDemand;

    if (imageChanged) {
      recordLatestUpdate({
        type: "image",
        label: "Nova Foto / Imagem",
        productName: updated.name,
        detail: "Foto atualizada",
        date: nowTime,
      });
    } else if (priceChanged) {
      recordLatestUpdate({
        type: "price",
        label: "Alteração de Preço",
        productName: updated.name,
        detail: numPrice > 0 ? `R$ ${numPrice.toFixed(2)}` : "Sob Consulta",
        date: nowTime,
      });
    } else {
      recordLatestUpdate({
        type: "product",
        label: "Produto Atualizado",
        productName: updated.name,
        detail: numPrice > 0 ? `R$ ${numPrice.toFixed(2)}` : undefined,
        date: nowTime,
      });
    }

    setEditingProduct(null);
    showNotification(`Produto "${updated.name}" atualizado com sucesso!`);
  };

  // Category Actions
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    const catSlug = catName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const newCat: Category = {
      id: catSlug,
      name: catName.trim(),
      slug: catSlug,
      icon: catIcon.trim() || "🌸",
      description: catDescription.trim() || undefined,
      active: true,
    };

    onAddCategory(newCat);
    setCatName("");
    setCatIcon("🌸");
    setCatDescription("");
    showNotification(`Categoria "${newCat.name}" criada com sucesso!`);
  };

  // Customer Actions
  const isBirthdayInCurrentMonth = (birthDateStr?: string) => {
    if (!birthDateStr) return false;
    const currentMonth = new Date().getMonth() + 1; // 1-12
    if (birthDateStr.includes("/")) {
      const parts = birthDateStr.split("/");
      if (parts.length >= 2) {
        const month = parseInt(parts[1], 10);
        return month === currentMonth;
      }
    } else if (birthDateStr.includes("-")) {
      const parts = birthDateStr.split("-");
      if (parts.length >= 2) {
        const month = parseInt(parts[1], 10);
        return month === currentMonth;
      }
    }
    return false;
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustPhone.trim()) {
      alert("Informe o nome e o telefone do cliente.");
      return;
    }

    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      fullName: newCustName.trim(),
      phone: newCustPhone.trim(),
      birthDate: newCustBirthDate.trim() || undefined,
      notes: newCustNotes.trim() || "Cadastrado manualmente no painel",
      totalOrders: 0,
      createdAt: new Date().toISOString(),
    };

    onAddCustomer(newCust);
    setNewCustName("");
    setNewCustPhone("");
    setNewCustBirthDate("");
    setNewCustNotes("");
    setIsAddCustomerOpen(false);
    showNotification(`Cliente "${newCust.fullName}" cadastrado com sucesso!`);
  };

  const handleOpenEditCustomer = (cust: Customer) => {
    setEditingCustomer(cust);
    setEditCustName(cust.fullName);
    setEditCustPhone(cust.phone);
    setEditCustBirthDate(cust.birthDate || "");
    setEditCustNotes(cust.notes || "");
  };

  const handleSaveEditedCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    if (!editCustName.trim() || !editCustPhone.trim()) {
      alert("Informe o nome e o telefone do cliente.");
      return;
    }
    const updated: Customer = {
      ...editingCustomer,
      fullName: editCustName.trim(),
      phone: editCustPhone.trim(),
      birthDate: editCustBirthDate.trim() || undefined,
      notes: editCustNotes.trim() || undefined,
    };
    onUpdateCustomer(updated);
    setEditingCustomer(null);
    showNotification(`Cadastro de "${updated.fullName}" atualizado com sucesso!`);
  };

  // Save Google Drive Settings
  const handleSaveGoogleDriveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: GoogleDriveConfig = {
      sheetWebhookUrl: sheetWebhookUrl.trim(),
      spreadsheetId: spreadsheetId.trim(),
      folderUrl: folderUrl.trim(),
      autoSync,
      lastSyncedAt: new Date().toLocaleDateString("pt-BR") + " às " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    };
    onUpdateGoogleDriveConfig(updated);
    showNotification("Configurações do Google Drive & Planilha salvas com sucesso!");
  };

  const handleDownloadOrdersCSV = () => {
    const csv = exportOrdersToCSV(kanbanOrders);
    const date = new Date().toISOString().split("T")[0];
    downloadCSV(`papoula_pedidos_kanban_${date}.csv`, csv);
    showNotification("Download do CSV de Pedidos iniciado!");
  };

  const handleDownloadCustomersCSV = () => {
    const csv = exportCustomersToCSV(customers);
    const date = new Date().toISOString().split("T")[0];
    downloadCSV(`papoula_clientes_aniversarios_${date}.csv`, csv);
    showNotification("Download do CSV de Clientes iniciado!");
  };

  const [isPushingCatalog, setIsPushingCatalog] = useState(false);
  const [isPushingCategories, setIsPushingCategories] = useState(false);
  const [isSyncingAllData, setIsSyncingAllData] = useState(false);

  const handleDownloadCatalogCSV = () => {
    const csv = exportCatalogToCSV(products);
    const date = new Date().toISOString().split("T")[0];
    downloadCSV(`papoula_catalogo_produtos_${date}.csv`, csv);
    showNotification("Download do CSV do Catálogo iniciado!");
  };

  const handleDownloadCategoriesCSV = () => {
    const csv = exportCategoriesToCSV(categories);
    const date = new Date().toISOString().split("T")[0];
    downloadCSV(`papoula_categorias_${date}.csv`, csv);
    showNotification("Download do CSV de Categorias iniciado!");
  };

  const handlePushCatalogToSheets = async () => {
    const url = googleDriveConfig.sheetWebhookUrl || sheetWebhookUrl;
    if (!url?.trim()) {
      showNotification("Configure primeiro a URL do Webhook na aba Banco Google Drive.");
      setActiveMenu("database");
      return;
    }
    setIsPushingCatalog(true);
    try {
      const res = await syncCatalogToGoogleSheets(url.trim(), products);
      showNotification(res.success ? "✅ Catálogo salvo na planilha com sucesso (aba Catalogo)!" : `⚠️ ${res.message}`);
    } catch (e: any) {
      showNotification("Erro ao salvar catálogo: " + e.message);
    } finally {
      setIsPushingCatalog(false);
    }
  };

  const handlePushCategoriesToSheets = async () => {
    const url = googleDriveConfig.sheetWebhookUrl || sheetWebhookUrl;
    if (!url?.trim()) {
      showNotification("Configure primeiro a URL do Webhook na aba Banco Google Drive.");
      setActiveMenu("database");
      return;
    }
    setIsPushingCategories(true);
    try {
      const res = await syncCategoriesToGoogleSheets(url.trim(), categories);
      showNotification(res.success ? "✅ Categorias salvas na planilha com sucesso (aba Categorias)!" : `⚠️ ${res.message}`);
    } catch (e: any) {
      showNotification("Erro ao salvar categorias: " + e.message);
    } finally {
      setIsPushingCategories(false);
    }
  };

  const handleSyncAllToSheets = async () => {
    const url = googleDriveConfig.sheetWebhookUrl || sheetWebhookUrl;
    if (!url?.trim()) {
      showNotification("Configure primeiro a URL do Webhook na aba Banco Google Drive.");
      setActiveMenu("database");
      return;
    }
    setIsSyncingAllData(true);
    try {
      const res = await syncAllToGoogleSheets(url.trim(), {
        orders: kanbanOrders,
        products,
        categories,
        customers
      });
      showNotification(res.success ? "✅ Sincronização completa realizada! (Abas Pedidos, Catalogo e Categorias atualizadas)" : `⚠️ ${res.message}`);
    } catch (e: any) {
      showNotification("Erro ao sincronizar tudo: " + e.message);
    } finally {
      setIsSyncingAllData(false);
    }
  };

  const monthBirthdaysCount = customers.filter((c) => isBirthdayInCurrentMonth(c.birthDate)).length;
  const withBirthdaysCount = customers.filter((c) => !!c.birthDate && c.birthDate.trim() !== "").length;
  const withOrdersCount = customers.filter((c) => (c.totalOrders || 0) > 0).length;

  const filteredCustomers = customers.filter((c) => {
    if (customerFilterTab === "birthdays" && (!c.birthDate || c.birthDate.trim() === "")) return false;
    if (customerFilterTab === "month_birthdays" && !isBirthdayInCurrentMonth(c.birthDate)) return false;
    if (customerFilterTab === "with_orders" && (!c.totalOrders || c.totalOrders <= 0)) return false;

    if (!customerSearch.trim()) return true;
    const q = customerSearch.toLowerCase();
    return (
      c.fullName.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.birthDate && c.birthDate.includes(q)) ||
      (c.notes && c.notes.toLowerCase().includes(q))
    );
  });

  // Calculate Metrics
  const totalRevenue = kanbanOrders.reduce((acc, order) => acc + (order.totalPrice || 0), 0);
  const completedOrders = kanbanOrders.filter((o) => o.status === "concluido").length;
  const activeOrders = kanbanOrders.filter((o) => o.status !== "concluido").length;

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">
      {/* Top Header bar with Logo */}
      <header className="sticky top-0 z-30 bg-[#114b30] text-white px-4 sm:px-8 py-3.5 shadow-md flex items-center justify-between border-b border-emerald-950/30">
        <div className="flex items-center gap-3">
          <PapoulaLogo size="md" variant="light" />
          <div className="hidden sm:block pl-3 border-l border-emerald-700/60">
            <span className="text-xs font-semibold text-emerald-200 block uppercase tracking-wider">
              Painel de Controle & Produção
            </span>
            <span className="text-[11px] text-amber-300">
              Floricultura Papoula • Pirapora & Buritizeiro
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsDriveModalOpen(true)}
            className="flex items-center gap-1.5 bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 px-3 py-2 rounded-xl text-xs font-bold transition-all border border-emerald-600/50 cursor-pointer"
            title="Configurar Google Drive & Banco de Dados"
          >
            <Database className="w-4 h-4 text-amber-300" />
            <span className="hidden md:inline">Google Drive</span>
          </button>

          <button
            onClick={onBackToShop}
            className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-emerald-950 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer hover:scale-102"
            title="Voltar para a Loja Virtual"
          >
            <Store className="w-4 h-4" />
            <span className="hidden sm:inline">Ver Vitrine da Loja</span>
            <span className="sm:hidden">Loja</span>
          </button>

          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20 text-emerald-100 px-3 py-2 rounded-xl transition-colors cursor-pointer"
              title="Sair da Área Interna"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Sair</span>
            </button>
          )}
        </div>
      </header>

      {/* Auth Check */}
      {!isAuthenticated ? (
        /* Login Screen (Full Page) */
        <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
          <div className="bg-white rounded-3xl p-6 sm:p-10 max-w-md w-full shadow-xl border border-stone-200 space-y-6 animate-fadeIn">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#114b30] flex items-center justify-center mx-auto shadow-2xs border border-emerald-200">
                <Lock className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-serif font-extrabold text-stone-900">
                Acesso ao Sistema Interno
              </h2>
              <p className="text-xs sm:text-sm text-stone-500">
                Gestão do Kanban de pedidos, catálogo de produtos, clientes e sincronização Google Drive.
              </p>
            </div>

            {loginError && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Usuário
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Seu usuário"
                    required
                    className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                  />
                  <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Senha
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                  />
                  <KeyRound className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#114b30] hover:bg-[#0c3924] text-white font-bold rounded-xl text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>Entrar no Sistema</span>
              </button>
            </form>
          </div>
        </main>
      ) : (
        /* Authenticated Full-Page Layout with Left Navigation */
        <div className="flex-1 flex flex-col md:flex-row">
          
          {/* LEFT LATERAL SIDEBAR */}
          <aside className="w-full md:w-64 bg-[#0d3b26] text-white flex md:flex-col justify-between shrink-0 border-r border-emerald-900/50 md:sticky md:top-[61px] md:h-[calc(100vh-61px)] md:overflow-y-auto z-20">
            <div className="p-3 sm:p-4 space-y-1.5 w-full overflow-x-auto md:overflow-x-visible flex md:flex-col gap-1 md:gap-1.5">
              
              <div className="hidden md:block px-3 py-2 text-[10px] font-extrabold uppercase tracking-widest text-emerald-400/80">
                Menu de Gestão
              </div>

              <button
                onClick={() => setActiveMenu("orders")}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap text-left ${
                  activeMenu === "orders" || (activeMenu as string) === "kanban"
                    ? "bg-amber-400 text-emerald-950 font-bold shadow-xs"
                    : "text-emerald-100 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Package className="w-4 h-4 shrink-0" />
                <span>Lista de Pedidos</span>
                <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  activeMenu === "orders" || (activeMenu as string) === "kanban" ? "bg-emerald-900 text-white" : "bg-white/15 text-white"
                }`}>
                  {kanbanOrders.length}
                </span>
              </button>

              <button
                onClick={() => setActiveMenu("products")}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap text-left ${
                  activeMenu === "products"
                    ? "bg-amber-400 text-emerald-950 font-bold shadow-xs"
                    : "text-emerald-100 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Flower2 className="w-4 h-4 shrink-0" />
                <span>Catálogo de Flores</span>
                <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  activeMenu === "products" ? "bg-emerald-900 text-white" : "bg-white/15 text-white"
                }`}>
                  {products.length}
                </span>
              </button>

              <button
                onClick={() => setActiveMenu("categories")}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap text-left ${
                  activeMenu === "categories"
                    ? "bg-amber-400 text-emerald-950 font-bold shadow-xs"
                    : "text-emerald-100 hover:bg-white/10 hover:text-white"
                }`}
              >
                <FolderTree className="w-4 h-4 shrink-0" />
                <span>Categorias</span>
                <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  activeMenu === "categories" ? "bg-emerald-900 text-white" : "bg-white/15 text-white"
                }`}>
                  {categories.length}
                </span>
              </button>

              <button
                onClick={() => setActiveMenu("customers")}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap text-left ${
                  activeMenu === "customers"
                    ? "bg-amber-400 text-emerald-950 font-bold shadow-xs"
                    : "text-emerald-100 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Users className="w-4 h-4 shrink-0" />
                <span>Clientes & Aniversários</span>
                <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  activeMenu === "customers" ? "bg-emerald-900 text-white" : "bg-white/15 text-white"
                }`}>
                  {customers.length}
                </span>
              </button>

              <button
                onClick={() => setActiveMenu("settings")}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap text-left ${
                  activeMenu === "settings"
                    ? "bg-amber-400 text-emerald-950 font-bold shadow-xs"
                    : "text-emerald-100 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Clock className="w-4 h-4 shrink-0" />
                <span>Horários & Configurações</span>
                <span className={`ml-auto w-2.5 h-2.5 rounded-full ${
                  cfgOperationMode === "forced_closed" 
                    ? "bg-rose-400" 
                    : cfgOperationMode === "forced_open"
                    ? "bg-emerald-300"
                    : "bg-emerald-400"
                }`} title="Status de Funcionamento" />
              </button>

              <button
                onClick={() => setActiveMenu("database")}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap text-left ${
                  activeMenu === "database"
                    ? "bg-amber-400 text-emerald-950 font-bold shadow-xs"
                    : "text-emerald-100 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Database className="w-4 h-4 shrink-0" />
                <span>Banco Google Drive</span>
                {googleDriveConfig.autoSync && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400" title="Sincronização Ativa" />
                )}
              </button>

              <button
                onClick={() => setActiveMenu("dashboard")}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap text-left ${
                  activeMenu === "dashboard"
                    ? "bg-amber-400 text-emerald-950 font-bold shadow-xs"
                    : "text-emerald-100 hover:bg-white/10 hover:text-white"
                }`}
              >
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                <span>Métricas & Vendas</span>
              </button>

            </div>

            {/* Bottom Quick Store Info & Apenas Última Atualização */}
            <div className="hidden md:block p-3.5 border-t border-emerald-900/50 bg-[#09291a] text-[11px] text-emerald-300/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span>Loja Física:</span>
                <strong className="text-white">Rua Mato Grosso 211B</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>WhatsApp:</span>
                <strong className="text-amber-300">(38) 98851-2855</strong>
              </div>

              {/* Card de Última Atualização (Apenas a última atualização mais recente) */}
              <div className="pt-2 border-t border-emerald-900/80 bg-emerald-950/70 p-2.5 rounded-xl border border-emerald-800/40 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-amber-300">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Última Atualização</span>
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>

                <div className="text-[11px] text-emerald-200/90 leading-tight">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-emerald-400 font-semibold text-[10px] flex items-center gap-1">
                      {lastUpdate.type === "product" && "📦"}
                      {lastUpdate.type === "price" && "💰"}
                      {lastUpdate.type === "image" && "📸"}
                      {lastUpdate.label}:
                    </span>
                    {lastUpdate.detail && (
                      <span className="text-amber-300 font-bold text-[10px] shrink-0">
                        {lastUpdate.detail}
                      </span>
                    )}
                  </div>
                  <strong className="text-white truncate block text-[11px]" title={lastUpdate.productName}>
                    {lastUpdate.productName}
                  </strong>
                  <span className="text-[9px] text-emerald-400/80 block mt-0.5">
                    {lastUpdate.date}
                  </span>
                </div>
              </div>
            </div>
          </aside>

          {/* MAIN VIEW WORKSPACE */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
            
            {/* Feedback notification toast */}
            {feedbackMessage && (
              <div className="mb-4 bg-emerald-700 text-white px-4 py-3 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-md animate-fadeIn">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>{feedbackMessage}</span>
                </div>
                <button onClick={() => setFeedbackMessage("")} className="text-white/80 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* TAB 1: LISTAGEM GERAL DE PEDIDOS DA PLANILHA (CONTAGEM & FILTRO POR DATA) */}
            {(activeMenu === "orders" || (activeMenu as string) === "kanban") && (
              <OrdersList
                orders={kanbanOrders}
                products={products}
                googleDriveConfig={googleDriveConfig}
                onUpdateOrderStatus={onUpdateOrderStatus}
                onAddOrder={onAddKanbanOrder}
                onUpdateOrder={onUpdateKanbanOrder || ((updated) => {})}
                onBatchImportOrders={onBatchImportOrders}
                onDeleteOrder={onDeleteKanbanOrder}
                onClearOrders={onClearOrders}
                onOpenDatabaseSettings={() => setActiveMenu("database")}
              />
            )}

            {/* TAB 2: LISTA DE CLIENTES & ANIVERSÁRIOS */}
            {activeMenu === "customers" && (
              <div className="space-y-6">
                {/* Header & Main Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-serif font-extrabold text-stone-900 flex items-center gap-2">
                      <Users className="w-6 h-6 text-[#114b30]" />
                      <span>Lista de Clientes & Aniversariantes</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-500">
                      Gestão completa em lista: contatos do WhatsApp, datas de aniversário e histórico de compras.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setIsAddCustomerOpen(!isAddCustomerOpen)}
                      className="px-3.5 py-2 bg-[#114b30] hover:bg-[#0c3924] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                    >
                      <PlusCircle className="w-4 h-4 text-emerald-300" />
                      <span>{isAddCustomerOpen ? "Fechar Formulário" : "+ Novo Cliente"}</span>
                    </button>

                    <button
                      onClick={handleDownloadCustomersCSV}
                      className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                      title="Exportar base de clientes para CSV"
                    >
                      <Download className="w-4 h-4 text-emerald-700" />
                      <span>Exportar CSV</span>
                    </button>

                    {onClearCustomers && customers.length > 0 && (
                      <button
                        onClick={onClearCustomers}
                        className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                        title="Limpar todos os clientes da lista"
                      >
                        <Trash2 className="w-4 h-4 text-rose-600" />
                        <span>Limpar Clientes</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* KPI Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">Total de Clientes</span>
                    <span className="text-2xl font-extrabold text-stone-900">{customers.length}</span>
                  </div>

                  <div className={`p-4 rounded-xl border shadow-2xs transition-colors ${monthBirthdaysCount > 0 ? "bg-amber-50/80 border-amber-300" : "bg-white border-stone-200"}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-bold uppercase tracking-wider block ${monthBirthdaysCount > 0 ? "text-amber-900" : "text-stone-400"}`}>
                        Aniversariantes do Mês
                      </span>
                      <Cake className={`w-4 h-4 ${monthBirthdaysCount > 0 ? "text-amber-600 animate-bounce" : "text-stone-400"}`} />
                    </div>
                    <span className={`text-2xl font-extrabold ${monthBirthdaysCount > 0 ? "text-amber-900" : "text-stone-900"}`}>
                      {monthBirthdaysCount}
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">Com Aniversário</span>
                    <span className="text-2xl font-extrabold text-stone-900">{withBirthdaysCount}</span>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">Com Pedidos Feitos</span>
                    <span className="text-2xl font-extrabold text-stone-900">{withOrdersCount}</span>
                  </div>
                </div>

                {/* Add Customer Collapsible Form */}
                {isAddCustomerOpen && (
                  <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                      <h4 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                        <PlusCircle className="w-4 h-4 text-[#114b30]" />
                        <span>Cadastrar Novo Cliente na Base</span>
                      </h4>
                      <button 
                        onClick={() => setIsAddCustomerOpen(false)}
                        className="text-stone-400 hover:text-stone-700 text-xs"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form onSubmit={handleCreateCustomer} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-stone-600 block mb-1">Nome Completo *</label>
                          <input
                            type="text"
                            value={newCustName}
                            onChange={(e) => setNewCustName(e.target.value)}
                            placeholder="Ex: Maria Eduarda Silva"
                            required
                            className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-stone-600 block mb-1">WhatsApp / Telefone *</label>
                          <input
                            type="text"
                            value={newCustPhone}
                            onChange={(e) => setNewCustPhone(e.target.value)}
                            placeholder="(38) 99876-5432"
                            required
                            className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-stone-600 block mb-1">Data de Aniversário</label>
                          <input
                            type="text"
                            value={newCustBirthDate}
                            onChange={(e) => setNewCustBirthDate(e.target.value)}
                            placeholder="DD/MM/AAAA (Ex: 15/09/1992)"
                            className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                        <div className="sm:col-span-3">
                          <label className="text-[11px] font-bold text-stone-600 block mb-1">Observações / Preferência de Flores</label>
                          <input
                            type="text"
                            value={newCustNotes}
                            onChange={(e) => setNewCustNotes(e.target.value)}
                            placeholder="Ex: Gosta de Rosas Vermelhas e Girassóis. Prefere entregas pela manhã."
                            className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2.5 bg-[#114b30] hover:bg-[#0c3924] text-white font-bold text-xs sm:text-sm rounded-xl cursor-pointer shadow-xs transition-colors"
                        >
                          Salvar Cliente
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Filter Tabs & Search Bar */}
                <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Filter Pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => setCustomerFilterTab("all")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                        customerFilterTab === "all"
                          ? "bg-[#114b30] text-white shadow-xs"
                          : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      }`}
                    >
                      Todos ({customers.length})
                    </button>

                    <button
                      onClick={() => setCustomerFilterTab("month_birthdays")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                        customerFilterTab === "month_birthdays"
                          ? "bg-amber-500 text-white shadow-xs"
                          : "bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100"
                      }`}
                    >
                      <Cake className="w-3.5 h-3.5" />
                      <span>Aniversariantes do Mês ({monthBirthdaysCount})</span>
                    </button>

                    <button
                      onClick={() => setCustomerFilterTab("birthdays")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                        customerFilterTab === "birthdays"
                          ? "bg-rose-600 text-white shadow-xs"
                          : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Com Aniversário ({withBirthdaysCount})</span>
                    </button>

                    <button
                      onClick={() => setCustomerFilterTab("with_orders")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                        customerFilterTab === "with_orders"
                          ? "bg-emerald-800 text-white shadow-xs"
                          : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      }`}
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>Com Pedidos ({withOrdersCount})</span>
                    </button>
                  </div>

                  {/* Search Input */}
                  <div className="relative w-full md:w-72">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      placeholder="Filtrar por nome, fone, mês..."
                      className="w-full pl-9 pr-8 py-2 bg-stone-50 hover:bg-stone-100/60 focus:bg-white border border-stone-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/30 transition-all"
                    />
                    {customerSearch && (
                      <button
                        onClick={() => setCustomerSearch("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Structured Customer List / Table View */}
                <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
                  {filteredCustomers.length === 0 ? (
                    <div className="text-center py-16 px-4 space-y-2">
                      <Users className="w-10 h-10 text-stone-300 mx-auto" />
                      <p className="font-bold text-stone-700 text-sm">Nenhum cliente encontrado na listagem.</p>
                      <p className="text-xs text-stone-400">
                        {customerSearch ? "Tente alterar os termos da busca ou limpe o filtro." : "Cadastre um novo cliente acima para começar."}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[760px]">
                        <thead>
                          <tr className="bg-stone-50/90 border-b border-stone-200 text-[11px] font-bold uppercase tracking-wider text-stone-500">
                            <th className="py-3.5 px-4">Cliente / Nome</th>
                            <th className="py-3.5 px-4">WhatsApp & Contato</th>
                            <th className="py-3.5 px-4">Data de Aniversário</th>
                            <th className="py-3.5 px-4 text-center">Histórico Pedidos</th>
                            <th className="py-3.5 px-4">Observações</th>
                            <th className="py-3.5 px-4 text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 text-xs sm:text-sm">
                          {filteredCustomers.map((cust) => {
                            const isMonthBday = isBirthdayInCurrentMonth(cust.birthDate);
                            const initials = cust.fullName
                              .split(" ")
                              .map((n) => n[0])
                              .filter(Boolean)
                              .slice(0, 2)
                              .join("")
                              .toUpperCase() || "CL";

                            const orderStars = calculateStarRating(cust.totalOrders || 0);

                            return (
                              <tr
                                key={cust.id}
                                className={`hover:bg-stone-50/80 transition-colors ${
                                  isMonthBday ? "bg-amber-50/30" : ""
                                }`}
                              >
                                {/* Column 1: Customer Name & Initials */}
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                      isMonthBday 
                                        ? "bg-amber-100 text-amber-800 border border-amber-300" 
                                        : "bg-emerald-100 text-emerald-900 border border-emerald-200"
                                    }`}>
                                      {initials}
                                    </div>
                                    <div>
                                      <span className="font-bold text-stone-900 block text-xs sm:text-sm">
                                        {cust.fullName}
                                      </span>
                                      <span className="text-[11px] text-stone-400 block">
                                        Cadastrado em {cust.createdAt ? new Date(cust.createdAt).toLocaleDateString("pt-BR") : "Painel"}
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                {/* Column 2: WhatsApp Phone */}
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-stone-800">
                                      {cust.phone}
                                    </span>
                                    <a
                                      href={buildWhatsAppUrl(cust.phone, `Olá, ${cust.fullName}! Tudo bem? Aqui é da Floricultura Papoula em Pirapora.`)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title="Abrir WhatsApp com este cliente"
                                      className="p-1 text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors"
                                    >
                                      <MessageCircle className="w-3.5 h-3.5" />
                                    </a>
                                  </div>
                                </td>

                                {/* Column 3: Birthday Date */}
                                <td className="py-3 px-4">
                                  {cust.birthDate ? (
                                    <div className="inline-flex items-center gap-1.5">
                                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                                        isMonthBday
                                          ? "bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs font-extrabold"
                                          : "bg-rose-50 text-rose-800 border border-rose-200"
                                      }`}>
                                        <Cake className={`w-3.5 h-3.5 ${isMonthBday ? "text-amber-600" : "text-rose-500"}`} />
                                        <span>{cust.birthDate}</span>
                                        {isMonthBday && (
                                          <span className="text-[10px] bg-amber-500 text-white px-1.5 py-0.2 rounded-md font-bold uppercase ml-1">
                                            Mês Atual 🎉
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-stone-300 text-xs italic">Não informado</span>
                                  )}
                                </td>

                                {/* Column 4: Orders Count & Stars */}
                                <td className="py-3 px-4 text-center">
                                  <div className="inline-flex flex-col items-center">
                                    <span className="text-xs font-bold text-stone-800 bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200">
                                      {cust.totalOrders || 0} {cust.totalOrders === 1 ? "pedido" : "pedidos"}
                                    </span>
                                    {orderStars > 0 && (
                                      <div className="flex items-center gap-0.5 mt-1 text-amber-400">
                                        {[...Array(5)].map((_, i) => (
                                          <Star
                                            key={i}
                                            className={`w-3 h-3 ${
                                              i < orderStars ? "fill-amber-400 text-amber-400" : "text-stone-200"
                                            }`}
                                          />
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </td>

                                {/* Column 5: Notes */}
                                <td className="py-3 px-4 max-w-xs">
                                  {cust.notes ? (
                                    <span className="text-xs text-stone-600 line-clamp-2" title={cust.notes}>
                                      {cust.notes}
                                    </span>
                                  ) : (
                                    <span className="text-stone-300 text-xs italic">—</span>
                                  )}
                                </td>

                                {/* Column 6: Actions */}
                                <td className="py-3 px-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <a
                                      href={buildWhatsAppUrl(
                                        cust.phone,
                                        isMonthBday 
                                          ? `Olá, ${cust.fullName}! Parabéns pelo seu aniversário neste mês! 🌸 Desejamos muitas felicidades. Venha retirar um mimo especial na Floricultura Papoula.`
                                          : `Olá, ${cust.fullName}! Tudo bem? Falamos da Floricultura Papoula.`
                                      )}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                                      title="Conversar no WhatsApp"
                                    >
                                      <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                                      <span className="hidden sm:inline">WhatsApp</span>
                                    </a>

                                    <button
                                      onClick={() => handleOpenEditCustomer(cust)}
                                      className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 border border-stone-200 rounded-lg transition-colors cursor-pointer"
                                      title="Editar dados do cliente"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      onClick={() => {
                                        if (window.confirm(`Excluir permanentemente o cliente "${cust.fullName}"?`)) {
                                          onDeleteCustomer(cust.id);
                                          showNotification(`Cliente "${cust.fullName}" removido com sucesso.`);
                                        }
                                      }}
                                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 border border-stone-200 rounded-lg transition-colors cursor-pointer"
                                      title="Excluir cliente"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Table Footer with count */}
                  <div className="py-2.5 px-4 bg-stone-50/80 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
                    <span>Exibindo <strong>{filteredCustomers.length}</strong> de <strong>{customers.length}</strong> clientes</span>
                    {customerSearch && (
                      <span className="italic text-emerald-800">Filtro de busca ativo: "{customerSearch}"</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* MODAL: EDIT CUSTOMER */}
            {editingCustomer && (
              <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
                <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                    <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-[#114b30]" />
                      <span>Editar Cadastro do Cliente</span>
                    </h3>
                    <button
                      onClick={() => setEditingCustomer(null)}
                      className="text-stone-400 hover:text-stone-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveEditedCustomer} className="space-y-3.5">
                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">Nome Completo *</label>
                      <input
                        type="text"
                        value={editCustName}
                        onChange={(e) => setEditCustName(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-stone-700 block mb-1">WhatsApp / Telefone *</label>
                        <input
                          type="text"
                          value={editCustPhone}
                          onChange={(e) => setEditCustPhone(e.target.value)}
                          required
                          className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-stone-700 block mb-1">Data de Aniversário</label>
                        <input
                          type="text"
                          value={editCustBirthDate}
                          onChange={(e) => setEditCustBirthDate(e.target.value)}
                          placeholder="DD/MM/AAAA"
                          className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">Observações & Preferências</label>
                      <textarea
                        rows={3}
                        value={editCustNotes}
                        onChange={(e) => setEditCustNotes(e.target.value)}
                        placeholder="Ex: Flores preferidas, datas importantes, restrições..."
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30 resize-none"
                      />
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
                      <button
                        type="button"
                        onClick={() => setEditingCustomer(null)}
                        className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs sm:text-sm font-bold cursor-pointer transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#114b30] hover:bg-[#0c3924] text-white rounded-xl text-xs sm:text-sm font-bold cursor-pointer shadow-xs transition-colors"
                      >
                        Salvar Alterações
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* TAB 3: CATÁLOGO DE FLORES */}
            {activeMenu === "products" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-serif font-extrabold text-stone-900 flex items-center gap-2">
                      <Flower2 className="w-6 h-6 text-[#114b30]" />
                      <span>Catálogo de Flores & Arranjos</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-500">
                      Cadastre novos buquês, defina produtos "Sob Consulta" (sem preço fixo), ou use o Agente IA para importar tudo do seu PDF.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handlePushCatalogToSheets}
                      disabled={isPushingCatalog}
                      className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors disabled:opacity-50"
                      title="Salvar e sincronizar todo o catálogo na aba 'Catalogo' da sua Planilha Google"
                    >
                      <Send className="w-3.5 h-3.5 text-amber-300" />
                      <span>{isPushingCatalog ? "Salvando na Planilha..." : "Salvar na Planilha Google"}</span>
                    </button>

                    <button
                      onClick={handleDownloadCatalogCSV}
                      className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                      title="Exportar catálogo em arquivo CSV"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Exportar CSV</span>
                    </button>

                    <label className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors" title="Importar produtos de um arquivo CSV">
                      <Upload className="w-3.5 h-3.5 text-stone-600" />
                      <span>Importar CSV</span>
                      <input
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (evt) => {
                            try {
                              const text = evt.target?.result as string;
                              const parsed = parseCatalogFromCSV(text);
                              if (parsed.length > 0) {
                                if (onBatchImportProducts) {
                                  onBatchImportProducts(parsed, categories, false);
                                } else {
                                  parsed.forEach((p) => onAddProduct(p));
                                }
                                showNotification(`✅ ${parsed.length} produtos importados do CSV!`);
                              } else {
                                showNotification("⚠️ Nenhum produto reconhecido no CSV.");
                              }
                            } catch (err: any) {
                              showNotification("Erro ao ler CSV: " + err.message);
                            }
                          };
                          reader.readAsText(file, "UTF-8");
                          e.target.value = "";
                        }}
                      />
                    </label>

                    {onClearProducts && products.length > 0 && (
                      <button
                        onClick={onClearProducts}
                        className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                        title="Limpar todos os produtos do catálogo"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Limpar ({products.length})</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* AI Agent Catalog Extractor Banner */}
                <div className="bg-gradient-to-r from-[#114b30] to-[#0c3924] text-white p-5 sm:p-6 rounded-2xl border border-emerald-900 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
                  <div className="flex items-start sm:items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-amber-300 shadow-inner shrink-0">
                      <Sparkles className="w-6 h-6 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-serif font-bold text-base sm:text-lg text-white">
                          Agente IA: Importador Automático via PDF
                        </h4>
                        <span className="bg-amber-400 text-emerald-950 font-extrabold text-[10px] uppercase px-2 py-0.5 rounded-full">
                          Visão & Extração
                        </span>
                      </div>
                      <p className="text-xs text-white/80 max-w-xl">
                        Anexe o arquivo PDF ou imagens do seu catálogo para extrair fotos, descrições enriquecidas, preços e categorias automaticamente em segundos.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsAIExtractorModalOpen(true)}
                    className="px-5 py-3 bg-amber-400 hover:bg-amber-300 text-emerald-950 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-transform hover:scale-102 cursor-pointer shrink-0 shadow-sm"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-950" />
                    <span>Anexar PDF / Catálogo com IA</span>
                  </button>
                </div>

                {/* Create Product Form */}
                <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
                  <h3 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2">
                    <PlusCircle className="w-5 h-5 text-[#114b30]" />
                    <span>Cadastrar Novo Arranjo Floral</span>
                  </h3>

                  <form onSubmit={handlePublishProduct} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                          Nome do Produto *
                        </label>
                        <input
                          type="text"
                          value={productName}
                          onChange={(e) => setProductName(e.target.value)}
                          placeholder="Ex: Buquê de 12 Rosas Colombianas & Lírios"
                          required
                          className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                          Categoria {categories.length > 0 ? "*" : ""}
                        </label>
                        <select
                          value={productCategory}
                          onChange={(e) => setProductCategory(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm"
                        >
                          {categories.length === 0 ? (
                            <option value="geral">Geral (Sem categoria)</option>
                          ) : (
                            categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.icon} {cat.name}
                              </option>
                            ))
                          )}
                        </select>
                        {categories.length === 0 && (
                          <span className="text-[11px] text-amber-700 block mt-1">
                            Dica: Crie categorias na aba <strong>Categorias</strong> para organizar seus produtos.
                          </span>
                        )}
                      </div>

                      {/* Checkbox: Gerar sem preço / Sob Consulta */}
                      <div className="sm:col-span-3 bg-amber-50/70 p-3 rounded-xl border border-amber-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-stone-800">
                            <input
                              type="checkbox"
                              checked={isPriceOnDemand}
                              onChange={(e) => setIsPriceOnDemand(e.target.checked)}
                              className="w-4 h-4 text-emerald-800 rounded border-stone-300 focus:ring-emerald-500"
                            />
                            <span>Marcar como "Sob Consulta" (WhatsApp / Sem preço público no catálogo)</span>
                          </label>
                          <span className="text-[11px] text-stone-500 hidden sm:inline">
                            Oculta o preço para o cliente na vitrine
                          </span>
                        </div>

                        {/* Campo de Preço de Referência Interno quando Sob Consulta */}
                        {isPriceOnDemand && (
                          <div className="pt-2 border-t border-amber-200/80 flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="w-full sm:w-64">
                              <label className="block text-[11px] font-bold text-amber-950 uppercase mb-0.5">
                                Preço de Referência Interno (R$)
                              </label>
                              <input
                                type="text"
                                value={referencePrice}
                                onChange={(e) => setReferencePrice(e.target.value)}
                                placeholder="Ex: 180,00"
                                className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                              />
                            </div>
                            <p className="text-[11px] text-amber-900 leading-snug flex-1">
                              💡 <strong>Uso interno:</strong> Usado para estimar o total de vendas, relatórios e pedidos. <em>Não será mostrado ao cliente no catálogo</em>.
                            </p>
                          </div>
                        )}
                      </div>

                      {!isPriceOnDemand && (
                        <>
                          <div>
                            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                              Preço Venda (R$) *
                            </label>
                            <input
                              type="text"
                              value={price}
                              onChange={(e) => setPrice(e.target.value)}
                              placeholder="189,90"
                              required={!isPriceOnDemand}
                              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold text-emerald-950"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">
                              Preço "De" (Opcional)
                            </label>
                            <input
                              type="text"
                              value={originalPrice}
                              onChange={(e) => setOriginalPrice(e.target.value)}
                              placeholder="229,90"
                              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-500"
                            />
                          </div>
                        </>
                      )}

                      <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1" title="Volume de pedidos que preenche as 5 estrelinhas na vitrine">
                          Volume de Pedidos (Estrelas ⭐)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="500"
                          value={orderCountInput}
                          onChange={(e) => setOrderCountInput(e.target.value)}
                          placeholder="15"
                          className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold text-amber-900"
                        />
                      </div>
                    </div>

                    {/* Image Upload / URL / Presets Component */}
                    <div className="bg-stone-50/70 p-4 rounded-2xl border border-stone-200">
                      <ImageUploadInput
                        value={imageUrl}
                        onChange={setImageUrl}
                        presets={PRESET_FLOWER_IMAGES}
                        label="Foto do Arranjo Floral / Produto"
                        helpText="Você pode enviar fotos do seu computador, galeria do celular, tirar foto na hora ou colar link direto."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                        Descrição do Arranjo
                      </label>
                      <textarea
                        rows={2}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Descreva as flores, cores e detalhes da embalagem..."
                        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="px-6 py-3 bg-[#114b30] hover:bg-[#0c3924] text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
                      >
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>Publicar na Vitrine da Floricultura</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Published Products */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif font-bold text-stone-900 text-base">
                      Itens Ativos no Catálogo ({products.length})
                    </h4>
                    {onClearProducts && products.length > 0 && (
                      <button
                        onClick={onClearProducts}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                        title="Limpar todos os produtos do catálogo"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Limpar Todo o Catálogo</span>
                      </button>
                    )}
                  </div>

                  {products.length === 0 ? (
                    <div className="bg-white p-8 rounded-2xl border border-dashed border-stone-300 text-center space-y-4">
                      <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#114b30] flex items-center justify-center mx-auto">
                        <Sparkles className="w-8 h-8 text-amber-500 animate-pulse" />
                      </div>
                      <div className="space-y-1">
                        <h5 className="font-serif font-bold text-stone-900 text-lg">Seu Catálogo Está Vazio</h5>
                        <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto">
                          Você pode cadastrar manualmente no formulário acima ou usar o <strong>Agente IA</strong> para ler seu arquivo PDF e cadastrar tudo automaticamente em segundos!
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                        <button
                          onClick={() => setIsAIExtractorModalOpen(true)}
                          className="px-5 py-2.5 bg-[#114b30] hover:bg-[#0d3b25] text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-all"
                        >
                          <Sparkles className="w-4 h-4 text-amber-300" />
                          <span>Anexar PDF e Extrair Catálogo com IA</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {products.map((prod) => {
                        const score = calculateStarRating(prod.orderCount || 0, prod.rating || 5);
                        return (
                          <div key={prod.id} className="bg-white p-4 rounded-2xl border border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                            <div className="flex items-center gap-3.5">
                              <div className="w-16 h-16 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
                                <img src={prod.imageUrl} alt="" className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h5 className="font-bold text-stone-900 text-sm sm:text-base">{prod.name}</h5>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${prod.inStock ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-stone-600"}`}>
                                    {prod.inStock ? "Em Estoque" : "Pausado"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                                  <span>Categoria: <strong>{categories.find(c => c.id === prod.category)?.name || prod.category}</strong></span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1 text-amber-700 font-bold">
                                    <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                                    <span>{score.toFixed(1)} ({prod.orderCount || 0} pedidos)</span>
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0">
                              {prod.isPriceOnDemand ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                    Sob Consulta
                                  </span>
                                  {prod.referencePrice && prod.referencePrice > 0 ? (
                                    <span className="text-xs font-bold text-stone-600 bg-stone-100 px-2 py-1 rounded-lg border border-stone-200" title="Preço de referência interno (oculto para clientes)">
                                      Ref: R$ {prod.referencePrice.toFixed(2)}
                                    </span>
                                  ) : null}
                                </div>
                              ) : editingPriceId === prod.id ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold">R$</span>
                                  <input
                                    type="text"
                                    value={newPriceValue}
                                    onChange={(e) => setNewPriceValue(e.target.value)}
                                    className="w-20 px-2 py-1 bg-stone-50 border border-emerald-500 rounded-lg text-xs font-bold"
                                    autoFocus
                                  />
                                  <button onClick={() => handleSaveInlinePrice(prod)} className="p-1.5 bg-emerald-700 text-white rounded-lg">
                                    <Save className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => setEditingPriceId(null)} className="p-1.5 text-stone-400">
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="text-base font-extrabold text-emerald-950">
                                    {prod.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                  </span>
                                  <button
                                    onClick={() => {
                                      setEditingPriceId(prod.id);
                                      setNewPriceValue(prod.price.toFixed(2));
                                    }}
                                    className="p-1.5 text-stone-400 hover:text-emerald-800"
                                    title="Editar Preço"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                </div>
                              )}

                              <button
                                onClick={() => handleOpenEditProduct(prod)}
                                className="text-xs px-3 py-1.5 rounded-xl font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                                title="Editar produto, foto, preço e detalhes"
                              >
                                <Pencil className="w-3.5 h-3.5 text-stone-600" />
                                <span>Editar</span>
                              </button>

                              <button
                                onClick={() => onUpdateProduct({ ...prod, inStock: !prod.inStock })}
                                className="text-xs px-3 py-1.5 rounded-xl font-bold bg-stone-100 hover:bg-stone-200 cursor-pointer"
                              >
                                {prod.inStock ? "Pausar" : "Ativar"}
                              </button>

                              <button
                                onClick={() => {
                                  if (window.confirm(`Excluir "${prod.name}"?`)) {
                                    onDeleteProduct(prod.id);
                                    showNotification(`Produto "${prod.name}" excluído.`);
                                  }
                                }}
                                className="p-2 text-stone-400 hover:text-rose-600 rounded-lg cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: CATEGORIAS */}
            {activeMenu === "categories" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-serif font-extrabold text-stone-900 flex items-center gap-2">
                      <FolderTree className="w-6 h-6 text-[#114b30]" />
                      <span>Categorias de Flores</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-500">
                      Organize a vitrine da floricultura criando seções temáticas e ícones.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handlePushCategoriesToSheets}
                      disabled={isPushingCategories}
                      className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors disabled:opacity-50"
                      title="Salvar e sincronizar todas as categorias na aba 'Categorias' da sua Planilha Google"
                    >
                      <Send className="w-3.5 h-3.5 text-amber-200" />
                      <span>{isPushingCategories ? "Salvando na Planilha..." : "Salvar na Planilha Google"}</span>
                    </button>

                    <button
                      onClick={handleDownloadCategoriesCSV}
                      className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                      title="Exportar categorias em arquivo CSV"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-800" />
                      <span>Exportar CSV</span>
                    </button>

                    <label className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors" title="Importar categorias de um arquivo CSV">
                      <Upload className="w-3.5 h-3.5 text-stone-600" />
                      <span>Importar CSV</span>
                      <input
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (evt) => {
                            try {
                              const text = evt.target?.result as string;
                              const parsed = parseCategoriesFromCSV(text);
                              if (parsed.length > 0) {
                                parsed.forEach((c) => onAddCategory(c));
                                showNotification(`✅ ${parsed.length} categorias importadas do CSV!`);
                              } else {
                                showNotification("⚠️ Nenhuma categoria reconhecida no CSV.");
                              }
                            } catch (err: any) {
                              showNotification("Erro ao ler CSV: " + err.message);
                            }
                          };
                          reader.readAsText(file, "UTF-8");
                          e.target.value = "";
                        }}
                      />
                    </label>

                    {onClearCategories && categories.length > 0 && (
                      <button
                        onClick={onClearCategories}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto transition-colors"
                        title="Limpar todas as categorias"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Limpar Todas ({categories.length})</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
                  <h3 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2">
                    <PlusCircle className="w-5 h-5 text-[#114b30]" />
                    <span>Nova Categoria</span>
                  </h3>

                  <form onSubmit={handleCreateCategory} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                          Nome da Categoria *
                        </label>
                        <input
                          type="text"
                          value={catName}
                          onChange={(e) => setCatName(e.target.value)}
                          placeholder="Ex: Orquídeas & Bonsais Raros"
                          required
                          className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                          Emoji / Ícone
                        </label>
                        <input
                          type="text"
                          value={catIcon}
                          onChange={(e) => setCatIcon(e.target.value)}
                          placeholder="🪴"
                          className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-center text-lg"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                        Descrição da Categoria (Opcional)
                      </label>
                      <input
                        type="text"
                        value={catDescription}
                        onChange={(e) => setCatDescription(e.target.value)}
                        placeholder="Ex: Espécies raras selecionadas para presentear momentos nobres"
                        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-[#114b30] hover:bg-[#0c3924] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs cursor-pointer"
                      >
                        Salvar Categoria
                      </button>
                    </div>
                  </form>
                </div>

                {/* Categories List */}
                {categories.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl border border-dashed border-stone-300 text-center space-y-2">
                    <FolderTree className="w-10 h-10 text-stone-400 mx-auto opacity-60" />
                    <h5 className="font-serif font-bold text-stone-800 text-base">Nenhuma Categoria Cadastrada</h5>
                    <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto">
                      Crie suas categorias personalizadas no formulário acima (ex: Buquês, Rosas, Girassóis, Orquídeas, Cestas) para organizar os produtos da loja.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((cat) => (
                      <div key={cat.id} className="bg-white p-4 rounded-2xl border border-stone-200 flex items-center justify-between shadow-xs">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl p-2 bg-stone-50 rounded-xl border border-stone-200/80">{cat.icon}</span>
                          <div>
                            <h5 className="font-bold text-stone-900 text-sm">{cat.name}</h5>
                            <span className="text-[11px] text-stone-400 block">{cat.description || "Sem descrição"}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (window.confirm(`Excluir categoria "${cat.name}"?`)) {
                              onDeleteCategory(cat.id);
                              showNotification(`Categoria "${cat.name}" excluída.`);
                            }
                          }}
                          className="p-1.5 text-stone-400 hover:text-rose-600 rounded cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: HORÁRIOS & CONFIGURAÇÕES DA LOJA */}
            {activeMenu === "settings" && (() => {
              const previewConfig: StoreConfig = {
                storeName: cfgStoreName,
                phone: cfgPhone,
                whatsapp: cfgWhatsapp,
                instagram: cfgInstagram,
                address: cfgAddress,
                city: cfgCity,
                operationMode: cfgOperationMode,
                weekdays: { enabled: cfgWeekdaysEnabled, openTime: cfgWeekdaysOpen, closeTime: cfgWeekdaysClose },
                saturday: { enabled: cfgSaturdayEnabled, openTime: cfgSaturdayOpen, closeTime: cfgSaturdayClose },
                sunday: { enabled: cfgSundayEnabled, openTime: cfgSundayOpen, closeTime: cfgSundayClose },
                closedMessage: cfgClosedMessage,
              };
              const liveStatus = getStoreBusinessHours(previewConfig);

              return (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h2 className="text-2xl font-serif font-extrabold text-stone-900 flex items-center gap-2">
                        <Clock className="w-6 h-6 text-[#114b30]" />
                        <span>Horários de Funcionamento & Configurações</span>
                      </h2>
                      <p className="text-xs sm:text-sm text-stone-500">
                        Defina os horários de atendimento de segunda a sexta, sábados e feriados. Fora do horário, os pedidos são recebidos normalmente com aviso de agendamento para o próximo dia útil.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                        liveStatus.isOpenNow
                          ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                          : "bg-rose-100 text-rose-900 border border-rose-300"
                      }`}>
                        <span className={`w-2.5 h-2.5 rounded-full ${liveStatus.isOpenNow ? "bg-emerald-600 animate-pulse" : "bg-rose-500"}`} />
                        <span>{liveStatus.isOpenNow ? "Status: Aberto Agora" : "Status: Fora do Horário"}</span>
                      </span>
                    </div>
                  </div>

                  {/* Status & Next Open Info Alert Banner */}
                  <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    liveStatus.isOpenNow 
                      ? "bg-emerald-50/80 border-emerald-200 text-emerald-950" 
                      : "bg-amber-50/90 border-amber-200 text-amber-950"
                  }`}>
                    <div className="space-y-1">
                      <div className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-700" />
                        <span>Diagnóstico do Horário Atual</span>
                      </div>
                      <p className="text-xs sm:text-sm font-medium">
                        {liveStatus.isOpenNow ? (
                          <>A loja está em <strong>atendimento em tempo real</strong>. Montagens imediatas e entregas no mesmo dia ativas!</>
                        ) : (
                          <>A loja está <strong>fora do horário de atendimento imediato</strong>. {liveStatus.nextOpenText}</>
                        )}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-mono font-bold px-2.5 py-1 bg-white/70 rounded-lg border border-stone-300 text-stone-700 block">
                        Modo Atual: {cfgOperationMode === "auto" ? "Automático (Relógio)" : cfgOperationMode === "forced_open" ? "Forçado Aberto" : "Forçado Fechado"}
                      </span>
                    </div>
                  </div>

                  {/* Main Form */}
                  <form onSubmit={handleSaveStoreConfig} className="space-y-6">
                    {/* Section 1: Operating Mode Selector */}
                    <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
                      <h3 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2">
                        <SlidersHorizontal className="w-5 h-5 text-[#114b30]" />
                        <span>Modo de Operação da Floricultura</span>
                      </h3>
                      <p className="text-xs text-stone-500">
                        Escolha se a loja segue os horários do relógio automaticamente ou se você deseja forçar um status temporário de plantão especial ou férias/manutenção.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => setCfgOperationMode("auto")}
                          className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                            cfgOperationMode === "auto"
                              ? "bg-emerald-50/80 border-[#114b30] ring-2 ring-[#114b30]/20 text-emerald-950 font-semibold"
                              : "bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold uppercase tracking-wider">🟢 Automático</span>
                            {cfgOperationMode === "auto" && <Check className="w-4 h-4 text-emerald-800" />}
                          </div>
                          <p className="text-xs text-stone-600">
                            Segue rigorosamente a grade de horários configurada abaixo para cada dia da semana.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCfgOperationMode("forced_open")}
                          className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                            cfgOperationMode === "forced_open"
                              ? "bg-amber-50/80 border-amber-600 ring-2 ring-amber-600/20 text-amber-950 font-semibold"
                              : "bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold uppercase tracking-wider">🌟 Forçar Aberto</span>
                            {cfgOperationMode === "forced_open" && <Check className="w-4 h-4 text-amber-800" />}
                          </div>
                          <p className="text-xs text-stone-600">
                            Plantão especial de datas comemorativas (Dia das Mães, Namorados, Finados).
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCfgOperationMode("forced_closed")}
                          className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                            cfgOperationMode === "forced_closed"
                              ? "bg-rose-50/80 border-rose-600 ring-2 ring-rose-600/20 text-rose-950 font-semibold"
                              : "bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold uppercase tracking-wider">⛔ Forçar Fechado</span>
                            {cfgOperationMode === "forced_closed" && <Check className="w-4 h-4 text-rose-800" />}
                          </div>
                          <p className="text-xs text-stone-600">
                            Pausa temporária para manutenção de estoque, feriados prolongados ou recesso.
                          </p>
                        </button>
                      </div>
                    </div>

                    {/* Section 2: Horários por Dia da Semana */}
                    <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
                      <h3 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-[#114b30]" />
                        <span>Grade Semanal de Horários</span>
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                        {/* 1. Segunda a Sexta-feira */}
                        <div className="bg-stone-50/80 p-4 rounded-xl border border-stone-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="chkWeekdays"
                                checked={cfgWeekdaysEnabled}
                                onChange={(e) => setCfgWeekdaysEnabled(e.target.checked)}
                                className="w-4 h-4 text-emerald-800 rounded border-stone-300 focus:ring-emerald-500"
                              />
                              <label htmlFor="chkWeekdays" className="text-xs font-bold text-stone-800 uppercase tracking-wider cursor-pointer">
                                Segunda a Sexta
                              </label>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-bold">
                              Dias Úteis
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <div>
                              <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">
                                Abertura
                              </label>
                              <input
                                type="time"
                                value={cfgWeekdaysOpen}
                                disabled={!cfgWeekdaysEnabled}
                                onChange={(e) => setCfgWeekdaysOpen(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-mono disabled:opacity-50"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">
                                Fechamento
                              </label>
                              <input
                                type="time"
                                value={cfgWeekdaysClose}
                                disabled={!cfgWeekdaysEnabled}
                                onChange={(e) => setCfgWeekdaysClose(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-mono disabled:opacity-50"
                              />
                            </div>
                          </div>
                        </div>

                        {/* 2. Sábados e Feriados */}
                        <div className="bg-stone-50/80 p-4 rounded-xl border border-stone-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="chkSaturday"
                                checked={cfgSaturdayEnabled}
                                onChange={(e) => setCfgSaturdayEnabled(e.target.checked)}
                                className="w-4 h-4 text-emerald-800 rounded border-stone-300 focus:ring-emerald-500"
                              />
                              <label htmlFor="chkSaturday" className="text-xs font-bold text-stone-800 uppercase tracking-wider cursor-pointer">
                                Sábados & Feriados
                              </label>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold">
                              Especial
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <div>
                              <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">
                                Abertura
                              </label>
                              <input
                                type="time"
                                value={cfgSaturdayOpen}
                                disabled={!cfgSaturdayEnabled}
                                onChange={(e) => setCfgSaturdayOpen(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-mono disabled:opacity-50"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">
                                Fechamento
                              </label>
                              <input
                                type="time"
                                value={cfgSaturdayClose}
                                disabled={!cfgSaturdayEnabled}
                                onChange={(e) => setCfgSaturdayClose(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-mono disabled:opacity-50"
                              />
                            </div>
                          </div>
                        </div>

                        {/* 3. Domingos */}
                        <div className="bg-stone-50/80 p-4 rounded-xl border border-stone-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="chkSunday"
                                checked={cfgSundayEnabled}
                                onChange={(e) => setCfgSundayEnabled(e.target.checked)}
                                className="w-4 h-4 text-emerald-800 rounded border-stone-300 focus:ring-emerald-500"
                              />
                              <label htmlFor="chkSunday" className="text-xs font-bold text-stone-800 uppercase tracking-wider cursor-pointer">
                                Domingos
                              </label>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                              cfgSundayEnabled ? "bg-emerald-100 text-emerald-900" : "bg-stone-200 text-stone-600"
                            }`}>
                              {cfgSundayEnabled ? "Aberto" : "Fechado"}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <div>
                              <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">
                                Abertura
                              </label>
                              <input
                                type="time"
                                value={cfgSundayOpen}
                                disabled={!cfgSundayEnabled}
                                onChange={(e) => setCfgSundayOpen(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-mono disabled:opacity-50"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">
                                Fechamento
                              </label>
                              <input
                                type="time"
                                value={cfgSundayClose}
                                disabled={!cfgSundayEnabled}
                                onChange={(e) => setCfgSundayClose(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-mono disabled:opacity-50"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Mensagem para Fora do Horário */}
                    <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
                      <h3 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-[#114b30]" />
                        <span>Mensagem Exibida Fora do Horário de Atendimento</span>
                      </h3>
                      <p className="text-xs text-stone-500">
                        O cliente continuará podendo navegar no catálogo, adicionar ao carrinho e gerar o pedido no WhatsApp. Esta mensagem será exibida na tela e no assistente informando o próximo dia útil.
                      </p>

                      <div>
                        <textarea
                          rows={3}
                          value={cfgClosedMessage}
                          onChange={(e) => setCfgClosedMessage(e.target.value)}
                          placeholder="Digite a mensagem de aviso para quando a loja estiver fechada..."
                          className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm font-sans focus:ring-2 focus:ring-emerald-600/30"
                        />
                      </div>
                    </div>

                    {/* Section 4: Informações de Contato e Endereço da Floricultura */}
                    <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
                      <h3 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2">
                        <Store className="w-5 h-5 text-[#114b30]" />
                        <span>Dados de Contato & Localização da Floricultura</span>
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                            Nome da Floricultura
                          </label>
                          <input
                            type="text"
                            value={cfgStoreName}
                            onChange={(e) => setCfgStoreName(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                            WhatsApp de Vendas (com DDD)
                          </label>
                          <div className="relative">
                            <Phone className="w-4 h-4 text-emerald-800 absolute left-3 top-3" />
                            <input
                              type="text"
                              value={cfgWhatsapp}
                              onChange={(e) => setCfgWhatsapp(e.target.value)}
                              placeholder="5538988512855"
                              className="w-full pl-9 pr-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm font-mono"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                            Telefone Exibição
                          </label>
                          <input
                            type="text"
                            value={cfgPhone}
                            onChange={(e) => setCfgPhone(e.target.value)}
                            placeholder="(38) 98851-2855"
                            className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                            Instagram (@)
                          </label>
                          <div className="relative">
                            <Instagram className="w-4 h-4 text-pink-700 absolute left-3 top-3" />
                            <input
                              type="text"
                              value={cfgInstagram}
                              onChange={(e) => setCfgInstagram(e.target.value)}
                              placeholder="floriculturapapoula"
                              className="w-full pl-9 pr-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                            Endereço Físico
                          </label>
                          <div className="relative">
                            <MapPin className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
                            <input
                              type="text"
                              value={cfgAddress}
                              onChange={(e) => setCfgAddress(e.target.value)}
                              placeholder="Rua Montes Claros, 240, Centro"
                              className="w-full pl-9 pr-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                            Cidade & Estado
                          </label>
                          <input
                            type="text"
                            value={cfgCity}
                            onChange={(e) => setCfgCity(e.target.value)}
                            placeholder="Pirapora - MG"
                            className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bottom Save Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setCfgStoreName(DEFAULT_STORE_CONFIG.storeName);
                          setCfgPhone(DEFAULT_STORE_CONFIG.phone);
                          setCfgWhatsapp(DEFAULT_STORE_CONFIG.whatsapp);
                          setCfgInstagram(DEFAULT_STORE_CONFIG.instagram);
                          setCfgAddress(DEFAULT_STORE_CONFIG.address);
                          setCfgCity(DEFAULT_STORE_CONFIG.city);
                          setCfgOperationMode(DEFAULT_STORE_CONFIG.operationMode);
                          setCfgWeekdaysEnabled(DEFAULT_STORE_CONFIG.weekdays.enabled);
                          setCfgWeekdaysOpen(DEFAULT_STORE_CONFIG.weekdays.openTime);
                          setCfgWeekdaysClose(DEFAULT_STORE_CONFIG.weekdays.closeTime);
                          setCfgSaturdayEnabled(DEFAULT_STORE_CONFIG.saturday.enabled);
                          setCfgSaturdayOpen(DEFAULT_STORE_CONFIG.saturday.openTime);
                          setCfgSaturdayClose(DEFAULT_STORE_CONFIG.saturday.closeTime);
                          setCfgSundayEnabled(DEFAULT_STORE_CONFIG.sunday.enabled);
                          setCfgSundayOpen(DEFAULT_STORE_CONFIG.sunday.openTime);
                          setCfgSundayClose(DEFAULT_STORE_CONFIG.sunday.closeTime);
                          setCfgClosedMessage(DEFAULT_STORE_CONFIG.closedMessage);
                        }}
                        className="px-4 py-2.5 text-xs font-semibold text-stone-600 hover:text-stone-900 border border-stone-200 hover:bg-stone-100 rounded-xl transition-all cursor-pointer flex items-center gap-2"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restaurar Horários Padrão</span>
                      </button>

                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-[#114b30] hover:bg-[#0c3924] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        <span>Salvar Horários & Configurações</span>
                      </button>
                    </div>
                  </form>
                </div>
              );
            })()}

            {/* TAB 6: BANCO DE DADOS & GOOGLE DRIVE */}
            {activeMenu === "database" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-serif font-extrabold text-stone-900 flex items-center gap-2">
                    <Database className="w-6 h-6 text-[#114b30]" />
                    <span>Banco de Dados & Google Drive</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-500">
                    Configure o armazenamento em nuvem via Google Drive e Google Planilhas para sincronizar pedidos do WhatsApp, clientes e relatórios automaticamente.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left: Quick Export & Status */}
                  <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
                        <FileSpreadsheet className="w-5 h-5 text-emerald-800" />
                        <span>Exportações & Sincronização por Aba</span>
                      </div>
                      <p className="text-xs text-stone-500 leading-relaxed">
                        Exporte e sincronize pedidos, catálogo de flores e categorias com as abas da sua planilha Google.
                      </p>

                      {/* Master Sync All Button */}
                      <button
                        type="button"
                        onClick={handleSyncAllToSheets}
                        disabled={isSyncingAllData}
                        className="w-full py-3 px-3 bg-gradient-to-r from-emerald-800 to-[#114b30] hover:from-emerald-700 hover:to-[#0c3924] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all hover:scale-[1.01] disabled:opacity-50"
                      >
                        <RefreshCw className={`w-4 h-4 text-amber-300 ${isSyncingAllData ? "animate-spin" : ""}`} />
                        <span>{isSyncingAllData ? "Sincronizando Tudo..." : "⚡ Sincronizar Tudo (Catálogo, Categorias e Pedidos)"}</span>
                      </button>

                      <div className="space-y-2 pt-1">
                        <button
                          type="button"
                          onClick={() => downloadOfficialSpreadsheetTemplate()}
                          className="w-full py-2 px-3 bg-[#114b30] hover:bg-[#0c3924] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-2xs transition-colors"
                        >
                          <Download className="w-4 h-4 text-amber-300" />
                          <span>📥 Baixar Modelo Oficial Multi-Abas (.CSV)</span>
                        </button>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={handleDownloadCatalogCSV}
                            className="py-2 px-2 bg-stone-50 hover:bg-stone-100 text-stone-800 border border-stone-200 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                            title="Baixar Catálogo de Produtos em CSV"
                          >
                            <Download className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Catálogo CSV ({products.length})</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleDownloadCategoriesCSV}
                            className="py-2 px-2 bg-stone-50 hover:bg-stone-100 text-stone-800 border border-stone-200 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                            title="Baixar Categorias em CSV"
                          >
                            <Download className="w-3.5 h-3.5 text-amber-700" />
                            <span>Categorias CSV ({categories.length})</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={handleDownloadOrdersCSV}
                          className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-2xs transition-colors"
                        >
                          <Download className="w-4 h-4 text-emerald-700" />
                          <span>Exportar Pedidos ({kanbanOrders.length})</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleDownloadCustomersCSV}
                          className="w-full py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                        >
                          <Download className="w-4 h-4 text-stone-600" />
                          <span>Exportar Clientes ({customers.length})</span>
                        </button>
                      </div>

                      {/* Instructions for upload */}
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-950 space-y-1.5">
                        <strong className="block text-amber-900 font-bold">Como funciona a planilha multi-abas:</strong>
                        <p className="leading-tight">1. A planilha possui 3 abas: <strong>Pedidos</strong>, <strong>Catalogo</strong> e <strong>Categorias</strong>.</p>
                        <p className="leading-tight">2. Ao salvar ou usar o Webhook, todas as alterações são salvas diretamente nas respectivas abas.</p>
                      </div>
                    </div>

                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-[11px] text-stone-600 space-y-1">
                      <span className="font-bold text-stone-800 block">Status da Sincronização:</span>
                      <p>Última sincronização: <strong>{googleDriveConfig.lastSyncedAt || "Nenhuma ainda"}</strong></p>
                      <p>Modo Automático: <strong className={googleDriveConfig.autoSync ? "text-emerald-700" : "text-stone-500"}>{googleDriveConfig.autoSync ? "Ativo (Sincroniza ao abrir)" : "Manual"}</strong></p>
                    </div>
                  </div>

                  {/* Right: Webhook / Google Drive Config Form */}
                  <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                      <h3 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2">
                        <Database className="w-5 h-5 text-[#114b30]" />
                        <span>Configurar Conexão com Google Drive</span>
                      </h3>
                      <button
                        onClick={() => setIsDriveModalOpen(true)}
                        className="text-xs text-emerald-800 hover:underline font-bold cursor-pointer"
                      >
                        Abrir Guia Passo a Passo ↗
                      </button>
                    </div>

                    <form onSubmit={handleSaveGoogleDriveSettings} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                          Webhook URL do Google Apps Script (Google Sheets)
                        </label>
                        <input
                          type="url"
                          value={sheetWebhookUrl}
                          onChange={(e) => setSheetWebhookUrl(e.target.value)}
                          placeholder="https://script.google.com/macros/s/.../exec"
                          className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                        />
                        <span className="text-[10px] text-stone-500 block mt-1">
                          Cole o link do seu WebApp publicado no Google Apps Script para receber os pedidos automaticamente em tempo real na sua planilha.
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                            ID da Planilha no Google Drive (Opcional)
                          </label>
                          <input
                            type="text"
                            value={spreadsheetId}
                            onChange={(e) => setSpreadsheetId(e.target.value)}
                            placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                            className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                            Link da Pasta do Google Drive
                          </label>
                          <input
                            type="url"
                            value={folderUrl}
                            onChange={(e) => setFolderUrl(e.target.value)}
                            placeholder="https://drive.google.com/drive/folders/..."
                            className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs"
                          />
                        </div>
                      </div>

                      <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200/80 space-y-1.5">
                        <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-emerald-950">
                          <input
                            type="checkbox"
                            checked={autoSync}
                            onChange={(e) => setAutoSync(e.target.checked)}
                            className="w-4 h-4 text-emerald-800 rounded border-stone-300 focus:ring-emerald-500 cursor-pointer"
                          />
                          <span>Sincronização Automática: Carregar pedidos ao entrar no app e a cada 2 min</span>
                        </label>
                        <p className="text-[11px] text-emerald-800 pl-6.5">
                          Puxa automaticamente todos os novos pedidos e alterações da sua planilha sempre que você abrir o app, sem necessidade de clicar no botão toda vez.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        <button
                          type="button"
                          onClick={async () => {
                            if (!sheetWebhookUrl.trim()) {
                              alert("Cole primeiro o link do Webhook do Google Apps Script acima.");
                              return;
                            }
                            const ok = await sendOrderToGoogleSheetsWebhook(sheetWebhookUrl.trim(), {
                              orderNumber: "#TESTE-" + Math.floor(100 + Math.random() * 900),
                              productName: "Buquê Teste Floricultura Papoula",
                              price: 150,
                              deliveryFee: 10,
                              total: 160,
                              senderName: "Teste Automático",
                              senderPhone: "(38) 99999-0000",
                              recipientName: "Cliente Teste",
                              recipientPhone: "(38) 98888-0000",
                              city: "Pirapora",
                              address: "Av. Salmeron, 100",
                              neighborhood: "Centro",
                              timeSlot: "Manhã",
                              cardMessage: "Teste de sincronização com Google Sheets realizado com sucesso!",
                              paymentMethod: "PIX"
                            });
                            showNotification(ok ? "✅ Pedido de teste enviado para a planilha! Verifique sua aba no Google Drive." : "⚠️ Verifique o link do Webhook.");
                          }}
                          className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
                        >
                          <Send className="w-4 h-4 text-amber-700" />
                          <span>🚀 Enviar Pedido Teste para a Planilha Agora</span>
                        </button>

                        <button
                          type="submit"
                          className="px-6 py-2.5 bg-[#114b30] hover:bg-[#0c3924] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
                        >
                          <Save className="w-4 h-4" />
                          <span>Salvar Configuração do Google Drive</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                {/* Bottom: Data Maintenance & Cleanup Controls */}
                <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
                  <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
                    <div>
                      <h3 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2">
                        <Trash2 className="w-5 h-5 text-rose-600" />
                        <span>Manutenção & Limpeza de Dados</span>
                      </h3>
                      <p className="text-xs text-stone-500">
                        Ferramentas para zerar pedidos de teste, limpar clientes ou restaurar os 28 produtos oficiais do PDF.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
                    <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex flex-col justify-between space-y-3">
                      <div>
                        <span className="font-bold text-xs text-stone-900 block">Zerar Pedidos do Kanban</span>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          Apaga todos os {kanbanOrders.length} pedidos da esteira para reiniciar do zero.
                        </p>
                      </div>
                      <button
                        onClick={onClearOrders || (() => {})}
                        disabled={kanbanOrders.length === 0}
                        className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                          kanbanOrders.length > 0
                            ? "bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200"
                            : "bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed"
                        }`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Limpar Pedidos ({kanbanOrders.length})</span>
                      </button>
                    </div>

                    <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex flex-col justify-between space-y-3">
                      <div>
                        <span className="font-bold text-xs text-stone-900 block">Zerar Lista de Clientes</span>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          Apaga todos os {customers.length} clientes da base de contatos.
                        </p>
                      </div>
                      <button
                        onClick={onClearCustomers || (() => {})}
                        disabled={customers.length === 0}
                        className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                          customers.length > 0
                            ? "bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200"
                            : "bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed"
                        }`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Limpar Clientes ({customers.length})</span>
                      </button>
                    </div>

                    <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex flex-col justify-between space-y-3">
                      <div>
                        <span className="font-bold text-xs text-stone-900 block">Limpar Catálogo & Categorias</span>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          Zera todos os produtos ({products.length}) e categorias ({categories.length}) para você cadastrar tudo pessoalmente.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          if (onClearProducts) onClearProducts();
                          if (onClearCategories) onClearCategories();
                        }}
                        disabled={products.length === 0 && categories.length === 0}
                        className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                          products.length > 0 || categories.length > 0
                            ? "bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200"
                            : "bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed"
                        }`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Zerar Catálogo ({products.length})</span>
                      </button>
                    </div>

                    <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 flex flex-col justify-between space-y-3">
                      <div>
                        <span className="font-bold text-xs text-emerald-950 block">Restaurar Catálogo Oficial (PDF)</span>
                        <p className="text-[11px] text-emerald-800/80 mt-0.5">
                          Recarrega os 28 produtos e categorias originais da Floricultura Papoula se desejar.
                        </p>
                      </div>
                      <button
                        onClick={onResetToDefaults}
                        className="w-full py-2 px-3 bg-[#114b30] hover:bg-[#0c3924] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Carregar 28 Itens do PDF</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: DASHBOARD & METRICS */}
            {activeMenu === "dashboard" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-serif font-extrabold text-stone-900 flex items-center gap-2">
                    <LayoutDashboard className="w-6 h-6 text-[#114b30]" />
                    <span>Métricas & Indicadores da Floricultura</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-500">
                    Acompanhamento do volume de pedidos, faturamento e base de clientes em Pirapora & Buritizeiro.
                  </p>
                </div>

                {/* Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
                    <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Faturamento Total</span>
                    <div className="text-2xl font-serif font-extrabold text-emerald-950">
                      {totalRevenue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </div>
                    <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>{kanbanOrders.length} pedidos registrados</span>
                    </span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
                    <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Pedidos em Andamento</span>
                    <div className="text-2xl font-serif font-extrabold text-amber-600">
                      {activeOrders}
                    </div>
                    <span className="text-[11px] text-stone-500">
                      Na esteira de montagem/entrega
                    </span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
                    <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Pedidos Entregues</span>
                    <div className="text-2xl font-serif font-extrabold text-emerald-800">
                      {completedOrders}
                    </div>
                    <span className="text-[11px] text-emerald-700 font-semibold">
                      Comprovantes e fotos arquivadas
                    </span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
                    <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Clientes Cadastrados</span>
                    <div className="text-2xl font-serif font-extrabold text-stone-900">
                      {customers.length}
                    </div>
                    <span className="text-[11px] text-stone-500">
                      {customers.filter(c => c.birthDate).length} com data de aniversário
                    </span>
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-stone-900 text-base sm:text-lg">
                    Editar Arranjo Floral
                  </h3>
                  <p className="text-xs text-stone-500">
                    Altere foto (upload ou link), preço, categoria e informações do item
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveEditProduct} className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Nome do Produto *
                  </label>
                  <input
                    type="text"
                    value={editProdName}
                    onChange={(e) => setEditProdName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Categoria *
                  </label>
                  <select
                    value={editProdCategory}
                    onChange={(e) => setEditProdCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Checkbox Sob Consulta */}
                <div className="sm:col-span-3 bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-stone-800">
                      <input
                        type="checkbox"
                        checked={editProdIsPriceOnDemand}
                        onChange={(e) => setEditProdIsPriceOnDemand(e.target.checked)}
                        className="w-4 h-4 text-emerald-800 rounded border-stone-300 focus:ring-emerald-500"
                      />
                      <span>Preço "Sob Consulta" (WhatsApp / Oculto no Catálogo)</span>
                    </label>
                    <span className="text-[11px] text-stone-500 hidden sm:inline">
                      Sem preço público para o cliente
                    </span>
                  </div>

                  {editProdIsPriceOnDemand && (
                    <div className="pt-2 border-t border-amber-200/80 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="w-full sm:w-64">
                        <label className="block text-[11px] font-bold text-amber-950 uppercase mb-0.5">
                          Preço de Referência Interno (R$)
                        </label>
                        <input
                          type="text"
                          value={editProdReferencePrice}
                          onChange={(e) => setEditProdReferencePrice(e.target.value)}
                          placeholder="Ex: 180,00"
                          className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                        />
                      </div>
                      <p className="text-[11px] text-amber-900 leading-snug flex-1">
                        💡 <strong>Uso interno:</strong> Usado para estimar o total de vendas e pedidos. Não será exibido no catálogo público.
                      </p>
                    </div>
                  )}
                </div>

                {!editProdIsPriceOnDemand && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                        Preço Venda (R$) *
                      </label>
                      <input
                        type="text"
                        value={editProdPrice}
                        onChange={(e) => setEditProdPrice(e.target.value)}
                        placeholder="189,90"
                        required={!editProdIsPriceOnDemand}
                        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold text-emerald-950"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">
                        Preço "De" (Opcional)
                      </label>
                      <input
                        type="text"
                        value={editProdOriginalPrice}
                        onChange={(e) => setEditProdOriginalPrice(e.target.value)}
                        placeholder="229,90"
                        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-500"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Volume de Pedidos (Estrelas ⭐)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="500"
                    value={editProdOrderCount}
                    onChange={(e) => setEditProdOrderCount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold text-amber-900"
                  />
                </div>

                <div className="sm:col-span-3 flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-stone-800 block">Disponibilidade na Vitrine</span>
                    <span className="text-[11px] text-stone-500">
                      {editProdInStock ? "Produto ativo e visível para compra" : "Produto pausado temporariamente"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditProdInStock(!editProdInStock)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                      editProdInStock ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-stone-700"
                    }`}
                  >
                    {editProdInStock ? "Em Estoque" : "Pausado"}
                  </button>
                </div>
              </div>

              {/* Image Upload Input */}
              <div className="bg-stone-50/70 p-4 rounded-2xl border border-stone-200">
                <ImageUploadInput
                  value={editProdImageUrl}
                  onChange={setEditProdImageUrl}
                  presets={PRESET_FLOWER_IMAGES}
                  label="Foto do Produto (Arquivo do Celular/PC, Link ou Catálogo)"
                  helpText="Você pode enviar uma foto do seu dispositivo para atualizar este arranjo floral."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Descrição do Produto
                </label>
                <textarea
                  rows={3}
                  value={editProdDescription}
                  onChange={(e) => setEditProdDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm"
                />
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs sm:text-sm rounded-xl cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md cursor-pointer transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Google Drive Settings Modal */}
      <GoogleDriveSettingsModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        orders={kanbanOrders}
        customers={customers}
        products={products}
        categories={categories}
        config={googleDriveConfig}
        onSaveConfig={onUpdateGoogleDriveConfig}
        onImportOrders={onBatchImportOrders}
        onImportProducts={(importedProducts) => {
          if (onBatchImportProducts) {
            onBatchImportProducts(importedProducts, categories, false);
          } else {
            importedProducts.forEach((p) => onAddProduct(p));
          }
        }}
        onImportCategories={(importedCats) => {
          importedCats.forEach((c) => onAddCategory(c));
        }}
      />

      {/* AI Catalog Extractor Modal */}
      <AICatalogExtractorModal
        isOpen={isAIExtractorModalOpen}
        onClose={() => setIsAIExtractorModalOpen(false)}
        onImportSuccess={(importedProducts, importedCategories, replaceMode) => {
          if (onBatchImportProducts) {
            onBatchImportProducts(importedProducts, importedCategories, replaceMode);
          } else {
            importedProducts.forEach((p) => onAddProduct(p));
            importedCategories.forEach((c) => onAddCategory(c));
          }
          setFeedbackMessage(`✨ Catálogo atualizado com sucesso! ${importedProducts.length} produtos importados via IA.`);
          setTimeout(() => setFeedbackMessage(""), 5000);
        }}
        currentProductsCount={products.length}
      />
    </div>
  );
};
