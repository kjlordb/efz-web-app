import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

export const sqlConfig: sql.config = {
  server: process.env.DB_SERVER || 'LAPTOP-N6BLB75S',
  database: process.env.DB_DATABASE || 'EFZApp',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '12345',
  port: parseInt(process.env.DB_PORT || '1433', 10),
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: {
    max: 20,
    min: 2,
    idleTimeoutMillis: 30000,
  },
  connectionTimeout: 15000,
  requestTimeout: 30000,
};

let pool: sql.ConnectionPool | null = null;
let isConnecting = false;

export async function getPool(): Promise<sql.ConnectionPool> {
  if (pool && pool.connected) {
    return pool;
  }

  if (isConnecting) {
    // Wait briefly if connection attempt is in progress
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (pool && pool.connected) return pool;
  }

  try {
    isConnecting = true;
    console.log(`[SQLServer] Connecting to ${sqlConfig.database} on ${sqlConfig.server}:${sqlConfig.port}...`);
    pool = await new sql.ConnectionPool(sqlConfig).connect();
    console.log(`[SQLServer] Successfully connected to database: ${sqlConfig.database}`);
    return pool;
  } catch (err: any) {
    console.error(`[SQLServer] Connection failed:`, err.message);
    pool = null;
    throw err;
  } finally {
    isConnecting = false;
  }
}

export async function checkConnection(): Promise<{
  connected: boolean;
  server: string;
  database: string;
  latencyMs?: number;
  counts?: {
    stockItems: number;
    orderItems: number;
    customers: number;
    suppliers: number;
    quotations: number;
  };
  error?: string;
}> {
  const start = Date.now();
  try {
    const activePool = await getPool();
    const result = await activePool.request().query(`
      SELECT 
        (SELECT COUNT(*) FROM dbo.StockItems) AS stockCount,
        (SELECT COUNT(*) FROM dbo.OrderItems) AS orderCount,
        (SELECT COUNT(*) FROM dbo.CustomerDetails) AS customerCount,
        (SELECT COUNT(*) FROM dbo.Suppliers) AS supplierCount,
        (SELECT COUNT(*) FROM dbo.QuotationItemHeader) AS quotationCount
    `);

    const latencyMs = Date.now() - start;
    const row = result.recordset[0];

    return {
      connected: true,
      server: String(sqlConfig.server),
      database: String(sqlConfig.database),
      latencyMs,
      counts: {
        stockItems: row.stockCount || 0,
        orderItems: row.orderCount || 0,
        customers: row.customerCount || 0,
        suppliers: row.supplierCount || 0,
        quotations: row.quotationCount || 0,
      },
    };
  } catch (err: any) {
    return {
      connected: false,
      server: String(sqlConfig.server),
      database: String(sqlConfig.database),
      latencyMs: Date.now() - start,
      error: err.message,
    };
  }
}

export { sql };
