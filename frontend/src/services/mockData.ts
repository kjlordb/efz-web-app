import { Customer, MasterItemDetail, Order, QuotationHeader, StockItem, Supplier } from '../types';

export const CATEGORIES = [
  "Graphics Card",
  "Processor",
  "Motherboard",
  "RAM",
  "SSD",
  "HDD",
  "Power Supply",
  "Case",
  "Monitor",
  "Gaming Chair",
  "Headset",
  "Keyboard",
  "Mouse",
  "Laptop",
  "Router",
  "Accessories"
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 1,
    supplierName: "TechSource Distribution Corp",
    supplierAddress: "88 Shaw Blvd, Mandaluyong City, Metro Manila",
    supplierEmail: "sales@techsource.ph",
    supplierContact: "0917-123-4567"
  },
  {
    id: 2,
    supplierName: "MicroPoint Hardware Hub",
    supplierAddress: "Unit 402 Gilmore IT Center, Quezon City",
    supplierEmail: "orders@micropoint.com.ph",
    supplierContact: "0918-987-6543"
  },
  {
    id: 3,
    supplierName: "Nexus Digital Components",
    supplierAddress: "Building C, FTI Complex, Taguig City",
    supplierEmail: "inquiry@nexusdigital.ph",
    supplierContact: "0920-555-8899"
  },
  {
    id: 4,
    supplierName: "Alpha Gaming Imports Inc",
    supplierAddress: "123 Binondo St., Manila",
    supplierEmail: "alphagaming@gmail.com",
    supplierContact: "0922-333-1122"
  },
  {
    id: 5,
    supplierName: "Quantum Peripheral Solutions",
    supplierAddress: "Ortigas Center, Pasig City",
    supplierEmail: "support@quantumph.net",
    supplierContact: "0927-444-7711"
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 1,
    firstName: "Gabriel",
    lastName: "Santos",
    fullName: "Gabriel Santos",
    company: "PixelForge Studios Inc.",
    address: "Unit 1204 One San Miguel Bldg, Ortigas Center, Pasig",
    email: "gsantos@pixelforge.com",
    contactNumber: "0917-889-1122",
    createdAt: "2024-01-15"
  },
  {
    id: 2,
    firstName: "Maria Clara",
    lastName: "Reyes",
    fullName: "Maria Clara Reyes",
    company: "InnovaTech Solutions",
    address: "24B Makati Avenue, Bel-Air, Makati City",
    email: "mcreyes@innovatech.ph",
    contactNumber: "0918-223-9988",
    createdAt: "2024-02-10"
  },
  {
    id: 3,
    firstName: "Christian",
    lastName: "Bautista",
    fullName: "Christian Bautista",
    company: "Freelance Architecture",
    address: "Block 8 Lot 14, Ayala Alabang Village, Muntinlupa",
    email: "arch.bautista@gmail.com",
    contactNumber: "0919-445-6677",
    createdAt: "2024-03-20"
  },
  {
    id: 4,
    firstName: "Angela",
    lastName: "Dizon",
    fullName: "Angela Dizon",
    company: "Apex Esports Arena",
    address: "5th Ave corner Rizal Dr., BGC, Taguig City",
    email: "management@apexesports.ph",
    contactNumber: "0922-777-3344",
    createdAt: "2024-04-05"
  },
  {
    id: 5,
    firstName: "Ramon",
    lastName: "Tan",
    fullName: "Ramon Tan",
    company: "RT General Merchandise",
    address: "744 Ongpin St., Binondo, Manila",
    email: "rtangm@yahoo.com",
    contactNumber: "0917-333-8899",
    createdAt: "2024-05-18"
  }
];

