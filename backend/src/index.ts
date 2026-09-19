import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { checkConnection } from './db.js';
import { healthRouter } from './routes/health.js';
import { stockRouter } from './routes/stock.js';
import { customerRouter } from './routes/customers.js';
import { ordersRouter } from './routes/orders.js';
import { supplierRouter } from './routes/suppliers.js';
import { quotationRouter } from './routes/quotations.js';
import { backupRouter } from './routes/backup.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, _res, next) => {
  const start = Date.now();
  next();
  const duration = Date.now() - start;
  if (req.path.startsWith('/api')) {
    console.log(`[API] ${req.method} ${req.path} - ${duration}ms`);
  }
});

// API Routes
app.use('/api/health', healthRouter);
app.use('/api/stock', stockRouter);
app.use('/api/customers', customerRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/suppliers', supplierRouter);
app.use('/api/quotations', quotationRouter);
app.use('/api/backup', backupRouter);

// Start server
app.listen(PORT, async () => {
  console.log(`====================================================`);
  console.log(`🚀 EFZ Web App API Server running on port ${PORT}`);
  console.log(`🌐 Endpoints: http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);

  // Initial connection test
  try {
    const status = await checkConnection();
    if (status.connected && status.counts) {
      console.log(`✅ [SQLServer] Connected to ${status.database} on ${status.server}`);
      console.log(`📊 [SQLServer] Inventory: ${status.counts.stockItems.toLocaleString()} units`);
      console.log(`🧾 [SQLServer] Sales Orders: ${status.counts.orderItems.toLocaleString()} orders`);
      console.log(`👥 [SQLServer] Customers: ${status.counts.customers.toLocaleString()} client accounts`);
      console.log(`⚡ [SQLServer] Latency: ${status.latencyMs}ms`);
    } else {
      console.warn(`⚠️ [SQLServer] Connection check failed: ${status.error}`);
    }
  } catch (err: any) {
    console.warn(`⚠️ [SQLServer] Initial probe failed: ${err.message}`);
  }
});
