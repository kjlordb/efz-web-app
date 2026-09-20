import { Router } from 'express';
import { getPool, sql } from '../db.js';
import { requirePermission } from '../auth.js';

export const stockRouter = Router();

// GET /api/stock/stats - Get complete breakdown of inventory numbers
stockRouter.get('/stats', requirePermission('VIEW_INVENTORY'), async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT 
        COUNT(*) AS totalUnits,
        SUM(CASE WHEN LOWER(StockStatus) != 'sold' THEN 1 ELSE 0 END) AS legacyUnsoldUnits,
        SUM(CASE WHEN StockStatus IN ('stored', 'updated') THEN 1 ELSE 0 END) AS activeSellableUnits,
        SUM(CASE WHEN StockStatus = 'stored' THEN 1 ELSE 0 END) AS storedUnits,
        SUM(CASE WHEN StockStatus = 'updated' THEN 1 ELSE 0 END) AS updatedUnits,
        SUM(CASE WHEN StockStatus = 'Deleted' THEN 1 ELSE 0 END) AS deletedUnits,
        SUM(CASE WHEN StockStatus = 'sold' THEN 1 ELSE 0 END) AS soldUnits,
        COALESCE(SUM(CASE WHEN StockStatus IN ('stored', 'updated') THEN StockPrice ELSE 0 END), 0) AS activeInventoryRetailValue,
        COALESCE(SUM(CASE WHEN StockStatus IN ('stored', 'updated') THEN SuppliersPrice ELSE 0 END), 0) AS activeInventoryCostValue
      FROM dbo.StockItems
    `);
    const stats = result.recordset[0];
    if (req.auth?.role !== 'admin' && req.auth?.role !== 'inventory') {
      delete stats.activeInventoryCostValue;
    }
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stock - List stock items with filtering and pagination
stockRouter.get('/', requirePermission('VIEW_INVENTORY'), async (req, res) => {
  try {
    const pool = await getPool();
    const {
      status,
      category,
      search,
      includeDeleted,
      limit = '200',
      offset = '0',
      sort = 'desc',
    } = req.query;

    const request = pool.request();
    let query = `
      SELECT 
        id,
        StockSerial,
        StockName,
        StockDetails,
        StockPrice,
        SupplierName,
        SuppliersPrice,
        StockStatus,
        Warranty,
        InDate,
        Encoder,
        OrderId,
        Remarks
      FROM dbo.StockItems
      WHERE 1=1
    `;

    // Filter by StockStatus:
    // - 'unsold' or 'legacy-unsold': exactly matches legacy desktop app "Stock Items" list (4,248 units)
    // - 'stored': active sellable items ('stored' and 'updated' - 3,498 units)
    // - 'sold': historically liquidated items (37,686 units)
    // - 'Deleted': decommissioned items (750 units)
    // - 'all': all master records (41,934 units)
    if (status === 'unsold' || status === 'legacy-unsold') {
      query += ` AND LOWER(StockStatus) != 'sold'`;
    } else if (status === 'stored') {
      query += ` AND StockStatus IN ('stored', 'updated')`;
    } else if (status && status !== 'all') {
      request.input('status', sql.NVarChar, status);
      query += ` AND StockStatus = @status`;
    } else if (!includeDeleted || includeDeleted === 'false') {
      query += ` AND (StockStatus != 'Deleted' OR StockStatus IS NULL)`;
    }

    if (category && typeof category === 'string' && category !== 'All Stocks') {
      request.input('category', sql.NVarChar, category);
      query += ` AND LOWER(StockName) = LOWER(@category)`;
    }

    if (search && typeof search === 'string' && search.trim()) {
      request.input('search', sql.NVarChar, `%${search.trim()}%`);
      query += ` AND (
        StockSerial LIKE @search OR
        StockDetails LIKE @search OR
        StockName LIKE @search OR
        SupplierName LIKE @search
      )`;
    }

    const parsedLimit = Math.min(Math.max(parseInt(limit as string, 10) || 50, 1), 5000);
    const parsedOffset = Math.max(parseInt(offset as string, 10) || 0, 0);
    const orderDirection = String(sort).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    request.input('offset', sql.Int, parsedOffset);
    request.input('limit', sql.Int, parsedLimit);

    query += ` ORDER BY id ${orderDirection} OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;

    const result = await request.query(query);

    const canViewCosts = req.auth?.role === 'admin' || req.auth?.role === 'inventory';
    const items = result.recordset.map((row) => ({
      id: row.id,
      stockSerial: row.StockSerial || '',
      stockName: row.StockName || '',
      stockDetails: row.StockDetails || '',
      stockPrice: Number(row.StockPrice) || 0,
      supplierName: row.SupplierName || '',
      suppliersPrice: canViewCosts ? Number(row.SuppliersPrice) || 0 : 0,
      stockStatus: row.StockStatus || 'stored',
      warranty: Number(row.Warranty) || 0,
      inDate: row.InDate ? new Date(row.InDate).toISOString() : new Date().toISOString(),
      encoder: row.Encoder || '',
      orderId: row.OrderId ? Number(row.OrderId) : undefined,
    }));

    res.json(items);
  } catch (err: any) {
    console.error('Error in GET /api/stock:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stock/categories - List distinct category names
stockRouter.get('/categories', requirePermission('VIEW_INVENTORY'), async (_req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT DISTINCT StockName 
      FROM dbo.StockItems 
      WHERE StockName IS NOT NULL AND StockName != '' 
      ORDER BY StockName
    `);
    const categories = result.recordset.map((r) => r.StockName);
    res.json(categories);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stock/serial/:serial - Instant barcode search
stockRouter.get('/serial/:serial', requirePermission('VIEW_INVENTORY'), async (req, res) => {
  try {
    const pool = await getPool();
    const serial = String(req.params.serial);
    const result = await pool
      .request()
      .input('serial', sql.NVarChar, serial.trim())
      .query(`
        SELECT TOP 1 
          id, StockSerial, StockName, StockDetails, StockPrice, 
          SupplierName, SuppliersPrice, StockStatus, Warranty, 
          InDate, Encoder, OrderId, Remarks
        FROM dbo.StockItems
        WHERE LOWER(StockSerial) = LOWER(@serial)
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: `Serial ${serial} not found in inventory.` });
    }

    const row = result.recordset[0];
    res.json({
      id: row.id,
      stockSerial: row.StockSerial || '',
      stockName: row.StockName || '',
      stockDetails: row.StockDetails || '',
      stockPrice: Number(row.StockPrice) || 0,
      supplierName: row.SupplierName || '',
      suppliersPrice: req.auth?.role === 'admin' || req.auth?.role === 'inventory' ? Number(row.SuppliersPrice) || 0 : 0,
      stockStatus: row.StockStatus || 'stored',
      warranty: Number(row.Warranty) || 0,
      inDate: row.InDate ? new Date(row.InDate).toISOString() : new Date().toISOString(),
      encoder: row.Encoder || '',
      orderId: row.OrderId ? Number(row.OrderId) : undefined,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/stock - Insert new inward stock item
stockRouter.post('/', requirePermission('MANAGE_INVENTORY'), async (req, res) => {
  try {
    const pool = await getPool();
    const {
      stockSerial,
      stockName,
      stockDetails,
      stockPrice,
      supplierName,
      suppliersPrice,
      warranty,
      encoder = 'Sales Associate',
    } = req.body;

    if (!stockSerial || !stockName || stockPrice === undefined) {
      return res.status(400).json({ error: 'Serial, category name, and price are required.' });
    }

    // Check duplicate
    const checkDup = await pool
      .request()
      .input('serial', sql.NVarChar, stockSerial.trim())
      .query(`
        SELECT TOP 1 id FROM dbo.StockItems 
        WHERE LOWER(StockSerial) = LOWER(@serial) AND (StockStatus != 'Deleted' OR StockStatus IS NULL)
      `);

    if (checkDup.recordset.length > 0) {
      return res.status(409).json({ error: `Serial "${stockSerial}" is already active in inventory.` });
    }

    const request = pool.request();
    request.input('StockSerial', sql.NVarChar(100), stockSerial.trim());
    request.input('StockName', sql.NVarChar(100), stockName.trim());
    request.input('StockDetails', sql.NVarChar(1000), stockDetails || '-');
    request.input('StockStatus', sql.NVarChar(100), 'stored');
    request.input('StockPrice', sql.Money, stockPrice);
    request.input('SupplierName', sql.NVarChar(100), supplierName || '-');
    request.input('Warranty', sql.Int, warranty || 30);
    request.input('SuppliersPrice', sql.Money, suppliersPrice || 0);
    request.input('InDate', sql.Date, new Date());
    request.output('id', sql.Int);

    const execResult = await request.execute('dbo.spStockItems_Insert');
    const newId = execResult.output.id;

    res.status(201).json({
      id: newId,
      stockSerial,
      stockName,
      stockDetails,
      stockPrice,
      supplierName,
      suppliersPrice: suppliersPrice || 0,
      stockStatus: 'stored',
      warranty: warranty || 30,
      inDate: new Date().toISOString(),
      encoder,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/stock/:id - Update stock item
stockRouter.put('/:id', requirePermission('MANAGE_INVENTORY'), async (req, res) => {
  try {
    const pool = await getPool();
    const id = parseInt(String(req.params.id), 10);
    const { stockPrice, stockDetails, stockStatus, warranty } = req.body;

    const request = pool.request().input('id', sql.Int, id);
    const updates: string[] = [];

    if (stockPrice !== undefined) {
      request.input('stockPrice', sql.Money, stockPrice);
      updates.push('StockPrice = @stockPrice');
    }
    if (stockDetails !== undefined) {
      request.input('stockDetails', sql.NVarChar, stockDetails);
      updates.push('StockDetails = @stockDetails');
    }
    if (stockStatus !== undefined) {
      request.input('stockStatus', sql.NVarChar, stockStatus);
      updates.push('StockStatus = @stockStatus');
    }
    if (warranty !== undefined) {
      request.input('warranty', sql.Int, warranty);
      updates.push('Warranty = @warranty');
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields provided to update.' });
    }

    await request.query(`UPDATE dbo.StockItems SET ${updates.join(', ')} WHERE id = @id`);
    res.json({ message: 'Stock item updated successfully.', id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/stock/:id - Soft-delete stock item
stockRouter.delete('/:id', requirePermission('MANAGE_INVENTORY'), async (req, res) => {
  try {
    const pool = await getPool();
    const id = parseInt(String(req.params.id), 10);
    await pool
      .request()
      .input('id', sql.Int, id)
      .query(`UPDATE dbo.StockItems SET StockStatus = 'Deleted' WHERE id = @id`);

    res.json({ message: 'Stock item marked as Deleted.', id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/stock/batch-price - Bulk price revision
stockRouter.post('/batch-price', requirePermission('MANAGE_INVENTORY'), async (req, res) => {
  try {
    const pool = await getPool();
    const { category, details, newPrice } = req.body;

    if (newPrice === undefined || isNaN(newPrice)) {
      return res.status(400).json({ error: 'Valid new price is required.' });
    }

    const request = pool.request().input('newPrice', sql.Money, newPrice);
    let condition = "WHERE StockStatus = 'stored'";

    if (category && category !== 'All Stocks') {
      request.input('category', sql.NVarChar, category);
      condition += ' AND LOWER(StockName) = LOWER(@category)';
    }

    if (details && details.trim()) {
      request.input('details', sql.NVarChar, `%${details.trim()}%`);
      condition += ' AND StockDetails LIKE @details';
    }

    const result = await request.query(`
      UPDATE dbo.StockItems 
      SET StockPrice = @newPrice 
      ${condition}
    `);

    res.json({
      message: 'Batch price update complete.',
      rowsAffected: result.rowsAffected[0] || 0,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