export const INITIAL_MASTER_ITEMS: MasterItemDetail[] = [
  {
    id: 1,
    stockName: "Graphics Card",
    itemBrand: "ASUS",
    itemColor: "Black",
    itemSize: "Triple Fan",
    fullItemDetails: "ASUS TUF Gaming GeForce RTX 4070 SUPER OC Edition 12GB GDDR6X"
  },
  {
    id: 2,
    stockName: "Graphics Card",
    itemBrand: "Gigabyte",
    itemColor: "White",
    itemSize: "Triple Fan",
    fullItemDetails: "Gigabyte GeForce RTX 4060 Ti Aero OC 8GB GDDR6"
  },
  {
    id: 3,
    stockName: "Processor",
    itemBrand: "Intel",
    itemColor: "Silver/Blue",
    itemSize: "LGA1700",
    fullItemDetails: "Intel Core i7-14700K 20-Core (8P+12E) Up to 5.6GHz Desktop Processor"
  },
  {
    id: 4,
    stockName: "Processor",
    itemBrand: "AMD",
    itemColor: "Silver/Black",
    itemSize: "AM5",
    fullItemDetails: "AMD Ryzen 7 7800X3D 8-Core 16-Thread Gaming Processor"
  },
  {
    id: 5,
    stockName: "Motherboard",
    itemBrand: "MSI",
    itemColor: "Black",
    itemSize: "ATX",
    fullItemDetails: "MSI MAG B650 TOMAHAWK WIFI AM5 DDR5 ATX Motherboard"
  },
  {
    id: 6,
    stockName: "RAM",
    itemBrand: "Corsair",
    itemColor: "Black RGB",
    itemSize: "32GB (2x16GB)",
    fullItemDetails: "Corsair Vengeance RGB 32GB (2x16GB) DDR5 6000MHz CL30"
  },
  {
    id: 7,
    stockName: "SSD",
    itemBrand: "Samsung",
    itemColor: "Black",
    itemSize: "2TB",
    fullItemDetails: "Samsung 990 PRO 2TB PCIe 4.0 NVMe M.2 Internal SSD"
  },
  {
    id: 8,
    stockName: "Power Supply",
    itemBrand: "Seasonic",
    itemColor: "Black",
    itemSize: "850W",
    fullItemDetails: "Seasonic Focus GX-850 850W 80+ Gold Full Modular ATX Power Supply"
  },
  {
    id: 9,
    stockName: "Monitor",
    itemBrand: "ASUS",
    itemColor: "Black",
    itemSize: "27-Inch",
    fullItemDetails: "ASUS ROG Swift OLED PG27AQDM 27-inch QHD 240Hz 0.03ms Gaming Monitor"
  },
  {
    id: 10,
    stockName: "Case",
    itemBrand: "Lian Li",
    itemColor: "White",
    itemSize: "Mid-Tower",
    fullItemDetails: "Lian Li O11 Vision Dual-Chamber Tempered Glass Mid-Tower Case"
  }
];

