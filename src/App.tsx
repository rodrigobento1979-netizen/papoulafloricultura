import React, { useState, useMemo, useEffect } from "react";
import { 
  Filter, 
  Sparkles, 
  SlidersHorizontal, 
  Truck, 
  Heart, 
  Clock, 
  ShieldCheck, 
  Check,
  Search,
  ArrowUpDown,
  MessageCircle,
  Lock,
  Plus
} from "lucide-react";

import { 
  Product, 
  ProductSize, 
  Addon, 
  CartItem, 
  DeliveryInfo, 
  Order, 
  Category, 
  Customer, 
  KanbanOrder, 
  KanbanOrderStatus, 
  GoogleDriveConfig,
  StoreConfig
} from "./types";
import { PRODUCTS, OFFICIAL_PDF_PRODUCTS } from "./data/products";
import { POPULAR_CITIES, CityOption } from "./data/cities";
import { INITIAL_CATEGORIES, OFFICIAL_PDF_CATEGORIES, INITIAL_CUSTOMERS, INITIAL_KANBAN_ORDERS } from "./data/initialData";
import { DEFAULT_STORE_CONFIG } from "./utils/businessHours";

import { Header } from "./components/Header";
import { HeroBanner } from "./components/HeroBanner";
import { LocationModal } from "./components/LocationModal";
import { ProductCard } from "./components/ProductCard";
import { ProductDetailModal } from "./components/ProductDetailModal";
import { AddonsDrawer } from "./components/AddonsDrawer";
import { CartDrawer } from "./components/CartDrawer";
import { CheckoutModal } from "./components/CheckoutModal";
import { OrderTrackingModal } from "./components/OrderTrackingModal";
import { SupportBotDrawer } from "./components/SupportBotDrawer";
import { AdminDashboard } from "./components/AdminDashboard";
import { WhatsAppOrderModal } from "./components/WhatsAppOrderModal";
import { Footer } from "./components/Footer";
import { buildWhatsAppUrl } from "./utils/whatsapp";

