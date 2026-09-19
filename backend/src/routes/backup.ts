import { Router } from 'express';
import { getPool } from '../db.js';

export const backupRouter = Router();

// POST /api/backup - Execute official SQL Server DbBackup stored procedure
backupRouter.post('/', async (req, res) => {
  try {
    const pool = await getPool();
    const backupDir = req.body?.backupDirectory || 'C:\\DbBackup';
    console.log(`[SQLServer] Triggering dbo.DbBackup routine into ${backupDir}...`);
    
    const result = await pool.request()
      .input('BackupDirectory', backupDir)
      .execute('dbo.DbBackup');

    const row = result.recordset?.[0] || {};
    const destination = row.BackupFilePath || `${backupDir}\\EFZApp.bak`;

    res.json({
      success: true,
      message: 'Database backup successfully generated via dbo.DbBackup.',
      destination,
      timestamp: row.BackupTimestamp || new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Error during DbBackup:', err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});
