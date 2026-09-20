import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = path.resolve('./presentation_assets/screenshots');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loginAs(page, email, password) {
  await page.evaluate(async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: email, password: password }),
    });
    const data = await res.json();
    if (data.token && data.user) {
      localStorage.setItem('efz_access_token', data.token);
      localStorage.setItem('efz_authenticated_user', JSON.stringify(data.user));
    }
  }, email, password);
  await page.reload({ waitUntil: 'networkidle0' });
  await sleep(1500);
}

async function logout(page) {
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.reload({ waitUntil: 'networkidle0' });
  await sleep(1000);
}

async function clickTab(page, tabName) {
  const clicked = await page.evaluate((name) => {
    const buttons = Array.from(document.querySelectorAll('aside button'));
    const btn = buttons.find((b) => b.textContent && b.textContent.includes(name));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  }, tabName);
  if (!clicked) {
    console.warn(`Tab button "${tabName}" not found in sidebar!`);
  }
  await sleep(1500);
}

async function main() {
  console.log('Launching browser to capture presentation screenshots...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1680,1050'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1680, height: 1050, deviceScaleFactor: 2 });

  // 1. Capture Login Screen
  console.log('Capturing: 00_login_terminal.png');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await logout(page);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '00_login_terminal.png') });

  // 2. Admin Perspective
  console.log('Logging in as Store Manager & Admin...');
  await loginAs(page, 'admin@efzdavao.ph', 'EfzSecure2026!Admin');

  console.log('Capturing: 01_admin_dashboard.png');
  await clickTab(page, 'Dashboard');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01_admin_dashboard.png') });

  console.log('Capturing: 02_admin_pos.png');
  await clickTab(page, 'POS Register');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '02_admin_pos.png') });

  console.log('Capturing: 03_admin_inventory.png');
  await clickTab(page, 'Stock Catalog');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '03_admin_inventory.png') });

  console.log('Capturing: 04_admin_sales.png');
  await clickTab(page, 'Sales & Warranty');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '04_admin_sales.png') });

  console.log('Capturing: 05_admin_quotation.png');
  await clickTab(page, 'Quotations');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '05_admin_quotation.png') });

  console.log('Capturing: 06_admin_audit.png');
  await clickTab(page, 'Stock Valuation');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '06_admin_audit.png') });

  console.log('Capturing: 07_admin_customers.png');
  await clickTab(page, 'Customer Directory');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '07_admin_customers.png') });

  console.log('Capturing: 08_admin_suppliers.png');
  await clickTab(page, 'Suppliers');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '08_admin_suppliers.png') });

  console.log('Capturing: 09_admin_installments.png');
  await clickTab(page, 'Installment AR');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '09_admin_installments.png') });

  console.log('Capturing: 10_admin_rma.png');
  await clickTab(page, 'RMA Claims');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '10_admin_rma.png') });

  console.log('Capturing: 11_admin_backup_modal.png');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('aside button'));
    const btn = buttons.find((b) => b.textContent && b.textContent.includes('Database Backup'));
    if (btn) btn.click();
  });
  await sleep(1000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '11_admin_backup_modal.png') });

  // Close backup modal
  await page.evaluate(() => {
    const closeBtn = document.querySelector('button[title="Close"]');
    if (closeBtn) closeBtn.click();
  });
  await sleep(500);

  // 3. Cashier Perspective
  console.log('Logging in as Front-Counter Sales & Cashier...');
  await logout(page);
  await loginAs(page, 'cashier@efzdavao.ph', 'EfzSecure2026!Cashier');

  console.log('Capturing: 12_cashier_pos_terminal.png');
  await clickTab(page, 'POS Register');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '12_cashier_pos_terminal.png') });

  console.log('Capturing: 13_cashier_inventory_srp_only.png');
  await clickTab(page, 'Stock Catalog');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '13_cashier_inventory_srp_only.png') });

  console.log('Capturing: 14_cashier_quotation_builder.png');
  await clickTab(page, 'Quotations');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '14_cashier_quotation_builder.png') });

  // 4. Warehouse & Inventory Specialist Perspective
  console.log('Logging in as Warehouse & Procurement Specialist...');
  await logout(page);
  await loginAs(page, 'inventory@efzdavao.ph', 'EfzSecure2026!Inventory');

  console.log('Capturing: 15_warehouse_stock_catalog.png');
  await clickTab(page, 'Stock Catalog');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '15_warehouse_stock_catalog.png') });

  console.log('Capturing: 16_warehouse_audit_movement.png');
  await clickTab(page, 'Stock Valuation');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '16_warehouse_audit_movement.png') });

  console.log('Capturing: 17_warehouse_suppliers.png');
  await clickTab(page, 'Suppliers');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '17_warehouse_suppliers.png') });

  // 5. Senior RMA Technician Perspective
  console.log('Logging in as Senior RMA & Warranty Technician...');
  await logout(page);
  await loginAs(page, 'technician@efzdavao.ph', 'EfzSecure2026!Technician');

  console.log('Capturing: 18_technician_rma_claims.png');
  await clickTab(page, 'RMA Claims');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '18_technician_rma_claims.png') });

  console.log('Capturing: 19_technician_sales_lookup.png');
  await clickTab(page, 'Sales & Warranty');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '19_technician_sales_lookup.png') });

  console.log('All screenshots captured successfully!');
  await browser.close();
}

main().catch((err) => {
  console.error('Error during screenshot capture:', err);
  process.exit(1);
});