export default function App() {
  // Location state
  const [currentCity, setCurrentCity] = useState<CityOption>(POPULAR_CITIES[0]);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Data version check to clean up old placeholder/mock examples and start with a clean slate
  const checkVersionAndInit = () => {
    try {
      const currentVersion = localStorage.getItem("papoula_version_cleanup");
      if (currentVersion !== "v5_clean_slate_personal_catalog") {
        localStorage.setItem("papoula_version_cleanup", "v5_clean_slate_personal_catalog");
        localStorage.setItem("papoula_catalog", JSON.stringify([]));
        localStorage.setItem("papoula_categories", JSON.stringify([]));
        localStorage.setItem("papoula_customers", JSON.stringify([]));
        localStorage.setItem("papoula_kanban_orders", JSON.stringify([]));
        localStorage.removeItem("papoula_cart");
        localStorage.removeItem("papoula_orders");
        localStorage.removeItem("papoula_client_profile");
        localStorage.removeItem("papoula_chat_messages");
      }
    } catch (e) {
      console.warn("Storage cleanup error", e);
    }
  };

  // Dynamic Catalog state (persisted in localStorage)
  const [products, setProducts] = useState<Product[]>(() => {
    checkVersionAndInit();
    try {
      const saved = localStorage.getItem("papoula_catalog");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Could not load catalog from localStorage", e);
    }
    return [];
  });

  // Dynamic Categories state (persisted in localStorage)
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem("papoula_categories");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Could not load categories from localStorage", e);
    }
    return [];
  });

  // Dynamic Customers list (persisted in localStorage)
  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem("papoula_customers");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Could not load customers from localStorage", e);
    }
    return INITIAL_CUSTOMERS;
  });

  // Dynamic Kanban Orders (persisted in localStorage)
  const [kanbanOrders, setKanbanOrders] = useState<KanbanOrder[]>(() => {
    try {
      const saved = localStorage.getItem("papoula_kanban_orders");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Could not load kanban orders from localStorage", e);
    }
    return INITIAL_KANBAN_ORDERS;
  });

  // Google Drive Database Config (persisted in localStorage)
  const [googleDriveConfig, setGoogleDriveConfig] = useState<GoogleDriveConfig>(() => {
    try {
      const saved = localStorage.getItem("papoula_gdrive_config");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return {
      sheetWebhookUrl: "",
      spreadsheetId: "",
      folderUrl: "",
      autoSync: false,
    };
  });

  // Business Hours & Store Configuration State (persisted in localStorage)
  const [storeConfig, setStoreConfig] = useState<StoreConfig>(() => {
    try {
      const saved = localStorage.getItem("papoula_store_config");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return DEFAULT_STORE_CONFIG;
  });

  // Sync state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("papoula_catalog", JSON.stringify(products));
    } catch (e) {}
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem("papoula_categories", JSON.stringify(categories));
    } catch (e) {}
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem("papoula_customers", JSON.stringify(customers));
    } catch (e) {}
  }, [customers]);

  useEffect(() => {
    try {
      localStorage.setItem("papoula_kanban_orders", JSON.stringify(kanbanOrders));
    } catch (e) {}
  }, [kanbanOrders]);

  useEffect(() => {
    try {
      localStorage.setItem("papoula_gdrive_config", JSON.stringify(googleDriveConfig));
    } catch (e) {}
  }, [googleDriveConfig]);

  useEffect(() => {
    try {
      localStorage.setItem("papoula_store_config", JSON.stringify(storeConfig));
    } catch (e) {}
  }, [storeConfig]);

  // Automatic Background Synchronization with Google Sheets (Orders, Catalog, Categories)
  useEffect(() => {
    const webhookUrl = googleDriveConfig?.sheetWebhookUrl?.trim() || "";
    const spreadsheetId = googleDriveConfig?.spreadsheetId?.trim() || "";
    const folderUrl = googleDriveConfig?.folderUrl?.trim() || "";
    const isAutoSyncEnabled = googleDriveConfig?.autoSync === true;

    // Verify if there is a valid URL or spreadsheet ID configured
    const hasValidTarget =
      (webhookUrl.startsWith("http://") || webhookUrl.startsWith("https://")) ||
      (spreadsheetId.length > 5 && !spreadsheetId.includes(" ")) ||
      (folderUrl.startsWith("http://") || folderUrl.startsWith("https://"));

    // If auto-sync is off or no valid credentials configured, skip auto sync
    if (!isAutoSyncEnabled || !hasValidTarget) return;

    // Run synchronization function
    const runAutoSync = async (silent = true) => {
      try {
        const { fetchStoreDataFromGoogleSheets, mergeOrders } = await import("./utils/googleDriveSync");
        const res = await fetchStoreDataFromGoogleSheets(webhookUrl, spreadsheetId, folderUrl);
        
        if (res.success) {
          // 1. Sync Orders
          if (Array.isArray(res.orders) && res.orders.length > 0) {
            setKanbanOrders((prevOrders) => {
              const { merged, addedCount, updatedCount } = mergeOrders(prevOrders, res.orders);
              if (!silent && (addedCount > 0 || updatedCount > 0)) {
                console.log(`[AutoSync] ${addedCount} novos pedidos adicionados, ${updatedCount} atualizados.`);
              }
              return merged;
            });
          }

          // 2. Sync Catalog (if sheets contains products)
          if (Array.isArray(res.products) && res.products.length > 0) {
            setProducts((prevProds) => {
              if (prevProds.length === 0) return res.products;
              return res.products;
            });
          }

          // 3. Sync Categories (if sheets contains categories)
          if (Array.isArray(res.categories) && res.categories.length > 0) {
            setCategories((prevCats) => {
              if (prevCats.length === 0) return res.categories;
              return res.categories;
            });
          }

          // Update lastSyncedAt timestamp in config
          setGoogleDriveConfig((prev) => ({
            ...prev,
            lastSyncedAt: new Date().toLocaleDateString("pt-BR") + " às " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
          }));
        }
      } catch (err) {
        // Silently capture background sync failure
      }
    };

    // 1. Initial automatic sync on mount / app load
    runAutoSync(true);

    // 2. Periodic background sync every 2 minutes
    const interval = setInterval(() => {
      runAutoSync(true);
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [googleDriveConfig?.sheetWebhookUrl, googleDriveConfig?.spreadsheetId, googleDriveConfig?.folderUrl, googleDriveConfig?.autoSync]);

  // Filters and search state
  const [selectedCategory, setSelectedCategory] = useState<string>("todos");
  const [selectedOccasion, setSelectedOccasion] = useState<string>("todos");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedFlowerFilter, setSelectedFlowerFilter] = useState<string>("todas");
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc" | "rating">("featured");

  // Cart & Active Delivery State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [activeDelivery, setActiveDelivery] = useState<Partial<DeliveryInfo>>({
    city: POPULAR_CITIES[0].name,
    state: POPULAR_CITIES[0].state,
    cep: POPULAR_CITIES[0].cepDefault,
    dateLabel: "Hoje",
    shiftName: "Tarde (13h às 18h)",
    shiftFee: 0,
  });

  // Modal / Drawer states
  const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(null);
  const [isAddonsDrawerOpen, setIsAddonsDrawerOpen] = useState(false);
  const [activeAddonsProduct, setActiveAddonsProduct] = useState<{
    product: Product;
    selectedSize?: ProductSize;
  } | null>(null);
  const [currentSelectedAddons, setCurrentSelectedAddons] = useState<
    { addon: Addon; quantity: number }[]
  >([]);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  // Navigation View: 'shop' or 'admin'
  const [currentView, setCurrentView] = useState<"shop" | "admin">("shop");
  const [isSupportBotOpen, setIsSupportBotOpen] = useState(false);
  const [selectedOrderProduct, setSelectedOrderProduct] = useState<Product | null>(null);
  const [selectedOrderCity, setSelectedOrderCity] = useState<string>("Pirapora");

  // Dedicated WhatsApp Order Modal State
  const [whatsAppOrderModal, setWhatsAppOrderModal] = useState<{
    isOpen: boolean;
    product: Product | null;
    selectedSize?: ProductSize;
    city?: string;
    deliveryFee?: number;
  }>({
    isOpen: false,
    product: null,
  });

  const handleOpenWhatsAppOrder = (
    product: Product,
    selectedSize?: ProductSize,
    city?: string,
    deliveryFee?: number
  ) => {
    setWhatsAppOrderModal({
      isOpen: true,
      product,
      selectedSize,
      city: city || (currentCity.name.includes("Buritizeiro") ? "Buritizeiro" : "Pirapora"),
      deliveryFee: deliveryFee || (currentCity.name.includes("Buritizeiro") ? 15.0 : 10.0),
    });
  };

  // Items per page and pagination state
  const [itemsPerPage, setItemsPerPage] = useState<number | "todos">(20);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Reset page to 1 when filters or items per page change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedOccasion, selectedFlowerFilter, searchQuery, itemsPerPage]);

  // Flower species filter definitions
  const flowerOptions = [
    { id: "todas", label: "Todas as Flores" },
    { id: "rosas", label: "🌹 Rosas Nobres" },
    { id: "girassol", label: "🌻 Girassóis" },
    { id: "orquideas", label: "🪴 Orquídeas" },
    { id: "lirios", label: "✨ Lírios" },
    { id: "astromelias", label: "🌸 Astromélias" },
  ];

  // Filter products logic using dynamic products catalog
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (selectedCategory !== "todos" && p.category !== selectedCategory) {
        return false;
      }
      // Occasion filter
      if (selectedOccasion !== "todos" && !p.occasion.includes(selectedOccasion)) {
        return false;
      }
      // Flower species filter
      if (selectedFlowerFilter !== "todas" && !p.flowerType.includes(selectedFlowerFilter)) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesDesc = p.description.toLowerCase().includes(q);
        const matchesTags = p.tags.some((t) => t.toLowerCase().includes(q));
        const matchesFlower = p.flowerType.some((f) => f.toLowerCase().includes(q));
        if (!matchesName && !matchesDesc && !matchesTags && !matchesFlower) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === "price-asc") return (a.price || 0) - (b.price || 0);
      if (sortBy === "price-desc") return (b.price || 0) - (a.price || 0);
      if (sortBy === "rating") return (b.rating || 5) - (a.rating || 5);
      return 0; // featured default
    });
  }, [products, selectedCategory, selectedOccasion, selectedFlowerFilter, searchQuery, sortBy]);

  // Paginated product slice based on itemsPerPage
  const totalProducts = filteredProducts.length;
  const totalPages = itemsPerPage === "todos" ? 1 : Math.max(1, Math.ceil(totalProducts / itemsPerPage));

  const paginatedProducts = useMemo(() => {
    if (itemsPerPage === "todos") return filteredProducts;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, itemsPerPage, currentPage]);

  // Product management handlers
  const handleAddProduct = (newProd: Product) => {
    setProducts((prev) => [newProd, ...prev]);
  };

  const handleUpdateProduct = (updatedProd: Product) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProd.id ? updatedProd : p))
    );
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  // Category management handlers
  const handleAddCategory = (newCat: Category) => {
    setCategories((prev) => [...prev, newCat]);
  };

  const handleUpdateCategory = (updatedCat: Category) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === updatedCat.id ? updatedCat : c))
    );
  };

  const handleDeleteCategory = (categoryId: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
  };

  // Customer management handlers
  const handleAddCustomer = (newCustomer: Customer) => {
    setCustomers((prev) => {
      // If customer with same phone exists, update it instead of duplicating
      const cleanPhone = newCustomer.phone.replace(/\D/g, "");
      const exists = prev.some((c) => c.phone.replace(/\D/g, "") === cleanPhone);
      if (exists) {
        return prev.map((c) => 
          c.phone.replace(/\D/g, "") === cleanPhone 
            ? { ...c, fullName: newCustomer.fullName, birthDate: newCustomer.birthDate || c.birthDate }
            : c
        );
      }
      return [newCustomer, ...prev];
    });
  };

  const handleUpdateCustomer = (updatedCustomer: Customer) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c))
    );
  };

  const handleDeleteCustomer = (customerId: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== customerId));
  };

  // Kanban Order management handlers
  const handleUpdateOrderStatus = (orderId: string, newStatus: KanbanOrderStatus, photoUrl?: string) => {
    setKanbanOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId) {
          return {
            ...order,
            status: newStatus,
            photoUrl: photoUrl || order.photoUrl,
            completedAt: newStatus === "concluido" ? new Date().toISOString() : order.completedAt,
          };
        }
        return order;
      })
    );
  };

  const handleAddKanbanOrder = (newOrder: KanbanOrder) => {
    setKanbanOrders((prev) => [newOrder, ...prev]);

    // Also auto-register customer if not in list
    if (newOrder.customerName && newOrder.customerPhone) {
      handleAddCustomer({
        id: `cust-${Date.now()}`,
        fullName: newOrder.customerName,
        phone: newOrder.customerPhone,
        birthDate: newOrder.customerBirthDate || "",
        createdAt: new Date().toISOString(),
        notes: `Pedido #${newOrder.orderNumber} via Atendimento`,
        totalOrders: 1,
      });
    }
  };

  const handleUpdateKanbanOrder = (updatedOrder: KanbanOrder) => {
    setKanbanOrders((prev) =>
      prev.map((order) => (order.id === updatedOrder.id ? updatedOrder : order))
    );
  };

  const handleBatchImportOrders = (importedOrders: KanbanOrder[]) => {
    setKanbanOrders(importedOrders);
    localStorage.setItem("papoula_kanban_orders", JSON.stringify(importedOrders));
  };

  const handleDeleteKanbanOrder = (orderId: string) => {
    setKanbanOrders((prev) => prev.filter((order) => order.id !== orderId));
  };

  const handleClearOrders = () => {
    if (window.confirm("Deseja apagar todos os pedidos do Kanban? Essa ação não pode ser desfeita.")) {
      setKanbanOrders([]);
      localStorage.setItem("papoula_kanban_orders", JSON.stringify([]));
    }
  };

  const handleClearCustomers = () => {
    if (window.confirm("Deseja apagar todos os clientes cadastrados? Essa ação não pode ser desfeita.")) {
      setCustomers([]);
      localStorage.setItem("papoula_customers", JSON.stringify([]));
    }
  };

  const handleClearCatalog = () => {
    if (window.confirm("Deseja apagar todos os produtos do catálogo para cadastrar do zero?")) {
      setProducts([]);
      localStorage.setItem("papoula_catalog", JSON.stringify([]));
    }
  };

  const handleClearCategories = () => {
    if (window.confirm("Deseja apagar todas as categorias para cadastrar do zero?")) {
      setCategories([]);
      localStorage.setItem("papoula_categories", JSON.stringify([]));
    }
  };

  const handleClearAllData = () => {
    if (window.confirm("Deseja limpar todos os pedidos, clientes e histórico de pedidos?")) {
      setKanbanOrders([]);
      setCustomers([]);
      setCartItems([]);
      localStorage.setItem("papoula_kanban_orders", JSON.stringify([]));
      localStorage.setItem("papoula_customers", JSON.stringify([]));
      localStorage.removeItem("papoula_cart");
      localStorage.removeItem("papoula_orders");
    }
  };

  const handleResetToDefaults = () => {
    if (window.confirm("Deseja carregar os 28 produtos e categorias oficiais do PDF da Floricultura Papoula?")) {
      setProducts(OFFICIAL_PDF_PRODUCTS);
      setCategories(OFFICIAL_PDF_CATEGORIES);
      localStorage.setItem("papoula_catalog", JSON.stringify(OFFICIAL_PDF_PRODUCTS));
      localStorage.setItem("papoula_categories", JSON.stringify(OFFICIAL_PDF_CATEGORIES));
    }
  };

  const handleBatchImportProducts = (
    importedProducts: Product[],
    importedCategories: Category[],
    replaceMode: boolean
  ) => {
    let nextProducts: Product[] = [];
    let nextCategories: Category[] = [];

    if (replaceMode) {
      nextProducts = importedProducts;
      nextCategories = importedCategories;
    } else {
      // Merge products: avoid duplicate IDs
      const existingProductIds = new Set(products.map((p) => p.id));
      const filteredNew = importedProducts.filter((p) => !existingProductIds.has(p.id));
      nextProducts = [...products, ...filteredNew];

      // Merge categories
      const existingCatIds = new Set(categories.map((c) => c.id));
      const filteredNewCats = importedCategories.filter((c) => !existingCatIds.has(c.id));
      nextCategories = [...categories, ...filteredNewCats];
    }

    setProducts(nextProducts);
    setCategories(nextCategories);
    localStorage.setItem("papoula_catalog", JSON.stringify(nextProducts));
    localStorage.setItem("papoula_categories", JSON.stringify(nextCategories));
  };

  const handleRequestOrder = (
    product: Product,
    selectedSize?: ProductSize,
    deliveryCity?: string
  ) => {
    // If size changes price, build updated copy
    const targetProduct = selectedSize
      ? { ...product, price: selectedSize.price, name: `${product.name} (${selectedSize.name})` }
      : product;

    setSelectedOrderProduct(targetProduct);
    if (deliveryCity) {
      setSelectedOrderCity(deliveryCity);
    } else {
      setSelectedOrderCity(currentCity.name);
    }
    if (selectedProductDetail) {
      setSelectedProductDetail(null);
    }
    setIsSupportBotOpen(true);
  };

  // Cart operations
  const handleOpenProductDetail = (product: Product) => {
    setSelectedProductDetail(product);
  };

  const handleQuickBuy = (product: Product) => {
    handleRequestOrder(product, undefined, currentCity.name);
  };

  const handleAddToCartFromDetail = (
    product: Product,
    selectedSize?: ProductSize,
    deliveryDetails?: Partial<DeliveryInfo>
  ) => {
    if (deliveryDetails) {
      setActiveDelivery((prev) => ({ ...prev, ...deliveryDetails }));
    }
    setSelectedProductDetail(null);
    setActiveAddonsProduct({ product, selectedSize });
    setCurrentSelectedAddons([]);
    setIsAddonsDrawerOpen(true);
  };

  const handleToggleAddon = (addon: Addon) => {
    setCurrentSelectedAddons((prev) => {
      const exists = prev.find((item) => item.addon.id === addon.id);
      if (exists) {
        return prev.filter((item) => item.addon.id !== addon.id);
      } else {
        return [...prev, { addon, quantity: 1 }];
      }
    });
  };

  const handleContinueToCartFromAddons = () => {
    if (!activeAddonsProduct) return;

    const newItem: CartItem = {
      id: `${activeAddonsProduct.product.id}-${Date.now()}`,
      product: activeAddonsProduct.product,
      selectedSize: activeAddonsProduct.selectedSize,
      unitPrice: activeAddonsProduct.selectedSize
        ? activeAddonsProduct.selectedSize.price
        : activeAddonsProduct.product.price,
      quantity: 1,
      addons: [...currentSelectedAddons],
    };

    setCartItems((prev) => [...prev, newItem]);
    setIsAddonsDrawerOpen(false);
    setActiveAddonsProduct(null);
    setCurrentSelectedAddons([]);
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (itemId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === itemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
      );
  };

  const handleRemoveItem = (itemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleRemoveAddon = (itemId: string, addonId: string) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            addons: item.addons.filter((a) => a.addon.id !== addonId),
          };
        }
        return item;
      })
    );
  };

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleOrderCompleted = (order: Order) => {
    setActiveOrder(order);
    setCartItems([]);
    setIsCheckoutOpen(false);
    setIsTrackingOpen(true);

    // Also auto-generate Kanban order for physical production
    const firstItem = order.items[0];
    const orderNum = `PAP-${Math.floor(1000 + Math.random() * 9000)}`;
    const newKanban: KanbanOrder = {
      id: `ord-${Date.now()}`,
      orderNumber: orderNum,
      customerName: order.buyer.fullName,
      customerPhone: order.buyer.phone,
      productName: firstItem ? firstItem.product.name : "Arranjo Especial Papoula",
      category: firstItem?.product.category || "buques",
      totalPrice: order.total,
      deliveryAddress: `${order.delivery.street}, ${order.delivery.number} ${order.delivery.complement ? `(${order.delivery.complement})` : ""}`,
      deliveryCity: order.delivery.city,
      deliveryDate: `${order.delivery.dateLabel} - ${order.delivery.shiftName}`,
      cardMessage: order.card?.messageText || "Com muito carinho!",
      cardSender: order.card?.senderSignature || order.buyer.fullName,
      status: "pedido",
      createdAt: new Date().toISOString(),
      paymentMethod: order.buyer.paymentMethod === "credit_card" ? "cartao" : "pix",
    };
    handleAddKanbanOrder(newKanban);
  };

  // FULL-SCREEN ADMIN PANEL
  if (currentView === "admin") {
    return (
      <AdminDashboard
        products={products}
        onAddProduct={handleAddProduct}
        onUpdateProduct={handleUpdateProduct}
        onDeleteProduct={handleDeleteProduct}
        categories={categories}
        onAddCategory={handleAddCategory}
        onUpdateCategory={handleUpdateCategory}
        onDeleteCategory={handleDeleteCategory}
        onBatchImportProducts={handleBatchImportProducts}
        customers={customers}
        onAddCustomer={handleAddCustomer}
        onUpdateCustomer={handleUpdateCustomer}
        onDeleteCustomer={handleDeleteCustomer}
        kanbanOrders={kanbanOrders}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        onAddKanbanOrder={handleAddKanbanOrder}
        onUpdateKanbanOrder={handleUpdateKanbanOrder}
        onDeleteKanbanOrder={handleDeleteKanbanOrder}
        onBatchImportOrders={handleBatchImportOrders}
        googleDriveConfig={googleDriveConfig}
        onUpdateGoogleDriveConfig={setGoogleDriveConfig}
        storeConfig={storeConfig}
        onUpdateStoreConfig={setStoreConfig}
        onClearOrders={handleClearOrders}
        onClearCustomers={handleClearCustomers}
        onClearProducts={handleClearCatalog}
        onClearCategories={handleClearCategories}
        onClearAllData={handleClearAllData}
        onResetToDefaults={handleResetToDefaults}
        onBackToShop={() => setCurrentView("shop")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 flex flex-col font-sans selection:bg-emerald-800 selection:text-white relative">
      {/* Header with Dynamic Categories & Navigation */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          const catalogEl = document.getElementById("catalogo-produtos");
          if (catalogEl) {
            catalogEl.scrollIntoView({ behavior: "smooth" });
          }
        }}
        categories={categories}
        onOpenSupportBot={() => setIsSupportBotOpen(true)}
        onOpenAdminPanel={() => setCurrentView("admin")}
      />

      {/* Hero Banner with Delivery Badges & Occasions */}
      <HeroBanner
        currentCity={currentCity}
        selectedOccasion={selectedOccasion}
        onSelectOccasion={(occ) => {
          setSelectedOccasion(occ);
          const catalogEl = document.getElementById("catalogo-produtos");
          if (catalogEl) {
            catalogEl.scrollIntoView({ behavior: "smooth" });
          }
        }}
        onOpenLocation={() => setIsLocationModalOpen(true)}
      />

      {/* Main Catalog Body */}
      <main id="catalogo-produtos" className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 space-y-6">
        {/* Catálogo de Flores & Presentes - Brand Green Master Card */}
        <div className="w-full bg-[#114b30] text-white rounded-3xl p-4 sm:p-6 lg:p-7 border border-[#1b6342] shadow-xl space-y-5">
          {/* Header row: Title, Total Items & Options */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight">
                  Catálogo de Flores & Presentes
                </span>
                <span className="text-xs bg-amber-400 text-emerald-950 font-extrabold px-2.5 py-0.5 rounded-full shadow-xs">
                  {totalProducts} {totalProducts === 1 ? "item" : "itens"}
                </span>
              </div>
              <p className="text-xs text-emerald-200/90 mt-1">
                Arranjos e buquês florais com entrega expressa em <strong>Pirapora</strong> e <strong>Buritizeiro</strong>
              </p>
            </div>

            {/* Display Count (10, 20, 50, todos) & Sort Options */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Items per page selector */}
              <div className="flex items-center gap-1.5 bg-[#0a3120] border border-emerald-700/70 rounded-2xl p-1 text-xs">
                <span className="text-emerald-300 font-semibold px-2 text-[11px]">Exibir:</span>
                {([10, 20, 50, "todos"] as const).map((opt) => (
                  <button
                    key={String(opt)}
                    onClick={() => {
                      setItemsPerPage(opt);
                      setCurrentPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-xl font-bold transition-all text-xs cursor-pointer ${
                      itemsPerPage === opt
                        ? "bg-amber-400 text-emerald-950 shadow-xs"
                        : "text-emerald-200 hover:text-white hover:bg-emerald-800/60"
                    }`}
                  >
                    {opt === "todos" ? "Todos" : opt}
                  </button>
                ))}
              </div>

              {/* Sort selector */}
              <div className="flex items-center gap-1.5 bg-[#0a3120] border border-emerald-700/70 rounded-2xl px-3 py-1.5 text-xs text-emerald-100">
                <ArrowUpDown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent font-medium focus:outline-none cursor-pointer text-white"
                >
                  <option value="featured" className="bg-[#114b30] text-white">Destaques</option>
                  <option value="price-asc" className="bg-[#114b30] text-white">Menor Preço</option>
                  <option value="price-desc" className="bg-[#114b30] text-white">Maior Preço</option>
                </select>
              </div>
            </div>
          </div>

          {/* Registered Categories Selector (Somente categorias cadastradas) */}
          <div className="pt-2 border-t border-emerald-800/80">
            <div className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span>Categorias Cadastradas:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* All Categories Option */}
              <button
                onClick={() => setSelectedCategory("todos")}
                className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedCategory === "todos"
                    ? "bg-amber-400 text-emerald-950 shadow-md ring-2 ring-amber-300"
                    : "bg-[#0d3b26] text-emerald-100 hover:bg-[#165638] hover:text-white border border-emerald-700/60"
                }`}
              >
                <span>🌿</span>
                <span>Todas as Categorias</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedCategory === "todos" ? "bg-emerald-950 text-amber-300" : "bg-emerald-900 text-emerald-200"
                }`}>
                  {products.length}
                </span>
              </button>

              {/* Dynamic registered categories from state */}
              {categories.map((cat) => {
                const count = products.filter((p) => p.category === cat.id).length;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-amber-400 text-emerald-950 shadow-md ring-2 ring-amber-300"
                        : "bg-[#0d3b26] text-emerald-100 hover:bg-[#165638] hover:text-white border border-emerald-700/60"
                    }`}
                  >
                    <span>{cat.icon || "🌸"}</span>
                    <span>{cat.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? "bg-emerald-950 text-amber-300" : "bg-emerald-900 text-emerald-200"
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Filter Badges & Clear Filters */}
          {(selectedCategory !== "todos" || selectedOccasion !== "todos" || searchQuery) && (
            <div className="pt-3 border-t border-emerald-800/80 flex items-center gap-2 flex-wrap text-xs text-emerald-200">
              <span className="font-semibold text-emerald-300">Filtro aplicado:</span>
              {selectedCategory !== "todos" && (
                <span className="bg-amber-400 text-emerald-950 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-bold">
                  Categoria: {categories.find((c) => c.id === selectedCategory)?.name || selectedCategory}
                  <button onClick={() => setSelectedCategory("todos")} className="hover:text-rose-700 font-bold ml-1 cursor-pointer">✕</button>
                </span>
              )}
              {selectedOccasion !== "todos" && (
                <span className="bg-amber-400 text-emerald-950 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-bold">
                  Ocasião: {selectedOccasion}
                  <button onClick={() => setSelectedOccasion("todos")} className="hover:text-rose-700 font-bold ml-1 cursor-pointer">✕</button>
                </span>
              )}
              {searchQuery && (
                <span className="bg-amber-400 text-emerald-950 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-bold">
                  Busca: "{searchQuery}"
                  <button onClick={() => setSearchQuery("")} className="hover:text-rose-700 font-bold ml-1 cursor-pointer">✕</button>
                </span>
              )}
              <button
                onClick={() => {
                  setSelectedCategory("todos");
                  setSelectedOccasion("todos");
                  setSelectedFlowerFilter("todas");
                  setSearchQuery("");
                }}
                className="text-amber-300 hover:text-white underline font-semibold ml-2 cursor-pointer"
              >
                Limpar filtros
              </button>
            </div>
          )}
        </div>

        {/* Product Grid */}
        {products.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border border-stone-200/90 shadow-2xs space-y-4 max-w-2xl mx-auto my-6">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-[#114b30] flex items-center justify-center mx-auto border border-emerald-100">
              <Sparkles className="w-8 h-8 text-amber-500" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">Catálogo Pronto para Cadastro</h3>
              <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
                Você optou por cadastrar seus próprios produtos e categorias pessoalmente. Acesse a <strong>Área Administrativa</strong> para cadastrar seus buquês, arranjos, cestas e fotos.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
              <button
                onClick={() => setCurrentView("admin")}
                className="w-full sm:w-auto px-6 py-3 bg-[#114b30] hover:bg-[#0c3924] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4 text-amber-300" />
                <span>Acessar Área Interna para Cadastrar</span>
              </button>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
              <Search className="w-8 h-8 opacity-40" />
            </div>
            <h3 className="text-lg font-serif font-bold text-stone-800">Nenhum arranjo encontrado</h3>
            <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto">
              Não encontramos produtos para os filtros selecionados. Tente buscar por outros termos ou gerencie o catálogo na Área Interna.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  setSelectedCategory("todos");
                  setSelectedOccasion("todos");
                  setSelectedFlowerFilter("todas");
                  setSearchQuery("");
                }}
                className="px-5 py-2.5 bg-[#114b30] text-white rounded-xl text-xs font-bold hover:bg-[#0c3924] transition-colors cursor-pointer"
              >
                Ver Todo o Catálogo
              </button>
              <button
                onClick={() => setCurrentView("admin")}
                className="px-5 py-2.5 bg-stone-100 text-stone-800 border border-stone-300 rounded-xl text-xs font-bold hover:bg-stone-200 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Publicar Novo Produto</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {paginatedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onOpenDetails={handleOpenProductDetail}
                  onOpenWhatsAppOrder={handleOpenWhatsAppOrder}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="bg-white rounded-2xl p-4 border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-600">
                <span className="font-medium">
                  Exibindo <strong>{paginatedProducts.length}</strong> de <strong>{totalProducts}</strong> produtos (Página {currentPage} de {totalPages})
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => {
                      setCurrentPage((p) => Math.max(1, p - 1));
                      document.getElementById("catalogo-produtos")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="px-3 py-1.5 rounded-xl border border-stone-300 font-semibold hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    Anterior
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => {
                        setCurrentPage(page);
                        document.getElementById("catalogo-produtos")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className={`w-8 h-8 rounded-xl font-bold transition-colors cursor-pointer ${
                        currentPage === page
                          ? "bg-[#114b30] text-white"
                          : "border border-stone-200 hover:bg-stone-100 text-stone-700"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => {
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
                      document.getElementById("catalogo-produtos")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="px-3 py-1.5 rounded-xl border border-stone-300 font-semibold hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    Próximo
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Bottom-Right WhatsApp Contact Button */}
      <a
        href={buildWhatsAppUrl(storeConfig.whatsapp || "5538988512855", "Olá! Gostaria de falar com a Floricultura Papoula sobre encomendar flores.")}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 bg-[#25D366] hover:bg-[#20bd5a] text-white p-3.5 sm:px-4 sm:py-3 rounded-full shadow-2xl hover:scale-105 transition-all flex items-center gap-2.5 border-2 border-white/80 cursor-pointer group"
        title="Atendimento no WhatsApp (38) 98851-2855"
      >
        <MessageCircle className="w-6 h-6 text-white fill-white/20" />
        <span className="hidden sm:inline font-bold text-xs">WhatsApp</span>
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-200 animate-ping absolute -top-1 -right-1" />
      </a>

      {/* Footer with institutional & FAQs */}
      <Footer />

      {/* Modals & Drawers */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentCity={currentCity}
        onSelectCity={(city) => {
          setCurrentCity(city);
          setActiveDelivery((prev) => ({
            ...prev,
            city: city.name,
            state: city.state,
            cep: city.cepDefault,
          }));
        }}
      />

      <ProductDetailModal
        product={selectedProductDetail}
        isOpen={!!selectedProductDetail}
        onClose={() => setSelectedProductDetail(null)}
        currentCity={currentCity}
        onRequestOrder={handleRequestOrder}
        onOpenWhatsAppOrder={handleOpenWhatsAppOrder}
      />

      {/* Dedicated WhatsApp Order Modal (Customer-facing Order Flow) */}
      <WhatsAppOrderModal
        isOpen={whatsAppOrderModal.isOpen}
        onClose={() => setWhatsAppOrderModal((prev) => ({ ...prev, isOpen: false }))}
        product={whatsAppOrderModal.product}
        selectedSize={whatsAppOrderModal.selectedSize}
        initialCity={whatsAppOrderModal.city}
        initialDeliveryFee={whatsAppOrderModal.deliveryFee}
      />

      <AddonsDrawer
        isOpen={isAddonsDrawerOpen}
        onClose={() => setIsAddonsDrawerOpen(false)}
        addedProduct={activeAddonsProduct}
        selectedAddons={currentSelectedAddons}
        onToggleAddon={handleToggleAddon}
        onContinueToCart={handleContinueToCartFromAddons}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        delivery={activeDelivery}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onRemoveAddon={handleRemoveAddon}
        onProceedToCheckout={handleProceedToCheckout}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cartItems}
        initialDelivery={activeDelivery}
        onOrderCompleted={handleOrderCompleted}
      />

      <OrderTrackingModal
        isOpen={isTrackingOpen}
        onClose={() => setIsTrackingOpen(false)}
        activeOrder={activeOrder}
      />

      {/* Support Bot Lateral Drawer (With Lead Capture, Birthday & Fast Kanban Order Generation) */}
      <SupportBotDrawer
        isOpen={isSupportBotOpen}
        onClose={() => setIsSupportBotOpen(false)}
        products={products}
        storeConfig={storeConfig}
        initialProductForOrder={selectedOrderProduct}
        initialCity={selectedOrderCity}
        onRegisterCustomer={handleAddCustomer}
        onCreateKanbanOrder={handleAddKanbanOrder}
      />
    </div>
  );
}
