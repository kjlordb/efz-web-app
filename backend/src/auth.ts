import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import type { NextFunction, Request, RequestHandler, Response } from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const scrypt = promisify(scryptCallback);

export type UserRole = 'admin' | 'cashier' | 'inventory' | 'technician';

export type Permission =
  | 'VIEW_DASHBOARD'
  | 'VIEW_INVENTORY'
  | 'EXECUTE_POS'
  | 'VIEW_SALES_LEDGER'
  | 'CREATE_QUOTATION'
  | 'MANAGE_INVENTORY'
  | 'VIEW_COGS_MARGINS'
  | 'MANAGE_SUPPLIERS'
  | 'MANAGE_CUSTOMERS'
  | 'PROCESS_INSTALLMENT_PAYMENTS'
  | 'MANAGE_RMA'
  | 'EXECUTE_BACKUP';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  entityLabel: string;
  workstation: string;
  avatar: string;
}

interface ConfiguredUser extends AuthenticatedUser {
  passwordHash: string;
}

interface TokenPayload extends AuthenticatedUser {
  exp: number;
  iat: number;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthenticatedUser;
    }
  }
}

const ROLE_METADATA: Record<UserRole, Pick<AuthenticatedUser, 'roleTitle' | 'entityLabel'>> = {
  admin: { roleTitle: 'Store Manager & Administrator', entityLabel: 'Executive Management' },
  cashier: { roleTitle: 'Sales Specialist & Cashier', entityLabel: 'Front-Counter Sales' },
  inventory: { roleTitle: 'Warehouse & Procurement Specialist', entityLabel: 'Supply Chain & Warehouse' },
  technician: { roleTitle: 'Senior RMA & Warranty Technician', entityLabel: 'Service Center & Diagnostics' },
};

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'VIEW_DASHBOARD', 'VIEW_INVENTORY', 'EXECUTE_POS', 'VIEW_SALES_LEDGER', 'CREATE_QUOTATION',
    'MANAGE_INVENTORY', 'VIEW_COGS_MARGINS', 'MANAGE_SUPPLIERS', 'MANAGE_CUSTOMERS',
    'PROCESS_INSTALLMENT_PAYMENTS', 'MANAGE_RMA', 'EXECUTE_BACKUP',
  ],
  cashier: ['VIEW_INVENTORY', 'EXECUTE_POS', 'VIEW_SALES_LEDGER', 'CREATE_QUOTATION', 'MANAGE_CUSTOMERS', 'PROCESS_INSTALLMENT_PAYMENTS'],
  inventory: ['VIEW_INVENTORY', 'MANAGE_INVENTORY', 'VIEW_COGS_MARGINS', 'MANAGE_SUPPLIERS'],
  technician: ['VIEW_INVENTORY', 'VIEW_SALES_LEDGER', 'MANAGE_RMA'],
};

const ROLES = new Set<UserRole>(['admin', 'cashier', 'inventory', 'technician']);
const TOKEN_TTL_SECONDS = 8 * 60 * 60;

function base64UrlEncode(value: string | Buffer): string {
  return Buffer.from(value).toString('base64url');
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function signingSecret(): string {
  const secret = process.env.AUTH_TOKEN_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_TOKEN_SECRET must be set to a value of at least 32 characters.');
  }
  return secret;
}

function parseUsers(): ConfiguredUser[] {
  const raw = process.env.AUTH_USERS_JSON;
  if (!raw) {
    throw new Error('AUTH_USERS_JSON is not configured.');
  }

  let values: unknown;
  try {
    values = JSON.parse(raw);
  } catch {
    throw new Error('AUTH_USERS_JSON must be valid JSON.');
  }
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error('AUTH_USERS_JSON must contain at least one operator account.');
  }

  return values.map((value, index) => {
    if (!value || typeof value !== 'object') throw new Error(`AUTH_USERS_JSON entry ${index + 1} is invalid.`);
    const item = value as Record<string, unknown>;
    const role = item.role;
    if (
      typeof item.id !== 'string' || typeof item.name !== 'string' || typeof item.email !== 'string' ||
      typeof item.passwordHash !== 'string' || typeof role !== 'string' || !ROLES.has(role as UserRole)
    ) {
      throw new Error(`AUTH_USERS_JSON entry ${index + 1} is missing a required field.`);
    }
    const roleMetadata = ROLE_METADATA[role as UserRole];
    return {
      id: item.id,
      name: item.name,
      email: item.email.toLowerCase(),
      passwordHash: item.passwordHash,
      role: role as UserRole,
      roleTitle: typeof item.roleTitle === 'string' ? item.roleTitle : roleMetadata.roleTitle,
      entityLabel: typeof item.entityLabel === 'string' ? item.entityLabel : roleMetadata.entityLabel,
      workstation: typeof item.workstation === 'string' ? item.workstation : 'WEB-TERM-01',
      avatar: typeof item.avatar === 'string' ? item.avatar.slice(0, 2) : item.name.slice(0, 1).toUpperCase(),
    };
  });
}

