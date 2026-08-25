import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  writeBatch
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { KanbanOrder, Product, Category, Customer, StoreConfig } from "../types";

// Collection references
export const ORDERS_COLLECTION = "orders";
export const PRODUCTS_COLLECTION = "products";
export const CATEGORIES_COLLECTION = "categories";
export const CUSTOMERS_COLLECTION = "customers";
export const CONFIG_COLLECTION = "store_config";

/**
 * Real-time listener for Orders (Kanban & WhatsApp)
 */
export function subscribeToOrders(
  onUpdate: (orders: KanbanOrder[]) => void,
  onError?: (error: Error) => void
) {
  try {
    const q = collection(db, ORDERS_COLLECTION);
    return onSnapshot(
      q,
      (snapshot) => {
        const orders: KanbanOrder[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as KanbanOrder;
          orders.push({
            ...data,
            id: docSnap.id || data.id,
          });
        });
        // Sort newest first
        orders.sort((a, b) => {
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        });
        onUpdate(orders);
      },
      (err) => {
        console.error("Firestore Orders Listener Error:", err);
        if (onError) onError(err);
      }
    );
  } catch (e: any) {
    console.error("Failed to subscribe to orders:", e);
    return () => {};
  }
}

/**
 * Real-time listener for Products Catalog
 */
export function subscribeToProducts(
  onUpdate: (products: Product[]) => void,
  onError?: (error: Error) => void
) {
  try {
    const q = collection(db, PRODUCTS_COLLECTION);
    return onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const products: Product[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Product;
            products.push({
              ...data,
              id: docSnap.id || data.id,
            });
          });
          onUpdate(products);
        }
      },
      (err) => {
        console.error("Firestore Products Listener Error:", err);
        if (onError) onError(err);
      }
    );
  } catch (e: any) {
    console.error("Failed to subscribe to products:", e);
    return () => {};
  }
}

/**
 * Real-time listener for Categories
 */
export function subscribeToCategories(
  onUpdate: (categories: Category[]) => void,
  onError?: (error: Error) => void
) {
  try {
    const q = collection(db, CATEGORIES_COLLECTION);
    return onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const categories: Category[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Category;
            categories.push({
              ...data,
              id: docSnap.id || data.id,
            });
          });
          onUpdate(categories);
        }
      },
      (err) => {
        console.error("Firestore Categories Listener Error:", err);
        if (onError) onError(err);
      }
    );
  } catch (e: any) {
    console.error("Failed to subscribe to categories:", e);
    return () => {};
  }
}

/**
 * Real-time listener for Customers
 */
export function subscribeToCustomers(
  onUpdate: (customers: Customer[]) => void,
  onError?: (error: Error) => void
) {
  try {
    const q = collection(db, CUSTOMERS_COLLECTION);
    return onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const customers: Customer[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Customer;
            customers.push({
              ...data,
              id: docSnap.id || data.id,
            });
          });
          onUpdate(customers);
        }
      },
      (err) => {
        console.error("Firestore Customers Listener Error:", err);
        if (onError) onError(err);
      }
    );
  } catch (e: any) {
    console.error("Failed to subscribe to customers:", e);
    return () => {};
  }
}

/**
 * Real-time listener for Store Config
 */
export function subscribeToStoreConfig(
  onUpdate: (config: StoreConfig) => void,
  onError?: (error: Error) => void
) {
  try {
    const docRef = doc(db, CONFIG_COLLECTION, "general");
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          onUpdate(docSnap.data() as StoreConfig);
        }
      },
      (err) => {
        console.error("Firestore Store Config Listener Error:", err);
        if (onError) onError(err);
      }
    );
  } catch (e: any) {
    console.error("Failed to subscribe to store config:", e);
    return () => {};
  }
}

// ----------------- CRUD Operations -----------------

/**
 * Save or update an order directly to Firestore
 */
