import { getPool } from '../db.js';

export async function createOperationalTables() {
  const pool = await getPool();
  await pool.request().query(`
    IF OBJECT_ID(N'dbo.InstallmentPlans', N'U') IS NULL
    BEGIN
      CREATE TABLE dbo.InstallmentPlans (
        PlanId NVARCHAR(50) NOT NULL PRIMARY KEY,
        OrderId INT NOT NULL UNIQUE,
        CustomerId INT NOT NULL,
        CustomerName NVARCHAR(200) NOT NULL,
        TotalPrincipal MONEY NOT NULL CHECK (TotalPrincipal >= 0),
        TermMonths INT NOT NULL CHECK (TermMonths IN (3, 12)),
        MonthlyAmortization MONEY NOT NULL CHECK (MonthlyAmortization >= 0),
        PaidMonths INT NOT NULL CONSTRAINT DF_InstallmentPlans_PaidMonths DEFAULT 0 CHECK (PaidMonths >= 0),
        RemainingBalance MONEY NOT NULL CHECK (RemainingBalance >= 0),
        NextDueDate DATE NULL,
        Status NVARCHAR(20) NOT NULL CHECK (Status IN ('Current', 'Settled', 'Delinquent')),
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_InstallmentPlans_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_InstallmentPlans_UpdatedAt DEFAULT SYSUTCDATETIME()
      );
    END;

    IF OBJECT_ID(N'dbo.InstallmentPayments', N'U') IS NULL
    BEGIN
      CREATE TABLE dbo.InstallmentPayments (
        PaymentId NVARCHAR(50) NOT NULL PRIMARY KEY,
        PlanId NVARCHAR(50) NOT NULL,
        PaymentDate DATETIME2 NOT NULL,
        AmountPaid MONEY NOT NULL CHECK (AmountPaid > 0),
        ReferenceNumber NVARCHAR(100) NOT NULL,
        Cashier NVARCHAR(200) NOT NULL,
        CONSTRAINT FK_InstallmentPayments_Plan FOREIGN KEY (PlanId) REFERENCES dbo.InstallmentPlans(PlanId)
      );
      CREATE INDEX IX_InstallmentPayments_PlanId_PaymentDate ON dbo.InstallmentPayments (PlanId, PaymentDate DESC);
    END;

    IF OBJECT_ID(N'dbo.RmaTickets', N'U') IS NULL
    BEGIN
      CREATE TABLE dbo.RmaTickets (
        Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        TicketNumber NVARCHAR(40) NULL UNIQUE,
        SerialNumber NVARCHAR(100) NOT NULL,
        ItemName NVARCHAR(200) NOT NULL,
        CustomerName NVARCHAR(200) NOT NULL,
        OrderId INT NOT NULL,
        SupplierName NVARCHAR(200) NOT NULL,
        ReportedDefect NVARCHAR(2000) NOT NULL,
        DateFiled DATETIME2 NOT NULL,
        Status NVARCHAR(50) NOT NULL CHECK (Status IN ('Pending Inspection', 'In Distributor Diagnostic', 'Replacement Inbound', 'Replacement Ready', 'Resolved & Released')),
        WarrantyValid BIT NOT NULL,
        ReplacementSerial NVARCHAR(100) NULL,
        TechnicianNotes NVARCHAR(4000) NULL,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_RmaTickets_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_RmaTickets_UpdatedAt DEFAULT SYSUTCDATETIME()
      );
      CREATE INDEX IX_RmaTickets_Status_DateFiled ON dbo.RmaTickets (Status, DateFiled DESC);
      CREATE INDEX IX_RmaTickets_SerialNumber ON dbo.RmaTickets (SerialNumber);
    END;
  `);
  console.log('Operational RMA and installment tables are ready.');
}

if (process.argv[1]?.includes('create_operational_tables')) {
  createOperationalTables()
    .then(() => { process.exitCode = 0; })
    .catch((error: unknown) => {
      console.error('Operational tables migration failed:', error);
      process.exitCode = 1;
    });
}
