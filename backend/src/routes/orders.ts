import { Router } from 'express';
import { getPool, sql } from '../db.js';

export const ordersRouter = Router();

// GET /api/orders - List sales invoices with customer metadata and liquidated units
ordersRouter.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    const {
      startDate,
      endDate,
      serial,
      customerId,
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

    if (serial && typeof serial === 'string') {
      const q = serial.toLowerCase().trim();
      orders = orders.filter((o) =>
        o.listOfSerials.toLowerCase().includes(q) ||
        o.items.some((i: any) => i.stockSerial.toLowerCase().includes(q))
      );
    }

    res.json(orders);
  } catch (err: any) {
    console.error('Error in GET /api/orders:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/orders - Transactional checkout & stock liquidation
ordersRouter.post('/', async (req, res) => {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    const {
      customerId,
      paymentTier,
      remarks,
      encoder = 'Sales Associate',
      computerName = 'POS-TERMINAL-01',
      amountTendered,
      changeDue,
      discountPercent = 0,
      items = [],
    } = req.body;

    if (!customerId) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Customer ID is required.' });
    }
    if (!items || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Transaction cart cannot be empty.' });
    }

    // 1. Fetch Customer details
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

    // 2. Compute Total Price
    let baseSum = items.reduce((acc: number, it: any) => acc + (Number(it.stockPrice) || 0), 0);
    if (discountPercent > 0) {
      baseSum = baseSum * (1 - discountPercent / 100);
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

    // 4. Liquidate Serialized Items (Update StockStatus='sold', OrderId=newOrderId)
    const serialsList = items.map((i: any) => i.stockSerial).filter(Boolean);
    if (serialsList.length > 0) {
      const serialsCsv = serialsList.join(',');
      const statusReq = new sql.Request(transaction);
      statusReq.input('StockSerial', sql.NVarChar(sql.MAX), serialsCsv);
      statusReq.input('OrderId', sql.NVarChar(500), String(newOrderId));
      await statusReq.execute('dbo.spStockItems_UpdateSerialStatus');

      // 5. Insert into dbo.TransactionHistory
      for (const it of items) {
        const historyReq = new sql.Request(transaction);
        historyReq.input('CustomerId', sql.Int, customerId);
        historyReq.input('StockSerial', sql.NVarChar(100), it.stockSerial || '');
        historyReq.input('StockName', sql.NVarChar(100), it.stockName || '');
        historyReq.input('StockDetails', sql.NVarChar(1000), it.stockDetails || '');
        historyReq.input('StockPrice', sql.Money, it.stockPrice || 0);
        historyReq.input('Quantity', sql.Int, 1);
        historyReq.input('SubTotal', sql.Money, it.stockPrice || 0);
        historyReq.input('Remarks', sql.NVarChar(1000), `Sold under Order #${newOrderId}`);
        historyReq.input('ComputerName', sql.NVarChar(100), computerName);
        historyReq.input('WindowName', sql.NVarChar(100), 'POS Checkout');
        historyReq.input('Warranty', sql.Int, it.warranty || 30);

        await historyReq.query(`
          INSERT INTO dbo.TransactionHistory
          (CustomerId, StockSerial, StockName, StockDetails, StockPrice, Quantity, SubTotal, Remarks, ComputerName, WindowName, Warranty)
          VALUES
          (@CustomerId, @StockSerial, @StockName, @StockDetails, @StockPrice, @Quantity, @SubTotal, @Remarks, @ComputerName, @WindowName, @Warranty)
        `);
      }
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
      amountTendered,
      changeDue,
      discountPercent,
      orderDate: new Date().toISOString(),
      encoder,
      computerName,
      listOfSerials: serialsList.join(', '),
      items,
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
