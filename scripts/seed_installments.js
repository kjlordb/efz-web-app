import { getPool } from '../backend/dist/db.js';

async function seed() {
  const pool = await getPool();
  const countRes = await pool.request().query('SELECT COUNT(*) as c FROM dbo.InstallmentPlans');
  if (countRes.recordset[0].c === 0) {
    await pool.request().query(`
      INSERT INTO dbo.InstallmentPlans (PlanId, OrderId, CustomerId, CustomerName, TotalPrincipal, TermMonths, MonthlyAmortization, PaidMonths, RemainingBalance, NextDueDate, Status)
      VALUES 
      ('INST-2026-001', 202306249, 422, 'KENNETH BAUTISTA', 46997.60, 12, 3916.47, 4, 31331.72, '2026-10-15', 'Current'),
      ('INST-2026-002', 202306250, 10, 'DIGOS CITY POLICE STATION', 110285.00, 12, 9190.42, 8, 36761.64, '2026-10-01', 'Current'),
      ('INST-2026-003', 202306251, 5, 'RAYMOND CASTILLO FUENTES', 45000.00, 3, 15000.00, 3, 0.00, '2026-08-01', 'Settled');
    `);
    console.log('SEEDED INSTALLMENT PLANS SUCCESSFULLY');
  } else {
    console.log('ALREADY HAS DATA:', countRes.recordset[0].c);
  }
  process.exit(0);
}

seed().catch((err) => {
  console.error('Failed to seed installments:', err);
  process.exit(1);
});