export const INITIAL_STOCK_ITEMS: StockItem[] = [
  {
    id: 101,
    stockSerial: "SN-GPU-4070-001",
    stockName: "Graphics Card",
    stockDetails: "ASUS TUF Gaming GeForce RTX 4070 SUPER OC Edition 12GB GDDR6X",
    stockStatus: "stored",
    stockPrice: 42500,
    suppliersPrice: 37500,
    supplierName: "TechSource Distribution Corp",
    warranty: 730, // 2 years
    inDate: "2024-09-01",
    remarks: "Brand new stock batch A1"
  },
  {
    id: 102,
    stockSerial: "SN-GPU-4070-002",
    stockName: "Graphics Card",
    stockDetails: "ASUS TUF Gaming GeForce RTX 4070 SUPER OC Edition 12GB GDDR6X",
    stockStatus: "stored",
    stockPrice: 42500,
    suppliersPrice: 37500,
    supplierName: "TechSource Distribution Corp",
    warranty: 730,
    inDate: "2024-09-01",
    remarks: "Brand new stock batch A1"
  },
  {
    id: 103,
    stockSerial: "SN-GPU-4060-101",
    stockName: "Graphics Card",
    stockDetails: "Gigabyte GeForce RTX 4060 Ti Aero OC 8GB GDDR6",
    stockStatus: "stored",
    stockPrice: 28500,
    suppliersPrice: 24800,
    supplierName: "MicroPoint Hardware Hub",
    warranty: 730,
    inDate: "2024-08-20"
  },
  {
    id: 104,
    stockSerial: "SN-CPU-14700-001",
    stockName: "Processor",
    stockDetails: "Intel Core i7-14700K 20-Core (8P+12E) Up to 5.6GHz Desktop Processor",
    stockStatus: "stored",
    stockPrice: 26900,
    suppliersPrice: 23500,
    supplierName: "Nexus Digital Components",
    warranty: 365, // 1 year
    inDate: "2024-08-25"
  },
  {
    id: 105,
    stockSerial: "SN-CPU-7800X3D-001",
    stockName: "Processor",
    stockDetails: "AMD Ryzen 7 7800X3D 8-Core 16-Thread Gaming Processor",
    stockStatus: "stored",
    stockPrice: 25950,
    suppliersPrice: 22800,
    supplierName: "Nexus Digital Components",
    warranty: 365,
    inDate: "2024-08-28"
  },
  {
    id: 106,
    stockSerial: "SN-RAM-DDR5-32-01",
    stockName: "RAM",
    stockDetails: "Corsair Vengeance RGB 32GB (2x16GB) DDR5 6000MHz CL30",
    stockStatus: "stored",
    stockPrice: 8450,
    suppliersPrice: 6900,
    supplierName: "Alpha Gaming Imports Inc",
    warranty: 365,
    inDate: "2024-08-15"
  },
  {
    id: 107,
    stockSerial: "SN-RAM-DDR5-32-02",
    stockName: "RAM",
    stockDetails: "Corsair Vengeance RGB 32GB (2x16GB) DDR5 6000MHz CL30",
    stockStatus: "stored",
    stockPrice: 8450,
    suppliersPrice: 6900,
    supplierName: "Alpha Gaming Imports Inc",
    warranty: 365,
    inDate: "2024-08-15"
  },
  {
    id: 108,
    stockSerial: "SN-SSD-990PRO-2TB-01",
    stockName: "SSD",
    stockDetails: "Samsung 990 PRO 2TB PCIe 4.0 NVMe M.2 Internal SSD",
    stockStatus: "stored",
    stockPrice: 11800,
    suppliersPrice: 9900,
    supplierName: "TechSource Distribution Corp",
    warranty: 730,
    inDate: "2024-09-02"
  },
  {
    id: 109,
    stockSerial: "SN-PSU-SS850-01",
    stockName: "Power Supply",
    stockDetails: "Seasonic Focus GX-850 850W 80+ Gold Full Modular ATX Power Supply",
    stockStatus: "stored",
    stockPrice: 7950,
    suppliersPrice: 6600,
    supplierName: "Quantum Peripheral Solutions",
    warranty: 730,
    inDate: "2024-08-10"
  },
  {
    id: 110,
    stockSerial: "SN-CASE-LIANLI-01",
    stockName: "Case",
    stockDetails: "Lian Li O11 Vision Dual-Chamber Tempered Glass Mid-Tower Case",
    stockStatus: "stored",
    stockPrice: 8900,
    suppliersPrice: 7200,
    supplierName: "Alpha Gaming Imports Inc",
    warranty: 365,
    inDate: "2024-08-05"
  },
  // Items that were sold recently (Covered by Warranty)
  {
    id: 201,
    stockSerial: "SN-GPU-4070-SOLD1",
    stockName: "Graphics Card",
    stockDetails: "ASUS TUF Gaming GeForce RTX 4070 SUPER OC Edition 12GB GDDR6X",
    stockStatus: "sold",
    stockPrice: 42500,
    suppliersPrice: 37500,
    supplierName: "TechSource Distribution Corp",
    warranty: 730,
    inDate: "2024-07-01",
    orderId: 1001
  },
  {
    id: 202,
    stockSerial: "SN-CPU-7800X3D-SOLD1",
    stockName: "Processor",
    stockDetails: "AMD Ryzen 7 7800X3D 8-Core 16-Thread Gaming Processor",
    stockStatus: "sold",
    stockPrice: 25950,
    suppliersPrice: 22800,
    supplierName: "Nexus Digital Components",
    warranty: 365,
    inDate: "2024-07-01",
    orderId: 1001
  },
  // Item sold long ago (Warranty Expired to showcase testing!)
  {
    id: 203,
    stockSerial: "SN-SSD-980-EXPIRED",
    stockName: "SSD",
    stockDetails: "Samsung 980 500GB PCIe 3.0 NVMe SSD",
    stockStatus: "sold",
    stockPrice: 3500,
    suppliersPrice: 2700,
    supplierName: "TechSource Distribution Corp",
    warranty: 30, // 30-day warranty, sold months ago -> definitely expired
    inDate: "2023-05-10",
    orderId: 1002
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 1001,
    customerId: 1,
    customerName: "Gabriel Santos",
    customerCompany: "PixelForge Studios Inc.",
    customerContact: "0917-889-1122",
    customerAddress: "Unit 1204 One San Miguel Bldg, Ortigas Center, Pasig",
    remarks: "Studio workstation upgrade package",
    paymentMethod: "Cash",
    paymentTier: "Cash",
    orderAmount: 68450,
    orderDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago (Covered!)
    encoder: "Kyle (Admin)",
    computerName: "POS-TERMINAL-01",
    listOfSerials: "SN-GPU-4070-SOLD1,SN-CPU-7800X3D-SOLD1"
  },
  {
    id: 1002,
    customerId: 2,
    customerName: "Maria Clara Reyes",
    customerCompany: "InnovaTech Solutions",
    customerContact: "0918-223-9988",
    customerAddress: "24B Makati Avenue, Bel-Air, Makati City",
    remarks: "Office backup drive replacement",
    paymentMethod: "3 Months 0% Interest or Straight Credit Card",
    paymentTier: "3months",
    orderAmount: 3640,
    orderDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(), // 180 days ago (Expired for 30-day item!)
    encoder: "Cashier-02",
    computerName: "POS-TERMINAL-02",
    listOfSerials: "SN-SSD-980-EXPIRED"
  }
];

