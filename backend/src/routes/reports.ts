import { Router } from 'express';
import { requirePermission } from '../auth.js';
import { getPool } from '../db.js';

export const reportsRouter = Router();

reportsRouter.get('/dashboard', requirePermission('VIEW_DASHBOARD'), async (_req, res) => {
  try {
    const pool = await getPool();
    const [summaryResult, categoriesResult] = await Promise.all([
      pool.request().query(`
        SELECT
          (SELECT COUNT(*) FROM dbo.OrderItems) AS totalOrders,
          (SELECT COALESCE(SUM(OrderAmount), 0) FROM dbo.OrderItems) AS totalRevenue,
          (SELECT COUNT(*) FROM dbo.CustomerDetails) AS totalCustomers,
          (SELECT COUNT(*) FROM dbo.StockItems WHERE StockStatus IN ('stored', 'updated')) AS activeStockUnits,
          (SELECT COALESCE(SUM(StockPrice), 0) FROM dbo.StockItems WHERE StockStatus IN ('stored', 'updated')) AS activeInventoryRetailValue,
          (SELECT COALESCE(SUM(SuppliersPrice), 0) FROM dbo.StockItems WHERE StockStatus IN ('stored', 'updated')) AS activeInventoryCostValue
      `),
      pool.request().query(`
        SELECT StockName AS category, COUNT(*) AS units
        FROM dbo.StockItems
        WHERE StockStatus IN ('stored', 'updated') AND StockName IS NOT NULL AND StockName != ''
        GROUP BY StockName
        ORDER BY COUNT(*) DESC
      `),
    ]);
    const summary = summaryResult.recordset[0];
    res.json({
      totalOrders: Number(summary.totalOrders) || 0,
      totalRevenue: Number(summary.totalRevenue) || 0,
      totalCustomers: Number(summary.totalCustomers) || 0,
      activeStockUnits: Number(summary.activeStockUnits) || 0,
      activeInventoryRetailValue: Number(summary.activeInventoryRetailValue) || 0,
      activeInventoryCostValue: Number(summary.activeInventoryCostValue) || 0,
      categories: categoriesResult.recordset.map((row) => ({
        category: String(row.category),
        units: Number(row.units) || 0,
      })),
    });
  } catch (error) {
    console.error('Error loading dashboard report:', error);
    res.status(500).json({ error: 'Unable to load dashboard reporting data.' });
  }
});
