import { Router } from 'express';
import { requirePermission } from '../auth.js';
import { getPool, sql } from '../db.js';

export const rmaRouter = Router();

const RMA_STATUSES = new Set([
  'Pending Inspection', 'In Distributor Diagnostic', 'Replacement Inbound', 'Replacement Ready', 'Resolved & Released',
]);

function mapTicket(row: Record<string, unknown>) {
  return {
    id: String(row.TicketNumber),
    serialNumber: String(row.SerialNumber),
    itemName: String(row.ItemName),
    customerName: String(row.CustomerName),
    orderId: Number(row.OrderId),
    supplierName: String(row.SupplierName),
    reportedDefect: String(row.ReportedDefect),
    dateFiled: new Date(String(row.DateFiled)).toISOString(),
    status: String(row.Status),
    warrantyValid: Boolean(row.WarrantyValid),
    replacementSerial: row.ReplacementSerial ? String(row.ReplacementSerial) : undefined,
    technicianNotes: row.TechnicianNotes ? String(row.TechnicianNotes) : undefined,
  };
}

rmaRouter.get('/', requirePermission('MANAGE_RMA'), async (_req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT TicketNumber, SerialNumber, ItemName, CustomerName, OrderId, SupplierName, ReportedDefect,
             DateFiled, Status, WarrantyValid, ReplacementSerial, TechnicianNotes
      FROM dbo.RmaTickets
      ORDER BY DateFiled DESC
    `);
    res.json(result.recordset.map(mapTicket));
  } catch (error) {
    console.error('Error loading RMA tickets:', error);
    res.status(500).json({ error: 'Unable to load RMA tickets. Run the operational tables migration first.' });
  }
});

rmaRouter.post('/', requirePermission('MANAGE_RMA'), async (req, res) => {
  const fields = ['serialNumber', 'itemName', 'customerName', 'supplierName', 'reportedDefect'] as const;
  const values = Object.fromEntries(fields.map((field) => [field, typeof req.body?.[field] === 'string' ? req.body[field].trim() : ''])) as Record<typeof fields[number], string>;
  const orderId = Number(req.body?.orderId);
  if (Object.values(values).some((value) => !value) || !Number.isSafeInteger(orderId) || orderId <= 0) {
    return res.status(400).json({ error: 'A serial, item, customer, order, supplier, and defect description are required.' });
  }
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin();
    const inserted = await new sql.Request(transaction)
      .input('serialNumber', sql.NVarChar(100), values.serialNumber)
      .input('itemName', sql.NVarChar(200), values.itemName)
      .input('customerName', sql.NVarChar(200), values.customerName)
      .input('orderId', sql.Int, orderId)
      .input('supplierName', sql.NVarChar(200), values.supplierName)
      .input('reportedDefect', sql.NVarChar(2000), values.reportedDefect)
      .input('warrantyValid', sql.Bit, Boolean(req.body?.warrantyValid))
      .query(`
        INSERT INTO dbo.RmaTickets
        (SerialNumber, ItemName, CustomerName, OrderId, SupplierName, ReportedDefect, DateFiled, Status, WarrantyValid)
        OUTPUT INSERTED.Id
        VALUES (@serialNumber, @itemName, @customerName, @orderId, @supplierName, @reportedDefect,
                SYSUTCDATETIME(), 'Pending Inspection', @warrantyValid)
      `);
    const id = Number(inserted.recordset[0].Id);
    const ticketNumber = `RMA-${new Date().getUTCFullYear()}-${String(id).padStart(6, '0')}`;
    const result = await new sql.Request(transaction)
      .input('id', sql.Int, id)
      .input('ticketNumber', sql.NVarChar(40), ticketNumber)
      .query(`
        UPDATE dbo.RmaTickets SET TicketNumber = @ticketNumber
        OUTPUT INSERTED.TicketNumber, INSERTED.SerialNumber, INSERTED.ItemName, INSERTED.CustomerName,
               INSERTED.OrderId, INSERTED.SupplierName, INSERTED.ReportedDefect, INSERTED.DateFiled,
               INSERTED.Status, INSERTED.WarrantyValid, INSERTED.ReplacementSerial, INSERTED.TechnicianNotes
        WHERE Id = @id
      `);
    await transaction.commit();
    res.status(201).json(mapTicket(result.recordset[0]));
  } catch (error) {
    try { await transaction.rollback(); } catch {}
    console.error('Error creating RMA ticket:', error);
    res.status(500).json({ error: 'Unable to create RMA ticket.' });
  }
});

rmaRouter.put('/:ticketNumber', requirePermission('MANAGE_RMA'), async (req, res) => {
  const ticketNumber = String(req.params.ticketNumber);
  const status = typeof req.body?.status === 'string' ? req.body.status : '';
  if (!RMA_STATUSES.has(status)) return res.status(400).json({ error: 'An allowed RMA status is required.' });
  const technicianNotes = typeof req.body?.technicianNotes === 'string' ? req.body.technicianNotes.slice(0, 4000) : undefined;
  const replacementSerial = typeof req.body?.replacementSerial === 'string' ? req.body.replacementSerial.trim().slice(0, 100) : undefined;
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('ticketNumber', sql.NVarChar(40), ticketNumber)
      .input('status', sql.NVarChar(50), status)
      .input('technicianNotes', sql.NVarChar(4000), technicianNotes || null)
      .input('replacementSerial', sql.NVarChar(100), replacementSerial || null)
      .query(`
        UPDATE dbo.RmaTickets
        SET Status = @status,
            TechnicianNotes = COALESCE(@technicianNotes, TechnicianNotes),
            ReplacementSerial = COALESCE(@replacementSerial, ReplacementSerial),
            UpdatedAt = SYSUTCDATETIME()
        OUTPUT INSERTED.TicketNumber, INSERTED.SerialNumber, INSERTED.ItemName, INSERTED.CustomerName,
               INSERTED.OrderId, INSERTED.SupplierName, INSERTED.ReportedDefect, INSERTED.DateFiled,
               INSERTED.Status, INSERTED.WarrantyValid, INSERTED.ReplacementSerial, INSERTED.TechnicianNotes
        WHERE TicketNumber = @ticketNumber
      `);
    if (result.recordset.length === 0) return res.status(404).json({ error: 'RMA ticket not found.' });
    res.json(mapTicket(result.recordset[0]));
  } catch (error) {
    console.error('Error updating RMA ticket:', error);
    res.status(500).json({ error: 'Unable to update RMA ticket.' });
  }
});
