import { Router } from 'express';
import { getPool } from '../db.js';

export const backupRouter = Router();

// POST /api/backup - Execute official SQL Server DbBackup stored procedure
backupRouter.post('/', async (_req, res) => {
  try {
    const pool = await getPool();
    console.log('[SQLServer] Triggering dbo.DbBackup routine...');
    await pool.request().execute('dbo.DbBackup');

    res.json({
      success: true,
      message: 'Database backup successfully generated via dbo.DbBackup.',
      destination: 'C:\\DbBackup\\EFZApp.bak',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Error during DbBackup:', err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});
