import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Receipt,
  FileText,
  BarChart3,
  Users,
  Truck,
  CreditCard,
  RotateCcw,
  Database,
  LogOut
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { useAuth } from '../../context/AuthContext';
import { ROLE_DEFINITIONS } from '../../types/rbac';

export type ActiveTab =
  | 'dashboard'
  | 'pos'
  | 'inventory'
  | 'sales'
  | 'quotation'
  | 'audit'
  | 'customers'
  | 'suppliers'
  | 'installments'
  | 'rma';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenBackupModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenBackupModal
}) => {
  const { currentUser, canAccess, logout } = useAuth();
  const currentRole = currentUser?.role || 'cashier';
  const roleMeta = ROLE_DEFINITIONS[currentRole];

  const navSections = [
    {
      group: 'MAIN',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'pos', label: 'POS Register', icon: ShoppingCart },
        { id: 'quotation', label: 'Quotations', icon: FileText },
        { id: 'sales', label: 'Sales & Warranty', icon: Receipt }
      ]
    },
    {
      group: 'INVENTORY',
      items: [
        { id: 'inventory', label: 'Stock Catalog', icon: Package },
        { id: 'audit', label: 'Stock Valuation', icon: BarChart3 },
        { id: 'suppliers', label: 'Suppliers', icon: Truck }
      ]
    },
    {
      group: 'COMMERCIAL CRM',
      items: [
        { id: 'customers', label: 'Customer Directory', icon: Users },
        { id: 'installments', label: 'Installment AR', icon: CreditCard }
      ]
    },
    {
      group: 'SERVICE CENTER',
      items: [
        { id: 'rma', label: 'RMA Claims', icon: RotateCcw }
      ]
    }
  ];

  const filteredNavSections = navSections
    .map((sec) => ({
      ...sec,
      items: sec.items.filter((item) => canAccess(item.id as ActiveTab))
    }))
    .filter((sec) => sec.items.length > 0);

  return (
    <aside className="no-print w-64 bg-[#080E1A] text-[#A9B6C8] flex flex-col shrink-0 border-r border-[rgba(148,163,184,0.10)] select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-[rgba(148,163,184,0.10)] flex items-center gap-3">
        <div className="shrink-0">
          <BrandLogo size="sm" withMotion glowEffect />
        </div>
        <div className="min-w-0">
          <h1 className="text-[#F4F7FB] font-black text-sm tracking-wide uppercase truncate">
            EFZ <span className="text-[#D8A83E] font-extrabold">Computer</span>
          </h1>
          <p className="text-[11px] text-[#19C3D1] font-semibold tracking-wider uppercase truncate">
            Sales & Enterprise POS
          </p>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {filteredNavSections.map((sec, sIdx) => (
          <div key={sIdx} className="space-y-1">
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#6F7E92] mb-1.5">
              {sec.group}
            </div>
            <div className="space-y-0.5">
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as ActiveTab)}
                    className={`relative w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[rgba(25,195,209,0.10)] border border-[rgba(25,195,209,0.18)] text-[#F4F7FB] font-semibold pl-3.5'
                        : 'text-[#A9B6C8] hover:text-[#F4F7FB] hover:bg-white/[0.04]'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-1 top-2 bottom-2 w-1 rounded-full bg-[#19C3D1]" />
                    )}
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-[#19C3D1]' : 'text-[#6F7E92] group-hover:text-[#A9B6C8]'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Operator Status & Footer */}
      <div className="p-3 border-t border-[rgba(148,163,184,0.10)] bg-[#070B14]/60 space-y-2">
        <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-[rgba(148,163,184,0.08)]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
              currentUser?.role === 'admin'
                ? 'bg-[#D8A83E]/15 text-[#F1C968]'
                : 'bg-[rgba(25,195,209,0.12)] text-[#19C3D1]'
            }`}>
              {currentUser?.avatar || 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[#F4F7FB] truncate">
                {currentUser?.name || 'Operator'}
              </div>
              <div className="text-[10px] text-[#6F7E92] truncate">
                {roleMeta.title}
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            title="Sign Out"
            className="text-[#6F7E92] hover:text-[#F05D6C] p-1.5 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

        {currentUser?.role === 'admin' && (
          <button
            onClick={onOpenBackupModal}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-medium text-[#A9B6C8] hover:text-[#19C3D1] hover:bg-teal-500/10 rounded-lg transition-colors cursor-pointer"
          >
            <Database className="w-3 h-3 text-[#19C3D1]" />
            <span>Database Backup</span>
          </button>
        )}
      </div>
    </aside>
  );
};
