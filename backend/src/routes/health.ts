import { Router } from 'express';
import { checkConnection } from '../db.js';

export const healthRouter = Router();

healthRouter.get('/', async (req, res) => {
  try {
    const status = await checkConnection();
    if (status.connected) {
      const canViewDatabaseMetadata = req.auth?.role === 'admin';
      res.json({
        status: 'online',
        connected: true,
        ...(canViewDatabaseMetadata ? {
          server: status.server,
          database: status.database,
          latencyMs: status.latencyMs,
          counts: status.counts,
        } : {}),
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        status: 'offline',
        connected: false,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      connected: false,
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});
