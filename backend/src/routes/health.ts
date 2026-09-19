import { Router } from 'express';
import { checkConnection } from '../db.js';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  try {
    const status = await checkConnection();
    if (status.connected) {
      res.json({
        status: 'online',
        ...status,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        status: 'offline',
        ...status,
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
