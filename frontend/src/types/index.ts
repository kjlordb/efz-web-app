export type StockStatus = 'stored' | 'updated' | 'sold' | 'Sold' | 'Deleted' | string;

/**
 * Serialized Inventory & Asset Unit
 * Reflects physical hardware components tracked individually by barcode serial.
 */
export interface StockItem {
  id: number;
  stockSerial: string; // Unique Manufacturer / System Serial Number
  stockName: string; // Category: Graphics Card, Processor, RAM, etc.
  stockDetails: string; // Product Title & Specifications
  stockStatus: StockStatus;
  stockPrice: number; // Suggested Retail Price (SRP) / Selling Price
  suppliersPrice: number; // Cost of Goods Sold (COGS) / Acquisition Cost
  supplierName: string; // Authorized Distributor / Vendor
  warranty: number; // Manufacturer/Store Warranty Duration in Days
  inDate: string; // Goods Inward Receiving Date (ISO)
  encoder?: string; // Receiving Associate
  orderId?: string | number | null; // Associated Sales Invoice # once liquidated
  remarks?: string;
}

export type PaymentMethodType = 'Cash' | '3months' | '12months';

/**
 * Commercial Sales Order & Tax Invoice
 */
export interface Order {
  id: number; // Invoice / Official Receipt Number
  customerId: number;
  customerName?: string;
  customerCompany?: string;
  customerContact?: string;
  customerAddress?: string;
  remarks: string;
  paymentMethod: string; // Descriptive commercial payment label
  paymentTier: PaymentMethodType;
  orderAmount: number; // Total Net Payable
  amountTendered?: number; // Cash or card tender amount
  changeDue?: number; // Change returned to client
  discountPercent?: number; // Promotional discount percentage
  orderDate: string; // Execution Timestamp (ISO)
  encoder: string; // Sales Specialist / Cashier
  computerName: string; // Terminal Workstation ID
  listOfSerials: string; // Comma-delimited serialized units liquidated
  items?: StockItem[];
}

/**
 * Customer / Commercial Account CRM
 */
export interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  company: string;
  address: string;
  email: string;
  contactNumber: string;
  remarks?: string;
  createdAt?: string;
  totalOrdersCount?: number;
  lifetimeSpend?: number;
}

/**
 * Vendor / Authorized Distributor
 */
export interface Supplier {
  id: number;
  supplierName: string;
  supplierAddress: string;
  supplierEmail: string;
  supplierContact: string;
  activeStockUnits?: number;
}

/**
 * Product Master Catalog Template
 */
export interface MasterItemDetail {
  id: number;
  stockName: string;
  itemBrand: string;
  itemColor: string;
  itemSize: string;
  fullItemDetails: string;
}

/**
 * Staged Point of Sale Line Item
 */
export interface CartItem {
  id: number;
  stockItemId: number;
  stockSerial: string;
  stockName: string;
  stockDetails: string;
  stockPrice: number;
  supplierName: string;
  warranty: number;
}

/**
 * Pro-Forma Quotation Header
 */
export interface QuotationHeader {
  quotationId: number;
  customerId: number;
  customerName?: string;
  remarks: string;
  payMethod1: number; // 12-Month Financing Tier (1.15x)
  payMethod2: number; // 3-Month Deferred Tier (1.04x)
  payMethod3: number; // Spot Cash Price (1.00x)
  quotationDate: string;
  quotationStatus: 'Pending' | 'Approved' | 'Converted to Order' | 'Expired';
  computerName: string;
  encoder: string;
  items: QuotationDetailItem[];
}

export interface QuotationDetailItem {
  id?: number;
  quotationId?: number;
  stockName: string;
  stockDetails: string;
  supplierName?: string;
  quantity: number;
  stockPrice: number;
  subTotal: number;
}

export interface WarrantyCalculation {
  isCovered: boolean;
  daysPassed: number;
  daysRemaining: number;
  warrantyDays: number;
}

/**
 * Return Merchandise Authorization (RMA) & Defect Ticket
 */
export type RMAStatus =
  | 'Pending Inspection'
  | 'In Distributor Diagnostic'
  | 'Replacement Inbound'
  | 'Replacement Ready'
  | 'Resolved & Released';

export interface RMATicket {
  id: string; // e.g. RMA-2024-001
  serialNumber: string;
  itemName: string;
  customerName: string;
  orderId: number;
  supplierName: string;
  reportedDefect: string;
  dateFiled: string;
  status: RMAStatus;
  warrantyValid: boolean;
  replacementSerial?: string;
  technicianNotes?: string;
}

/**
 * Installment Accounts Receivable & Amortization
 */
export interface InstallmentPaymentLog {
  id: string;
  date: string;
  amountPaid: number;
  referenceNumber: string;
  cashier: string;
}

export interface InstallmentPlan {
  id: string; // e.g. INS-2024-001
  orderId: number;
  customerName: string;
  totalPrincipal: number;
  termMonths: 3 | 12;
  monthlyAmortization: number;
  paidMonths: number;
  totalMonths: number;
  remainingBalance: number;
  nextDueDate: string;
  status: 'Current' | 'Settled' | 'Delinquent';
  paymentHistory: InstallmentPaymentLog[];
}
