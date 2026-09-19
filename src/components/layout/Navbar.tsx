import React, { useState, useEffect } from 'react';
import { 
  Monitor, 
  User, 
  Clock, 
  Bell, 
  Search, 
  ShieldCheck, 
  Sparkles,
  Database,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  onSearchGlobal?: (query: string) => void;
  onOpenBackupModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenBackupModal }) => {
  const { currentUser, logout, switchRole } = useAuth();
  const [time, setTime] = useState<string>('');
  const currentRole = currentUser?.role || 'cashier';

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="no-print h-16 bg-slate-900/75 backdrop-blur-xl border-b border-white/[0.08] px-6 flex items-center justify-between sticky top-0 z-20 shadow-glass-xs transition-colors">
      {/* Search & Breadcrumb info */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex items-center gap-2.5">
          <span className="font-black tracking-tight text-teal-400 text-lg drop-shadow-[0_0_12px_rgba(29,130,150,0.5)]">
            EFZ
          </span>
          <span className="hidden sm:inline font-bold text-slate-100 text-sm tracking-wide">
            Davao Computer Sales
          </span>
          <span className="text-[10px] font-mono font-bold bg-amber-400/10 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full">
            v2.8 Web
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-2 ml-3 pl-3 border-l border-white/[0.08] text-xs text-slate-400 shrink-0">
          <Monitor className="w-3.5 h-3.5 text-teal-400" />
          <span>Station: <strong className="text-slate-200 font-mono">{currentUser?.workstation || 'POS-TERM-01'}</strong></span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        {/* Presentation Role Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-950/60 backdrop-blur-md px-2 py-1 rounded-xl border border-white/[0.1] text-xs shadow-inner">
          <span className="hidden md:inline text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
            Entity:
          </span>
          <select
            value={currentRole}
            onChange={(e) => switchRole(e.target.value as any)}
            className="bg-slate-900/90 text-slate-100 font-semibold text-xs py-1 px-2.5 rounded-lg border border-white/[0.12] outline-none cursor-pointer hover:border-teal-400/60 focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30 transition-all"
            title="Switch presentation entity role"
          >
            <option value="cashier" className="bg-slate-900 text-slate-100">Cashier (Sales Register)</option>
            <option value="inventory" className="bg-slate-900 text-slate-100">Warehouse (Inventory & Valuation)</option>
            <option value="technician" className="bg-slate-900 text-slate-100">Technician (Service Center & RMA)</option>
            <option value="admin" className="bg-slate-900 text-slate-100">Store Manager (Admin Executive)</option>
          </select>
        </div>

        {/* Real-time Clock */}
        <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-300 bg-slate-950/50 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/[0.08] font-mono shadow-inner">
          <Clock className="w-3.5 h-3.5 text-teal-400" />
          <span>{time}</span>
        </div>

        {/* Database Backup Action - Restricted to Executive/Admin */}
        {currentUser?.role === 'admin' && (
          <button
            onClick={onOpenBackupModal}
            title="Create Database Backup (spDbBackup) - Executive Only"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 bg-slate-800/80 hover:bg-teal-500/20 hover:text-teal-300 hover:border-teal-400/50 border border-white/[0.1] px-3 py-1.5 rounded-xl transition-all shadow-glass-xs cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">DB Backup</span>
          </button>
        )}

        {/* Currency Pill */}
        <div className="hidden sm:block text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 px-2.5 py-1 rounded-lg">
          PHP (₱)
        </div>

        {/* User profile & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-white/[0.08]">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-sm ring-1 ring-white/20 ${
            currentUser?.role === 'admin'
              ? 'bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-black shadow-[0_0_12px_rgba(245,158,11,0.4)]'
              : currentUser?.role === 'inventory'
              ? 'bg-gradient-to-tr from-cyan-600 to-teal-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
              : currentUser?.role === 'technician'
              ? 'bg-gradient-to-tr from-purple-600 to-indigo-400 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
              : 'bg-gradient-to-tr from-teal-700 to-teal-400 shadow-[0_0_12px_rgba(20,184,166,0.3)]'
          }`}>
            {currentUser?.avatar || 'U'}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-slate-100 leading-tight flex items-center gap-1">
              <span>{currentUser?.name || 'Authorized Operator'}</span>
            </div>
            <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
              {currentUser?.entityLabel || 'Front-Counter'}
            </div>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={logout}
            title="Sign Out / Switch Presentation Profile"
            className="ml-1 p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
