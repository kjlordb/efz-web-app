import React, { useState, useEffect } from 'react';
import { 
  Monitor, 
  Clock, 
  Database,
  LogOut,
  ChevronDown
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
    <header className="no-print h-14 bg-[#090d16]/90 backdrop-blur-md border-b border-white/[0.06] px-5 flex items-center justify-between sticky top-0 z-20 select-none">
      {/* Brand & Station Telemetry */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="font-black text-teal-400 text-base">EFZ</span>
          <span className="hidden sm:inline font-bold text-slate-200 text-xs tracking-wide">
            Computer Sales
          </span>
        </div>

        <div className="flex items-center gap-1.5 pl-3 border-l border-white/[0.06] text-xs text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
          <span className="font-mono text-slate-300 font-medium">{currentUser?.workstation || 'POS-01'}</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Role Switcher */}
        <div className="flex items-center">
          <select
            value={currentRole}
            onChange={(e) => switchRole(e.target.value as any)}
            className="bg-slate-900 text-slate-200 text-xs py-1 px-2.5 rounded-lg border border-white/[0.08] outline-none cursor-pointer hover:border-teal-500/40 transition-colors"
            title="Switch operating role"
          >
            <option value="cashier" className="bg-slate-900 text-slate-200">Cashier (POS)</option>
            <option value="inventory" className="bg-slate-900 text-slate-200">Warehouse (Inventory)</option>
            <option value="technician" className="bg-slate-900 text-slate-200">Technician (RMA)</option>
            <option value="admin" className="bg-slate-900 text-slate-200">Store Manager (Admin)</option>
          </select>
        </div>

        {/* Live Clock */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 font-mono">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>{time}</span>
        </div>

        {/* DB Backup for Admin */}
        {currentUser?.role === 'admin' && (
          <button
            onClick={onOpenBackupModal}
            title="Database Backup"
            className="p-1.5 text-slate-400 hover:text-teal-300 hover:bg-white/[0.04] rounded-lg transition-colors cursor-pointer"
          >
            <Database className="w-4 h-4" />
          </button>
        )}

        {/* User Info */}
        <div className="flex items-center gap-2 pl-2 border-l border-white/[0.06]">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
            currentUser?.role === 'admin'
              ? 'bg-amber-500/20 text-amber-300'
              : 'bg-teal-500/20 text-teal-300'
          }`}>
            {currentUser?.avatar || 'U'}
          </div>
          <span className="hidden sm:inline text-xs font-medium text-slate-200 truncate max-w-[120px]">
            {currentUser?.name || 'Operator'}
          </span>
          <button
            onClick={logout}
            title="Sign Out"
            className="text-slate-500 hover:text-rose-400 p-1 rounded-md hover:bg-white/[0.04] transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
