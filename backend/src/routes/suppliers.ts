import { Router } from 'express';
import { getPool, sql } from '../db.js';
import { requirePermission } from '../auth.js';

export const supplierRouter = Router();

// GET /api/suppliers - List suppliers with active stock units
supplierRouter.get('/', requirePermission('VIEW_INVENTORY'), async (req, res) => {
  try {
    const pool = await getPool();
    const { search } = req.query;

    const request = pool.request();
    let query = `
      SELECT 
        s.id,
        s.SupplierName,
        s.SupplierAddress,
        s.SupplierEmail,
        s.SupplierContact,
        (
          SELECT COUNT(*) 
          FROM dbo.StockItems 
          WHERE SupplierName = s.SupplierName AND StockStatus = 'stored'
        ) AS activeStockUnits
      FROM dbo.Suppliers s
      WHERE 1=1
    `;

    if (search && typeof search === 'string' && search.trim()) {
      request.input('search', sql.NVarChar, `%${search.trim()}%`);
      query += ` AND (
        s.SupplierName LIKE @search OR
        s.SupplierAddress LIKE @search OR
        s.SupplierEmail LIKE @search OR
        s.SupplierContact LIKE @search
      )`;
    }

    query += ` ORDER BY s.SupplierName ASC`;

    const result = await request.query(query);

    const suppliers = result.recordset.map((row) => ({
      id: row.id,
      supplierName: row.SupplierName || '',
      supplierAddress: row.SupplierAddress || '',
      supplierEmail: row.SupplierEmail || '',
      supplierContact: row.SupplierContact || '',
      activeStockUnits: Number(row.activeStockUnits) || 0,
    }));

    res.json(suppliers);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/suppliers - Register new supplier
supplierRouter.post('/', requirePermission('MANAGE_SUPPLIERS'), async (req, res) => {
  try {
    const pool = await getPool();
    const { supplierName, supplierAddress, supplierEmail, supplierContact } = req.body;

    if (!supplierName) {
      return res.status(400).json({ error: 'Supplier name is required.' });
    }

    const request = pool.request();
    request.input('SupplierName', sql.NVarChar(100), supplierName.trim());
    request.input('SupplierAddress', sql.NVarChar(1000), supplierAddress || '');
    request.input('SupplierEmail', sql.NVarChar(100), supplierEmail || '');
    request.input('SupplierContact', sql.NVarChar(100), supplierContact || '');
    request.output('id', sql.Int);

    const result = await request.execute('dbo.spSuppliers_Insert');
    const newId = result.output.id;

    res.status(201).json({
      id: newId,
      supplierName,
      supplierAddress: supplierAddress || '',
      supplierEmail: supplierEmail || '',
      supplierContact: supplierContact || '',
      activeStockUnits: 0,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
