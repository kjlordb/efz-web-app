import { ActiveTab } from '../components/layout/Sidebar';

export type UserRole = 'admin' | 'cashier' | 'inventory' | 'technician';

export type Permission =
  | 'VIEW_DASHBOARD'
  | 'EXECUTE_POS'
  | 'VIEW_SALES_LEDGER'
  | 'CREATE_QUOTATION'
  | 'MANAGE_INVENTORY'
  | 'VIEW_COGS_MARGINS'
  | 'MANAGE_SUPPLIERS'
  | 'MANAGE_CUSTOMERS'
  | 'PROCESS_INSTALLMENT_PAYMENTS'
  | 'MANAGE_RMA'
  | 'EXECUTE_BACKUP'
  | 'RESET_SYSTEM_CACHE';

export interface RoleMetadata {
  role: UserRole;
  title: string;
  entityLabel: string;
  description: string;
  badgeColor: string;
  badgeBg: string;
  borderColor: string;
  homeTab: ActiveTab;
  allowedTabs: ActiveTab[];
}

export const ROLE_DEFINITIONS: Record<UserRole, RoleMetadata> = {
  admin: {
    role: 'admin',
    title: 'Store Manager & Administrator',
    entityLabel: 'Executive Management',
    description: 'Unrestricted clearance across all modules, COGS margins, financial ledgers, and database backups.',
    badgeColor: 'text-amber-300',
    badgeBg: 'bg-amber-500/20',
    borderColor: 'border-amber-500/40',
    homeTab: 'dashboard',
    allowedTabs: [
      'dashboard',
      'pos',
      'inventory',
      'sales',
      'quotation',
      'audit',
      'customers',
      'suppliers',
      'installments',
      'rma'
    ]
  },
  cashier: {
    role: 'cashier',
    title: 'Sales Specialist & Cashier',
    entityLabel: 'Front-Counter Sales',
    description: 'Authorized for customer checkouts, commercial quotations, sales invoice audits, and customer payments.',
    badgeColor: 'text-teal-300',
    badgeBg: 'bg-teal-500/20',
    borderColor: 'border-teal-500/40',
    homeTab: 'pos',
    allowedTabs: [
      'pos',
      'sales',
      'quotation',
      'customers',
      'installments',
      'inventory' // Read-only SRP stock checking
    ]
  },
  inventory: {
    role: 'inventory',
    title: 'Warehouse & Procurement Specialist',
    entityLabel: 'Supply Chain & Warehouse',
    description: 'Authorized for hardware receiving, serialized barcode management, COGS valuation, and distributor procurement.',
    badgeColor: 'text-cyan-300',
    badgeBg: 'bg-cyan-500/20',
    borderColor: 'border-cyan-500/40',
    homeTab: 'inventory',
    allowedTabs: [
      'inventory',
      'audit',
      'suppliers'
    ]
  },
  technician: {
    role: 'technician',
    title: 'Senior RMA & Warranty Technician',
    entityLabel: 'Service Center & Diagnostics',
    description: 'Authorized for hardware defect inspection, warranty claims, distributor diagnostic tracking, and replacement dispatch.',
    badgeColor: 'text-purple-300',
    badgeBg: 'bg-purple-500/20',
    borderColor: 'border-purple-500/40',
    homeTab: 'rma',
    allowedTabs: [
      'rma',
      'inventory', // Read-only warranty check
      'sales' // Read-only invoice date check
    ]
  }
};

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'VIEW_DASHBOARD',
    'EXECUTE_POS',
    'VIEW_SALES_LEDGER',
    'CREATE_QUOTATION',
    'MANAGE_INVENTORY',
    'VIEW_COGS_MARGINS',
    'MANAGE_SUPPLIERS',
    'MANAGE_CUSTOMERS',
    'PROCESS_INSTALLMENT_PAYMENTS',
    'MANAGE_RMA',
    'EXECUTE_BACKUP',
    'RESET_SYSTEM_CACHE'
  ],
  cashier: [
    'EXECUTE_POS',
    'VIEW_SALES_LEDGER',
    'CREATE_QUOTATION',
    'MANAGE_CUSTOMERS',
    'PROCESS_INSTALLMENT_PAYMENTS'
  ],
  inventory: [
    'MANAGE_INVENTORY',
    'VIEW_COGS_MARGINS',
    'MANAGE_SUPPLIERS'
  ],
  technician: [
    'MANAGE_RMA',
    'VIEW_SALES_LEDGER'
  ]
};

export function canRoleAccessTab(role: UserRole, tab: ActiveTab): boolean {
  const metadata = ROLE_DEFINITIONS[role];
  return metadata ? metadata.allowedTabs.includes(tab) : false;
}

export function roleHasPermission(role: UserRole, permission: Permission): boolean {
  const perms = ROLE_PERMISSIONS[role];
  return perms ? perms.includes(permission) : false;
}
