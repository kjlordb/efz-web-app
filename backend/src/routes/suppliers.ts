import { Router } from 'express';
import { getPool, sql } from '../db.js';

export const supplierRouter = Router();

// GET /api/suppliers - List suppliers with active stock units
supplierRouter.get('/', async (_req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
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
      ORDER BY s.SupplierName ASC
    `);

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
supplierRouter.post('/', async (req, res) => {
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
