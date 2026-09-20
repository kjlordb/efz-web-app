import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireAuth } from './auth.js';
import { authRouter } from './routes/auth.js';
import { healthRouter } from './routes/health.js';
import { stockRouter } from './routes/stock.js';
import { customerRouter } from './routes/customers.js';
import { ordersRouter } from './routes/orders.js';
import { supplierRouter } from './routes/suppliers.js';
import { quotationRouter } from './routes/quotations.js';
import { backupRouter } from './routes/backup.js';
import { reportsRouter } from './routes/reports.js';
import { installmentRouter } from './routes/installments.js';
import { rmaRouter } from './routes/rma.js';
import { createRateLimiter, securityHeaders } from './security.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const configuredOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(securityHeaders);
app.use(cors({
  origin(origin, callback) {
    if (!origin || configuredOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Origin is not allowed by CORS policy.'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Authorization', 'Content-Type'],
  maxAge: 600,
}));
app.use(express.json({ limit: '100kb' }));
app.use('/api', createRateLimiter({ windowMs: 60_000, maxRequests: 300 }));

app.use('/api/auth', authRouter);
app.use('/api', requireAuth);
app.use('/api/health', healthRouter);
app.use('/api/stock', stockRouter);
app.use('/api/customers', customerRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/suppliers', supplierRouter);
app.use('/api/quotations', quotationRouter);
app.use('/api/backup', backupRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/installments', installmentRouter);
app.use('/api/rma', rmaRouter);

app.use((_err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(500).json({ error: 'The request could not be completed.' });
});
