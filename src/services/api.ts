import {
  Customer,
  InstallmentPlan,
  Order,
  PaymentMethodType,
  QuotationHeader,
  RMATicket,
  StockItem,
  Supplier,
  WarrantyCalculation
} from '../types';
import {
  INITIAL_CUSTOMERS,
  INITIAL_INSTALLMENT_PLANS,
  INITIAL_ORDERS,
  INITIAL_QUOTATIONS,
  INITIAL_RMA_TICKETS,
  INITIAL_STOCK_ITEMS,
  INITIAL_SUPPLIERS
} from './mockData';

// LocalStorage Persistence Keys
const STORAGE_KEYS = {
  STOCK: 'efz_stock_items',
  ORDERS: 'efz_orders',
  CUSTOMERS: 'efz_customers',
  SUPPLIERS: 'efz_suppliers',
  QUOTATIONS: 'efz_quotations',
  RMA: 'efz_rma_tickets',
  INSTALLMENTS: 'efz_installment_plans'
};

function loadFromStorage<T>(key: string, initial: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : initial;
  } catch {
    return initial;
  }
}

export const DATA_UPDATED_EVENT = 'efz:data_updated';

export function notifyDataUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(DATA_UPDATED_EVENT));
  }
}

function saveToStorage<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    notifyDataUpdated();
  } catch (err) {
    console.warn(`Failed to save ${key} to localStorage`, err);
  }
}

