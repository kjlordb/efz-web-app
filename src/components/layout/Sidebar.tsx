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
    <aside className="no-print w-64 bg-[#090d16] text-slate-300 flex flex-col shrink-0 border-r border-white/[0.06] select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-white/[0.06] flex items-center gap-3">
        <div className="shrink-0">
          <BrandLogo size="sm" withMotion glowEffect />
        </div>
        <div className="min-w-0">
          <h1 className="text-white font-extrabold text-sm tracking-wide uppercase truncate">
            EFZ Computer
          </h1>
          <p className="text-[11px] text-teal-400 font-semibold tracking-wider uppercase truncate">
            Sales & Enterprise POS
          </p>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {filteredNavSections.map((sec, sIdx) => (
          <div key={sIdx} className="space-y-1">
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
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
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs transition-all cursor-pointer ${
                      isActive
                        ? 'bg-teal-500/15 text-teal-300 font-semibold border-l-2 border-teal-400 pl-2.5'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-teal-400' : 'text-slate-500 group-hover:text-slate-300'
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
      <div className="p-3 border-t border-white/[0.06] bg-slate-950/40 space-y-2">
        <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
              currentUser?.isGuest
                ? 'bg-amber-500/20 text-amber-300'
                : 'bg-teal-500/20 text-teal-300'
            }`}>
              {currentUser?.avatar || 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-200 truncate">
                {currentUser?.name || 'Operator'}
              </div>
              <div className="text-[10px] text-slate-500 truncate">
                {roleMeta.title}
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            title="Sign Out"
            className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

        {currentUser?.role === 'admin' && (
          <button
            onClick={onOpenBackupModal}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-medium text-slate-400 hover:text-teal-300 hover:bg-teal-500/10 rounded-lg transition-colors cursor-pointer"
          >
            <Database className="w-3 h-3 text-teal-400" />
            <span>Database Backup</span>
          </button>
        )}
      </div>
    </aside>
  );
};
