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
    <header className="no-print h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Search & Breadcrumb info */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex items-center gap-2.5">
          <span className="font-black tracking-tight text-teal-800 text-lg">
            EFZ
          </span>
          <span className="hidden sm:inline font-bold text-slate-800 text-sm">
            Davao Computer Sales
          </span>
          <span className="text-[11px] bg-amber-50 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full font-bold">
            v2.8 Web
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-2 ml-3 pl-3 border-l border-slate-200 text-xs text-slate-500 shrink-0">
          <Monitor className="w-3.5 h-3.5 text-teal-600" />
          <span>Station: <strong className="text-slate-700 font-mono">{currentUser?.workstation || 'POS-TERM-01'}</strong></span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        {/* Presentation Role Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <span className="hidden md:inline text-[10px] font-bold text-slate-500 uppercase px-1.5">
            Entity:
          </span>
          <select
            value={currentRole}
            onChange={(e) => switchRole(e.target.value as any)}
            className="bg-white text-slate-800 font-bold text-xs py-1 px-2 rounded-md border border-slate-200 shadow-2xs outline-none cursor-pointer hover:border-teal-400 transition-colors"
            title="Switch presentation entity role"
          >
            <option value="cashier">Cashier (Sales Register)</option>
            <option value="inventory">Warehouse (Inventory & Valuation)</option>
            <option value="technician">Technician (Service Center & RMA)</option>
            <option value="admin">Store Manager (Admin Executive)</option>
          </select>
        </div>

        {/* Real-time Clock */}
        <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 font-mono">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>{time}</span>
        </div>

        {/* Database Backup Action - Restricted to Executive/Admin */}
        {currentUser?.role === 'admin' && (
          <button
            onClick={onOpenBackupModal}
            title="Create Database Backup (spDbBackup) - Executive Only"
            className="flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Database className="w-3.5 h-3.5 text-teal-600" />
            <span className="hidden sm:inline">DB Backup</span>
          </button>
        )}

        {/* Currency Pill */}
        <div className="hidden sm:block text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-md">
          PHP (₱)
        </div>

        {/* User profile & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm ${
            currentUser?.role === 'admin'
              ? 'bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 font-black'
              : currentUser?.role === 'inventory'
              ? 'bg-gradient-to-tr from-cyan-600 to-cyan-500'
              : currentUser?.role === 'technician'
              ? 'bg-gradient-to-tr from-purple-600 to-purple-500'
              : 'bg-gradient-to-tr from-teal-700 to-teal-500'
          }`}>
            {currentUser?.avatar || 'U'}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-slate-800 leading-tight flex items-center gap-1">
              <span>{currentUser?.name || 'Authorized Operator'}</span>
            </div>
            <div className="text-[10px] text-slate-500 leading-tight">
              {currentUser?.entityLabel || 'Front-Counter'}
            </div>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={logout}
            title="Sign Out / Switch Presentation Profile"
            className="ml-1 p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