// In-Memory state initialized from localStorage
let stockItems: StockItem[] = loadFromStorage(STORAGE_KEYS.STOCK, INITIAL_STOCK_ITEMS);
let orders: Order[] = loadFromStorage(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
let customers: Customer[] = loadFromStorage(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
let suppliers: Supplier[] = loadFromStorage(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
let quotations: QuotationHeader[] = loadFromStorage(STORAGE_KEYS.QUOTATIONS, INITIAL_QUOTATIONS);
let rmaTickets: RMATicket[] = loadFromStorage(STORAGE_KEYS.RMA, INITIAL_RMA_TICKETS);
let installmentPlans: InstallmentPlan[] = loadFromStorage(STORAGE_KEYS.INSTALLMENTS, INITIAL_INSTALLMENT_PLANS);

export function syncStateFromStorage() {
  stockItems = loadFromStorage(STORAGE_KEYS.STOCK, INITIAL_STOCK_ITEMS);
  orders = loadFromStorage(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
  customers = loadFromStorage(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  suppliers = loadFromStorage(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
  quotations = loadFromStorage(STORAGE_KEYS.QUOTATIONS, INITIAL_QUOTATIONS);
  rmaTickets = loadFromStorage(STORAGE_KEYS.RMA, INITIAL_RMA_TICKETS);
  installmentPlans = loadFromStorage(STORAGE_KEYS.INSTALLMENTS, INITIAL_INSTALLMENT_PLANS);
}

export function resetDemoDataToBaseline() {
  localStorage.setItem(STORAGE_KEYS.STOCK, JSON.stringify(INITIAL_STOCK_ITEMS));
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS));
  localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(INITIAL_SUPPLIERS));
  localStorage.setItem(STORAGE_KEYS.QUOTATIONS, JSON.stringify(INITIAL_QUOTATIONS));
  localStorage.setItem(STORAGE_KEYS.RMA, JSON.stringify(INITIAL_RMA_TICKETS));
  localStorage.setItem(STORAGE_KEYS.INSTALLMENTS, JSON.stringify(INITIAL_INSTALLMENT_PLANS));
  syncStateFromStorage();
  notifyDataUpdated();
}

export function getStorageStats() {
  syncStateFromStorage();
  return {
    ordersCount: orders.length,
    storedStockCount: stockItems.filter((i) => i.stockStatus === 'stored').length,
    soldStockCount: stockItems.filter((i) => i.stockStatus === 'sold').length,
    customersCount: customers.length,
    rmaCount: rmaTickets.length,
    installmentsCount: installmentPlans.length,
    quotationsCount: quotations.length
  };
}

const delay = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms));

// ==========================================
// INVENTORY & ASSET SERVICES
// ==========================================
export const inventoryService = {
  async getStockItems(options?: {
    category?: string;
    search?: string;
    includeDeleted?: boolean;
    status?: string;
  }): Promise<StockItem[]> {
    await delay();
    let result = [...stockItems];

    if (!options?.includeDeleted) {
      result = result.filter((item) => item.stockStatus !== 'Deleted');
    }

    if (options?.status) {
      result = result.filter((item) => item.stockStatus === options.status);
    }

    if (options?.category && options.category !== 'All Stocks') {
      result = result.filter(
        (item) => item.stockName.toLowerCase() === options.category?.toLowerCase()
      );
    }

    if (options?.search) {
      const q = options.search.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.stockSerial.toLowerCase().includes(q) ||
          item.stockDetails.toLowerCase().includes(q) ||
          item.stockName.toLowerCase().includes(q)
      );
    }

    return result;
  },

  async addStockItem(item: Omit<StockItem, 'id' | 'stockStatus' | 'inDate'>): Promise<StockItem> {
    await delay();
    const exists = stockItems.some(
      (s) => s.stockSerial.toLowerCase() === item.stockSerial.toLowerCase() && s.stockStatus !== 'Deleted'
    );
    if (exists) {
      throw new Error(`Serial number "${item.stockSerial}" is already registered in inventory.`);
    }

    const newItem: StockItem = {
      ...item,
      id: Date.now(),
      stockStatus: 'stored',
      inDate: new Date().toISOString()
    };

    stockItems.unshift(newItem);
    saveToStorage(STORAGE_KEYS.STOCK, stockItems);
    return newItem;
  },

  async updateStockItem(id: number, updates: Partial<StockItem>): Promise<StockItem> {
    await delay();
    const index = stockItems.findIndex((item) => item.id === id);
    if (index === -1) throw new Error('Stock item not found');

    stockItems[index] = { ...stockItems[index], ...updates };
    saveToStorage(STORAGE_KEYS.STOCK, stockItems);
    return stockItems[index];
  },

  async deleteStockItem(id: number): Promise<void> {
    await delay();
    const index = stockItems.findIndex((item) => item.id === id);
    if (index === -1) throw new Error('Stock item not found');

    // Soft delete corresponding to spStockItems_UpdateStatus
    stockItems[index].stockStatus = 'Deleted';
    saveToStorage(STORAGE_KEYS.STOCK, stockItems);
  },

  async restoreStockItem(id: number): Promise<void> {
    await delay();
    const index = stockItems.findIndex((item) => item.id === id);
    if (index === -1) throw new Error('Stock item not found');

    stockItems[index].stockStatus = 'stored';
    saveToStorage(STORAGE_KEYS.STOCK, stockItems);
  },

  async batchUpdatePrice(category: string, details: string, newPrice: number): Promise<number> {
    await delay();
    let updatedCount = 0;
    stockItems = stockItems.map((item) => {
      const matchCategory = !category || category === 'All Stocks' || item.stockName.toLowerCase() === category.toLowerCase();
      const matchDetails = !details || item.stockDetails.toLowerCase().includes(details.toLowerCase());
      if (matchCategory && matchDetails && item.stockStatus === 'stored') {
        updatedCount++;
        return { ...item, stockPrice: newPrice };
      }
      return item;
    });
    saveToStorage(STORAGE_KEYS.STOCK, stockItems);
    return updatedCount;
  }
};

