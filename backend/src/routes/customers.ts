import { Router } from 'express';
import { getPool, sql } from '../db.js';
import { requirePermission } from '../auth.js';

export const customerRouter = Router();

// GET /api/customers - Query customers with order metrics
customerRouter.get('/', requirePermission('MANAGE_CUSTOMERS'), async (req, res) => {
  try {
    const pool = await getPool();
    const { search, limit = '100', offset = '0' } = req.query;

    const request = pool.request();
    let query = `
      SELECT 
        c.id,
        c.FirstName,
        c.LastName,
        c.Company,
        c.Address,
        c.Email,
        c.ContactNumber,
        c.Remarks,
        COUNT(o.id) AS totalOrdersCount,
        COALESCE(SUM(o.OrderAmount), 0) AS lifetimeSpend
      FROM dbo.CustomerDetails c
      LEFT JOIN dbo.OrderItems o ON c.id = o.CustomerId
      WHERE 1=1
    `;

    if (search && typeof search === 'string' && search.trim()) {
      request.input('search', sql.NVarChar, `%${search.trim()}%`);
      query += ` AND (
        c.FirstName LIKE @search OR
        c.LastName LIKE @search OR
        c.Company LIKE @search OR
        c.ContactNumber LIKE @search OR
        c.Address LIKE @search OR
        c.Email LIKE @search
      )`;
    }

    query += `
      GROUP BY c.id, c.FirstName, c.LastName, c.Company, c.Address, c.Email, c.ContactNumber, c.Remarks
      ORDER BY c.id DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `;

    const parsedLimit = Math.min(Math.max(parseInt(limit as string, 10) || 100, 1), 500);
    const parsedOffset = Math.max(parseInt(offset as string, 10) || 0, 0);

    request.input('offset', sql.Int, parsedOffset);
    request.input('limit', sql.Int, parsedLimit);

    const result = await request.query(query);

    const customers = result.recordset.map((row) => {
      const firstName = row.FirstName || '';
      const lastName = row.LastName || '';
      const fullName = `${firstName} ${lastName}`.trim() || 'Valued Retail Client';

      return {
        id: row.id,
        firstName,
        lastName,
        fullName,
        company: row.Company || undefined,
        address: row.Address || 'Davao City, Philippines',
        email: row.Email || '',
        contactNumber: row.ContactNumber || '',
        remarks: row.Remarks || '',
        totalOrdersCount: Number(row.totalOrdersCount) || 0,
        lifetimeSpend: Number(row.lifetimeSpend) || 0,
      };
    });

    res.json(customers);
  } catch (err: any) {
    console.error('Error in GET /api/customers:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/customers - Register new customer
customerRouter.post('/', requirePermission('MANAGE_CUSTOMERS'), async (req, res) => {
  try {
    const pool = await getPool();
    const {
      firstName,
      lastName,
      company,
      address,
      email,
      contactNumber,
      remarks,
    } = req.body;

    if (!firstName && !lastName && !company) {
      return res.status(400).json({ error: 'Customer name or company is required.' });
    }

    const request = pool.request();
    request.input('FirstName', sql.NVarChar(100), firstName || '');
    request.input('LastName', sql.NVarChar(100), lastName || '');
    request.input('Company', sql.NVarChar(100), company || '');
    request.input('Address', sql.NVarChar(1000), address || 'Davao City, Philippines');
    request.input('Email', sql.NVarChar(100), email || '');
    request.input('ContactNumber', sql.NVarChar(100), contactNumber || '');
    request.output('id', sql.Int);

    const execResult = await request.execute('dbo.spCustomerDetails_Insert');
    const newId = execResult.output.id;

    const fullName = `${firstName || ''} ${lastName || ''}`.trim() || company;

    res.status(201).json({
      id: newId,
      firstName: firstName || '',
      lastName: lastName || '',
      fullName,
      company,
      address: address || 'Davao City, Philippines',
      email: email || '',
      contactNumber: contactNumber || '',
      remarks: remarks || '',
      totalOrdersCount: 0,
      lifetimeSpend: 0,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/customers/:id - Update customer record
customerRouter.put('/:id', requirePermission('MANAGE_CUSTOMERS'), async (req, res) => {
  try {
    const pool = await getPool();
    const id = parseInt(String(req.params.id), 10);
    const { firstName, lastName, company, address, email, contactNumber, remarks } = req.body;

    await pool
      .request()
      .input('id', sql.Int, id)
      .input('firstName', sql.NVarChar, firstName || '')
      .input('lastName', sql.NVarChar, lastName || '')
      .input('company', sql.NVarChar, company || '')
      .input('address', sql.NVarChar, address || '')
      .input('email', sql.NVarChar, email || '')
      .input('contactNumber', sql.NVarChar, contactNumber || '')
      .input('remarks', sql.NVarChar, remarks || '')
      .query(`
        UPDATE dbo.CustomerDetails
        SET 
          FirstName = @firstName,
          LastName = @lastName,
          Company = @company,
          Address = @address,
          Email = @email,
          ContactNumber = @contactNumber,
          Remarks = @remarks
        WHERE id = @id
      `);

    res.json({ message: 'Customer updated successfully.', id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