export const INITIAL_QUOTATIONS: QuotationHeader[] = [
  {
    quotationId: 5001,
    customerId: 3,
    customerName: "Christian Bautista",
    remarks: "Architectural 3D Rendering System configuration",
    payMethod1: 135700, // 12-month tier
    payMethod2: 122720, // 3-month tier
    payMethod3: 118000, // Cash tier
    quotationDate: new Date().toISOString(),
    quotationStatus: "Pending",
    computerName: "POS-TERMINAL-01",
    encoder: "Kyle (Admin)",
    items: [
      {
        id: 1,
        stockName: "Graphics Card",
        stockDetails: "ASUS TUF Gaming GeForce RTX 4070 SUPER OC Edition 12GB GDDR6X",
        quantity: 1,
        stockPrice: 42500,
        subTotal: 42500
      },
      {
        id: 2,
        stockName: "Processor",
        stockDetails: "Intel Core i7-14700K 20-Core Desktop Processor",
        quantity: 1,
        stockPrice: 26900,
        subTotal: 26900
      },
      {
        id: 3,
        stockName: "RAM",
        stockDetails: "Corsair Vengeance RGB 32GB (2x16GB) DDR5 6000MHz CL30",
        quantity: 2,
        stockPrice: 8450,
        subTotal: 16900
      },
      {
        id: 4,
        stockName: "SSD",
        stockDetails: "Samsung 990 PRO 2TB PCIe 4.0 NVMe M.2 Internal SSD",
        quantity: 1,
        stockPrice: 11800,
        subTotal: 11800
      },
      {
        id: 5,
        stockName: "Monitor",
        stockDetails: "ASUS ROG Swift OLED PG27AQDM 27-inch QHD 240Hz",
        quantity: 1,
        stockPrice: 19900,
        subTotal: 19900
      }
    ]
  }
];

export const INITIAL_RMA_TICKETS: import('../types').RMATicket[] = [
  {
    id: 'RMA-2024-001',
    serialNumber: 'SN-GPU-4070-SOLD1',
    itemName: 'ASUS TUF Gaming GeForce RTX 4070 SUPER OC Edition 12GB GDDR6X',
    customerName: 'Gabriel Santos',
    orderId: 1001,
    supplierName: 'TechSource Distribution Corp',
    reportedDefect: 'DisplayPort 2 output intermittent blackout during rendering workloads',
    dateFiled: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'In Distributor Diagnostic',
    warrantyValid: true,
    technicianNotes: 'Diagnostic ticket #TS-88912 dispatched to TechSource RMA center.'
  },
  {
    id: 'RMA-2024-002',
    serialNumber: 'SN-SSD-980-EXPIRED',
    itemName: 'Samsung 980 500GB PCIe 3.0 NVMe SSD',
    customerName: 'Maria Clara Reyes',
    orderId: 1002,
    supplierName: 'TechSource Distribution Corp',
    reportedDefect: 'SMART error detected, bad sectors',
    dateFiled: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Resolved & Released',
    warrantyValid: false,
    technicianNotes: 'Warranty expired; client opted for out-of-warranty paid drive upgrade.'
  }
];

export const INITIAL_INSTALLMENT_PLANS: import('../types').InstallmentPlan[] = [
  {
    id: 'INS-2024-001',
    orderId: 1001,
    customerName: 'Gabriel Santos',
    totalPrincipal: 78717.50,
    termMonths: 12,
    monthlyAmortization: 6559.79,
    paidMonths: 4,
    totalMonths: 12,
    remainingBalance: 52478.34,
    nextDueDate: '2024-10-15',
    status: 'Current',
    paymentHistory: [
      { id: 'PAY-01', date: '2024-06-15', amountPaid: 6559.79, referenceNumber: 'OR-8921', cashier: 'Kyle (Admin)' },
      { id: 'PAY-02', date: '2024-07-15', amountPaid: 6559.79, referenceNumber: 'OR-9104', cashier: 'Kyle (Admin)' },
      { id: 'PAY-03', date: '2024-08-15', amountPaid: 6559.79, referenceNumber: 'OR-9382', cashier: 'Cashier-02' },
      { id: 'PAY-04', date: '2024-09-15', amountPaid: 6559.79, referenceNumber: 'OR-9551', cashier: 'Kyle (Admin)' }
    ]
  },
  {
    id: 'INS-2024-002',
    orderId: 1002,
    customerName: 'Maria Clara Reyes',
    totalPrincipal: 3785.60,
    termMonths: 3,
    monthlyAmortization: 1261.86,
    paidMonths: 2,
    totalMonths: 3,
    remainingBalance: 1261.88,
    nextDueDate: '2024-10-01',
    status: 'Current',
    paymentHistory: [
      { id: 'PAY-11', date: '2024-08-01', amountPaid: 1261.86, referenceNumber: 'OR-9201', cashier: 'Kyle (Admin)' },
      { id: 'PAY-12', date: '2024-09-01', amountPaid: 1261.86, referenceNumber: 'OR-9440', cashier: 'Cashier-02' }
    ]
  }
];