// ==========================================
// POS & SALES ORDER SERVICES
// ==========================================
export const salesService = {
  async getOrders(options?: {
    startDate?: string;
    endDate?: string;
    serial?: string;
    customerId?: number;
    paymentTier?: PaymentMethodType;
  }): Promise<Order[]> {
    await delay();
    let result = [...orders];

    if (options?.customerId) {
      result = result.filter((o) => o.customerId === options.customerId);
    }

    if (options?.paymentTier) {
      result = result.filter((o) => o.paymentTier === options.paymentTier);
    }

    if (options?.startDate) {
      const start = new Date(options.startDate).getTime();
      result = result.filter((o) => new Date(o.orderDate).getTime() >= start);
    }

    if (options?.endDate) {
      const end = new Date(options.endDate).setHours(23, 59, 59, 999);
      result = result.filter((o) => new Date(o.orderDate).getTime() <= end);
    }

    if (options?.serial) {
      const s = options.serial.toLowerCase().trim();
      result = result.filter((o) => o.listOfSerials.toLowerCase().includes(s));
    }

    return result.map((order) => {
      const serialList = order.listOfSerials.split(',').map((x) => x.trim().toLowerCase());
      const matchedItems = stockItems.filter((item) =>
        serialList.includes(item.stockSerial.toLowerCase())
      );
      return { ...order, items: matchedItems };
    });
  },

  async createOrder(data: {
    customerId: number;
    paymentTier: PaymentMethodType;
    remarks: string;
    encoder: string;
    computerName?: string;
    amountTendered?: number;
    changeDue?: number;
    discountPercent?: number;
    items: StockItem[];
  }): Promise<Order> {
    await delay();
    syncStateFromStorage();
    const customer = customers.find((c) => c.id === data.customerId);
    if (!customer) throw new Error('Customer profile not found');
    if (data.items.length === 0) throw new Error('Transaction cart cannot be empty');

    let baseSum = data.items.reduce((acc, item) => acc + item.stockPrice, 0);

    // Apply optional promotional discount
    if (data.discountPercent && data.discountPercent > 0) {
      baseSum = baseSum * (1 - data.discountPercent / 100);
    }

    let multiplier = 1.0;
    let paymentMethodName = 'Cash Settlement';

    if (data.paymentTier === '3months') {
      multiplier = 1.04;
      paymentMethodName = '3-Month Deferred Plan / Credit Card (4% MDR)';
    } else if (data.paymentTier === '12months') {
      multiplier = 1.15;
      paymentMethodName = '12-Month Financing Plan (15% Financing Premium)';
    }

    const orderTotal = Math.round(baseSum * multiplier * 100) / 100;
    const newOrderId = 1000 + orders.length + 1;
    const serialList = data.items.map((i) => i.stockSerial).join(',');

    const newOrder: Order = {
      id: newOrderId,
      customerId: data.customerId,
      customerName: customer.fullName,
      customerCompany: customer.company,
      customerContact: customer.contactNumber,
      customerAddress: customer.address,
      remarks: data.remarks || 'Standard commercial sales transaction',
      paymentMethod: paymentMethodName,
      paymentTier: data.paymentTier,
      orderAmount: orderTotal,
      amountTendered: data.amountTendered,
      changeDue: data.changeDue,
      discountPercent: data.discountPercent,
      orderDate: new Date().toISOString(),
      encoder: data.encoder || 'Kyle (Admin)',
      computerName: data.computerName || 'POS-TERMINAL-01',
      listOfSerials: serialList,
      items: data.items
    };

    // Liquidate items
    const itemIds = new Set(data.items.map((i) => i.id));
    stockItems = stockItems.map((item) => {
      if (itemIds.has(item.id)) {
        return {
          ...item,
          stockStatus: 'sold',
          orderId: newOrderId
        };
      }
      return item;
    });

    // Auto-create installment plan if financed
    if (data.paymentTier === '3months' || data.paymentTier === '12months') {
      const termMonths = data.paymentTier === '3months' ? 3 : 12;
      const monthlyDue = Math.round((orderTotal / termMonths) * 100) / 100;
      const nextDate = new Date();
      nextDate.setMonth(nextDate.getMonth() + 1);

      const plan: InstallmentPlan = {
        id: `INS-${new Date().getFullYear()}-${String(installmentPlans.length + 1).padStart(3, '0')}`,
        orderId: newOrderId,
        customerName: customer.fullName,
        totalPrincipal: orderTotal,
        termMonths: termMonths as 3 | 12,
        monthlyAmortization: monthlyDue,
        paidMonths: 0,
        totalMonths: termMonths,
        remainingBalance: orderTotal,
        nextDueDate: nextDate.toISOString().split('T')[0],
        status: 'Current',
        paymentHistory: []
      };
      installmentPlans.unshift(plan);
      saveToStorage(STORAGE_KEYS.INSTALLMENTS, installmentPlans);
    }

    orders.unshift(newOrder);
    saveToStorage(STORAGE_KEYS.ORDERS, orders);
    saveToStorage(STORAGE_KEYS.STOCK, stockItems);

    return newOrder;
  },

  calculateWarranty(item: StockItem, order: Order): WarrantyCalculation {
    const orderTime = new Date(order.orderDate).getTime();
    const nowTime = Date.now();
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysPassed = Math.floor((nowTime - orderTime) / msPerDay);
    const warrantyDays = item.warranty || 0;
    const isCovered = daysPassed <= warrantyDays;
    const daysRemaining = Math.max(0, warrantyDays - daysPassed);

    return {
      isCovered,
      daysPassed,
      daysRemaining,
      warrantyDays
    };
  }
};