export async function saveOrderToFirestore(order: KanbanOrder): Promise<boolean> {
  try {
    const orderId = order.id || order.orderNumber.replace(/[^a-zA-Z0-9_-]/g, "") || `ord_${Date.now()}`;
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    await setDoc(docRef, {
      ...order,
      id: orderId,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (error) {
    console.error("Error saving order to Firestore:", error);
    return false;
  }
}

/**
 * Delete an order from Firestore
 */
export async function deleteOrderFromFirestore(orderId: string): Promise<boolean> {
  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Error deleting order from Firestore:", error);
    return false;
  }
}

/**
 * Save or update a product in Firestore
 */
export async function saveProductToFirestore(product: Product): Promise<boolean> {
  try {
    const prodId = product.id || `prod_${Date.now()}`;
    const docRef = doc(db, PRODUCTS_COLLECTION, prodId);
    await setDoc(docRef, {
      ...product,
      id: prodId,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (error) {
    console.error("Error saving product to Firestore:", error);
    return false;
  }
}

/**
 * Delete a product from Firestore
 */
export async function deleteProductFromFirestore(productId: string): Promise<boolean> {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, productId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Error deleting product from Firestore:", error);
    return false;
  }
}

/**
 * Save or update a category in Firestore
 */
export async function saveCategoryToFirestore(category: Category): Promise<boolean> {
  try {
    const catId = category.id || `cat_${Date.now()}`;
    const docRef = doc(db, CATEGORIES_COLLECTION, catId);
    await setDoc(docRef, {
      ...category,
      id: catId,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (error) {
    console.error("Error saving category to Firestore:", error);
    return false;
  }
}

/**
 * Delete a category from Firestore
 */
export async function deleteCategoryFromFirestore(categoryId: string): Promise<boolean> {
  try {
    const docRef = doc(db, CATEGORIES_COLLECTION, categoryId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Error deleting category from Firestore:", error);
    return false;
  }
}

/**
 * Save customer to Firestore
 */
export async function saveCustomerToFirestore(customer: Customer): Promise<boolean> {
  try {
    const custId = customer.id || `cust_${Date.now()}`;
    const docRef = doc(db, CUSTOMERS_COLLECTION, custId);
    await setDoc(docRef, {
      ...customer,
      id: custId,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (error) {
    console.error("Error saving customer to Firestore:", error);
    return false;
  }
}

/**
 * Delete a customer from Firestore
 */
export async function deleteCustomerFromFirestore(customerId: string): Promise<boolean> {
  try {
    const docRef = doc(db, CUSTOMERS_COLLECTION, customerId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Error deleting customer from Firestore:", error);
    return false;
  }
}

/**
 * Save Store Configuration to Firestore
 */
export async function saveStoreConfigToFirestore(config: StoreConfig): Promise<boolean> {
  try {
    const docRef = doc(db, CONFIG_COLLECTION, "general");
    await setDoc(docRef, config, { merge: true });
    return true;
  } catch (error) {
    console.error("Error saving store config to Firestore:", error);
    return false;
  }
}

/**
 * Clear all orders from Firestore database
 */
export async function clearAllOrdersFromFirestore(): Promise<boolean> {
  try {
    const q = collection(db, ORDERS_COLLECTION);
    const snap = await getDocs(q);
    if (snap.empty) return true;
    const batch = writeBatch(db);
    snap.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error clearing orders from Firestore:", error);
    return false;
  }
}

/**
 * Seed or batch upload full catalog, categories and orders to Firestore
 */
export async function seedAllToFirestore(data: {
  products?: Product[];
  categories?: Category[];
  orders?: KanbanOrder[];
  customers?: Customer[];
  storeConfig?: StoreConfig;
}): Promise<{ success: boolean; message: string }> {
  try {
    const batch = writeBatch(db);

    // Products
    if (data.products && data.products.length > 0) {
      data.products.forEach((p) => {
        const docRef = doc(db, PRODUCTS_COLLECTION, p.id);
        batch.set(docRef, p, { merge: true });
      });
    }

    // Categories
    if (data.categories && data.categories.length > 0) {
      data.categories.forEach((c) => {
        const docRef = doc(db, CATEGORIES_COLLECTION, c.id);
        batch.set(docRef, c, { merge: true });
      });
    }

    // Orders
    if (data.orders && data.orders.length > 0) {
      data.orders.forEach((o) => {
        const docRef = doc(db, ORDERS_COLLECTION, o.id);
        batch.set(docRef, o, { merge: true });
      });
    }

    // Customers
    if (data.customers && data.customers.length > 0) {
      data.customers.forEach((cust) => {
        const docRef = doc(db, CUSTOMERS_COLLECTION, cust.id);
        batch.set(docRef, cust, { merge: true });
      });
    }

    // Store Config
    if (data.storeConfig) {
      const configRef = doc(db, CONFIG_COLLECTION, "general");
      batch.set(configRef, data.storeConfig, { merge: true });
    }

    await batch.commit();
    return {
      success: true,
      message: "Todos os dados foram gravados com sucesso no Google Firebase Firestore!",
    };
  } catch (error: any) {
    console.error("Error batch syncing to Firestore:", error);
    return {
      success: false,
      message: "Erro ao gravar dados no Firestore: " + error.message,
    };
  }
}
