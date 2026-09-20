import React from 'react';
import { ShieldAlert, ArrowLeft, Lock, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_DEFINITIONS, UserRole } from '../../types/rbac';
import { ActiveTab } from '../layout/Sidebar';

interface AccessRestrictedProps {
  attemptedTab: ActiveTab;
  onNavigateHome: () => void;
}

export const AccessRestricted: React.FC<AccessRestrictedProps> = ({ attemptedTab, onNavigateHome }) => {
  const { currentUser, logout } = useAuth();
  const currentRole = currentUser?.role || 'cashier';
  const roleMeta = ROLE_DEFINITIONS[currentRole];

  // Find roles that have access to attemptedTab
  const authorizedRoles = (Object.keys(ROLE_DEFINITIONS) as UserRole[]).filter((r) =>
    ROLE_DEFINITIONS[r].allowedTabs.includes(attemptedTab)
  );

  return (
    <div className="min-h-[550px] flex items-center justify-center p-6 select-none font-sans">
      <div className="max-w-md w-full glass-modal rounded-2xl border border-white/[0.12] p-8 text-center space-y-6 shadow-glass-modal">
        {/* Shield Icon with glowing ring */}
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center justify-center mx-auto text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
          <ShieldAlert className="w-8 h-8" />
        </div>

        {/* Title and message */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/15 text-red-300 border border-red-500/30 text-xs font-bold uppercase tracking-wider">
            <Lock className="w-3 h-3" />
            <span>Role-Based Access Control (RBAC)</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100">
            Access Restricted
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your current entity clearance as <strong className="text-slate-200">{roleMeta.title}</strong> does not permit direct access to the <span className="font-mono font-bold text-teal-400 uppercase">[{attemptedTab}]</span> module.
          </p>
        </div>

        {/* Clearance requirement card */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-white/[0.08] text-left space-y-2 text-xs shadow-inner">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Permitted Entities for this Module:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {authorizedRoles.map((r) => (
              <span
                key={r}
                className="px-2.5 py-1 rounded-lg bg-slate-900/80 border border-white/[0.1] font-semibold text-slate-200 text-[11px] flex items-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5 text-teal-400" />
                <span>{ROLE_DEFINITIONS[r].title}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
          <button
            onClick={onNavigateHome}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-900/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to {roleMeta.entityLabel}</span>
          </button>

          <button
            onClick={logout}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 font-semibold text-xs border border-white/[0.1] hover:border-teal-400/40 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <UserCheck className="w-3.5 h-3.5 text-teal-400" />
            <span>Switch Operator Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};
