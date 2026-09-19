# EFZ Computer Sales - Enterprise Retail POS & Inventory Suite

Modern web front-end application for **EFZ Computer Sales**, modernized and upgraded from the desktop Windows Forms (.NET Framework) `EFZApp` system with professional commercial terminology, financial tracking, and cross-module workflows.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fkjlordb%2Fefz-web-app&teamSlug=kjlordbs-projects)

> **Quick Deploy to Vercel Team:** [Deploy to `kjlordbs-projects`](https://vercel.com/new?teamSlug=kjlordbs-projects)

---

## 🏛️ Business Terminology Enhancements

| Legacy Desktop Term | Enhanced Enterprise Term | Scope & Realization |
| :--- | :--- | :--- |
| `POForm` / `POitem` | **POS Register Terminal** / **Sales Order Checkout** | Reflects commercial retail checkout (rather than confusing with procurement purchase orders). |
| `Encoder` | **Sales Associate / Cashier (Staff ID)** | Professional store representative attribution across all tax invoices. |
| `ComputerName` | **POS Workstation Register ID** | Hardware station tracking (e.g. `POS-TERMINAL-01`). |
| `SuppliersPrice` | **Unit Cost (COGS - Cost of Goods Sold)** | Financial wholesale acquisition cost. |
| `StockPrice` | **SRP (Suggested Retail Price) / List Price** | Selling price with automated gross margin % calculation. |
| `P1 / P2 / P3` | **3-Tier Financing Structure** | • **Tier 3 (1.00x)**: Spot Cash Settlement<br>• **Tier 2 (1.04x)**: 3-Month Deferred / Credit Card (4% MDR)<br>• **Tier 1 (1.15x)**: 12-Month Financing (15% APR) |
| `MultipleChangePrice` | **Bulk Price Revision (Schedule Adjustment)** | Governance tool to revise retail price points across matching hardware lines. |
| `InstallmentSales` | **Installment AR Ledger & Amortization** | Accounts receivable portfolio, monthly maturities, and collection logs. |
| `RMAForm` | **RMA & Distributor Warranty Claims** | Defect triage, turnaround lifecycle, and replacement serial tracking. |

---

## 🚀 Key Functional Modules

1. **Executive Dashboard (`DashboardPage.tsx`)**
   - Live revenue metrics: Gross Sales Revenue, In-Stock Asset Portfolio valuation, Outstanding Accounts Receivable (AR), and Active RMA Claims.
   - Recent commercial tax invoices with warranty badges and category inventory concentration.

2. **POS Register Terminal (`POSPage.tsx`)**
   - Client account lookup with inline customer registration modal.
   - **Barcode / Serial Scanner Input** with instant validation and `[F2]` keyboard shortcut.
   - **Cash Tendering & Change Calculator**: Real-time change due computation.
   - **Promotional Discount %**: Apply custom promotional discounts.
   - **Quick Test-Scan Helper**: Demo serialized liquidation with 1 click.
   - Multi-tier commercial settlement schedule with print-ready official tax invoices.

3. **Serialized Inventory & Asset Master (`InventoryPage.tsx`)**
   - Individual barcode tracking for every component.
   - **Gross Profit Margin %**: Real-time margin computation $((\text{SRP} - \text{COGS}) / \text{SRP} \times 100)\%$.
   - **Export to CSV**: 1-click export of inventory records.
   - Category filtering, spec search, decommission soft-delete, and bulk price adjustments.

4. **Sales Ledger & Warranty Claims Audit (`SalesRecordPage.tsx`)**
   - **Real-Time Warranty Status Engine**:
     - Evaluates $(\text{Today} - \text{OrderDate})$ against warranty duration.
     - **Covered (Green)** with remaining days vs. **Expired (Red)** with elapsed days.
   - **Instant Barcode Lookup**: Test scanning active vs. expired items.
   - **One-Click RMA Claim Initiation**: Directly launch an RMA claim ticket from any sold item.
   - Date range and payment tier filters.
   - CSV export of sales transactions.

5. **Installment Accounts Receivable Suite (`InstallmentSalesPage.tsx`)**
   - Total Financed Portfolio, Collected Principal, and Outstanding Balance monitoring.
   - **Interactive Payment Collection**: Log monthly amortization payments with official receipt reference numbers.
   - Visual progress bars and payment history audit trails.

6. **RMA & Distributor Warranty Claims (`RMAPage.tsx`)**
   - Log customer hardware defects with warranty validation.
   - Track turnaround lifecycle: `Pending Inspection` → `In Distributor Diagnostic` → `Replacement Inbound` → `Replacement Ready` → `Resolved & Released`.
   - Record replacement unit serial numbers and technical notes.

7. **Commercial Quotations (`QuotationPage.tsx`)**
   - Formal quotes with automated 3-tier payment options.
   - Print-ready pro-forma commercial quotation sheet.

8. **Client Accounts (CRM) & Vendor Directory (`CustomersPage.tsx`, `SuppliersPage.tsx`)**
   - Commercial account records with order history aggregation and lifetime spend.

9. **Database Backup Simulation (`BackupModal.tsx`)**
   - Automated routine simulating SQL Server `dbo.DbBackup`.

---

## 🛠️ Segregated Monorepo Architecture

The project is decoupled into clean, dedicated `frontend/` and `backend/` directories with a root npm workspace orchestrator:

```text
efz_web_app/
├── frontend/               # Isolated React 19 + TypeScript + Vite + Tailwind CSS
│   ├── public/             # SVGs, 3D assets, video banners
│   ├── src/                # POS, Admin, Inventory, Customer, Quotation modules
│   ├── index.html          # Frontend HTML entry
│   ├── package.json        # Frontend dependencies & scripts
│   ├── postcss.config.js   # PostCSS configuration
│   ├── tailwind.config.js  # EFZ Midnight + Electric Teal + Champagne Gold theme
│   ├── tsconfig.json       # React / DOM TypeScript configuration
│   ├── tsconfig.node.json  # Vite TypeScript configuration
│   └── vite.config.ts      # Vite config with /api proxy to localhost:5050
├── backend/                # Isolated Node.js + Express + MSSQL API service
│   ├── src/
│   │   ├── routes/         # Modular routes (stock, customers, orders, etc.)
│   │   ├── db.ts           # SQL Server connection pool & query helpers
│   │   └── index.ts        # Express entry point & server bootstrap
│   ├── .env                # Local SQL Server connection credentials
│   ├── .env.example        # Sanitized template for environment variables
│   ├── package.json        # Express, MSSQL, CORS dependencies & scripts
│   └── tsconfig.json       # NodeNext TypeScript configuration
├── .gitignore              # Unified ignore rules (node_modules, .env, dist)
├── package.json            # Root Monorepo Orchestrator (npm workspaces & scripts)
├── README.md               # Project documentation & run guide
└── vercel.json             # Vercel deployment config (outputDirectory: "frontend/dist")
```

---

## 🗄️ SQL Server Database Connection

The backend connects directly to your Microsoft SQL Server instance using `backend/.env`:

```env
DB_SERVER=LAPTOP-N6BLB75S
DB_DATABASE=EFZApp
DB_USER=sa
DB_PASSWORD=12345
DB_PORT=1433
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true
PORT=5050
```

### Verified Live Tables & Procedures:
- `dbo.StockItems` (41,934 units)
- `dbo.OrderItems` (12,718 sales orders)
- `dbo.CustomerDetails` (8,411 customers)
- `dbo.QuotationItemHeader` & `dbo.QuotationItemDetails`
- `dbo.Suppliers` (62 vendors)
- Stored Procedures: `spOrderItems_Insert`, `spStockItems_UpdateSerialStatus`, `spStockItems_Insert`, `spCustomerDetails_Insert`, `DbBackup`

---

## 💻 Running the Application

### From Project Root (Convenience Orchestrator)

```powershell
# 1. Run Front-End and SQL Server Backend Concurrently
npm run dev:all

# 2. Run Backend API Server Only (Port 5050)
npm run server

# 3. Run Front-End Only (Port 3000, proxies /api to port 5050)
npm run dev

# 4. Build Front-End for Production
npm run build
```

### From Subdirectories Directly

```powershell
# Frontend
cd frontend
npm install
npm run dev

# Backend
cd backend
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your web browser.
API Health endpoint: [http://localhost:5050/api/health](http://localhost:5050/api/health).

