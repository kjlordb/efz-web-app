import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { requirePermission } from '../auth.js';
import { getPool, sql } from '../db.js';

export const installmentRouter = Router();

function mapPlan(row: Record<string, unknown>, payments: Array<Record<string, unknown>>) {
  return {
    id: String(row.PlanId),
    orderId: Number(row.OrderId),
    customerName: String(row.CustomerName),
    totalPrincipal: Number(row.TotalPrincipal),
    termMonths: Number(row.TermMonths) as 3 | 12,
    monthlyAmortization: Number(row.MonthlyAmortization),
    paidMonths: Number(row.PaidMonths),
    totalMonths: Number(row.TermMonths),
    remainingBalance: Number(row.RemainingBalance),
    nextDueDate: row.NextDueDate ? new Date(String(row.NextDueDate)).toISOString().slice(0, 10) : 'Fully Settled',
    status: String(row.Status),
    paymentHistory: payments.map((payment) => ({
      id: String(payment.PaymentId),
      date: new Date(String(payment.PaymentDate)).toISOString().slice(0, 10),
      amountPaid: Number(payment.AmountPaid),
      referenceNumber: String(payment.ReferenceNumber),
      cashier: String(payment.Cashier),
    })),
  };
}

installmentRouter.get('/', requirePermission('PROCESS_INSTALLMENT_PAYMENTS'), async (_req, res) => {
  try {
    const pool = await getPool();
    const [plansResult, paymentsResult] = await Promise.all([
      pool.request().query(`
        SELECT PlanId, OrderId, CustomerName, TotalPrincipal, TermMonths, MonthlyAmortization,
               PaidMonths, RemainingBalance, NextDueDate, Status
        FROM dbo.InstallmentPlans
        ORDER BY CreatedAt DESC
      `),
      pool.request().query(`
        SELECT PaymentId, PlanId, PaymentDate, AmountPaid, ReferenceNumber, Cashier
        FROM dbo.InstallmentPayments
        ORDER BY PaymentDate DESC
      `),
    ]);
    const paymentsByPlan = new Map<string, Array<Record<string, unknown>>>();
    for (const payment of paymentsResult.recordset) {
      const planId = String(payment.PlanId);
      const collection = paymentsByPlan.get(planId) || [];
      collection.push(payment);
      paymentsByPlan.set(planId, collection);
    }
    res.json(plansResult.recordset.map((plan) => mapPlan(plan, paymentsByPlan.get(String(plan.PlanId)) || [])));
  } catch (error) {
    console.error('Error loading installment plans:', error);
    res.status(500).json({ error: 'Unable to load installment plans. Run the operational tables migration first.' });
  }
});

installmentRouter.post('/:id/payments', requirePermission('PROCESS_INSTALLMENT_PAYMENTS'), async (req, res) => {
  const planId = String(req.params.id);
  const amount = Number(req.body?.amount);
  const referenceNumber = typeof req.body?.referenceNumber === 'string' ? req.body.referenceNumber.trim() : '';
  if (!Number.isFinite(amount) || amount <= 0 || !referenceNumber || referenceNumber.length > 100) {
    return res.status(400).json({ error: 'A positive amount and receipt reference are required.' });
  }

  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin();
    const planResult = await new sql.Request(transaction)
      .input('planId', sql.NVarChar(50), planId)
      .query(`
        SELECT PlanId, OrderId, CustomerName, TotalPrincipal, TermMonths, MonthlyAmortization,
               PaidMonths, RemainingBalance, NextDueDate, Status
        FROM dbo.InstallmentPlans WITH (UPDLOCK, HOLDLOCK)
        WHERE PlanId = @planId
      `);
    if (planResult.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Installment plan not found.' });
    }
    const plan = planResult.recordset[0];
    const remainingBalance = Number(plan.RemainingBalance);
    if (plan.Status === 'Settled' || amount > remainingBalance) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Payment amount exceeds the remaining balance or the plan is settled.' });
    }

    const newBalance = Math.round((remainingBalance - amount) * 100) / 100;
    const settled = newBalance === 0;
    const paidMonths = Math.min(Number(plan.TermMonths), Number(plan.PaidMonths) + 1);
    const paymentId = randomUUID();
    const paymentRequest = new sql.Request(transaction);
    paymentRequest.input('paymentId', sql.NVarChar(50), paymentId);
    paymentRequest.input('planId', sql.NVarChar(50), planId);
    paymentRequest.input('amount', sql.Money, amount);
    paymentRequest.input('referenceNumber', sql.NVarChar(100), referenceNumber);
    paymentRequest.input('cashier', sql.NVarChar(200), req.auth!.name);
    await paymentRequest.query(`
      INSERT INTO dbo.InstallmentPayments (PaymentId, PlanId, PaymentDate, AmountPaid, ReferenceNumber, Cashier)
      VALUES (@paymentId, @planId, SYSUTCDATETIME(), @amount, @referenceNumber, @cashier)
    `);
    const updated = await new sql.Request(transaction)
      .input('planId', sql.NVarChar(50), planId)
      .input('remainingBalance', sql.Money, newBalance)
      .input('paidMonths', sql.Int, paidMonths)
      .input('status', sql.NVarChar(20), settled ? 'Settled' : 'Current')
      .query(`
        UPDATE dbo.InstallmentPlans
        SET RemainingBalance = @remainingBalance,
            PaidMonths = @paidMonths,
            Status = @status,
            NextDueDate = CASE WHEN @status = 'Settled' THEN NULL ELSE DATEADD(MONTH, 1, CAST(GETDATE() AS date)) END,
            UpdatedAt = SYSUTCDATETIME()
        OUTPUT INSERTED.PlanId, INSERTED.OrderId, INSERTED.CustomerName, INSERTED.TotalPrincipal,
               INSERTED.TermMonths, INSERTED.MonthlyAmortization, INSERTED.PaidMonths,
               INSERTED.RemainingBalance, INSERTED.NextDueDate, INSERTED.Status
        WHERE PlanId = @planId
      `);
    await transaction.commit();
    res.json(mapPlan(updated.recordset[0], [{
      PaymentId: paymentId,
      PaymentDate: new Date().toISOString(),
      AmountPaid: amount,
      ReferenceNumber: referenceNumber,
      Cashier: req.auth!.name,
    }]));
  } catch (error) {
    try { await transaction.rollback(); } catch {}
    console.error('Error recording installment payment:', error);
    res.status(500).json({ error: 'Unable to record installment payment.' });
  }
});