// ==========================================
// CUSTOMER CRM SERVICES
// ==========================================
export const customerService = {
  async getCustomers(search?: string): Promise<Customer[]> {
    await delay();
    let result = [...customers];

    if (search) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.fullName.toLowerCase().includes(q) ||
          c.company.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.contactNumber.toLowerCase().includes(q) ||
          c.address.toLowerCase().includes(q)
      );
    }

    // Enrich with order history aggregates
    return result.map((c) => {
      const custOrders = orders.filter((o) => o.customerId === c.id);
      const lifetimeSpend = custOrders.reduce((acc, o) => acc + o.orderAmount, 0);
      return {
        ...c,
        totalOrdersCount: custOrders.length,
        lifetimeSpend
      };
    });
  },

  async addCustomer(customer: Omit<Customer, 'id' | 'fullName' | 'createdAt'>): Promise<Customer> {
    await delay();
    const newCustomer: Customer = {
      ...customer,
      id: Date.now(),
      fullName: `${customer.firstName} ${customer.lastName}`.trim(),
      createdAt: new Date().toISOString().split('T')[0],
      totalOrdersCount: 0,
      lifetimeSpend: 0
    };

    customers.unshift(newCustomer);
    saveToStorage(STORAGE_KEYS.CUSTOMERS, customers);
    return newCustomer;
  },

  async updateCustomer(id: number, updates: Partial<Customer>): Promise<Customer> {
    await delay();
    const index = customers.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Customer record not found');

    const updated = {
      ...customers[index],
      ...updates,
      fullName:
        updates.firstName || updates.lastName
          ? `${updates.firstName || customers[index].firstName} ${updates.lastName || customers[index].lastName}`.trim()
          : customers[index].fullName
    };

    customers[index] = updated;
    saveToStorage(STORAGE_KEYS.CUSTOMERS, customers);
    return updated;
  }
};

// ==========================================
// VENDOR / SUPPLIER SERVICES
// ==========================================
export const supplierService = {
  async getSuppliers(): Promise<Supplier[]> {
    await delay();
    return suppliers.map((s) => ({
      ...s,
      activeStockUnits: stockItems.filter(
        (i) => i.supplierName.toLowerCase() === s.supplierName.toLowerCase() && i.stockStatus === 'stored'
      ).length
    }));
  },

  async addSupplier(supplier: Omit<Supplier, 'id'>): Promise<Supplier> {
    await delay();
    const newSupplier: Supplier = {
      ...supplier,
      id: Date.now(),
      activeStockUnits: 0
    };
    suppliers.push(newSupplier);
    saveToStorage(STORAGE_KEYS.SUPPLIERS, suppliers);
    return newSupplier;
  }
};

