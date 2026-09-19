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
    <header className="no-print h-14 bg-[#080E1A]/90 backdrop-blur-md border-b border-[rgba(148,163,184,0.10)] px-5 flex items-center justify-between sticky top-0 z-20 select-none">
      {/* Brand & Station Telemetry */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="font-black text-[#19C3D1] text-base tracking-tight">EFZ</span>
          <span className="hidden sm:inline font-bold text-[#F4F7FB] text-xs tracking-wide">
            Computer Sales
          </span>
        </div>

        <div className="flex items-center gap-1.5 pl-3 border-l border-[rgba(148,163,184,0.10)] text-xs text-[#A9B6C8]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#20C997] inline-block animate-pulse"></span>
          <span className="font-mono text-[#A9B6C8] font-medium">{currentUser?.workstation || 'POS-01'}</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Role Switcher */}
        <div className="flex items-center">
          <select
            value={currentRole}
            onChange={(e) => switchRole(e.target.value as any)}
            className="bg-[#0B1120] text-[#F4F7FB] text-xs py-1 px-2.5 rounded-lg border border-[rgba(148,163,184,0.14)] outline-none cursor-pointer hover:border-[#19C3D1]/40 transition-colors"
            title="Switch operating role"
          >
            <option value="cashier" className="bg-[#0B1120] text-[#F4F7FB]">Cashier (POS)</option>
            <option value="inventory" className="bg-[#0B1120] text-[#F4F7FB]">Warehouse (Inventory)</option>
            <option value="technician" className="bg-[#0B1120] text-[#F4F7FB]">Technician (RMA)</option>
            <option value="admin" className="bg-[#0B1120] text-[#F4F7FB]">Store Manager (Admin)</option>
          </select>
        </div>

        {/* Live Clock */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-[#A9B6C8] font-mono">
          <Clock className="w-3.5 h-3.5 text-[#6F7E92]" />
          <span>{time}</span>
        </div>

        {/* DB Backup for Admin */}
        {currentUser?.role === 'admin' && (
          <button
            onClick={onOpenBackupModal}
            title="Database Backup"
            className="p-1.5 text-[#A9B6C8] hover:text-[#19C3D1] hover:bg-white/[0.04] rounded-lg transition-colors cursor-pointer"
          >
            <Database className="w-4 h-4" />
          </button>
        )}

        {/* User Info */}
        <div className="flex items-center gap-2 pl-2 border-l border-[rgba(148,163,184,0.10)]">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
            currentUser?.role === 'admin'
              ? 'bg-[#D8A83E]/15 text-[#F1C968]'
              : 'bg-[rgba(25,195,209,0.12)] text-[#19C3D1]'
          }`}>
            {currentUser?.avatar || 'U'}
          </div>
          <span className="hidden sm:inline text-xs font-medium text-[#F4F7FB] truncate max-w-[120px]">
            {currentUser?.name || 'Operator'}
          </span>
          <button
            onClick={logout}
            title="Sign Out"
            className="text-[#6F7E92] hover:text-[#F05D6C] p-1 rounded-md hover:bg-white/[0.04] transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
