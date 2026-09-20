import React, { useState, useEffect } from 'react';
import { 
  Monitor, 
  Clock, 
  Database, 
  LogOut, 
  ChevronDown,
  Menu
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getDbHealth, DbHealthStatus } from '../../services/api';

interface NavbarProps {
  onSearchGlobal?: (query: string) => void;
  onOpenBackupModal?: () => void;
  onToggleMobileNav?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenBackupModal, onToggleMobileNav }) => {
  const { currentUser, logout } = useAuth();
  const [time, setTime] = useState<string>('');
  const [dbHealth, setDbHealth] = useState<DbHealthStatus | null>(null);
  const currentRole = currentUser?.role || 'cashier';

  useEffect(() => {
    getDbHealth().then(setDbHealth);
    const healthInterval = setInterval(() => {
      getDbHealth().then(setDbHealth);
    }, 15000);

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
    return () => {
      clearInterval(interval);
      clearInterval(healthInterval);
    };
  }, []);

  return (
    <header className="no-print h-14 bg-[#080E1A]/95 backdrop-blur-md border-b border-[rgba(148,163,184,0.10)] px-3 sm:px-5 flex items-center justify-between sticky top-0 z-20 select-none">
      {/* Brand & Mobile Hamburger */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onToggleMobileNav}
          className="lg:hidden p-2 rounded-xl text-[#A9B6C8] hover:text-[#F4F7FB] hover:bg-white/[0.06] active:bg-white/[0.1] transition-colors cursor-pointer touch-target"
          aria-label="Open navigation menu"
          title="Open Menu"
        >
          <Menu className="w-5 h-5 text-[#19C3D1]" />
        </button>

        <div className="flex items-center gap-2">
          <span className="font-black text-[#19C3D1] text-base tracking-tight">EFZ</span>
          <span className="hidden sm:inline font-bold text-[#F4F7FB] text-xs tracking-wide">
            Computer Sales
          </span>
        </div>

        <div className="flex items-center gap-1.5 pl-2 sm:pl-3 border-l border-[rgba(148,163,184,0.10)] text-[11px] sm:text-xs text-[#A9B6C8]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#20C997] inline-block animate-pulse"></span>
          <span className="font-mono text-[#A9B6C8] font-medium">{currentUser?.workstation || 'POS-01'}</span>
        </div>

        {/* SQL Server Database Telemetry Badge */}
        <div 
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[rgba(18,28,45,0.7)] border border-[rgba(148,163,184,0.14)] text-[11px] font-mono cursor-default select-none"
          title={dbHealth?.connected 
            ? `SQL Server: ${dbHealth.server}\nDatabase: ${dbHealth.database}\nLatency: ${dbHealth.latencyMs}ms\nStock Items: ${dbHealth.counts?.stockItems.toLocaleString()}\nOrders: ${dbHealth.counts?.orderItems.toLocaleString()}\nCustomers: ${dbHealth.counts?.customers.toLocaleString()}`
            : 'SQL Server offline or disconnected (Local fallback cache active)'}
        >
          <span className={`w-2 h-2 rounded-full inline-block ${dbHealth?.connected ? 'bg-[#20C997] shadow-[0_0_8px_#20C997]' : 'bg-[#F2B84B]'}`}></span>
          <span className="text-[#A9B6C8] font-semibold">
            {dbHealth?.connected ? 'SQL Server' : 'Local Cache'}
          </span>
          {dbHealth?.connected && (
            <span className="text-[#19C3D1] font-bold text-[10px]">
              {dbHealth.latencyMs}ms
            </span>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Role Badge */}
        <div className="flex items-center">
          <span className="bg-[#0B1120] text-[#19C3D1] font-semibold text-[11px] sm:text-xs py-1 px-2.5 rounded-lg border border-[rgba(25,195,209,0.2)] select-none">
            {currentUser?.roleTitle || currentRole.toUpperCase()}
          </span>
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