// ==========================================
// COMMERCIAL QUOTATION SERVICES
// ==========================================
export const quotationService = {
  async getQuotations(): Promise<QuotationHeader[]> {
    await delay();
    return [...quotations];
  },

  async createQuotation(data: {
    customerId: number;
    remarks: string;
    encoder: string;
    items: Array<{
      stockName: string;
      stockDetails: string;
      quantity: number;
      stockPrice: number;
    }>;
  }): Promise<QuotationHeader> {
    await delay();
    const customer = customers.find((c) => c.id === data.customerId);
    const subtotal = data.items.reduce((acc, i) => acc + i.stockPrice * i.quantity, 0);

    const newQuote: QuotationHeader = {
      quotationId: 5000 + quotations.length + 1,
      customerId: data.customerId,
      customerName: customer?.fullName || 'Commercial Client',
      remarks: data.remarks || 'Standard price quotation valid for 7 days',
      payMethod3: subtotal, // Spot cash
      payMethod2: Math.round(subtotal * 1.04 * 100) / 100, // 3-month
      payMethod1: Math.round(subtotal * 1.15 * 100) / 100, // 12-month
      quotationDate: new Date().toISOString(),
      quotationStatus: 'Pending',
      computerName: 'POS-TERMINAL-01',
      encoder: data.encoder || 'Kyle (Admin)',
      items: data.items.map((item, idx) => ({
        id: idx + 1,
        stockName: item.stockName,
        stockDetails: item.stockDetails,
        quantity: item.quantity,
        stockPrice: item.stockPrice,
        subTotal: item.stockPrice * item.quantity
      }))
    };

    quotations.unshift(newQuote);
    saveToStorage(STORAGE_KEYS.QUOTATIONS, quotations);
    return newQuote;
  }
};

// ==========================================
// RMA & WARRANTY CLAIM SERVICES
// ==========================================
export const rmaService = {
  async getTickets(): Promise<RMATicket[]> {
    await delay();
    return [...rmaTickets];
  },

  async createTicket(ticket: Omit<RMATicket, 'id' | 'dateFiled'>): Promise<RMATicket> {
    await delay();
    const newTicket: RMATicket = {
      ...ticket,
      id: `RMA-${new Date().getFullYear()}-${String(rmaTickets.length + 1).padStart(3, '0')}`,
      dateFiled: new Date().toISOString()
    };
    rmaTickets.unshift(newTicket);
    saveToStorage(STORAGE_KEYS.RMA, rmaTickets);
    return newTicket;
  },

  async updateTicketStatus(
    id: string,
    status: RMATicket['status'],
    technicianNotes?: string,
    replacementSerial?: string
  ): Promise<RMATicket> {
    await delay();
    const idx = rmaTickets.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error('RMA Ticket not found');

    rmaTickets[idx] = {
      ...rmaTickets[idx],
      status,
      technicianNotes: technicianNotes || rmaTickets[idx].technicianNotes,
      replacementSerial: replacementSerial || rmaTickets[idx].replacementSerial
    };
    saveToStorage(STORAGE_KEYS.RMA, rmaTickets);
    return rmaTickets[idx];
  }
};

// ==========================================
// INSTALLMENT ACCOUNTS RECEIVABLE SERVICES
// ==========================================
export const installmentService = {
  async getPlans(): Promise<InstallmentPlan[]> {
    await delay();
    return [...installmentPlans];
  },

  async recordPayment(
    planId: string,
    amount: number,
    referenceNumber: string,
    cashier: string
  ): Promise<InstallmentPlan> {
    await delay();
    const idx = installmentPlans.findIndex((p) => p.id === planId);
    if (idx === -1) throw new Error('Installment plan not found');

    const plan = installmentPlans[idx];
    const newPaidMonths = Math.min(plan.totalMonths, plan.paidMonths + 1);
    const newRemainingBalance = Math.max(0, plan.remainingBalance - amount);

    const log = {
      id: `PAY-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().split('T')[0],
      amountPaid: amount,
      referenceNumber,
      cashier
    };

    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + 1);

    installmentPlans[idx] = {
      ...plan,
      paidMonths: newPaidMonths,
      remainingBalance: newRemainingBalance,
      nextDueDate: newRemainingBalance === 0 ? 'Fully Settled' : nextDate.toISOString().split('T')[0],
      status: newRemainingBalance === 0 ? 'Settled' : 'Current',
      paymentHistory: [log, ...plan.paymentHistory]
    };

    saveToStorage(STORAGE_KEYS.INSTALLMENTS, installmentPlans);
    return installmentPlans[idx];
  }
};
