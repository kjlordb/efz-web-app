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
      title: 'Executive Administration',
      entityTag: 'Management',
      items: [
        {
          id: 'dashboard',
          label: 'Executive Dashboard',
          icon: LayoutDashboard,
          desc: 'KPIs & Revenue Analytics'
        }
      ]
    },
    {
      title: 'Front-Counter Sales & Cashier',
      entityTag: 'Sales Register',
      items: [
        {
          id: 'pos',
          label: 'POS Register Terminal',
          icon: ShoppingCart,
          desc: 'Sales Checkout & Liquidation',
          badge: 'Live'
        },
        {
          id: 'quotation',
          label: 'Commercial Quotations',
          icon: FileText,
          desc: 'Pro-Forma 3-Tier Financed Quotes'
        },
        {
          id: 'sales',
          label: 'Sales Ledger & Warranty',
          icon: Receipt,
          desc: 'Invoice Audit & Real-Time Claims'
        }
      ]
    },
    {
      title: 'Supply Chain & Warehouse',
      entityTag: 'Inventory',
      items: [
        {
          id: 'inventory',
          label: 'Serialized Stock Catalog',
          icon: Package,
          desc: 'Individual Hardware & Barcodes'
        },
        {
          id: 'audit',
          label: 'Inventory Valuation',
          icon: BarChart3,
          desc: 'COGS vs Margins & Stock Levels'
        },
        {
          id: 'suppliers',
          label: 'Distributors & Procurement',
          icon: Truck,
          desc: 'Authorized Vendors & Sourcing'
        }
      ]
    },
    {
      title: 'Credit & Accounts CRM',
      entityTag: 'Customer Accounts',
      items: [
        {
          id: 'customers',
          label: 'Client Accounts & CRM',
          icon: Users,
          desc: 'Customer Profiles & Spend History'
        },
        {
          id: 'installments',
          label: 'Installment AR Ledger',
          icon: CreditCard,
          desc: 'Customer Financing & Amortization'
        }
      ]
    },
    {
      title: 'Service Center & Diagnostics',
      entityTag: 'Warranty / RMA',
      items: [
        {
          id: 'rma',
          label: 'RMA & Warranty Claims',
          icon: RotateCcw,
          desc: 'Distributor Turnaround & Defect Logs'
        }
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
    <aside className="no-print w-72 bg-slate-950/80 backdrop-blur-xl text-slate-300 flex flex-col shrink-0 border-r border-white/[0.08] select-none shadow-glass-md">
      {/* Brand Hero Showcase */}
      <div className="p-6 border-b border-white/[0.08] bg-gradient-to-b from-slate-950/90 via-slate-900/40 to-transparent flex flex-col items-center text-center relative overflow-hidden group">
        {/* Subtle background ambient illumination */}
        <div className="absolute inset-0 bg-radial from-amber-500/12 via-teal-500/8 to-transparent pointer-events-none"></div>

        {/* Large Logo with Motion Graphics (size="lg" = 128px) */}
        <div className="my-2 relative z-10">
          <BrandLogo size="lg" withMotion glowEffect showOrbitalRing />
        </div>

        {/* Brand Titles */}
        <div className="mt-4 space-y-1 relative z-10">
          <h1 className="text-white font-black text-lg tracking-wider uppercase font-sans drop-shadow-sm">
            EFZ Computer
          </h1>
          <p className="text-xs text-amber-400 font-extrabold tracking-widest uppercase drop-shadow-[0_0_8px_rgba(248,207,67,0.3)]">
            Davao Computer Sales
          </p>
        </div>

        {/* Terminal Live Pill */}
        <div className="mt-3 relative z-10 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/[0.1] text-[10px] font-mono text-slate-300 shadow-glass-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
          <span className="tracking-wide text-emerald-400 font-bold">TERMINAL ONLINE</span>
        </div>
      </div>

      {/* Active Entity Clearance Banner */}
      <div className="mx-3 mt-3 mb-1 p-2.5 rounded-xl bg-slate-900/50 backdrop-blur-md border border-white/[0.08] text-[10px] space-y-1 shadow-glass-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Entity Clearance</span>
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${roleMeta.badgeBg} ${roleMeta.badgeColor} border ${roleMeta.borderColor}`}>
            {roleMeta.role}
          </span>
        </div>
        <div className="text-slate-100 font-bold text-xs truncate">{roleMeta.entityLabel}</div>
        <div className="text-slate-400 text-[10px] truncate leading-tight">{roleMeta.title}</div>
      </div>

      {/* Navigation menu */}
      <div className="flex-1 overflow-y-auto py-2 px-3 space-y-3.5">
        {filteredNavSections.map((sec, sIdx) => (
          <div key={sIdx} className="space-y-1">
            <div className="flex items-center justify-between px-3 mb-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                {sec.title}
              </span>
              <span className="text-[8px] font-mono text-slate-400 bg-slate-900/80 border border-white/[0.06] px-1.5 py-0.5 rounded">
                {sec.entityTag}
              </span>
            </div>
            {sec.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as ActiveTab)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-medium transition-all group relative cursor-pointer ${
                    isActive
                      ? 'bg-teal-500/15 text-teal-300 border border-teal-500/40 shadow-glass-xs shadow-[0_0_16px_rgba(29,130,150,0.2)]'
                      : 'hover:bg-white/[0.05] text-slate-300 hover:text-white border border-transparent'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-teal-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold truncate">{item.label}</span>
                      {item.badge && (
                        <span className="text-[9px] bg-teal-400 text-slate-950 font-black px-1.5 py-0.2 rounded-full uppercase shadow-xs">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate leading-tight mt-0.5">
                      {item.desc}
                    </div>
                  </div>
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0 shadow-[0_0_8px_rgba(45,212,191,0.9)]"></div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Active Operator Status & Logout */}
      <div className="p-3 border-t border-white/[0.08] bg-slate-950/90 backdrop-blur-md space-y-2">
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/60 border border-white/[0.08] shadow-glass-xs">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shadow-inner shrink-0 ring-1 ring-white/10 ${
            currentUser?.isGuest
              ? 'bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 font-black shadow-[0_0_10px_rgba(245,158,11,0.3)]'
              : 'bg-gradient-to-tr from-teal-700 to-teal-500 text-white shadow-[0_0_10px_rgba(20,184,166,0.3)]'
          }`}>
            {currentUser?.avatar || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-slate-100 truncate leading-tight flex items-center gap-1">
              <span>{currentUser?.name || 'Operator'}</span>
              {currentUser?.isGuest && (
                <span className="text-[9px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-1 rounded font-bold">
                  Demo
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-400 truncate mt-0.5">
              {currentUser?.roleTitle || roleMeta.title}
            </div>
          </div>
        </div>

        {currentUser?.role === 'admin' ? (
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={onOpenBackupModal}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[11px] font-semibold bg-slate-800/80 hover:bg-teal-500/20 text-slate-200 hover:text-teal-300 border border-white/[0.1] hover:border-teal-400/40 transition-all cursor-pointer shadow-glass-xs"
            >
              <Database className="w-3 h-3 text-teal-400" />
              <span>Backup</span>
            </button>
            <button
              onClick={logout}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[11px] font-bold bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 hover:border-red-700 transition-all cursor-pointer shadow-glass-xs"
            >
              <LogOut className="w-3 h-3 text-red-400" />
              <span>Log Out</span>
            </button>
          </div>
        ) : (
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 hover:border-red-700 transition-all cursor-pointer shadow-glass-xs"
          >
            <LogOut className="w-3.5 h-3.5 text-red-400" />
            <span>Sign Out Operator Session</span>
          </button>
        )}

        <div className="text-[9px] text-slate-400 text-center pt-0.5 font-mono">
          Station: <span className="text-emerald-400 font-semibold">{currentUser?.workstation || 'POS-01'}</span>
        </div>
      </div>
    </aside>
  );
};