function publicUser(user: ConfiguredUser): AuthenticatedUser {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

async function verifyPassword(password: string, encodedHash: string): Promise<boolean> {
  const [algorithm, salt, expected] = encodedHash.split('$');
  if (algorithm !== 'scrypt' || !salt || !expected) return false;
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  const expectedBuffer = Buffer.from(expected, 'hex');
  return expectedBuffer.length === derived.length && timingSafeEqual(expectedBuffer, derived);
}

export async function hashPassword(password: string): Promise<string> {
  if (password.length < 12) throw new Error('Passwords must contain at least 12 characters.');
  const salt = randomBytes(16).toString('hex');
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${derived.toString('hex')}`;
}

export function validateAuthConfiguration(): void {
  signingSecret();
  parseUsers();
}

export async function authenticate(identifier: string, password: string): Promise<AuthenticatedUser | null> {
  const normalized = identifier.trim().toLowerCase();
  const account = parseUsers().find((user) => user.email === normalized || user.id.toLowerCase() === normalized);
  if (!account || !(await verifyPassword(password, account.passwordHash))) return null;
  return publicUser(account);
}

export function createAccessToken(user: AuthenticatedUser): string {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64UrlEncode(JSON.stringify({ ...user, iat: now, exp: now + TOKEN_TTL_SECONDS }));
  const unsigned = `${header}.${payload}`;
  const signature = createHmac('sha256', signingSecret()).update(unsigned).digest('base64url');
  return `${unsigned}.${signature}`;
}

export function readAccessToken(token: string): AuthenticatedUser | null {
  const [header, payload, suppliedSignature, ...extra] = token.split('.');
  if (!header || !payload || !suppliedSignature || extra.length > 0) return null;
  const unsigned = `${header}.${payload}`;
  const expectedSignature = createHmac('sha256', signingSecret()).update(unsigned).digest('base64url');
  const expectedBuffer = Buffer.from(expectedSignature);
  const suppliedBuffer = Buffer.from(suppliedSignature);
  if (expectedBuffer.length !== suppliedBuffer.length || !timingSafeEqual(expectedBuffer, suppliedBuffer)) return null;

  try {
    const parsed = JSON.parse(base64UrlDecode(payload)) as Partial<TokenPayload>;
    if (
      typeof parsed.id !== 'string' || typeof parsed.name !== 'string' || typeof parsed.email !== 'string' ||
      typeof parsed.role !== 'string' || !ROLES.has(parsed.role as UserRole) || typeof parsed.exp !== 'number' ||
      parsed.exp <= Math.floor(Date.now() / 1000)
    ) return null;
    const role = parsed.role as UserRole;
    const defaults = ROLE_METADATA[role];
    return {
      id: parsed.id,
      name: parsed.name,
      email: parsed.email,
      role,
      roleTitle: typeof parsed.roleTitle === 'string' ? parsed.roleTitle : defaults.roleTitle,
      entityLabel: typeof parsed.entityLabel === 'string' ? parsed.entityLabel : defaults.entityLabel,
      workstation: typeof parsed.workstation === 'string' ? parsed.workstation : 'WEB-TERM-01',
      avatar: typeof parsed.avatar === 'string' ? parsed.avatar : parsed.name.slice(0, 1).toUpperCase(),
    };
  } catch {
    return null;
  }
}

export const extractAuth: RequestHandler = (req: Request, _res: Response, next: NextFunction) => {
  const authorization = req.header('authorization');
  if (authorization?.startsWith('Bearer ')) {
    try {
      const user = readAccessToken(authorization.slice(7));
      if (user) {
        req.auth = user;
      }
    } catch {
      // Continue unauthenticated if token fails to decode
    }
  }
  next();
};

export const requireAuth: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const authorization = req.header('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication is required.' });
    return;
  }
  try {
    const user = readAccessToken(authorization.slice(7));
    if (!user) {
      res.status(401).json({ error: 'Your session is invalid or has expired.' });
      return;
    }
    req.auth = user;
    next();
  } catch {
    res.status(503).json({ error: 'Authentication is not configured.' });
  }
};

export function requirePermission(permission: Permission): RequestHandler {
  return (req, res, next) => {
    if (!req.auth) {
      res.status(401).json({ error: 'Authentication is required.' });
      return;
    }
    if (!ROLE_PERMISSIONS[req.auth.role].includes(permission)) {
      res.status(403).json({ error: 'You are not authorized to perform this action.' });
      return;
    }
    next();
  };
}
