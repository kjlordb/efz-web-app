import { checkConnection } from './db.js';
import { app } from './app.js';

const PORT = parseInt(process.env.PORT || '5000', 10);

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
