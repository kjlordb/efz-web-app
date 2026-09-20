import { Router } from 'express';
import { getPool, sql } from '../db.js';
import { requirePermission } from '../auth.js';

export const ordersRouter = Router();

// GET /api/orders - List sales invoices with customer metadata and liquidated units
ordersRouter.get('/', requirePermission('VIEW_SALES_LEDGER'), async (req, res) => {
  try {
    const pool = await getPool();
    const {
      startDate,
      endDate,
      serial,
      customerId,
      search,
      paymentTier,
      limit = '100',
      offset = '0',
    } = req.query;

    const request = pool.request();
    let query = `
      SELECT 
        o.id,
        o.CustomerId,
        o.Remarks,
        o.OrderAmount,
        o.PaymentMethod,
        o.Encoder,
        o.OrderDate,
        o.ComputerName,
        c.FirstName,
        c.LastName,
        c.Company AS CustomerCompany,
        c.ContactNumber AS CustomerContact,
        c.Address AS CustomerAddress
      FROM dbo.OrderItems o
      LEFT JOIN dbo.CustomerDetails c ON o.CustomerId = c.id
      WHERE 1=1
    `;

    if (customerId) {
      request.input('customerId', sql.Int, parseInt(customerId as string, 10));
      query += ` AND o.CustomerId = @customerId`;
    }

    if (startDate) {
      request.input('startDate', sql.DateTime, new Date(startDate as string));
      query += ` AND o.OrderDate >= @startDate`;
    }

    if (endDate) {
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);
      request.input('endDate', sql.DateTime, end);
      query += ` AND o.OrderDate <= @endDate`;
    }

    if (paymentTier && typeof paymentTier === 'string') {
      request.input('paymentTier', sql.NVarChar, `%${paymentTier}%`);
      query += ` AND o.PaymentMethod LIKE @paymentTier`;
    }

    if (search && typeof search === 'string' && search.trim()) {
      request.input('search', sql.NVarChar, `%${search.trim()}%`);
      query += ` AND (
        c.FirstName LIKE @search OR c.LastName LIKE @search OR c.Company LIKE @search OR c.ContactNumber LIKE @search
      )`;
    }

    if (serial && typeof serial === 'string' && serial.trim()) {
      request.input('serial', sql.NVarChar, `%${serial.trim()}%`);
      query += ` AND EXISTS (
        SELECT 1 FROM dbo.StockItems stock
        WHERE stock.OrderId = CONVERT(NVARCHAR(500), o.id)
          AND stock.StockSerial LIKE @serial
      )`;
    }

    const parsedLimit = Math.min(Math.max(parseInt(limit as string, 10) || 100, 1), 500);
    const parsedOffset = Math.max(parseInt(offset as string, 10) || 0, 0);

    request.input('offset', sql.Int, parsedOffset);
    request.input('limit', sql.Int, parsedLimit);

    query += ` ORDER BY o.id DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;

    const ordersResult = await request.query(query);
    const ordersRows = ordersResult.recordset;

    if (ordersRows.length === 0) {
      return res.json([]);
    }

    // Fetch items for these orders
    const orderIds = ordersRows.map((o) => o.id);
    const itemsRequest = pool.request();
    const itemsResult = await itemsRequest.query(`
      SELECT 
        id, StockSerial, StockName, StockDetails, StockPrice, 
        SupplierName, SuppliersPrice, StockStatus, Warranty, 
        InDate, Encoder, OrderId, Remarks
      FROM dbo.StockItems
      WHERE OrderId IN (${orderIds.join(',')})
    `);

    // Group items by OrderId
    const itemsByOrder: Record<string, any[]> = {};
    for (const item of itemsResult.recordset) {
      const oid = String(item.OrderId);
      if (!itemsByOrder[oid]) itemsByOrder[oid] = [];
      itemsByOrder[oid].push({
        id: item.id,
        stockSerial: item.StockSerial || '',
        stockName: item.StockName || '',
        stockDetails: item.StockDetails || '',
        stockPrice: Number(item.StockPrice) || 0,
        supplierName: item.SupplierName || '',
        suppliersPrice: Number(item.SuppliersPrice) || 0,
        stockStatus: item.StockStatus || 'sold',
        warranty: Number(item.Warranty) || 0,
        inDate: item.InDate ? new Date(item.InDate).toISOString() : new Date().toISOString(),
        encoder: item.Encoder || '',
        orderId: item.OrderId ? Number(item.OrderId) : undefined,
      });
    }

    let orders = ordersRows.map((row) => {
      const items = itemsByOrder[String(row.id)] || [];
      const serialList = items.map((i) => i.stockSerial).join(', ');
      const customerFullName = `${row.FirstName || ''} ${row.LastName || ''}`.trim() || 'Retail Client';

      // Infer tier
      let pTier: 'Cash' | '3months' | '12months' = 'Cash';
      const pm = (row.PaymentMethod || '').toLowerCase();
      if (pm.includes('3 month') || pm.includes('3-mo') || pm.includes('3months')) {
        pTier = '3months';
      } else if (pm.includes('12 month') || pm.includes('12-mo') || pm.includes('12months')) {
        pTier = '12months';
      }

      return {
        id: row.id,
        customerId: row.CustomerId,
        customerName: customerFullName,
        customerCompany: row.CustomerCompany || undefined,
        customerContact: row.CustomerContact || '',
        customerAddress: row.CustomerAddress || 'Davao City, Philippines',
        remarks: row.Remarks || '',
        paymentMethod: row.PaymentMethod || 'Cash',
        paymentTier: pTier,
        orderAmount: Number(row.OrderAmount) || 0,
        orderDate: row.OrderDate ? new Date(row.OrderDate).toISOString() : new Date().toISOString(),
        encoder: row.Encoder || 'Sales Associate',
        computerName: row.ComputerName || 'POS-TERMINAL-01',
        listOfSerials: serialList,
        items,
      };
    });

    res.json(orders);
  } catch (err: any) {
    console.error('Error in GET /api/orders:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/orders - Transactional checkout & stock liquidation
ordersRouter.post('/', requirePermission('EXECUTE_POS'), async (req, res) => {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    const {
      customerId,
      paymentTier,
      remarks,
      amountTendered,
      discountPercent = 0,
      items = [],
    } = req.body;

    if (!Number.isSafeInteger(customerId) || customerId <= 0) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Customer ID is required.' });
    }
    if (!Array.isArray(items) || items.length === 0 || items.length > 100) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Transaction cart cannot be empty.' });
    }

    const parsedDiscount = Number(discountPercent);
    if (!Number.isFinite(parsedDiscount) || parsedDiscount < 0 || parsedDiscount > 100) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Discount must be between 0 and 100 percent.' });
    }

    const requestedSerials = items.map((item: unknown) => {
      const serial = typeof (item as { stockSerial?: unknown })?.stockSerial === 'string'
        ? (item as { stockSerial: string }).stockSerial.trim()
        : '';
      return serial;
    });
    if (requestedSerials.some((serial) => !serial) || new Set(requestedSerials.map((serial) => serial.toLowerCase())).size !== requestedSerials.length) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Every checkout item must have one unique serial number.' });
    }

    // 1. Fetch customer and lock each sellable item before calculating the invoice.
    const custReq = new sql.Request(transaction);
    const custRes = await custReq
      .input('custId', sql.Int, customerId)
      .query(`SELECT TOP 1 * FROM dbo.CustomerDetails WHERE id = @custId`);

    if (custRes.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Customer record not found.' });
    }
    const customer = custRes.recordset[0];
    const customerFullName = `${customer.FirstName || ''} ${customer.LastName || ''}`.trim() || 'Retail Client';

    const stockRequest = new sql.Request(transaction);
    const serialParameters = requestedSerials.map((serial, index) => {
      const parameter = `serial${index}`;
      stockRequest.input(parameter, sql.NVarChar(100), serial);
      return `LOWER(StockSerial) = LOWER(@${parameter})`;
    });
    const stockResult = await stockRequest.query(`
      SELECT id, StockSerial, StockName, StockDetails, StockPrice, SupplierName, SuppliersPrice, StockStatus, Warranty, InDate, Encoder
      FROM dbo.StockItems WITH (UPDLOCK, HOLDLOCK)
      WHERE ${serialParameters.join(' OR ')}
    `);
    if (stockResult.recordset.length !== requestedSerials.length) {
      await transaction.rollback();
      return res.status(409).json({ error: 'One or more scanned serials no longer exist.' });
    }

    const stockBySerial = new Map(stockResult.recordset.map((item) => [String(item.StockSerial).toLowerCase(), item]));
    const authoritativeItems = requestedSerials.map((serial) => stockBySerial.get(serial.toLowerCase()));
    if (authoritativeItems.some((item) => !item || !['stored', 'updated'].includes(String(item.StockStatus).toLowerCase()))) {
      await transaction.rollback();
      return res.status(409).json({ error: 'One or more scanned units are no longer available for sale.' });
    }

    // 2. Compute total from database prices, never client-submitted price fields.
    let baseSum = authoritativeItems.reduce((acc, item) => acc + Number(item!.StockPrice), 0);
    if (parsedDiscount > 0) {
      baseSum = baseSum * (1 - parsedDiscount / 100);
    }

    if (paymentTier !== 'Cash' && paymentTier !== '3months' && paymentTier !== '12months') {
      await transaction.rollback();
      return res.status(400).json({ error: 'A valid payment tier is required.' });
    }

    let multiplier = 1.0;
    let paymentMethodName = 'Cash Settlement';
    if (paymentTier === '3months') {
      multiplier = 1.04;
      paymentMethodName = '3-Month Deferred Plan / Credit Card (4% MDR)';
    } else if (paymentTier === '12months') {
      multiplier = 1.15;
      paymentMethodName = '12-Month Financing Plan (15% Financing Premium)';
    }
    const orderTotal = Math.round(baseSum * multiplier * 100) / 100;

    const parsedTendered = amountTendered === undefined || amountTendered === null ? undefined : Number(amountTendered);
    if (parsedTendered !== undefined && (!Number.isFinite(parsedTendered) || parsedTendered < 0)) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Tendered amount must be a non-negative number.' });
    }
    if (paymentTier === 'Cash' && parsedTendered !== undefined && parsedTendered < orderTotal) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Cash tendered is less than the invoice total.' });
    }
    const authoritativeChangeDue = paymentTier === 'Cash' && parsedTendered !== undefined
      ? Math.round((parsedTendered - orderTotal) * 100) / 100
      : undefined;
    const encoder = req.auth!.name;
    const computerName = req.auth!.workstation;

    // 3. Insert into dbo.OrderItems via spOrderItems_Insert
    const orderInsertReq = new sql.Request(transaction);
    orderInsertReq.input('CustomerId', sql.Int, customerId);
    orderInsertReq.input('Remarks', sql.NVarChar(1000), remarks || 'Standard commercial sales transaction');
    orderInsertReq.input('PaymentMethod', sql.NVarChar(1000), paymentMethodName);
    orderInsertReq.input('OrderAmount', sql.Money, orderTotal);
    orderInsertReq.input('OrderDate', sql.DateTime, new Date());
    orderInsertReq.input('Encoder', sql.NVarChar(500), encoder);
    orderInsertReq.input('ComputerName', sql.NVarChar(500), computerName);
    orderInsertReq.output('id', sql.Int);

    const execResult = await orderInsertReq.execute('dbo.spOrderItems_Insert');
    const newOrderId = execResult.output.id;

    if (paymentTier === '3months' || paymentTier === '12months') {
      const termMonths = paymentTier === '3months' ? 3 : 12;
      const monthlyAmortization = Math.round((orderTotal / termMonths) * 100) / 100;
      await new sql.Request(transaction)
        .input('planId', sql.NVarChar(50), `INS-${newOrderId}`)
        .input('orderId', sql.Int, newOrderId)
        .input('customerId', sql.Int, customerId)
        .input('customerName', sql.NVarChar(200), customerFullName)
        .input('totalPrincipal', sql.Money, orderTotal)
        .input('termMonths', sql.Int, termMonths)
        .input('monthlyAmortization', sql.Money, monthlyAmortization)
        .query(`
          INSERT INTO dbo.InstallmentPlans
          (PlanId, OrderId, CustomerId, CustomerName, TotalPrincipal, TermMonths, MonthlyAmortization,
           PaidMonths, RemainingBalance, NextDueDate, Status)
          VALUES
          (@planId, @orderId, @customerId, @customerName, @totalPrincipal, @termMonths, @monthlyAmortization,
           0, @totalPrincipal, DATEADD(MONTH, 1, CAST(GETDATE() AS date)), 'Current')
        `);
    }

    // 4. Liquidate only the rows locked and verified above.
    const itemIds = authoritativeItems.map((item) => Number(item!.id));
    const statusReq = new sql.Request(transaction).input('OrderId', sql.NVarChar(500), String(newOrderId));
    const idParameters = itemIds.map((id, index) => {
      const parameter = `itemId${index}`;
      statusReq.input(parameter, sql.Int, id);
      return `@${parameter}`;
    });
    const statusResult = await statusReq.query(`
      UPDATE dbo.StockItems
      SET StockStatus = 'sold', OrderId = @OrderId
      WHERE id IN (${idParameters.join(', ')}) AND StockStatus IN ('stored', 'updated')
    `);
    if ((statusResult.rowsAffected[0] || 0) !== itemIds.length) {
      throw new Error('Inventory changed during checkout. The transaction was cancelled.');
    }

    // 5. Insert transaction history from authoritative item data.
    for (const it of authoritativeItems) {
        const historyReq = new sql.Request(transaction);
        historyReq.input('CustomerId', sql.Int, customerId);
        historyReq.input('StockSerial', sql.NVarChar(100), it!.StockSerial || '');
        historyReq.input('StockName', sql.NVarChar(100), it!.StockName || '');
        historyReq.input('StockDetails', sql.NVarChar(1000), it!.StockDetails || '');
        historyReq.input('StockPrice', sql.Money, it!.StockPrice || 0);
        historyReq.input('Quantity', sql.Int, 1);
        historyReq.input('SubTotal', sql.Money, it!.StockPrice || 0);
        historyReq.input('Remarks', sql.NVarChar(1000), `Sold under Order #${newOrderId}`);
        historyReq.input('ComputerName', sql.NVarChar(100), computerName);
        historyReq.input('WindowName', sql.NVarChar(100), 'POS Checkout');
        historyReq.input('Warranty', sql.Int, it!.Warranty || 30);

        await historyReq.query(`
          INSERT INTO dbo.TransactionHistory
          (CustomerId, StockSerial, StockName, StockDetails, StockPrice, Quantity, SubTotal, Remarks, ComputerName, WindowName, Warranty)
          VALUES
          (@CustomerId, @StockSerial, @StockName, @StockDetails, @StockPrice, @Quantity, @SubTotal, @Remarks, @ComputerName, @WindowName, @Warranty)
        `);
    }

    await transaction.commit();

    const createdOrder = {
      id: newOrderId,
      customerId,
      customerName: customerFullName,
      customerCompany: customer.Company || undefined,
      customerContact: customer.ContactNumber || '',
      customerAddress: customer.Address || 'Davao City, Philippines',
      remarks: remarks || 'Standard commercial sales transaction',
      paymentMethod: paymentMethodName,
      paymentTier,
      orderAmount: orderTotal,
      amountTendered: parsedTendered,
      changeDue: authoritativeChangeDue,
      discountPercent: parsedDiscount,
      orderDate: new Date().toISOString(),
      encoder,
      computerName,
      listOfSerials: requestedSerials.join(', '),
      items: authoritativeItems.map((item) => ({
        id: item!.id,
        stockSerial: item!.StockSerial || '',
        stockName: item!.StockName || '',
        stockDetails: item!.StockDetails || '',
        stockPrice: Number(item!.StockPrice) || 0,
        supplierName: item!.SupplierName || '',
        suppliersPrice: Number(item!.SuppliersPrice) || 0,
        stockStatus: 'sold',
        warranty: Number(item!.Warranty) || 0,
        inDate: item!.InDate ? new Date(item!.InDate).toISOString() : new Date().toISOString(),
        encoder: item!.Encoder || '',
        orderId: newOrderId,
      })),
    };

    console.log(`[SQLServer] Finalized Sales Invoice #${newOrderId} for ${customerFullName} (Total: ₱${orderTotal.toLocaleString()})`);
    res.status(201).json(createdOrder);
  } catch (err: any) {
    console.error('Error during checkout transaction:', err);
    try {
      await transaction.rollback();
    } catch {}
    res.status(500).json({ error: err.message || 'Transaction checkout failed.' });
  }
});
