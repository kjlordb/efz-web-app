import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOTS_DIR = path.resolve('./presentation_assets/screenshots');
const OUTPUT_PDF = path.resolve('./presentation_assets/EFZ_Computer_Sales_Terminal_Client_Presentation.pdf');
const ARTIFACT_PDF = 'C:\\Users\\kjlor\\.gemini\\antigravity\\brain\\b4b6eca3-5095-42cc-b464-50a9ba51150a\\EFZ_Computer_Sales_Terminal_Client_Presentation.pdf';

function toBase64(fileName) {
  const filePath = path.join(SCREENSHOTS_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return '';
  }
  const fileBuffer = fs.readFileSync(filePath);
  return `data:image/png;base64,${fileBuffer.toString('base64')}`;
}

async function main() {
  console.log('Generating business-focused client presentation deck...');

  // Convert key screenshots to base64
  const imgLogin = toBase64('00_login_terminal.png');
  const imgDashboard = toBase64('01_admin_dashboard.png');
  const imgAdminInv = toBase64('03_admin_inventory.png');
  const imgCashierPos = toBase64('12_cashier_pos_terminal.png');
  const imgCashierQuote = toBase64('14_cashier_quotation_builder.png');
  const imgAdminInst = toBase64('09_admin_installments.png');
  const imgWarehouseAudit = toBase64('16_warehouse_audit_movement.png');
  const imgTechRma = toBase64('18_technician_rma_claims.png');

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>EFZ Computer Sales Terminal - Business Presentation Deck</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #050811;
      color: #E2E8F0;
      -webkit-font-smoothing: antialiased;
    }
    .slide {
      width: 297mm;
      height: 210mm;
      padding: 16mm 20mm;
      position: relative;
      page-break-after: always;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      background: radial-gradient(circle at 85% 15%, rgba(25, 195, 209, 0.08), transparent 45%),
                  radial-gradient(circle at 15% 85%, rgba(216, 168, 62, 0.07), transparent 50%),
                  #070B14;
    }
    .slide:last-child {
      page-break-after: avoid;
    }

    /* Header & Footer */
    .slide-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid rgba(148, 163, 184, 0.12);
      padding-bottom: 10px;
      margin-bottom: 12px;
    }
    .slide-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 10px;
      background: rgba(216, 168, 62, 0.12);
      border: 1px solid rgba(216, 168, 62, 0.3);
      border-radius: 9999px;
      color: #F1C968;
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 4px;
    }
    .slide-badge.cyan {
      background: rgba(25, 195, 209, 0.12);
      border-color: rgba(25, 195, 209, 0.3);
      color: #19C3D1;
    }
    .slide-badge.purple {
      background: rgba(168, 85, 247, 0.12);
      border-color: rgba(168, 85, 247, 0.3);
      color: #C084FC;
    }
    .slide-title {
      font-size: 20px;
      font-weight: 900;
      color: #FFFFFF;
      text-transform: uppercase;
      letter-spacing: -0.02em;
    }
    .slide-subtitle {
      font-size: 11px;
      color: #94A3B8;
      margin-top: 2px;
    }
    .slide-meta-right {
      text-align: right;
      font-size: 10px;
      color: #64748B;
      font-weight: 600;
    }
    .slide-meta-right .highlight {
      color: #19C3D1;
      font-weight: 700;
    }

    .slide-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid rgba(148, 163, 184, 0.12);
      padding-top: 8px;
      font-size: 9px;
      color: #64748B;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    /* Content Area */
    .slide-body {
      flex: 1;
      display: flex;
      gap: 18px;
      align-items: stretch;
      min-height: 0;
    }

    /* Screenshot Container */
    .screenshot-frame {
      flex: 1.4;
      background: #03060C;
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 12px 30px -10px rgba(0, 0, 0, 0.7);
      display: flex;
      flex-direction: column;
    }
    .screenshot-toolbar {
      height: 20px;
      background: #0C121E;
      border-bottom: 1px solid rgba(148, 163, 184, 0.15);
      display: flex;
      align-items: center;
      padding: 0 10px;
      gap: 6px;
    }
    .toolbar-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }
    .dot-red { background: #EF4444; }
    .dot-yellow { background: #F59E0B; }
    .dot-green { background: #10B981; }
    .toolbar-title {
      font-size: 8.5px;
      color: #64748B;
      margin-left: 8px;
      font-family: inherit;
      font-weight: 600;
    }
    .screenshot-img-box {
      flex: 1;
      overflow: hidden;
      background: #080D18;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .screenshot-img-box img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    /* Sidebar Information Cards */
    .info-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 10px;
      justify-content: center;
    }
    .feature-card {
      background: rgba(15, 23, 42, 0.65);
      border: 1px solid rgba(148, 163, 184, 0.12);
      border-radius: 10px;
      padding: 10px 14px;
    }
    .feature-card.gold-border {
      border-left: 3px solid #D8A83E;
    }
    .feature-card.cyan-border {
      border-left: 3px solid #19C3D1;
    }
    .feature-card.purple-border {
      border-left: 3px solid #A855F7;
    }
    .feature-card.green-border {
      border-left: 3px solid #10B981;
    }
    .card-title {
      font-size: 12px;
      font-weight: 800;
      color: #F8FAFC;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .card-desc {
      font-size: 10px;
      color: #94A3B8;
      line-height: 1.45;
    }
    .card-desc strong {
      color: #F1F5F9;
    }

    /* Metrics Grid */
    .metrics-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
    .metric-pill {
      background: rgba(30, 41, 59, 0.5);
      border: 1px solid rgba(148, 163, 184, 0.1);
      border-radius: 8px;
      padding: 7px 8px;
      text-align: center;
    }
    .metric-value {
      font-size: 14px;
      font-weight: 900;
      color: #F1C968;
    }
    .metric-value.cyan { color: #19C3D1; }
    .metric-value.green { color: #34D399; }
    .metric-label {
      font-size: 8px;
      color: #64748B;
      text-transform: uppercase;
      font-weight: 700;
      margin-top: 2px;
    }

    /* COVER SLIDE */
    .cover-slide {
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 0 35mm;
      background: radial-gradient(circle at 50% 35%, rgba(216, 168, 62, 0.14), transparent 60%),
                  radial-gradient(circle at 20% 80%, rgba(25, 195, 209, 0.10), transparent 50%),
                  #070B14;
    }
    .cover-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 18px;
      border-radius: 9999px;
      background: rgba(216, 168, 62, 0.15);
      border: 1px solid rgba(216, 168, 62, 0.4);
      color: #F1C968;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      margin-bottom: 16px;
    }
    .cover-title {
      font-size: 40px;
      font-weight: 900;
      color: #FFFFFF;
      letter-spacing: -0.03em;
      line-height: 1.1;
      text-transform: uppercase;
      margin-bottom: 12px;
    }
    .cover-title span {
      background: linear-gradient(135deg, #F1C968, #D8A83E);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .cover-subtitle {
      font-size: 15px;
      color: #94A3B8;
      max-width: 660px;
      margin: 0 auto 26px auto;
      line-height: 1.5;
    }
    .cover-specs-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      width: 100%;
      max-width: 800px;
      margin-bottom: 24px;
    }
    .cover-spec-card {
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(148, 163, 184, 0.15);
      border-radius: 10px;
      padding: 12px 14px;
      text-align: center;
    }
    .cover-spec-val {
      font-size: 18px;
      font-weight: 900;
      color: #19C3D1;
    }
    .cover-spec-lbl {
      font-size: 9px;
      color: #64748B;
      text-transform: uppercase;
      font-weight: 700;
      margin-top: 3px;
    }
    .cover-meta {
      font-size: 11px;
      color: #64748B;
      font-weight: 600;
      letter-spacing: 0.05em;
    }

    /* WORKFLOW SKETCH SLIDE */
    .flow-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      width: 100%;
      height: 100%;
      align-items: stretch;
    }
    .flow-column {
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(148, 163, 184, 0.15);
      border-radius: 12px;
      padding: 14px 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .flow-header {
      font-size: 12px;
      font-weight: 900;
      color: #FFFFFF;
      text-transform: uppercase;
      display: flex;
      align-items: center;
      gap: 6px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(148, 163, 184, 0.12);
    }
    .flow-card {
      background: #090E1A;
      border: 1px solid rgba(148, 163, 184, 0.1);
      border-radius: 8px;
      padding: 9px 10px;
    }
    .flow-card-title {
      font-size: 11px;
      font-weight: 800;
      color: #19C3D1;
      margin-bottom: 3px;
    }
    .flow-card-desc {
      font-size: 9px;
      color: #94A3B8;
      line-height: 1.4;
    }

    /* MATRIX SLIDE */
    .matrix-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5px;
      margin-top: 4px;
    }
    .matrix-table th {
      background: rgba(30, 41, 59, 0.85);
      color: #F1C968;
      font-weight: 800;
      text-transform: uppercase;
      padding: 8px 12px;
      text-align: left;
      border: 1px solid rgba(148, 163, 184, 0.15);
    }
    .matrix-table td {
      padding: 7.5px 12px;
      border: 1px solid rgba(148, 163, 184, 0.1);
      color: #94A3B8;
    }
    .matrix-table tr:nth-child(even) {
      background: rgba(15, 23, 42, 0.45);
    }
    .matrix-badge {
      display: inline-block;
      padding: 2.5px 8px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 8.5px;
      text-transform: uppercase;
    }
    .badge-grant {
      background: rgba(16, 185, 129, 0.2);
      color: #34D399;
      border: 1px solid rgba(16, 185, 129, 0.4);
    }
    .badge-deny {
      background: rgba(239, 68, 68, 0.2);
      color: #F87171;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }
    .badge-mask {
      background: rgba(245, 158, 11, 0.2);
      color: #FBBF24;
      border: 1px solid rgba(245, 158, 11, 0.4);
    }
  </style>
</head>
<body>

  <!-- SLIDE 1: COVER DECK -->
  <section class="slide cover-slide">
    <div>
      <div class="cover-badge">
        <span>★ Store Operations & Commercial Presentation</span>
      </div>
      <h1 class="cover-title">
        EFZ <span>Computer Sales</span> Terminal
      </h1>
      <p class="cover-subtitle">
        Point of Sale, Serialized Barcode Inventory, Corporate Quotations & Commercial Financing System engineered for retail store efficiency and profit growth.
      </p>

      <div class="cover-specs-grid">
        <div class="cover-spec-card">
          <div class="cover-spec-val">41,934</div>
          <div class="cover-spec-lbl">Tracked Hardware Items</div>
        </div>
        <div class="cover-spec-card">
          <div class="cover-spec-val">₱211.78M</div>
          <div class="cover-spec-lbl">Total Recorded Sales</div>
        </div>
        <div class="cover-spec-card">
          <div class="cover-spec-val">8,411</div>
          <div class="cover-spec-lbl">Customer Accounts</div>
        </div>
        <div class="cover-spec-card">
          <div class="cover-spec-val">4 Clear Roles</div>
          <div class="cover-spec-lbl">Protected Store Clearance</div>
        </div>
      </div>

      <div class="cover-meta">
        Davao City, Philippines • Retail Store Operations Guide • Commercial Edition
      </div>
    </div>
  </section>

  <!-- SLIDE 2: EXECUTIVE SUMMARY & BUSINESS VALUE -->
  <section class="slide">
    <div class="slide-header">
      <div>
        <span class="slide-badge">Executive Overview</span>
        <h2 class="slide-title">How the System Grows Your Business</h2>
        <p class="slide-subtitle">Solving real retail pain points: inventory losses, slow checkout queues, and leaked supplier costs</p>
      </div>
      <div class="slide-meta-right">
        Business Focus: <span class="highlight">Speed & Profit Protection</span><br>
        Store Mode: <span class="highlight">Fully Integrated</span>
      </div>
    </div>

    <div class="slide-body">
      <div class="info-panel" style="flex: 1.2;">
        <div class="feature-card gold-border">
          <div class="card-title">📦 Zero Lost Inventory (Serialized Tracking)</div>
          <div class="card-desc">
            Every motherboard, graphics card, laptop, and accessory is logged with its <strong>exact manufacturer serial barcode</strong>. From delivery to customer checkout, you know exactly which unit was sold to whom, eliminating inventory shrinkage and lost stock.
          </div>
        </div>

        <div class="feature-card cyan-border">
          <div class="card-title">🔒 Confidential Wholesale Pricing</div>
          <div class="card-desc">
            Front-counter cashiers only see the <strong>Retail Selling Price (SRP)</strong>. Your confidential distributor purchase costs and profit margins are kept strictly hidden and visible only to the Store Manager.
          </div>
        </div>

        <div class="feature-card green-border">
          <div class="card-title">💳 Sell More with Flexible Financing Options</div>
          <div class="card-desc">
            Close bigger deals instantly by offering customers <strong>Spot Cash</strong>, <strong>3-Month Credit Card (+4%)</strong>, or <strong>12-Month In-House Installments (+15%)</strong> with automated monthly billing schedules.
          </div>
        </div>
      </div>

      <div class="info-panel" style="flex: 1;">
        <div class="feature-card" style="height: 100%; display: flex; flex-direction: column; justify-content: space-around;">
          <div>
            <div class="card-title" style="color: #F1C968;">📊 Proven Store Scale & Capacity</div>
            <div class="card-desc" style="margin-bottom: 8px;">Real store numbers actively running in the operational database:</div>
          </div>
          <div class="metrics-row">
            <div class="metric-pill">
              <div class="metric-value">41,934</div>
              <div class="metric-label">Products Logged</div>
            </div>
            <div class="metric-pill">
              <div class="metric-value cyan">12,718</div>
              <div class="metric-label">Invoices Finalized</div>
            </div>
            <div class="metric-pill">
              <div class="metric-value green">8,411</div>
              <div class="metric-label">Client Directory</div>
            </div>
          </div>
          <div class="metrics-row">
            <div class="metric-pill">
              <div class="metric-value">62</div>
              <div class="metric-label">Distributor Partners</div>
            </div>
            <div class="metric-pill">
              <div class="metric-value cyan">489</div>
              <div class="metric-label">Corporate Quotes</div>
            </div>
            <div class="metric-pill">
              <div class="metric-value green">100%</div>
              <div class="metric-label">Warranty Audited</div>
            </div>
          </div>
          <div class="card-desc" style="font-size: 8.5px; color: #64748B; text-align: center; border-top: 1px solid rgba(148, 163, 184, 0.1); padding-top: 6px;">
            Built specifically for high-volume retail computer centers and wholesale distribution.
          </div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div>EFZ DAVAO COMPUTER SALES • STORE OPERATIONS GUIDE</div>
      <div>PAGE 02 / 13</div>
    </div>
  </section>

  <!-- SLIDE 3: STORE OPERATIONS FLOW SKETCH -->
  <section class="slide">
    <div class="slide-header">
      <div>
        <span class="slide-badge cyan">Operations Blueprint</span>
        <h2 class="slide-title">Daily Store Workflow & Operations Sketch</h2>
        <p class="slide-subtitle">A seamless 4-step lifecycle from stock delivery to customer payment and after-sales care</p>
      </div>
      <div class="slide-meta-right">
        Operational Flow: <span class="highlight">Delivery to After-Sales</span><br>
        Audit Trail: <span class="highlight">100% Traceable</span>
      </div>
    </div>

    <div class="slide-body">
      <div class="flow-grid">
        <!-- STEP 1 -->
        <div class="flow-column">
          <div class="flow-header">
            <span style="color: #19C3D1;">STEP 1</span> Stock Delivery Intake
          </div>
          <div class="flow-card">
            <div class="flow-card-title">Distributor Receiving</div>
            <div class="flow-card-desc">Log deliveries from official distributors (e.g. Asus, Kingston, Dareu) with purchase batch details.</div>
          </div>
          <div class="flow-card">
            <div class="flow-card-title">Barcode Serial Binding</div>
            <div class="flow-card-desc">Scan and register individual serial numbers with supplier warranty terms (e.g., 90 days, 1 year, 2 years).</div>
          </div>
          <div class="flow-card">
            <div class="flow-card-title">Warehouse Allocation</div>
            <div class="flow-card-desc">Stock immediately marked as "In-Store & Ready to Sell" and made available to the cashiers.</div>
          </div>
        </div>

        <!-- STEP 2 -->
        <div class="flow-column">
          <div class="flow-header">
            <span style="color: #F1C968;">STEP 2</span> Counter POS & Quotations
          </div>
          <div class="flow-card">
            <div class="flow-card-title">Instant Barcode Scan</div>
            <div class="flow-card-desc">Press [F2] and scan product barcode. Price and specs load in under a second with zero typing mistakes.</div>
          </div>
          <div class="flow-card">
            <div class="flow-card-title">Customer Linkage</div>
            <div class="flow-card-desc">Tag sales to existing corporate accounts or walk-in customers for warranty and purchase history records.</div>
          </div>
          <div class="flow-card">
            <div class="flow-card-title">Multi-Tier Checkout</div>
            <div class="flow-card-desc">Select Cash, Card (+4%), or In-House Financing (+15%). Prints invoice with serials and warranty dates.</div>
          </div>
        </div>

        <!-- STEP 3 -->
        <div class="flow-column">
          <div class="flow-header">
            <span style="color: #C084FC;">STEP 3</span> Service & Warranty (RMA)
          </div>
          <div class="flow-card">
            <div class="flow-card-title">Quick Warranty Check</div>
            <div class="flow-card-desc">When a customer brings in a part, scan the serial to instantly verify purchase date and warranty validity.</div>
          </div>
          <div class="flow-card">
            <div class="flow-card-title">Defect Diagnostics</div>
            <div class="flow-card-desc">Technicians record defects, print claim slips, and ship items to official distributor service centers.</div>
          </div>
          <div class="flow-card">
            <div class="flow-card-title">Replacement Unit Dispatch</div>
            <div class="flow-card-desc">Assign replacement serial numbers and notify customers when their unit is ready for counter pickup.</div>
          </div>
        </div>

        <!-- STEP 4 -->
        <div class="flow-column">
          <div class="flow-header">
            <span style="color: #34D399;">STEP 4</span> Management & Store Safety
          </div>
          <div class="flow-card">
            <div class="flow-card-title">Daily Sales Monitoring</div>
            <div class="flow-card-desc">Track real-time counter sales, top-selling product categories, and gross profit margins.</div>
          </div>
          <div class="flow-card">
            <div class="flow-card-title">Smart Reordering</div>
            <div class="flow-card-desc">See which brands and hardware categories are running low to place timely distributor reorders.</div>
          </div>
          <div class="flow-card">
            <div class="flow-card-title">One-Click Data Backup</div>
            <div class="flow-card-desc">Click "Backup Database" at the end of each day to safely preserve all store records with zero effort.</div>
          </div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div>EFZ DAVAO COMPUTER SALES • OPERATIONS BLUEPRINT</div>
      <div>PAGE 03 / 13</div>
    </div>
  </section>

  <!-- SLIDE 4: STAFF ROLES & PERMISSIONS MATRIX -->
  <section class="slide">
    <div class="slide-header">
      <div>
        <span class="slide-badge purple">Staff Governance</span>
        <h2 class="slide-title">Store Staff Roles & Access Control</h2>
        <p class="slide-subtitle">Clear operational duties for each team member while keeping confidential store records secure</p>
      </div>
      <div class="slide-meta-right">
        Team Positions: <span class="highlight">4 Staff Workstations</span><br>
        Security: <span class="highlight">Automatic Enforcement</span>
      </div>
    </div>

    <div class="slide-body" style="flex-direction: column; gap: 8px;">
      <table class="matrix-table">
        <thead>
          <tr>
            <th>Store Activity / Feature</th>
            <th>Store Manager & Owner</th>
            <th>Front-Counter Cashier</th>
            <th>Warehouse Custodian</th>
            <th>Service Center Technician</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Store Sales Dashboard & Daily Totals</strong></td>
            <td><span class="matrix-badge badge-grant">Full View</span></td>
            <td><span class="matrix-badge badge-deny">No Access</span></td>
            <td><span class="matrix-badge badge-deny">No Access</span></td>
            <td><span class="matrix-badge badge-deny">No Access</span></td>
          </tr>
          <tr>
            <td><strong>POS Cashier Checkout & Billing</strong></td>
            <td><span class="matrix-badge badge-grant">Allowed</span></td>
            <td><span class="matrix-badge badge-grant">Primary Job</span></td>
            <td><span class="matrix-badge badge-deny">No Access</span></td>
            <td><span class="matrix-badge badge-deny">No Access</span></td>
          </tr>
          <tr>
            <td><strong>Wholesale Purchase Cost & Profit Margins</strong></td>
            <td><span class="matrix-badge badge-grant">Full Visibility</span></td>
            <td><span class="matrix-badge badge-mask">Hidden (Protected)</span></td>
            <td><span class="matrix-badge badge-grant">Receiving Cost</span></td>
            <td><span class="matrix-badge badge-mask">Hidden (Protected)</span></td>
          </tr>
          <tr>
            <td><strong>Product Catalog & Stock Inquiries</strong></td>
            <td><span class="matrix-badge badge-grant">Edit / Delete / Price</span></td>
            <td><span class="matrix-badge badge-grant">Retail SRP Lookup</span></td>
            <td><span class="matrix-badge badge-grant">Stock Receiving</span></td>
            <td><span class="matrix-badge badge-grant">Warranty Check Only</span></td>
          </tr>
          <tr>
            <td><strong>Customer Sales History & Invoices</strong></td>
            <td><span class="matrix-badge badge-grant">Full Ledger</span></td>
            <td><span class="matrix-badge badge-grant">Counter Invoices</span></td>
            <td><span class="matrix-badge badge-deny">No Access</span></td>
            <td><span class="matrix-badge badge-grant">Warranty Verification</span></td>
          </tr>
          <tr>
            <td><strong>Corporate Price Quotations</strong></td>
            <td><span class="matrix-badge badge-grant">Approve / Adjust</span></td>
            <td><span class="matrix-badge badge-grant">Draft & Print</span></td>
            <td><span class="matrix-badge badge-deny">No Access</span></td>
            <td><span class="matrix-badge badge-deny">No Access</span></td>
          </tr>
          <tr>
            <td><strong>Distributor Supplier Management</strong></td>
            <td><span class="matrix-badge badge-grant">Full Management</span></td>
            <td><span class="matrix-badge badge-deny">No Access</span></td>
            <td><span class="matrix-badge badge-grant">Delivery Contacts</span></td>
            <td><span class="matrix-badge badge-deny">No Access</span></td>
          </tr>
          <tr>
            <td><strong>Customer Installment Payment Collection</strong></td>
            <td><span class="matrix-badge badge-grant">Full Audit</span></td>
            <td><span class="matrix-badge badge-grant">Collect & Receipt</span></td>
            <td><span class="matrix-badge badge-deny">No Access</span></td>
            <td><span class="matrix-badge badge-deny">No Access</span></td>
          </tr>
          <tr>
            <td><strong>Warranty Diagnostics & RMA Claims</strong></td>
            <td><span class="matrix-badge badge-grant">Full Oversight</span></td>
            <td><span class="matrix-badge badge-deny">No Access</span></td>
            <td><span class="matrix-badge badge-deny">No Access</span></td>
          <td><span class="matrix-badge badge-grant">Primary Job</span></td>
          </tr>
          <tr>
            <td><strong>Daily Store Data Backup</strong></td>
            <td><span class="matrix-badge badge-grant">One-Click Backup</span></td>
            <td><span class="matrix-badge badge-deny">No Access</span></td>
            <td><span class="matrix-badge badge-deny">No Access</span></td>
            <td><span class="matrix-badge badge-deny">No Access</span></td>
          </tr>
        </tbody>
      </table>

      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 4px;">
        <div class="feature-card" style="padding: 8px 10px;">
          <div style="font-size: 10px; font-weight: 800; color: #F1C968;">Store Manager</div>
          <div style="font-size: 8.5px; color: #94A3B8;">Business health, profit control, backups</div>
        </div>
        <div class="feature-card" style="padding: 8px 10px;">
          <div style="font-size: 10px; font-weight: 800; color: #19C3D1;">Front Cashier</div>
          <div style="font-size: 8.5px; color: #94A3B8;">Fast sales checkout, quotes, installments</div>
        </div>
        <div class="feature-card" style="padding: 8px 10px;">
          <div style="font-size: 10px; font-weight: 800; color: #38BDF8;">Warehouse Custodian</div>
          <div style="font-size: 8.5px; color: #94A3B8;">Stock receiving, serial tagging, audits</div>
        </div>
        <div class="feature-card" style="padding: 8px 10px;">
          <div style="font-size: 10px; font-weight: 800; color: #C084FC;">Service Technician</div>
          <div style="font-size: 8.5px; color: #94A3B8;">Defect testing, warranty claims, returns</div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div>EFZ DAVAO COMPUTER SALES • STAFF GOVERNANCE SPECIFICATION</div>
      <div>PAGE 04 / 13</div>
    </div>
  </section>

  <!-- SLIDE 5: LOGIN & PERIMETER AUTHENTICATION -->
  <section class="slide">
    <div class="slide-header">
      <div>
        <span class="slide-badge">Store Sign-In</span>
        <h2 class="slide-title">Terminal Sign-In & Staff Workstations</h2>
        <p class="slide-subtitle">Simple, secure sign-in for counter staff with automatic role selection and screen protection</p>
      </div>
      <div class="slide-meta-right">
        Station: <span class="highlight">All Store Computers</span><br>
        Feature: <span class="highlight">One-Click Staff Presets</span>
      </div>
    </div>

    <div class="slide-body">
      <div class="screenshot-frame">
        <div class="screenshot-toolbar">
          <div class="toolbar-dot dot-red"></div>
          <div class="toolbar-dot dot-yellow"></div>
          <div class="toolbar-dot dot-green"></div>
          <div class="toolbar-title">Terminal Sign-In — Store Operator Gateway</div>
        </div>
        <div class="screenshot-img-box">
          <img src="${imgLogin}" alt="Operator Login Terminal">
        </div>
      </div>

      <div class="info-panel">
        <div class="feature-card gold-border">
          <div class="card-title">👤 Dedicated Staff Accounts</div>
          <div class="card-desc">
            Every staff member signs in with their assigned account. The system immediately opens their dedicated screen (Cashiers see the POS register, Technicians see RMA tickets).
          </div>
        </div>

        <div class="feature-card cyan-border">
          <div class="card-title">⚡ Fast One-Click Role Selection</div>
          <div class="card-desc">
            Quick-fill buttons allow staff to log into Cashier, Warehouse, Technician, or Manager mode in seconds without complex typing.
          </div>
        </div>

        <div class="feature-card purple-border">
          <div class="card-title">🚫 Automatic Permission Guard</div>
          <div class="card-desc">
            If a cashier attempts to access management reports, confidential margins, or backup tools, the system displays a clear <strong>"Access Restricted"</strong> screen and returns them to their sales counter.
          </div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div>EFZ DAVAO COMPUTER SALES • TERMINAL SIGN-IN WORKSTATION</div>
      <div>PAGE 05 / 13</div>
    </div>
  </section>

  <!-- SLIDE 6: ADMIN DASHBOARD -->
  <section class="slide">
    <div class="slide-header">
      <div>
        <span class="slide-badge">Store Manager View</span>
        <h2 class="slide-title">Executive Operations Dashboard</h2>
        <p class="slide-subtitle">Live sales totals, active inventory value, and product category breakdown at a single glance</p>
      </div>
      <div class="slide-meta-right">
        Clearance: <span class="highlight">Store Manager</span><br>
        Data: <span class="highlight">Live Store Figures</span>
      </div>
    </div>

    <div class="slide-body">
      <div class="screenshot-frame">
        <div class="screenshot-toolbar">
          <div class="toolbar-dot dot-red"></div>
          <div class="toolbar-dot dot-yellow"></div>
          <div class="toolbar-dot dot-green"></div>
          <div class="toolbar-title">Executive Dashboard — Real-Time Store Intelligence</div>
        </div>
        <div class="screenshot-img-box">
          <img src="${imgDashboard}" alt="Executive Dashboard">
        </div>
      </div>

      <div class="info-panel">
        <div class="feature-card gold-border">
          <div class="card-title">💰 Live Total Sales Revenue</div>
          <div class="card-desc">
            Instantly view cumulative store sales (<strong>₱211,782,950.25</strong> across 12,718 completed counter orders) without waiting for manual bookkeeping.
          </div>
        </div>

        <div class="feature-card cyan-border">
          <div class="card-title">📦 Total Sellable Stock Valuation</div>
          <div class="card-desc">
            Know your exact store asset value at all times: currently <strong>3,498 ready-to-sell units</strong> worth <strong>₱15,656,043.00</strong> in retail inventory.
          </div>
        </div>

        <div class="feature-card purple-border">
          <div class="card-title">🏷️ Product Category Distribution</div>
          <div class="card-desc">
            Clear visual charts show stock balance across <strong>RAM, Graphics Cards, Monitors, Accessories, and Laptops</strong> to guide profitable purchasing.
          </div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div>EFZ DAVAO COMPUTER SALES • STORE MANAGER DASHBOARD</div>
      <div>PAGE 06 / 13</div>
    </div>
  </section>

  <!-- SLIDE 7: ADMIN INVENTORY & BACKUP -->
  <section class="slide">
    <div class="slide-header">
      <div>
        <span class="slide-badge">Store Manager View</span>
        <h2 class="slide-title">Profit Margin Control & One-Click Backup</h2>
        <p class="slide-subtitle">Track wholesale purchase costs against selling prices, and protect all store records effortlessly</p>
      </div>
      <div class="slide-meta-right">
        Security: <span class="highlight">Margins Protected</span><br>
        Backup: <span class="highlight">Instant One-Click</span>
      </div>
    </div>

    <div class="slide-body">
      <div class="screenshot-frame">
        <div class="screenshot-toolbar">
          <div class="toolbar-dot dot-red"></div>
          <div class="toolbar-dot dot-yellow"></div>
          <div class="toolbar-dot dot-green"></div>
          <div class="toolbar-title">Stock Catalog — Profit Margins & Automatic Backup</div>
        </div>
        <div class="screenshot-img-box">
          <img src="${imgAdminInv}" alt="Admin Stock Catalog">
        </div>
      </div>

      <div class="info-panel">
        <div class="feature-card gold-border">
          <div class="card-title">📈 Confidential Profit Margins</div>
          <div class="card-desc">
            Store Managers see exact <strong>Wholesale Supplier Cost</strong> and <strong>Gross Margin %</strong> for every unit, ensuring every sale and quotation remains profitable.
          </div>
        </div>

        <div class="feature-card cyan-border">
          <div class="card-title">🔍 Fast Product & Serial Search</div>
          <div class="card-desc">
            Instantly search by product name, model specs, serial barcode, or distributor brand to answer customer questions in seconds.
          </div>
        </div>

        <div class="feature-card green-border">
          <div class="card-title">💾 One-Click Store Data Backup</div>
          <div class="card-desc">
            Click <strong>"Database Backup"</strong> at the end of each business day. It creates a safe, compressed copy of all sales, customer records, and inventory history to safeguard against power failures or computer breakdown.
          </div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div>EFZ DAVAO COMPUTER SALES • PROFIT & DATA GOVERNANCE</div>
      <div>PAGE 07 / 13</div>
    </div>
  </section>

  <!-- SLIDE 8: CASHIER POS CHECKOUT -->
  <section class="slide">
    <div class="slide-header">
      <div>
        <span class="slide-badge cyan">Front-Counter Sales</span>
        <h2 class="slide-title">Fast POS Register & Barcode Checkout</h2>
        <p class="slide-subtitle">Built for counter speed: scan barcodes, select payment, and issue sales invoices in seconds</p>
      </div>
      <div class="slide-meta-right">
        Station: <span class="highlight">POS-COUNTER-01</span><br>
        Speed Key: <span class="highlight">[F2] Instant Scan</span>
      </div>
    </div>

    <div class="slide-body">
      <div class="screenshot-frame">
        <div class="screenshot-toolbar">
          <div class="toolbar-dot dot-red"></div>
          <div class="toolbar-dot dot-yellow"></div>
          <div class="toolbar-dot dot-green"></div>
          <div class="toolbar-title">POS Register — Counter Checkout Terminal</div>
        </div>
        <div class="screenshot-img-box">
          <img src="${imgCashierPos}" alt="Cashier POS Register">
        </div>
      </div>

      <div class="info-panel">
        <div class="feature-card cyan-border">
          <div class="card-title">⚡ Instant Barcode Scanning [F2]</div>
          <div class="card-desc">
            Cashiers simply press <code>[F2]</code> on the keyboard and scan the barcode scanner. Products enter the cart immediately without clicking the mouse.
          </div>
        </div>

        <div class="feature-card gold-border">
          <div class="card-title">💳 Flexible Customer Payment Tiers</div>
          <div class="card-desc">
            Select payment with one click: <strong>Spot Cash</strong>, <strong>3-Month Credit Card (+4% fee)</strong>, or <strong>12-Month In-House Financing (+15%)</strong>. Exact change is calculated on screen.
          </div>
        </div>

        <div class="feature-card purple-border">
          <div class="card-title">🧾 Serialized Warranty Invoices</div>
          <div class="card-desc">
            Every printed sales receipt lists the customer name and exact product serial numbers, serving as an official warranty certificate for after-sales claims.
          </div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div>EFZ DAVAO COMPUTER SALES • POINT OF SALE REGISTER</div>
      <div>PAGE 08 / 13</div>
    </div>
  </section>

  <!-- SLIDE 9: CASHIER PROTECTED CATALOG & QUOTATIONS -->
  <section class="slide">
    <div class="slide-header">
      <div>
        <span class="slide-badge cyan">Front-Counter Sales</span>
        <h2 class="slide-title">Corporate Quotations & Protected Catalog</h2>
        <p class="slide-subtitle">Generate professional corporate price proposals while keeping wholesale costs masked</p>
      </div>
      <div class="slide-meta-right">
        Pricing: <span class="highlight">Retail SRP Only</span><br>
        Clients: <span class="highlight">8,411 Accounts</span>
      </div>
    </div>

    <div class="slide-body">
      <div class="screenshot-frame">
        <div class="screenshot-toolbar">
          <div class="toolbar-dot dot-red"></div>
          <div class="toolbar-dot dot-yellow"></div>
          <div class="toolbar-dot dot-green"></div>
          <div class="toolbar-title">Quotations — Formal Price Quotation Builder</div>
        </div>
        <div class="screenshot-img-box">
          <img src="${imgCashierQuote}" alt="Quotation Builder">
        </div>
      </div>

      <div class="info-panel">
        <div class="feature-card cyan-border">
          <div class="card-title">📝 Corporate Quotations in Minutes</div>
          <div class="card-desc">
            Quickly draft official price quotations for bulk buyers (schools, BPOs, internet cafes, government agencies). Automatically calculates 3-tier financing comparisons.
          </div>
        </div>

        <div class="feature-card gold-border">
          <div class="card-title">🔍 Instant Client Picker (8,400+ Clients)</div>
          <div class="card-desc">
            Cashiers can search across 8,400+ corporate clients by company name, contact person, or phone number with instant dropdown auto-complete.
          </div>
        </div>

        <div class="feature-card purple-border">
          <div class="card-title">🛡️ Protected Retail Inventory View</div>
          <div class="card-desc">
            When browsing the stock catalog, cashiers only see customer retail prices (SRP). Wholesale supplier costs are completely invisible on front-counter screens.
          </div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div>EFZ DAVAO COMPUTER SALES • COMMERCIAL CRM & QUOTATIONS</div>
      <div>PAGE 09 / 13</div>
    </div>
  </section>

  <!-- SLIDE 10: COMMERCIAL FINANCING & INSTALLMENT AR -->
  <section class="slide">
    <div class="slide-header">
      <div>
        <span class="slide-badge cyan">Commercial Financing</span>
        <h2 class="slide-title">Installment Accounts Receivable & Amortization</h2>
        <p class="slide-subtitle">Automated monthly amortization schedules, customer payment collections, and aging balance tracking</p>
      </div>
      <div class="slide-meta-right">
        Financing Terms: <span class="highlight">3-Mo &amp; 12-Mo Plans</span><br>
        AR Tracking: <span class="highlight">Automated Maturity</span>
      </div>
    </div>

    <div class="slide-body">
      <div class="screenshot-frame">
        <div class="screenshot-toolbar">
          <div class="toolbar-dot dot-red"></div>
          <div class="toolbar-dot dot-yellow"></div>
          <div class="toolbar-dot dot-green"></div>
          <div class="toolbar-title">Installment AR — Customer Amortization &amp; Collections Ledger</div>
        </div>
        <div class="screenshot-img-box">
          <img src="${imgAdminInst}" alt="Installment AR Ledger">
        </div>
      </div>

      <div class="info-panel">
        <div class="feature-card cyan-border">
          <div class="card-title">📈 Boost High-Value PC Sales Conversion</div>
          <div class="card-desc">
            Allow walk-ins and corporate clients to purchase high-end gaming rigs, laptops, and workstations with structured <strong>3-Month (4% card fee)</strong> or <strong>12-Month In-House Financing (+15% APR)</strong>, dramatically raising average ticket size.
          </div>
        </div>

        <div class="feature-card gold-border">
          <div class="card-title">📅 Live Amortization &amp; Due Date Schedules</div>
          <div class="card-desc">
            Automated ledger tracks exact monthly dues (e.g. <strong>₱3,916.47/mo</strong>), payment progress (<strong>4/12 paid</strong>), maturity dates, and remaining balances (<strong>₱31,331.72</strong>) with zero manual calculations.
          </div>
        </div>

        <div class="feature-card green-border">
          <div class="card-title">💳 Front-Counter Collections &amp; Status Alerts</div>
          <div class="card-desc">
            Cashiers collect monthly installments directly at the counter with one-click payment logging. Visual status badges (<strong>Current, Settled, Delinquent</strong>) ensure overdue balances are immediately flagged for prompt collection.
          </div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div>EFZ DAVAO COMPUTER SALES • COMMERCIAL FINANCING &amp; AR</div>
      <div>PAGE 10 / 13</div>
    </div>
  </section>

  <!-- SLIDE 11: WAREHOUSE & INVENTORY VALUATION -->
  <section class="slide">
    <div class="slide-header">
      <div>
        <span class="slide-badge" style="background: rgba(56, 189, 248, 0.12); border-color: rgba(56, 189, 248, 0.3); color: #38BDF8;">Warehouse Operations</span>
        <h2 class="slide-title">Stock Receiving & Inventory Auditing</h2>
        <p class="slide-subtitle">Tracking deliveries from 62 distributors, tagging warranty periods, and verifying stock movement</p>
      </div>
      <div class="slide-meta-right">
        Station: <span class="highlight">WAR-TERM-01</span><br>
        Suppliers: <span class="highlight">62 Partner Brands</span>
      </div>
    </div>

    <div class="slide-body">
      <div class="screenshot-frame">
        <div class="screenshot-toolbar">
          <div class="toolbar-dot dot-red"></div>
          <div class="toolbar-dot dot-yellow"></div>
          <div class="toolbar-dot dot-green"></div>
          <div class="toolbar-title">Stock Valuation — Inventory Audit & Sourcing Ledger</div>
        </div>
        <div class="screenshot-img-box">
          <img src="${imgWarehouseAudit}" alt="Stock Valuation Audit">
        </div>
      </div>

      <div class="info-panel">
        <div class="feature-card cyan-border">
          <div class="card-title">📥 Serialized Stock Intake</div>
          <div class="card-desc">
            Warehouse staff log distributor delivery boxes, scan manufacturer barcodes, and record official warranty periods (e.g. 90 days, 1 year, 2 years).
          </div>
        </div>

        <div class="feature-card gold-border">
          <div class="card-title">🚚 Distributor Sourcing Overview</div>
          <div class="card-desc">
            Shows how much stock you hold from each of your <strong>62 distributors</strong> (e.g. IONTECH, UBERTECH, DAREU) to help negotiate volume discounts and rebates.
          </div>
        </div>

        <div class="feature-card purple-border">
          <div class="card-title">📜 Inbound vs. Outbound Movement Logs</div>
          <div class="card-desc">
            Audit exactly when units were received from suppliers and when they were sold at the cashier, making physical stock counts fast and accurate.
          </div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div>EFZ DAVAO COMPUTER SALES • WAREHOUSE OPERATIONS</div>
      <div>PAGE 11 / 13</div>
    </div>
  </section>

  <!-- SLIDE 12: RMA DEFECT DIAGNOSTICS & WARRANTY -->
  <section class="slide">
    <div class="slide-header">
      <div>
        <span class="slide-badge purple">Service Center Care</span>
        <h2 class="slide-title">RMA Warranty Claims & Defect Diagnostics</h2>
        <p class="slide-subtitle">Professional defect testing, distributor warranty claims, and fast replacement turnaround</p>
      </div>
      <div class="slide-meta-right">
        Station: <span class="highlight">RMA-BENCH-01</span><br>
        Workflow: <span class="highlight">5-Stage Pipeline</span>
      </div>
    </div>

    <div class="slide-body">
      <div class="screenshot-frame">
        <div class="screenshot-toolbar">
          <div class="toolbar-dot dot-red"></div>
          <div class="toolbar-dot dot-yellow"></div>
          <div class="toolbar-dot dot-green"></div>
          <div class="toolbar-title">RMA Claims — Service Center Diagnostics Pipeline</div>
        </div>
        <div class="screenshot-img-box">
          <img src="${imgTechRma}" alt="RMA Warranty Claims">
        </div>
      </div>

      <div class="info-panel">
        <div class="feature-card purple-border">
          <div class="card-title">🔬 Clear 5-Stage Warranty Status</div>
          <div class="card-desc">
            Track claims step-by-step: <strong>Pending Inspection</strong> → <strong>In Distributor Diagnostic</strong> → <strong>Replacement Inbound</strong> → <strong>Replacement Ready</strong> → <strong>Resolved & Released</strong>.
          </div>
        </div>

        <div class="feature-card cyan-border">
          <div class="card-title">🔍 Instant Invoice & Warranty Verification</div>
          <div class="card-desc">
            When a customer returns a defective component, technicians verify the exact purchase date and warranty coverage in seconds using the sales history.
          </div>
        </div>

        <div class="feature-card gold-border">
          <div class="card-title">🔄 Replacement Barcode Assignment</div>
          <div class="card-desc">
            When the distributor delivers a replacement unit, technicians link the new serial barcode directly to the ticket, giving the customer an updated warranty record.
          </div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div>EFZ DAVAO COMPUTER SALES • SERVICE CENTER & WARRANTY CARE</div>
      <div>PAGE 12 / 13</div>
    </div>
  </section>

  <!-- SLIDE 13: BUSINESS BENEFITS SUMMARY & READINESS -->
  <section class="slide">
    <div class="slide-header">
      <div>
        <span class="slide-badge">Store Value Summary</span>
        <h2 class="slide-title">Business Advantages & Operational Readiness</h2>
        <p class="slide-subtitle">Transforming store efficiency, protecting profits, and delivering exceptional customer service</p>
      </div>
      <div class="slide-meta-right">
        Commercial Status: <span class="highlight">Production Ready</span><br>
        Store Efficiency: <span class="highlight">Maximum</span>
      </div>
    </div>

    <div class="slide-body">
      <div class="info-panel" style="flex: 1.1;">
        <div class="feature-card gold-border">
          <div class="card-title">🛡️ Total Inventory Accountability</div>
          <div class="card-desc">
            Serialized barcode tracking ensures 100% visibility over every computer component. You will never lose track of expensive graphics cards, processors, or laptops.
          </div>
        </div>

        <div class="feature-card cyan-border">
          <div class="card-title">💰 Confidential Profit Protection</div>
          <div class="card-desc">
            Strict role boundaries keep your supplier purchase costs confidential. Cashiers focus on closing sales and customer service without seeing your margins.
          </div>
        </div>

        <div class="feature-card purple-border">
          <div class="card-title">📈 Accelerated Sales Growth</div>
          <div class="card-desc">
            Offer flexible payment plans (Spot Cash, Credit Card, 12-Month Financing) and instant corporate quotations to convert more walk-ins into repeat business clients.
          </div>
        </div>
      </div>

      <div class="info-panel" style="flex: 0.9;">
        <div class="feature-card" style="height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div class="card-title" style="color: #10B981; font-size: 13px;">✅ Ready for Daily Store Operations</div>
            <div class="card-desc" style="margin-top: 8px; line-height: 1.7; font-size: 10.5px;">
              ✔ Fast Barcode Scanner Integration<br>
              ✔ Clear Roles for Store Manager, Cashier, Warehouse & RMA<br>
              ✔ In-House Installment & Commercial AR Tracking<br>
              ✔ Professional Invoices with Warranty Dates<br>
              ✔ 8,400+ Existing Customers Connected<br>
              ✔ 41,900+ Hardware Units Ready for Checkout<br>
              ✔ One-Click Daily Data Backup Built-In
            </div>
          </div>

          <div style="background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 8px; padding: 12px; text-align: center;">
            <div style="font-size: 12px; font-weight: 800; color: #34D399; text-transform: uppercase;">
              SYSTEM READY FOR STORE LAUNCH
            </div>
            <div style="font-size: 9px; color: #94A3B8; margin-top: 3px;">
              Empowering your sales team, warehouse, and service center from day one.
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div>EFZ DAVAO COMPUTER SALES • COMMERCIAL PRESENTATION DECK</div>
      <div>PAGE 13 / 13</div>
    </div>
  </section>

</body>
</html>
`;

  // Write presentation HTML
  const htmlPath = path.resolve('./presentation_assets/presentation.html');
  fs.writeFileSync(htmlPath, htmlContent, 'utf8');
  console.log('Business presentation HTML saved:', htmlPath);

  // Launch Chrome to generate PDF
  console.log('Launching Chrome to render presentation PDF...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  console.log('Rendering PDF (A4 Landscape, PrintBackground)...');
  await page.pdf({
    path: OUTPUT_PDF,
    format: 'A4',
    landscape: true,
    printBackground: true,
    margin: {
      top: '0mm',
      right: '0mm',
      bottom: '0mm',
      left: '0mm'
    }
  });

  await browser.close();
  console.log('PDF rendered successfully at:', OUTPUT_PDF);

  // Copy to Artifacts directory for immediate download/viewing
  fs.copyFileSync(OUTPUT_PDF, ARTIFACT_PDF);
  console.log('Copied PDF to Artifacts directory:', ARTIFACT_PDF);

  const stats = fs.statSync(OUTPUT_PDF);
  console.log(`Generated PDF size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
}

main().catch((err) => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
