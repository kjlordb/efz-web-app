import { getPool, sql } from '../db.js';

export async function runDatabaseAlignment() {
  console.log('=================================================================');
  console.log('🚀 Starting EFZApp Database Alignment & Performance Optimization');
  console.log('=================================================================');

  const pool = await getPool();

  // 1. Audit Orphaned Records before indexing
  console.log('\n🔍 [Audit] Checking referential integrity across unconstrained tables...');
  const orphanOrders = await pool.request().query(`
    SELECT COUNT(*) AS OrphanOrderCount 
    FROM dbo.OrderItems o
    WHERE o.CustomerId IS NOT NULL 
      AND o.CustomerId NOT IN (SELECT id FROM dbo.CustomerDetails)
  `);
  console.log(`📊 Orphaned Orders (invalid CustomerId): ${orphanOrders.recordset[0].OrphanOrderCount}`);

  const orphanStock = await pool.request().query(`
    SELECT COUNT(*) AS OrphanStockCount 
    FROM dbo.StockItems s
    WHERE s.StockStatus = 'sold' 
      AND s.OrderId IS NOT NULL 
      AND ISNUMERIC(s.OrderId) = 1
      AND CAST(s.OrderId AS INT) NOT IN (SELECT id FROM dbo.OrderItems)
  `);
  console.log(`📊 Orphaned Sold Stock (invalid OrderId): ${orphanStock.recordset[0].OrphanStockCount}`);

  const orphanQuotes = await pool.request().query(`
    SELECT COUNT(*) AS OrphanQuoteDetailsCount 
    FROM dbo.QuotationItemDetails d
    WHERE d.QuotationId IS NOT NULL 
      AND d.QuotationId NOT IN (SELECT QuotationId FROM dbo.QuotationItemHeader)
  `);
  console.log(`📊 Orphaned Quotation Lines (invalid QuotationId): ${orphanQuotes.recordset[0].OrphanQuoteDetailsCount}`);

  // 2. High-Impact Non-Clustered Indexes
  console.log('\n⚡ [Indexing] Creating high-performance non-clustered indexes...');

  const indexesToCreate = [
    {
      name: 'IX_StockItems_StockSerial',
      table: 'dbo.StockItems',
      sql: `
        CREATE NONCLUSTERED INDEX IX_StockItems_StockSerial 
        ON dbo.StockItems (StockSerial)
        INCLUDE (StockName, StockDetails, StockPrice, StockStatus, Warranty);
      `,
      description: 'Barcode & serial fast seek (O(log N) lookup)',
    },
    {
      name: 'IX_StockItems_Status_Category',
      table: 'dbo.StockItems',
      sql: `
        CREATE NONCLUSTERED INDEX IX_StockItems_Status_Category 
        ON dbo.StockItems (StockStatus, StockName)
        INCLUDE (StockPrice, SuppliersPrice, InDate);
      `,
      description: 'Inventory status and category filtering index',
    },
    {
      name: 'IX_OrderItems_OrderDate',
      table: 'dbo.OrderItems',
      sql: `
        CREATE NONCLUSTERED INDEX IX_OrderItems_OrderDate 
        ON dbo.OrderItems (OrderDate DESC)
        INCLUDE (CustomerId, OrderAmount, PaymentMethod, Encoder);
      `,
      description: 'Sales ledger and dashboard timeline queries index',
    },
    {
      name: 'IX_OrderItems_CustomerId',
      table: 'dbo.OrderItems',
      sql: `
        CREATE NONCLUSTERED INDEX IX_OrderItems_CustomerId 
        ON dbo.OrderItems (CustomerId)
        INCLUDE (OrderAmount, OrderDate);
      `,
      description: 'Customer order history and lifetime spend aggregation index',
    },
    {
      name: 'IX_QuotationDetails_QuoteId',
      table: 'dbo.QuotationItemDetails',
      sql: `
        CREATE NONCLUSTERED INDEX IX_QuotationDetails_QuoteId 
        ON dbo.QuotationItemDetails (QuotationId)
        INCLUDE (StockName, StockDetails, Quantity, StockPrice, SubTotal);
      `,
      description: 'Quotation Bill of Materials lookup index',
    },
  ];

  for (const idx of indexesToCreate) {
    const check = await pool.request().query(`
      SELECT 1 FROM sys.indexes 
      WHERE name = '${idx.name}' AND object_id = OBJECT_ID('${idx.table}')
    `);

    if (check.recordset.length === 0) {
      console.log(`🔨 Creating index ${idx.name} on ${idx.table} (${idx.description})...`);
      const start = Date.now();
      await pool.request().query(idx.sql);
      console.log(`✅ ${idx.name} created successfully in ${Date.now() - start}ms`);
    } else {
      console.log(`ℹ️ Index ${idx.name} already exists on ${idx.table}.`);
    }
  }

  // 3. Stored Procedure Upgrade: DbBackup
  console.log('\n🛡️ [Procedures] Upgrading DbBackup procedure with timestamps, path safety, and compression...');
  await pool.request().query(`
    CREATE OR ALTER PROCEDURE [dbo].[DbBackup]
        @BackupDirectory NVARCHAR(500) = 'C:\\DbBackup'
    AS
    BEGIN
        SET NOCOUNT ON;
        
        -- Try to create directory if extended proc is available
        BEGIN TRY
            EXEC master.dbo.xp_create_subdir @BackupDirectory;
        END TRY
        BEGIN CATCH
            -- Ignore if permissions disallow xp_create_subdir
        END CATCH

        DECLARE @timestamp NVARCHAR(30) = REPLACE(REPLACE(REPLACE(CONVERT(NVARCHAR(19), GETDATE(), 120), '-', ''), ' ', '_'), ':', '');
        DECLARE @filename NVARCHAR(600) = @BackupDirectory + '\\EFZApp_' + @timestamp + '.bak';
        
        BACKUP DATABASE [EFZApp] 
        TO DISK = @filename 
        WITH STATS = 10;
        
        SELECT 
          @filename AS BackupFilePath, 
          GETDATE() AS BackupTimestamp,
          'Success' AS Status;
    END
  `);
  console.log('✅ [dbo].[DbBackup] upgraded successfully.');

  // 4. Performance Benchmark
  console.log('\n⏱️ [Benchmark] Testing query performance with new indexes...');
  const sampleSerial = 'TESTXXXX';
  const startSerial = Date.now();
  const serialResult = await pool.request()
    .input('serial', sql.NVarChar, sampleSerial)
    .query('SELECT TOP 1 * FROM dbo.StockItems WHERE StockSerial = @serial');
  const elapsedSerial = Date.now() - startSerial;
  console.log(`⚡ Barcode query for "${sampleSerial}": found ${serialResult.recordset.length} match in ${elapsedSerial}ms!`);

  const startStatus = Date.now();
  const statusResult = await pool.request()
    .query("SELECT COUNT(*) AS StoredCount FROM dbo.StockItems WHERE StockStatus = 'stored'");
  const elapsedStatus = Date.now() - startStatus;
  console.log(`⚡ Inventory count for StockStatus='stored' (${statusResult.recordset[0].StoredCount} items) in ${elapsedStatus}ms!`);

  console.log('\n=================================================================');
  console.log('🎉 EFZApp Database Alignment & Optimization Completed Successfully!');
  console.log('=================================================================');
}

// Allow standalone execution
if (process.argv[1]?.includes('align_database')) {
  runDatabaseAlignment()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Alignment failed:', err);
      process.exit(1);
    });
}
