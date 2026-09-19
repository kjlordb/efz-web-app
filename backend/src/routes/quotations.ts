import { Router } from 'express';
import { getPool, sql } from '../db.js';

export const quotationRouter = Router();

// GET /api/quotations - List quotations with item details
quotationRouter.get('/', async (_req, res) => {
  try {
    const pool = await getPool();
    const headersResult = await pool.request().query(`
      SELECT TOP 50
        q.QuotationId,
        q.CustomerId,
        q.Remarks,
        q.PayMethod1,
        q.PayMethod2,
        q.PayMethod3,
        q.QuotationDate,
        q.QuotationStatus,
        q.ComputerName,
        q.Encoder,
        c.FirstName,
        c.LastName,
        c.Company,
        c.ContactNumber,
        c.Address
      FROM dbo.QuotationItemHeader q
      LEFT JOIN dbo.CustomerDetails c ON q.CustomerId = c.id
      ORDER BY q.QuotationId DESC
    `);

    const headers = headersResult.recordset;
    if (headers.length === 0) return res.json([]);

    const quoteIds = headers.map((h) => h.QuotationId);
    const detailsResult = await pool.request().query(`
      SELECT 
        id, QuotationId, StockName, StockDetails, SupplierName, 
        Quantity, StockPrice, SubTotal, QuotationDate
      FROM dbo.QuotationItemDetails
      WHERE QuotationId IN (${quoteIds.join(',')})
    `);

    const detailsByQuote: Record<string, any[]> = {};
    for (const d of detailsResult.recordset) {
      const qid = String(d.QuotationId);
      if (!detailsByQuote[qid]) detailsByQuote[qid] = [];
      detailsByQuote[qid].push({
        id: d.id,
        stockName: d.StockName || '',
        stockDetails: d.StockDetails || '',
        quantity: Number(d.Quantity) || 1,
        stockPrice: Number(d.StockPrice) || 0,
        subTotal: Number(d.SubTotal) || 0,
      });
    }

    const quotations = headers.map((row) => {
      const items = detailsByQuote[String(row.QuotationId)] || [];
      const fullName = `${row.FirstName || ''} ${row.LastName || ''}`.trim() || 'Commercial Client';
      const subtotal = items.reduce((acc, it) => acc + it.subTotal, 0);

      return {
        id: row.QuotationId,
        customerId: row.CustomerId,
        customerName: fullName,
        customerCompany: row.Company || undefined,
        customerContact: row.ContactNumber || '',
        customerAddress: row.Address || 'Davao City, Philippines',
        remarks: row.Remarks || '',
        quotationDate: row.QuotationDate ? new Date(row.QuotationDate).toISOString() : new Date().toISOString(),
        quotationStatus: row.QuotationStatus || 'Draft',
        encoder: row.Encoder || 'Sales Associate',
        computerName: row.ComputerName || 'POS-TERMINAL-01',
        subtotal,
        p3Cash: Number(row.PayMethod3) || subtotal,
        p2ThreeMonths: Number(row.PayMethod2) || Math.round(subtotal * 1.04 * 100) / 100,
        p1TwelveMonths: Number(row.PayMethod1) || Math.round(subtotal * 1.15 * 100) / 100,
        items,
      };
    });

    res.json(quotations);
  } catch (err: any) {
    console.error('Error in GET /api/quotations:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/quotations - Create pro-forma quotation
quotationRouter.post('/', async (req, res) => {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    const {
      customerId,
      remarks,
      encoder = 'Sales Associate',
      computerName = 'POS-TERMINAL-01',
      items = [],
    } = req.body;

    if (!customerId || !items || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Customer ID and quotation line items are required.' });
    }

    const subtotal = items.reduce((acc: number, it: any) => acc + (it.stockPrice * it.quantity), 0);
    const p3 = subtotal;
    const p2 = Math.round(subtotal * 1.04 * 100) / 100;
    const p1 = Math.round(subtotal * 1.15 * 100) / 100;

    // Insert Header
    const headerReq = new sql.Request(transaction);
    headerReq.input('CustomerId', sql.Int, customerId);
    headerReq.input('Remarks', sql.NVarChar(1000), remarks || 'Commercial Pro-Forma Quotation');
    headerReq.input('PayMethod1', sql.Money, p1);
    headerReq.input('PayMethod2', sql.Money, p2);
    headerReq.input('PayMethod3', sql.Money, p3);
    headerReq.input('QuotationDate', sql.DateTime, new Date());
    headerReq.input('QuotationStatus', sql.NVarChar(100), 'Active');
    headerReq.input('ComputerName', sql.NVarChar(100), computerName);
    headerReq.input('Encoder', sql.NVarChar(100), encoder);

    const headerResult = await headerReq.query(`
      INSERT INTO dbo.QuotationItemHeader
      (CustomerId, Remarks, PayMethod1, PayMethod2, PayMethod3, QuotationDate, QuotationStatus, ComputerName, Encoder)
      OUTPUT INSERTED.QuotationId
      VALUES
      (@CustomerId, @Remarks, @PayMethod1, @PayMethod2, @PayMethod3, @QuotationDate, @QuotationStatus, @ComputerName, @Encoder)
    `);

    const newQuoteId = headerResult.recordset[0].QuotationId;

    // Insert Details
    for (const it of items) {
      const lineReq = new sql.Request(transaction);
      lineReq.input('QuotationId', sql.Int, newQuoteId);
      lineReq.input('StockName', sql.NVarChar(100), it.stockName || 'Hardware Component');
      lineReq.input('StockDetails', sql.NVarChar(1000), it.stockDetails || '-');
      lineReq.input('SupplierName', sql.NVarChar(1000), it.supplierName || '-');
      lineReq.input('Quantity', sql.Int, it.quantity || 1);
      lineReq.input('StockPrice', sql.Money, it.stockPrice || 0);
      lineReq.input('SubTotal', sql.Money, (it.stockPrice || 0) * (it.quantity || 1));
      lineReq.input('QuotationDate', sql.DateTime, new Date());

      await lineReq.query(`
        INSERT INTO dbo.QuotationItemDetails
        (QuotationId, StockName, StockDetails, SupplierName, Quantity, StockPrice, SubTotal, QuotationDate)
        VALUES
        (@QuotationId, @StockName, @StockDetails, @SupplierName, @Quantity, @StockPrice, @SubTotal, @QuotationDate)
      `);
    }

    await transaction.commit();

    res.status(201).json({
      id: newQuoteId,
      customerId,
      remarks,
      quotationDate: new Date().toISOString(),
      quotationStatus: 'Active',
      encoder,
      computerName,
      subtotal,
      p3Cash: p3,
      p2ThreeMonths: p2,
      p1TwelveMonths: p1,
      items,
    });
  } catch (err: any) {
    try {
      await transaction.rollback();
    } catch {}
    res.status(500).json({ error: err.message });
  }
});
